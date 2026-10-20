import { complianceKnowledgeRepository } from '../../data/repositories/complianceKnowledgeRepository';
import {
  RetrievalQuery,
  RetrievalResponse,
  RetrievalResultItem,
  SourceCitation,
  RetrievalConfidence,
  RetrievalPolicy,
} from './retrievalTypes';
import { normalizeQuery, rankChunks } from './textRetriever';
import { KnowledgeChunk } from '../../data/models/KnowledgeChunk';

export class RagService {
  /**
   * Primary RAG retrieval pipeline:
   * 1. Normalize Query
   * 2. Candidate Filtering (Verification Gate, Role & Mine Scoping, Category)
   * 3. Relevance Ranking via Text Retriever
   * 4. Context Grounding Construction
   * 5. Source Attribution & Confidence Scoring
   * 6. No-Hallucination Fallback Enforcement
   */
  async query(queryInput: RetrievalQuery): Promise<RetrievalResponse> {
    const startTime = performance.now();
    const rawQuery = (queryInput.query || '').trim();
    const policy: RetrievalPolicy = queryInput.policy || 'VERIFIED_ONLY';
    const limit = queryInput.limit || 5;
    const minScore = queryInput.minScore !== undefined ? queryInput.minScore : 0.15;

    const normalizedTerms = normalizeQuery(rawQuery);

    if (rawQuery.length === 0 || normalizedTerms.length === 0) {
      return {
        query: rawQuery,
        normalizedQuery: '',
        policy,
        results: [],
        groundedContext: '',
        sources: [],
        confidence: 'NONE',
        hasVerifiedInformation: false,
        hasDemoInformation: false,
        retrievalDurationMs: Math.round(performance.now() - startTime),
        fallbackMessage: 'No verified information found in the current compliance knowledge base.',
      };
    }

    // 1. Fetch all knowledge records and chunks from repository
    const [allKnowledge, allChunks] = await Promise.all([
      complianceKnowledgeRepository.getAll(),
      complianceKnowledgeRepository.getChunks(),
    ]);

    const knowledgeMap = new Map(allKnowledge.map((k) => [k.id, k]));

    // 2. Candidate pre-filtering based on policy, role, mineType, status
    const candidates: Array<{ chunk: KnowledgeChunk; knowledgeTitle: string }> = [];

    for (const chunk of allChunks) {
      const parentDoc = knowledgeMap.get(chunk.knowledgeId);
      if (!parentDoc) continue;

      // Exclude archived or superseded records
      if (parentDoc.status === 'ARCHIVED' || parentDoc.status === 'SUPERSEDED') {
        continue;
      }

      // Verification Policy Gate:
      // VERIFIED_ONLY: strictly require parent & chunk verificationStatus === 'VERIFIED' and exclude synthetic demo
      if (policy === 'VERIFIED_ONLY') {
        if (chunk.metadata.verificationStatus !== 'VERIFIED' || parentDoc.isSyntheticDemo) {
          continue;
        }
      } else if (policy === 'ALLOW_DEMO') {
        // ALLOW_DEMO allows verified or demo records that are not DRAFT
        if (parentDoc.status === 'DRAFT') {
          continue;
        }
      }

      // Category filter
      if (queryInput.category && queryInput.category !== 'ALL') {
        if (chunk.metadata.category !== queryInput.category) {
          continue;
        }
      }

      // Role filter
      if (queryInput.role && queryInput.role !== 'ADMIN') {
        if (!chunk.metadata.applicableRoles.includes(queryInput.role)) {
          continue;
        }
      }

      // Mine type filter
      if (queryInput.mineType && queryInput.mineType !== 'ALL') {
        const matchesMine = chunk.metadata.applicableMineTypes.some(
          (t) => t.toLowerCase() === queryInput.mineType?.toLowerCase() || t === 'Mixed'
        );
        if (!matchesMine) {
          continue;
        }
      }

      candidates.push({
        chunk,
        knowledgeTitle: parentDoc.title,
      });
    }

    // 3. Rank candidate chunks using local text retriever
    const rankedResults: RetrievalResultItem[] = rankChunks(
      candidates,
      rawQuery,
      minScore,
      limit
    );

    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTime);

    // 4. Verification and demo indicators
    const hasVerifiedInformation = rankedResults.some(
      (r) => r.verificationStatus === 'VERIFIED'
    );
    const hasDemoInformation = rankedResults.some((r) => r.isSyntheticDemo);

    // 5. Confidence determination
    let confidence: RetrievalConfidence = 'NONE';
    if (rankedResults.length > 0) {
      const topScore = rankedResults[0].score;
      if (topScore >= 0.65) confidence = 'HIGH';
      else if (topScore >= 0.38) confidence = 'MEDIUM';
      else confidence = 'LOW';
    }

    // 6. Assemble Grounded Context
    const groundedContext = this.buildContext(rankedResults, rawQuery);

    // 7. Deduplicate sources
    const sources = this.extractSources(rankedResults, knowledgeMap);

    // 8. No-hallucination fallback enforcement
    let fallbackMessage: string | undefined;
    if (rankedResults.length === 0 || (!hasVerifiedInformation && policy === 'VERIFIED_ONLY')) {
      fallbackMessage =
        'No verified information found in the current compliance knowledge base.';
    }

    return {
      query: rawQuery,
      normalizedQuery: normalizedTerms.join(' '),
      policy,
      results: rankedResults,
      groundedContext,
      sources,
      confidence,
      hasVerifiedInformation,
      hasDemoInformation,
      retrievalDurationMs: durationMs,
      fallbackMessage,
    };
  }

  /**
   * Builds high-density grounded context for future Phase 5 model consumption.
   * Formats citations, statutory authority, and exact clause wording.
   */
  buildContext(results: RetrievalResultItem[], query?: string): string {
    if (results.length === 0) {
      return 'No verified regulatory or operational standards retrieved for this query.';
    }

    const contextHeader = query
      ? `### Grounded Regulatory Context for Query: "${query}"\n\n`
      : '### Grounded Regulatory Context\n\n';

    const items = results.map((item, idx) => {
      const citation = `[Citation ${idx + 1}]: ${item.sourceName} (${item.sourceReference})`;
      const sectionInfo = item.section ? ` - ${item.section}` : '';
      const clauseInfo = item.clause ? ` [Clause ${item.clause}]` : '';
      const demoNotice = item.isSyntheticDemo ? ' [DEMO SYNTHETIC STANDARD]' : '';
      const verif = `Verification: ${item.verificationStatus}`;

      return `#### ${citation}${sectionInfo}${clauseInfo}${demoNotice} (${verif})
**Heading**: ${item.heading}
**Relevance Score**: ${(item.score * 100).toFixed(0)}%
**Content**:
${item.content}
`;
    });

    return contextHeader + items.join('\n---\n\n');
  }

  private extractSources(
    results: RetrievalResultItem[],
    knowledgeMap: Map<string, any>
  ): SourceCitation[] {
    const seenIds = new Set<string>();
    const sources: SourceCitation[] = [];

    for (const res of results) {
      if (seenIds.has(res.knowledgeId)) continue;
      seenIds.add(res.knowledgeId);

      const parent = knowledgeMap.get(res.knowledgeId);
      if (parent) {
        sources.push({
          id: parent.id,
          title: parent.title,
          sourceName: parent.sourceName,
          sourceReference: parent.sourceReference,
          authority: parent.authority,
          documentVersion: parent.documentVersion,
          verificationStatus: parent.verificationStatus,
          isSyntheticDemo: parent.isSyntheticDemo,
          category: parent.category,
        });
      }
    }

    return sources;
  }

  /**
   * Future Phase 5 Gemini Integration Contract:
   * Clean abstraction that bundles user queries with deterministic grounded context.
   */
  preparePhase5GroundingPayload(response: RetrievalResponse) {
    return {
      query: response.query,
      retrievedChunksCount: response.results.length,
      groundedContext: response.groundedContext,
      sources: response.sources,
      policy: response.policy,
      isGroundedInVerifiedFacts: response.hasVerifiedInformation,
      readyForModelIngestion: response.confidence !== 'NONE' && !response.fallbackMessage,
    };
  }
}

export const ragService = new RagService();

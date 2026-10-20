import { KnowledgeChunk } from '../../data/models/KnowledgeChunk';
import { RetrievalResultItem } from './retrievalTypes';

const STOP_WORDS = new Set([
  'a',
  'about',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'how',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'was',
  'what',
  'when',
  'where',
  'which',
  'who',
  'will',
  'with',
]);

export function normalizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

export function calculateChunkScore(
  chunk: KnowledgeChunk,
  knowledgeTitle: string,
  queryTerms: string[],
  rawQuery: string
): { score: number; matchedTerms: string[] } {
  if (queryTerms.length === 0) {
    return { score: 0, matchedTerms: [] };
  }

  const cleanRawQuery = rawQuery.toLowerCase().trim();
  const headingLower = chunk.heading.toLowerCase();
  const titleLower = knowledgeTitle.toLowerCase();
  const contentLower = chunk.content.toLowerCase();
  const clauseLower = (chunk.clause || '').toLowerCase();
  const sectionLower = (chunk.section || '').toLowerCase();
  const refLower = (chunk.metadata.sourceReference || '').toLowerCase();
  const tagsLower = chunk.tags.map((t) => t.toLowerCase());
  const keywordsLower = chunk.keywords.map((k) => k.toLowerCase());

  let totalScore = 0;
  const matchedTermsSet = new Set<string>();

  // 1. Exact phrase bonus
  if (cleanRawQuery.length > 3) {
    if (headingLower.includes(cleanRawQuery)) {
      totalScore += 4.0;
      matchedTermsSet.add(cleanRawQuery);
    }
    if (titleLower.includes(cleanRawQuery)) {
      totalScore += 3.5;
      matchedTermsSet.add(cleanRawQuery);
    }
    if (contentLower.includes(cleanRawQuery)) {
      totalScore += 2.5;
      matchedTermsSet.add(cleanRawQuery);
    }
  }

  // 2. Individual term weights
  let termMatchCount = 0;

  for (const term of queryTerms) {
    let termScore = 0;

    // Heading match (weight: 3.5)
    if (headingLower.includes(term)) {
      termScore += 3.5;
      matchedTermsSet.add(term);
    }

    // Title match (weight: 3.0)
    if (titleLower.includes(term)) {
      termScore += 3.0;
      matchedTermsSet.add(term);
    }

    // Statutory Reference / Clause match (weight: 4.0)
    if (refLower.includes(term) || clauseLower.includes(term) || sectionLower.includes(term)) {
      termScore += 4.0;
      matchedTermsSet.add(term);
    }

    // Keywords match (weight: 2.5)
    if (keywordsLower.some((k) => k.includes(term))) {
      termScore += 2.5;
      matchedTermsSet.add(term);
    }

    // Tags match (weight: 2.0)
    if (tagsLower.some((t) => t.includes(term))) {
      termScore += 2.0;
      matchedTermsSet.add(term);
    }

    // Content occurrence (weight: 1.0 per distinct mention, max 3.0)
    if (contentLower.includes(term)) {
      // Count frequency
      const regex = new RegExp(`\\b${term}`, 'gi');
      const matches = contentLower.match(regex);
      const occurrences = matches ? matches.length : 1;
      termScore += Math.min(occurrences * 0.8, 2.4);
      matchedTermsSet.add(term);
    }

    if (termScore > 0) {
      termMatchCount++;
      totalScore += termScore;
    }
  }

  // Completeness multiplier: if query has multiple terms and many match, give a boost
  if (queryTerms.length > 1) {
    const coverageRatio = termMatchCount / queryTerms.length;
    totalScore = totalScore * (0.6 + 0.8 * coverageRatio);
  }

  // Normalize score to roughly 0 - 1 range
  // Typical max score for strong match is ~15 - 20
  const normalizedScore = Math.min(Math.round((totalScore / 16) * 100) / 100, 1.0);

  return {
    score: normalizedScore,
    matchedTerms: Array.from(matchedTermsSet),
  };
}

export function rankChunks(
  candidates: Array<{ chunk: KnowledgeChunk; knowledgeTitle: string }>,
  query: string,
  minScore = 0.15,
  limit = 5
): RetrievalResultItem[] {
  const queryTerms = normalizeQuery(query);
  if (queryTerms.length === 0) return [];

  const scoredItems: RetrievalResultItem[] = [];

  for (const { chunk, knowledgeTitle } of candidates) {
    const { score, matchedTerms } = calculateChunkScore(
      chunk,
      knowledgeTitle,
      queryTerms,
      query
    );

    if (score >= minScore) {
      scoredItems.push({
        chunkId: chunk.id,
        knowledgeId: chunk.knowledgeId,
        title: knowledgeTitle,
        heading: chunk.heading,
        sourceName: chunk.metadata.sourceName,
        sourceReference: chunk.metadata.sourceReference,
        section: chunk.section,
        clause: chunk.clause,
        content: chunk.content,
        score,
        matchedTerms,
        verificationStatus: chunk.metadata.verificationStatus,
        isSyntheticDemo: chunk.metadata.isSyntheticDemo,
        category: chunk.metadata.category,
        applicableMineTypes: chunk.metadata.applicableMineTypes,
      });
    }
  }

  // Sort descending by score
  scoredItems.sort((a, b) => b.score - a.score);

  return scoredItems.slice(0, limit);
}

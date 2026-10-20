import { ComplianceKnowledge } from '../data/models/ComplianceKnowledge';
import { KnowledgeChunk, CreateChunkInput } from '../data/models/KnowledgeChunk';

/**
 * Deterministic text chunker for compliance knowledge documents.
 * Extracts sections, headings, clauses, and content paragraphs while
 * preserving document structure and regulatory metadata for RAG retrieval.
 */
export function chunkKnowledgeDocument(knowledge: ComplianceKnowledge): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  const now = new Date().toISOString();

  // If content has markdown headers (##), split by sections/headings
  const rawSections = knowledge.content.split(/(?=^##\s+)/m).map((s) => s.trim()).filter(Boolean);

  let chunkIndex = 0;

  if (rawSections.length === 0) {
    // Fallback: single chunk from content or summary
    const contentText = (knowledge.content || knowledge.summary || knowledge.description).trim();
    if (contentText) {
      chunks.push({
        id: `${knowledge.id}-chunk-${chunkIndex}`,
        knowledgeId: knowledge.id,
        chunkIndex,
        heading: knowledge.shortTitle || knowledge.title,
        content: contentText,
        keywords: knowledge.keywords,
        tags: knowledge.tags,
        metadata: {
          sourceName: knowledge.sourceName,
          sourceReference: knowledge.sourceReference,
          category: knowledge.category,
          subcategory: knowledge.subcategory,
          authority: knowledge.authority,
          verificationStatus: knowledge.verificationStatus,
          isSyntheticDemo: knowledge.isSyntheticDemo,
          applicableMineTypes: knowledge.applicableMineTypes,
          applicableRoles: knowledge.applicableRoles,
          version: knowledge.version,
        },
        characterCount: contentText.length,
        tokenEstimate: Math.ceil(contentText.length / 4),
        createdAt: now,
        updatedAt: now,
      });
    }
    return chunks;
  }

  for (const rawSec of rawSections) {
    const lines = rawSec.split('\n');
    let heading = knowledge.shortTitle || knowledge.title;
    let bodyStartIndex = 0;

    // First line may be # or ##
    if (lines[0]?.startsWith('#')) {
      heading = lines[0].replace(/^#+\s*/, '').trim();
      bodyStartIndex = 1;
    }

    const body = lines.slice(bodyStartIndex).join('\n').trim();
    if (!body) continue;

    // Check if matching a specific section/clause from structured sections
    const matchedSection = knowledge.sections?.find(
      (sec) => heading.toLowerCase().includes(sec.title.toLowerCase()) || heading.toLowerCase().includes(sec.sectionNumber.toLowerCase())
    );

    const sectionLabel = matchedSection ? `${matchedSection.sectionNumber}: ${matchedSection.title}` : undefined;
    const clauseLabel = matchedSection?.clauses?.length
      ? matchedSection.clauses.map((c) => c.clauseNumber).join(', ')
      : undefined;

    // Combine section keywords with knowledge keywords
    const keywords = Array.from(
      new Set([
        ...knowledge.keywords,
        ...heading.toLowerCase().split(/[\s,–—:-]+/).filter((w) => w.length > 3),
      ])
    );

    chunks.push({
      id: `${knowledge.id}-chunk-${chunkIndex}`,
      knowledgeId: knowledge.id,
      chunkIndex,
      heading,
      section: sectionLabel,
      clause: clauseLabel,
      content: body,
      keywords,
      tags: knowledge.tags,
      metadata: {
        sourceName: knowledge.sourceName,
        sourceReference: knowledge.sourceReference,
        category: knowledge.category,
        subcategory: knowledge.subcategory,
        authority: knowledge.authority,
        verificationStatus: knowledge.verificationStatus,
        isSyntheticDemo: knowledge.isSyntheticDemo,
        applicableMineTypes: knowledge.applicableMineTypes,
        applicableRoles: knowledge.applicableRoles,
        version: knowledge.version,
      },
      characterCount: body.length,
      tokenEstimate: Math.ceil(body.length / 4),
      createdAt: now,
      updatedAt: now,
    });

    chunkIndex++;
  }

  // Also create a high-level summary chunk for executive context if summary exists
  if (knowledge.summary && knowledge.summary.length > 30) {
    chunks.push({
      id: `${knowledge.id}-chunk-summary`,
      knowledgeId: knowledge.id,
      chunkIndex,
      heading: `${knowledge.shortTitle || knowledge.title} (Statutory Executive Summary)`,
      section: 'Executive Summary',
      content: knowledge.summary,
      keywords: knowledge.keywords,
      tags: knowledge.tags,
      metadata: {
        sourceName: knowledge.sourceName,
        sourceReference: knowledge.sourceReference,
        category: knowledge.category,
        subcategory: knowledge.subcategory,
        authority: knowledge.authority,
        verificationStatus: knowledge.verificationStatus,
        isSyntheticDemo: knowledge.isSyntheticDemo,
        applicableMineTypes: knowledge.applicableMineTypes,
        applicableRoles: knowledge.applicableRoles,
        version: knowledge.version,
      },
      characterCount: knowledge.summary.length,
      tokenEstimate: Math.ceil(knowledge.summary.length / 4),
      createdAt: now,
      updatedAt: now,
    });
  }

  return chunks;
}

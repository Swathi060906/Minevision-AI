import { IStorageAdapter } from '../storage/storageAdapter';
import { defaultStorage } from '../storage/localStorageAdapter';
import {
  ComplianceKnowledge,
  CreateKnowledgeInput,
  UpdateKnowledgeInput,
  KnowledgeStatus,
  VerificationStatus,
} from '../models/ComplianceKnowledge';
import { KnowledgeChunk } from '../models/KnowledgeChunk';
import { INITIAL_COMPLIANCE_KNOWLEDGE_SEED } from '../seed/complianceKnowledgeSeed';
import { chunkKnowledgeDocument } from '../../services/complianceKnowledgeService';
import { UserRole } from '../../types';

export const COMPLIANCE_KNOWLEDGE_STORAGE_KEY = 'compliance_knowledge';
export const COMPLIANCE_CHUNKS_STORAGE_KEY = 'compliance_knowledge_chunks';

export interface KnowledgeFilter {
  search?: string;
  category?: string;
  status?: KnowledgeStatus;
  verificationStatus?: VerificationStatus;
  mineType?: string;
  role?: UserRole;
  isSyntheticDemo?: boolean;
}

export class ComplianceKnowledgeRepository {
  private storage: IStorageAdapter;
  private initialized = false;

  constructor(storage: IStorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  private async ensureInitialized(): Promise<ComplianceKnowledge[]> {
    let items = await this.storage.getItem<ComplianceKnowledge[]>(
      COMPLIANCE_KNOWLEDGE_STORAGE_KEY
    );

    if (!items || items.length === 0) {
      // Seed initial synthetic knowledge base
      const seedItems: ComplianceKnowledge[] = JSON.parse(
        JSON.stringify(INITIAL_COMPLIANCE_KNOWLEDGE_SEED)
      );

      // Generate chunks for all seed items
      const allChunks: KnowledgeChunk[] = [];
      for (const item of seedItems) {
        const chunks = chunkKnowledgeDocument(item);
        item.chunkIds = chunks.map((c) => c.id);
        allChunks.push(...chunks);
      }

      await this.storage.setItem(COMPLIANCE_KNOWLEDGE_STORAGE_KEY, seedItems);
      await this.storage.setItem(COMPLIANCE_CHUNKS_STORAGE_KEY, allChunks);
      items = seedItems;
    }

    this.initialized = true;
    return items;
  }

  async getAll(filter?: KnowledgeFilter): Promise<ComplianceKnowledge[]> {
    const items = await this.ensureInitialized();
    if (!filter) return items;

    return items.filter((item) => {
      if (filter.status && item.status !== filter.status) {
        return false;
      }
      if (filter.verificationStatus && item.verificationStatus !== filter.verificationStatus) {
        return false;
      }
      if (filter.category && filter.category !== 'ALL' && item.category !== filter.category) {
        return false;
      }
      if (filter.mineType && filter.mineType !== 'ALL') {
        const matchesType = item.applicableMineTypes.some(
          (t) => t.toLowerCase() === filter.mineType?.toLowerCase() || t === 'Mixed'
        );
        if (!matchesType) return false;
      }
      if (filter.role && filter.role !== 'ADMIN') {
        if (!item.applicableRoles.includes(filter.role)) {
          return false;
        }
      }
      if (filter.isSyntheticDemo !== undefined && item.isSyntheticDemo !== filter.isSyntheticDemo) {
        return false;
      }
      if (filter.search && filter.search.trim().length > 0) {
        const q = filter.search.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesShort = item.shortTitle?.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesRef = item.sourceReference.toLowerCase().includes(q);
        const matchesAuth = item.authority.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
        const matchesKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
        const matchesContent = item.content.toLowerCase().includes(q);

        if (
          !matchesTitle &&
          !matchesShort &&
          !matchesDesc &&
          !matchesRef &&
          !matchesAuth &&
          !matchesCat &&
          !matchesTags &&
          !matchesKeywords &&
          !matchesContent
        ) {
          return false;
        }
      }
      return true;
    });
  }

  async getById(id: string): Promise<ComplianceKnowledge | null> {
    const items = await this.ensureInitialized();
    return items.find((item) => item.id === id) || null;
  }

  async create(input: CreateKnowledgeInput): Promise<ComplianceKnowledge> {
    const items = await this.ensureInitialized();
    const now = new Date().toISOString();
    const id = `KNOW-CUSTOM-${Date.now().toString(36).toUpperCase()}`;

    const newRecord: ComplianceKnowledge = {
      id,
      title: input.title.trim(),
      shortTitle: input.shortTitle?.trim() || input.title.trim().slice(0, 40),
      description: input.description.trim(),
      category: input.category,
      subcategory: input.subcategory?.trim() || 'General Operations',
      jurisdiction: input.jurisdiction?.trim() || 'National - India (Demonstration Context)',
      authority: input.authority.trim(),
      sourceName: input.sourceName.trim(),
      sourceReference: input.sourceReference.trim(),
      sourceUrl: input.sourceUrl?.trim(),
      documentType: input.documentType,
      documentVersion: input.documentVersion?.trim() || '1.0',
      effectiveDate: input.effectiveDate,
      expiryDate: input.expiryDate,
      status: input.status || 'ACTIVE',
      applicableMineTypes: input.applicableMineTypes || ['Open Cast', 'Underground', 'Mixed'],
      applicableRoles: input.applicableRoles || ['ADMIN', 'OFFICER', 'OPERATOR'],
      tags: Array.from(new Set(input.tags.map((t) => t.trim().toLowerCase()))),
      keywords: Array.from(new Set(input.keywords.map((k) => k.trim().toLowerCase()))),
      content: input.content.trim(),
      summary: input.summary?.trim() || input.description.trim(),
      sections: input.sections || [],
      clauses: input.clauses || [],
      verificationStatus: input.verificationStatus || 'NEEDS_REVIEW',
      verifiedBy: input.verifiedBy,
      verifiedAt: input.verificationStatus === 'VERIFIED' ? now : undefined,
      isSyntheticDemo: input.isSyntheticDemo !== undefined ? input.isSyntheticDemo : true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    // Generate chunks for newly created record
    const newChunks = chunkKnowledgeDocument(newRecord);
    newRecord.chunkIds = newChunks.map((c) => c.id);

    items.unshift(newRecord);
    await this.storage.setItem(COMPLIANCE_KNOWLEDGE_STORAGE_KEY, items);

    // Persist new chunks
    const existingChunks = (await this.storage.getItem<KnowledgeChunk[]>(COMPLIANCE_CHUNKS_STORAGE_KEY)) || [];
    await this.storage.setItem(COMPLIANCE_CHUNKS_STORAGE_KEY, [...newChunks, ...existingChunks]);

    return newRecord;
  }

  async update(id: string, updates: UpdateKnowledgeInput): Promise<ComplianceKnowledge> {
    const items = await this.ensureInitialized();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Knowledge record with ID ${id} not found.`);
    }

    const current = items[index];
    const now = new Date().toISOString();

    const isContentChanged =
      updates.content !== undefined && updates.content.trim() !== current.content;

    const updatedRecord: ComplianceKnowledge = {
      ...current,
      ...updates,
      tags: updates.tags ? Array.from(new Set(updates.tags.map((t) => t.trim().toLowerCase()))) : current.tags,
      keywords: updates.keywords
        ? Array.from(new Set(updates.keywords.map((k) => k.trim().toLowerCase())))
        : current.keywords,
      version: isContentChanged ? current.version + 1 : current.version,
      updatedAt: now,
    };

    if (updates.verificationStatus === 'VERIFIED' && current.verificationStatus !== 'VERIFIED') {
      updatedRecord.verifiedAt = now;
      updatedRecord.verifiedBy = updates.verifiedBy || 'Administrator (Manual Verification)';
    }

    // If content or metadata changed, rebuild chunks for this record
    if (isContentChanged || updates.title || updates.category || updates.verificationStatus) {
      const freshChunks = chunkKnowledgeDocument(updatedRecord);
      updatedRecord.chunkIds = freshChunks.map((c) => c.id);

      // Update stored chunks
      const allChunks = (await this.storage.getItem<KnowledgeChunk[]>(COMPLIANCE_CHUNKS_STORAGE_KEY)) || [];
      const filteredChunks = allChunks.filter((c) => c.knowledgeId !== id);
      await this.storage.setItem(COMPLIANCE_CHUNKS_STORAGE_KEY, [...freshChunks, ...filteredChunks]);
    }

    items[index] = updatedRecord;
    await this.storage.setItem(COMPLIANCE_KNOWLEDGE_STORAGE_KEY, items);
    return updatedRecord;
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.ensureInitialized();
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;

    await this.storage.setItem(COMPLIANCE_KNOWLEDGE_STORAGE_KEY, filtered);

    // Remove associated chunks
    const allChunks = (await this.storage.getItem<KnowledgeChunk[]>(COMPLIANCE_CHUNKS_STORAGE_KEY)) || [];
    const filteredChunks = allChunks.filter((c) => c.knowledgeId !== id);
    await this.storage.setItem(COMPLIANCE_CHUNKS_STORAGE_KEY, filteredChunks);

    return true;
  }

  async archive(id: string): Promise<ComplianceKnowledge> {
    return this.update(id, { status: 'ARCHIVED' });
  }

  async setVerificationStatus(
    id: string,
    status: VerificationStatus,
    verifiedBy?: string
  ): Promise<ComplianceKnowledge> {
    return this.update(id, {
      verificationStatus: status,
      verifiedBy: status === 'VERIFIED' ? verifiedBy || 'Administrator' : undefined,
    });
  }

  async getChunks(knowledgeId?: string): Promise<KnowledgeChunk[]> {
    await this.ensureInitialized();
    const allChunks = (await this.storage.getItem<KnowledgeChunk[]>(COMPLIANCE_CHUNKS_STORAGE_KEY)) || [];
    if (!knowledgeId) return allChunks;
    return allChunks.filter((c) => c.knowledgeId === knowledgeId);
  }

  async saveChunks(chunks: KnowledgeChunk[]): Promise<void> {
    await this.storage.setItem(COMPLIANCE_CHUNKS_STORAGE_KEY, chunks);
  }

  async rebuildChunks(knowledgeId: string): Promise<KnowledgeChunk[]> {
    const record = await this.getById(knowledgeId);
    if (!record) {
      throw new Error(`Knowledge record ${knowledgeId} not found to rebuild chunks.`);
    }

    const freshChunks = chunkKnowledgeDocument(record);
    record.chunkIds = freshChunks.map((c) => c.id);

    // Save record update
    const items = await this.ensureInitialized();
    const idx = items.findIndex((i) => i.id === knowledgeId);
    if (idx !== -1) {
      items[idx] = record;
      await this.storage.setItem(COMPLIANCE_KNOWLEDGE_STORAGE_KEY, items);
    }

    // Save chunks
    const allChunks = (await this.storage.getItem<KnowledgeChunk[]>(COMPLIANCE_CHUNKS_STORAGE_KEY)) || [];
    const otherChunks = allChunks.filter((c) => c.knowledgeId !== knowledgeId);
    const combined = [...freshChunks, ...otherChunks];
    await this.storage.setItem(COMPLIANCE_CHUNKS_STORAGE_KEY, combined);

    return freshChunks;
  }

  async rebuildAllChunks(): Promise<number> {
    const items = await this.ensureInitialized();
    const allFreshChunks: KnowledgeChunk[] = [];

    for (const item of items) {
      const chunks = chunkKnowledgeDocument(item);
      item.chunkIds = chunks.map((c) => c.id);
      allFreshChunks.push(...chunks);
    }

    await this.storage.setItem(COMPLIANCE_KNOWLEDGE_STORAGE_KEY, items);
    await this.storage.setItem(COMPLIANCE_CHUNKS_STORAGE_KEY, allFreshChunks);
    return allFreshChunks.length;
  }

  async reset(): Promise<void> {
    await this.storage.removeItem(COMPLIANCE_KNOWLEDGE_STORAGE_KEY);
    await this.storage.removeItem(COMPLIANCE_CHUNKS_STORAGE_KEY);
    this.initialized = false;
    await this.ensureInitialized();
  }
}

export const complianceKnowledgeRepository = new ComplianceKnowledgeRepository();

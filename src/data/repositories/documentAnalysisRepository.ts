import { IStorageAdapter } from '../storage/storageAdapter';
import { defaultStorage } from '../storage/localStorageAdapter';
import { DocumentAnalysis, DocumentAnalysisStatus, CreateDocumentAnalysisInput } from '../models/DocumentAnalysis';
import { ProposedFinding, ProposedFindingReviewStatus } from '../models/ProposedFinding';
import { UserRole } from '../../auth/authTypes';
import {
  SEED_DEMO_DOCUMENT_ANALYSES,
  SEED_DEMO_PROPOSED_FINDINGS,
} from '../seed/demoScenarioSeed';

function getNormalizedMineAliases(mineId: string): Set<string> {
  const ids = new Set<string>([mineId]);
  const numMatch = mineId.match(/(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    ids.add(`DEMO-MINE-${String(n).padStart(3, '0')}`);
    ids.add(`DEMO-MINE-${String(n).padStart(2, '0')}`);
    ids.add(`DEMO-MINE-${n}`);
    ids.add(`mine-${n}`);
    ids.add(`mine-${String(n).padStart(2, '0')}`);
    ids.add(`mine-${String(n).padStart(3, '0')}`);
  }
  return ids;
}

export const DOCUMENT_ANALYSES_STORAGE_KEY = 'document_analyses';
export const PROPOSED_FINDINGS_STORAGE_KEY = 'proposed_findings';

export interface DocumentAnalysisFilter {
  inspectionId?: string;
  mineId?: string;
  status?: DocumentAnalysisStatus;
  roleContext?: {
    role?: UserRole;
    assignedMineIds?: string[];
  };
}

export interface ProposedFindingFilter {
  analysisId?: string;
  inspectionId?: string;
  mineId?: string;
  reviewStatus?: ProposedFindingReviewStatus;
  roleContext?: {
    role?: UserRole;
    assignedMineIds?: string[];
  };
}

export class DocumentAnalysisRepository {
  private storage: IStorageAdapter;

  constructor(storage: IStorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  // --- Document Analyses ---

  async getAllAnalyses(filter?: DocumentAnalysisFilter): Promise<DocumentAnalysis[]> {
    let items = await this.storage.getItem<DocumentAnalysis[]>(DOCUMENT_ANALYSES_STORAGE_KEY);
    if (!items || items.length === 0) {
      items = [...SEED_DEMO_DOCUMENT_ANALYSES];
      await this.storage.setItem(DOCUMENT_ANALYSES_STORAGE_KEY, items);
    }

    let filtered = [...items];

    // Mine access scoping
    if (filter?.roleContext && filter.roleContext.role !== 'ADMIN') {
      const assigned = filter.roleContext.assignedMineIds || [];
      if (assigned.length === 0) {
        return [];
      }
      const allowedAliases = new Set(
        assigned.flatMap((id) => Array.from(getNormalizedMineAliases(id)))
      );
      filtered = filtered.filter((a) => allowedAliases.has(a.mineId));
    }

    if (filter?.mineId) {
      const targetAliases = getNormalizedMineAliases(filter.mineId);
      filtered = filtered.filter((a) => targetAliases.has(a.mineId));
    }

    if (filter?.inspectionId) {
      filtered = filtered.filter((a) => a.inspectionId === filter.inspectionId);
    }

    if (filter?.status) {
      filtered = filtered.filter((a) => a.analysisStatus === filter.status);
    }

    // Sort descending by creation date
    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getAnalysisById(id: string): Promise<DocumentAnalysis | null> {
    const items = await this.getAllAnalyses();
    const found = items.find((a) => a.id === id);
    if (!found) return null;

    // Attach current proposed findings
    const findings = await this.getProposedFindings({ analysisId: id });
    return {
      ...found,
      proposedFindings: findings,
    };
  }

  async createAnalysis(input: CreateDocumentAnalysisInput): Promise<DocumentAnalysis> {
    const items = await this.getAllAnalyses();
    const now = new Date().toISOString();

    const newAnalysis: DocumentAnalysis = {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      inspectionId: input.inspectionId,
      mineId: input.mineId,
      evidenceId: input.evidenceId,
      fileName: input.fileName,
      fileType: input.fileType,
      fileSizeBytes: input.fileSizeBytes || 0,
      analysisStatus: 'PENDING',
      extractedFacts: [],
      retrievedKnowledgeIds: [],
      retrievedChunkIds: [],
      ragPolicyUsed: input.isDemoMode ? 'ALLOW_DEMO' : 'VERIFIED_ONLY',
      isDemoMode: Boolean(input.isDemoMode),
      proposedFindings: [],
      modelProvider: 'Google Gemini',
      modelName: 'gemini-3.8-flash',
      startedAt: now,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    items.unshift(newAnalysis);
    await this.storage.setItem(DOCUMENT_ANALYSES_STORAGE_KEY, items);
    return newAnalysis;
  }

  async updateAnalysis(
    id: string,
    updates: Partial<DocumentAnalysis>
  ): Promise<DocumentAnalysis> {
    const items = await this.getAllAnalyses();
    const idx = items.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error(`DocumentAnalysis not found: ${id}`);
    }

    const updated: DocumentAnalysis = {
      ...items[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    items[idx] = updated;
    await this.storage.setItem(DOCUMENT_ANALYSES_STORAGE_KEY, items);
    return updated;
  }

  async deleteAnalysis(id: string): Promise<boolean> {
    const items = await this.getAllAnalyses();
    const filtered = items.filter((a) => a.id !== id);
    if (filtered.length === items.length) return false;

    await this.storage.setItem(DOCUMENT_ANALYSES_STORAGE_KEY, filtered);

    // Also remove associated proposed findings
    const findings = await this.getProposedFindings();
    const remainingFindings = findings.filter((f) => f.analysisId !== id);
    await this.storage.setItem(PROPOSED_FINDINGS_STORAGE_KEY, remainingFindings);

    return true;
  }

  // --- Proposed Findings ---

  async getProposedFindings(filter?: ProposedFindingFilter): Promise<ProposedFinding[]> {
    let items = await this.storage.getItem<ProposedFinding[]>(PROPOSED_FINDINGS_STORAGE_KEY);
    if (!items || items.length === 0) {
      items = [...SEED_DEMO_PROPOSED_FINDINGS];
      await this.storage.setItem(PROPOSED_FINDINGS_STORAGE_KEY, items);
    }

    let filtered = [...items];

    if (filter?.roleContext && filter.roleContext.role !== 'ADMIN') {
      const assigned = filter.roleContext.assignedMineIds || [];
      if (assigned.length === 0) {
        return [];
      }
      const allowedAliases = new Set(
        assigned.flatMap((id) => Array.from(getNormalizedMineAliases(id)))
      );
      filtered = filtered.filter((f) => allowedAliases.has(f.mineId));
    }

    if (filter?.analysisId) {
      filtered = filtered.filter((f) => f.analysisId === filter.analysisId);
    }

    if (filter?.inspectionId) {
      filtered = filtered.filter((f) => f.inspectionId === filter.inspectionId);
    }

    if (filter?.mineId) {
      const targetAliases = getNormalizedMineAliases(filter.mineId);
      filtered = filtered.filter((f) => targetAliases.has(f.mineId));
    }

    if (filter?.reviewStatus) {
      filtered = filtered.filter((f) => f.reviewStatus === filter.reviewStatus);
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getProposedFindingById(id: string): Promise<ProposedFinding | null> {
    const items = await this.getProposedFindings();
    return items.find((f) => f.id === id) || null;
  }

  async createProposedFinding(
    data: Omit<ProposedFinding, 'id' | 'createdAt' | 'updatedAt' | 'reviewStatus'> & {
      reviewStatus?: ProposedFindingReviewStatus;
    }
  ): Promise<ProposedFinding> {
    const items = await this.getProposedFindings();
    const now = new Date().toISOString();

    const newFinding: ProposedFinding = {
      ...data,
      id: `prop-finding-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      reviewStatus: data.reviewStatus || 'PENDING_REVIEW',
      createdAt: now,
      updatedAt: now,
    };

    items.unshift(newFinding);
    await this.storage.setItem(PROPOSED_FINDINGS_STORAGE_KEY, items);

    // Keep analysis in sync
    const analysis = await this.getAnalysisById(newFinding.analysisId);
    if (analysis) {
      const currentList = analysis.proposedFindings || [];
      const updatedFindings = [newFinding, ...currentList.filter((f) => f.id !== newFinding.id)];
      await this.updateAnalysis(newFinding.analysisId, {
        proposedFindings: updatedFindings,
      });
    }

    return newFinding;
  }

  async updateProposedFinding(
    id: string,
    updates: Partial<ProposedFinding>
  ): Promise<ProposedFinding> {
    const items = await this.getProposedFindings();
    const idx = items.findIndex((f) => f.id === id);
    if (idx === -1) {
      throw new Error(`ProposedFinding not found: ${id}`);
    }

    const updated: ProposedFinding = {
      ...items[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    items[idx] = updated;
    await this.storage.setItem(PROPOSED_FINDINGS_STORAGE_KEY, items);

    // Update parent analysis
    const analysis = await this.getAnalysisById(updated.analysisId);
    if (analysis) {
      const findings = await this.getProposedFindings({ analysisId: updated.analysisId });
      // Calculate new overall analysis status if all proposals are reviewed
      const allReviewed = findings.length > 0 && findings.every((f) => f.reviewStatus !== 'PENDING_REVIEW');
      const newAnalysisStatus: DocumentAnalysisStatus = allReviewed ? 'COMPLETED' : 'REVIEW_REQUIRED';

      await this.updateAnalysis(updated.analysisId, {
        proposedFindings: findings,
        analysisStatus: newAnalysisStatus,
        completedAt: allReviewed ? new Date().toISOString() : undefined,
      });
    }

    return updated;
  }

  async reset(): Promise<void> {
    await this.storage.removeItem(DOCUMENT_ANALYSES_STORAGE_KEY);
    await this.storage.removeItem(PROPOSED_FINDINGS_STORAGE_KEY);
  }
}

export const documentAnalysisRepository = new DocumentAnalysisRepository();

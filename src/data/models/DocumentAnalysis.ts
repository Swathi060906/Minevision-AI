import { ExtractedFact } from './ExtractedFact';
import { ProposedFinding } from './ProposedFinding';

export type DocumentAnalysisStatus =
  | 'PENDING'
  | 'EXTRACTING'
  | 'RETRIEVING'
  | 'ANALYZING'
  | 'REVIEW_REQUIRED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface DocumentAnalysis {
  id: string;
  inspectionId: string;
  mineId: string;
  evidenceId?: string;
  fileName: string;
  fileType: string;
  fileSizeBytes?: number;

  analysisStatus: DocumentAnalysisStatus;

  // Extracted Facts
  extractedFacts: ExtractedFact[];

  // RAG Retrieval Metadata
  ragQuery?: string;
  retrievedKnowledgeIds: string[];
  retrievedChunkIds: string[];
  ragPolicyUsed: 'VERIFIED_ONLY' | 'ALLOW_DEMO';
  isDemoMode: boolean;

  // Grounded Proposed Findings
  proposedFindings: ProposedFinding[];

  // Provider & Model Metadata
  modelProvider: string;
  modelName: string;

  // Timestamps & Metrics
  startedAt: string;
  completedAt?: string;
  durationMs?: number;

  createdBy: string;
  createdAt: string;
  updatedAt: string;

  errorMessage?: string;
}

export interface CreateDocumentAnalysisInput {
  inspectionId: string;
  mineId: string;
  evidenceId?: string;
  fileName: string;
  fileType: string;
  fileSizeBytes?: number;
  createdBy: string;
  isDemoMode?: boolean;
}

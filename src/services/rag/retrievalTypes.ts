import { VerificationStatus } from '../../data/models/ComplianceKnowledge';
import { UserRole } from '../../types';

export type RetrievalPolicy = 'VERIFIED_ONLY' | 'ALLOW_DEMO' | 'INCLUDE_ALL';

export type RetrievalConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface RetrievalQuery {
  query: string;
  policy?: RetrievalPolicy;
  category?: string;
  mineType?: string;
  role?: UserRole;
  limit?: number;
  minScore?: number;
}

export interface RetrievalResultItem {
  chunkId: string;
  knowledgeId: string;
  title: string;
  heading: string;
  sourceName: string;
  sourceReference: string;
  section?: string;
  clause?: string;
  content: string;
  score: number; // 0 to 1
  matchedTerms: string[];
  verificationStatus: VerificationStatus;
  isSyntheticDemo: boolean;
  category: string;
  applicableMineTypes: string[];
}

export interface SourceCitation {
  id: string;
  title: string;
  sourceName: string;
  sourceReference: string;
  authority: string;
  documentVersion: string;
  verificationStatus: VerificationStatus;
  isSyntheticDemo: boolean;
  category: string;
}

export interface RetrievalResponse {
  query: string;
  normalizedQuery: string;
  policy: RetrievalPolicy;
  results: RetrievalResultItem[];
  groundedContext: string;
  sources: SourceCitation[];
  confidence: RetrievalConfidence;
  hasVerifiedInformation: boolean;
  hasDemoInformation: boolean;
  retrievalDurationMs: number;
  fallbackMessage?: string;
}

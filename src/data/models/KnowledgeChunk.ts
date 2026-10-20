import { VerificationStatus } from './ComplianceKnowledge';

export interface ChunkMetadata {
  sourceName: string;
  sourceReference: string;
  category: string;
  subcategory?: string;
  authority: string;
  verificationStatus: VerificationStatus;
  isSyntheticDemo: boolean;
  applicableMineTypes: string[];
  applicableRoles: string[];
  version: number;
}

export interface KnowledgeChunk {
  id: string;
  knowledgeId: string;
  chunkIndex: number;
  content: string;
  heading: string;
  section?: string;
  clause?: string;
  keywords: string[];
  tags: string[];
  metadata: ChunkMetadata;
  tokenEstimate: number;
  characterCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChunkInput {
  knowledgeId: string;
  chunkIndex: number;
  content: string;
  heading: string;
  section?: string;
  clause?: string;
  keywords: string[];
  tags: string[];
  metadata: ChunkMetadata;
}

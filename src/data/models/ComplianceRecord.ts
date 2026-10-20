import { ComplianceStatus } from '../../types';

export type ComplianceCategory =
  | 'SAFETY'
  | 'ENVIRONMENT'
  | 'EQUIPMENT'
  | 'PPE'
  | 'DOCUMENTATION';

export interface ComplianceRecord {
  id: string;
  mineId: string;
  inspectionId?: string;
  complianceKnowledgeId?: string;
  knowledgeReference?: string;
  category: ComplianceCategory;
  score: number;
  status: ComplianceStatus;
  findingCount: number;
  criticalFindingCount: number;
  evaluatedAt: string;
  sourceType: 'INSPECTION' | 'AUDIT' | 'STATUTORY_REVIEW';
}

export interface CategorySummary {
  category: string;
  score: number;
  benchmark: number;
  description: string;
  recordCount: number;
}

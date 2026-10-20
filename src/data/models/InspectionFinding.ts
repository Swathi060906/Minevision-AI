export type FindingCategory =
  | 'SAFETY'
  | 'ENVIRONMENT'
  | 'EQUIPMENT'
  | 'PPE'
  | 'DOCUMENTATION'
  | 'VENTILATION';

export type FindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FindingStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';

export interface InspectionFinding {
  id: string;
  inspectionId: string;
  mineId: string;
  category: FindingCategory;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  ruleReference?: string;
  complianceKnowledgeId?: string;
  knowledgeReference?: string;
  correctiveAction?: string;
  dueDate?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFindingInput {
  inspectionId: string;
  mineId: string;
  category: FindingCategory;
  title: string;
  description: string;
  severity: FindingSeverity;
  status?: FindingStatus;
  ruleReference?: string;
  complianceKnowledgeId?: string;
  knowledgeReference?: string;
  correctiveAction?: string;
  dueDate?: string;
}

export interface UpdateFindingInput {
  title?: string;
  description?: string;
  category?: FindingCategory;
  severity?: FindingSeverity;
  status?: FindingStatus;
  ruleReference?: string;
  complianceKnowledgeId?: string;
  knowledgeReference?: string;
  correctiveAction?: string;
  dueDate?: string;
  resolvedAt?: string;
}

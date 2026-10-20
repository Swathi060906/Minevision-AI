export type KnowledgeCategory =
  | 'Mine Safety'
  | 'Occupational Health'
  | 'Environmental Compliance'
  | 'Explosives & Blasting'
  | 'Electrical Safety'
  | 'Machinery Safety'
  | 'Emergency Preparedness'
  | 'Personal Protective Equipment'
  | 'Ventilation'
  | 'Ground Control'
  | 'Fire Safety'
  | 'Labour / Worker Welfare'
  | 'Reporting & Record Keeping';

export type KnowledgeStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'SUPERSEDED';

export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'NEEDS_REVIEW';

export type DocumentType =
  | 'ACT'
  | 'REGULATION'
  | 'CIRCULAR'
  | 'STANDARD_OPERATING_PROCEDURE'
  | 'SAFETY_GUIDELINE'
  | 'INTERNAL_POLICY';

export interface KnowledgeClause {
  clauseNumber: string;
  title?: string;
  text: string;
  penaltiesOrMandates?: string;
}

export interface KnowledgeSection {
  sectionNumber: string;
  title: string;
  clauses: KnowledgeClause[];
}

export interface ComplianceKnowledge {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  category: KnowledgeCategory;
  subcategory: string;
  jurisdiction: string;
  authority: string;
  sourceName: string;
  sourceReference: string;
  sourceUrl?: string;
  documentType: DocumentType;
  documentVersion: string;
  effectiveDate: string;
  expiryDate?: string;
  status: KnowledgeStatus;
  applicableMineTypes: ('Open Cast' | 'Underground' | 'Mixed')[];
  applicableRoles: ('ADMIN' | 'OFFICER' | 'OPERATOR')[];
  tags: string[];
  keywords: string[];
  content: string;
  summary: string;
  sections: KnowledgeSection[];
  clauses: string[];
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  isSyntheticDemo: boolean;
  version: number;
  supersededById?: string;
  chunkIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeInput {
  title: string;
  shortTitle?: string;
  description: string;
  category: KnowledgeCategory;
  subcategory?: string;
  jurisdiction?: string;
  authority: string;
  sourceName: string;
  sourceReference: string;
  sourceUrl?: string;
  documentType: DocumentType;
  documentVersion?: string;
  effectiveDate: string;
  expiryDate?: string;
  status?: KnowledgeStatus;
  applicableMineTypes?: ('Open Cast' | 'Underground' | 'Mixed')[];
  applicableRoles?: ('ADMIN' | 'OFFICER' | 'OPERATOR')[];
  tags: string[];
  keywords: string[];
  content: string;
  summary?: string;
  sections?: KnowledgeSection[];
  clauses?: string[];
  verificationStatus?: VerificationStatus;
  verifiedBy?: string;
  isSyntheticDemo?: boolean;
}

export interface UpdateKnowledgeInput {
  title?: string;
  shortTitle?: string;
  description?: string;
  category?: KnowledgeCategory;
  subcategory?: string;
  jurisdiction?: string;
  authority?: string;
  sourceName?: string;
  sourceReference?: string;
  sourceUrl?: string;
  documentType?: DocumentType;
  documentVersion?: string;
  effectiveDate?: string;
  expiryDate?: string;
  status?: KnowledgeStatus;
  applicableMineTypes?: ('Open Cast' | 'Underground' | 'Mixed')[];
  applicableRoles?: ('ADMIN' | 'OFFICER' | 'OPERATOR')[];
  tags?: string[];
  keywords?: string[];
  content?: string;
  summary?: string;
  sections?: KnowledgeSection[];
  clauses?: string[];
  verificationStatus?: VerificationStatus;
  verifiedBy?: string;
  isSyntheticDemo?: boolean;
  supersededById?: string;
}

import { FindingCategory, FindingSeverity } from './InspectionFinding';
import { VerificationStatus } from './ComplianceKnowledge';

export type ProposedFindingReviewStatus =
  | 'PENDING_REVIEW'
  | 'ACCEPTED'
  | 'EDITED_AND_ACCEPTED'
  | 'REJECTED'
  | 'NEEDS_MORE_EVIDENCE';

export type ComplianceAnalysisOutcome =
  | 'SUPPORTED_COMPLIANT'
  | 'POTENTIAL_NON_COMPLIANCE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'MANUAL_REVIEW_REQUIRED';

export type ProposedFindingConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ProposedFinding {
  id: string;
  analysisId: string;
  inspectionId: string;
  mineId: string;

  category: FindingCategory;
  title: string;
  description: string;

  severitySuggestion: FindingSeverity;
  analysisOutcome: ComplianceAnalysisOutcome;

  // Evidence traceability
  evidenceFactIds: string[];
  evidenceText: string;
  sourcePage?: number | string;
  sourceSection?: string;

  // Grounded source traceability
  knowledgeId?: string;
  knowledgeChunkIds: string[];
  sourceReference?: string;
  sourceTitle?: string;
  authority?: string;
  sectionOrClause?: string;
  verificationStatus?: VerificationStatus;
  isSyntheticDemo?: boolean;

  // Reasoning & action
  reasoningSummary: string;
  recommendedCorrectiveAction?: string;
  confidence: ProposedFindingConfidence;

  // Human Review Lifecycle (AI NEVER automatically converts into official finding)
  reviewStatus: ProposedFindingReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  officialFindingId?: string; // ID of the created InspectionFinding when accepted

  createdAt: string;
  updatedAt: string;
}

export interface EditAndAcceptProposalInput {
  title: string;
  description: string;
  severity: FindingSeverity;
  category: FindingCategory;
  correctiveAction?: string;
  dueDate?: string;
  reviewNotes?: string;
}

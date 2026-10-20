export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type ComplianceStatus = 'Compliant' | 'Warning' | 'High Risk' | 'Critical';

export type InspectionStatus = 'Completed' | 'Review Required' | 'In Progress' | 'Scheduled' | 'Cancelled';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// Re-export models for unified access
export type { Mine, CreateMineInput, UpdateMineInput, MineType, MineStatus } from '../data/models/Mine';
export type {
  Inspection,
  CreateInspectionInput,
  UpdateInspectionInput,
  InspectionType,
} from '../data/models/Inspection';
export type {
  InspectionFinding,
  CreateFindingInput,
  UpdateFindingInput,
  FindingCategory,
  FindingSeverity,
  FindingStatus,
} from '../data/models/InspectionFinding';
export type { Evidence, CreateEvidenceInput } from '../data/models/Evidence';
export type {
  ComplianceRecord,
  CategorySummary,
  ComplianceCategory,
} from '../data/models/ComplianceRecord';
export type { Alert, CreateAlertInput, AlertStatus } from '../data/models/Alert';
export type {
  ComplianceKnowledge,
  CreateKnowledgeInput,
  UpdateKnowledgeInput,
  KnowledgeCategory,
  KnowledgeStatus,
  VerificationStatus,
  DocumentType,
  KnowledgeSection,
  KnowledgeClause,
} from '../data/models/ComplianceKnowledge';
export type {
  KnowledgeChunk,
  CreateChunkInput,
  ChunkMetadata,
} from '../data/models/KnowledgeChunk';
export type {
  ExtractedFact,
  FactCategory,
  FactConfidence,
} from '../data/models/ExtractedFact';
export type {
  ProposedFinding,
  ProposedFindingReviewStatus,
  ComplianceAnalysisOutcome,
  ProposedFindingConfidence,
  EditAndAcceptProposalInput,
} from '../data/models/ProposedFinding';
export type {
  DocumentAnalysis,
  DocumentAnalysisStatus,
  CreateDocumentAnalysisInput,
} from '../data/models/DocumentAnalysis';
export type {
  VisionDetection,
  BoundingBox,
  DetectionType,
} from '../data/models/VisionDetection';
export type {
  ZoneDefinition,
  ZoneType,
  ZoneGeometry,
  CreateZoneInput,
  UpdateZoneInput,
} from '../data/models/ZoneDefinition';
export type {
  SafetyObservation,
  ObservationType,
  ObservationStatus,
  SpatialDetails,
} from '../data/models/SafetyObservation';
export type {
  VisionEvidence,
  CreateVisionEvidenceInput,
} from '../data/models/VisionEvidence';
export type {
  VisionAnalysis,
  VisionAnalysisStatus,
  CreateVisionAnalysisInput,
} from '../data/models/VisionAnalysis';
export type {
  RetrievalQuery,
  RetrievalResponse,
  RetrievalResultItem,
  SourceCitation,
  RetrievalConfidence,
  RetrievalPolicy,
} from '../services/rag/retrievalTypes';

// Compatibility alias for existing Phase 1 components
export type CriticalAlert = import('../data/models/Alert').Alert;

export interface ComplianceTrendPoint {
  month: string;
  complianceScore: number;
  targetScore: number;
  inspectionsCount: number;
}

export interface UserSession {
  name: string;
  email: string;
  role: string;
  officerId: string;
  department: string;
  isAuthenticated: boolean;
}

export type {
  RiskScoreBand,
  RiskTrendDirection,
  RiskTimeWindow,
  RiskFactorType,
  RiskFactorContribution,
  RiskDriver,
  CategoryRiskAnalysis,
  RecurringIssue,
  FindingAgingItem,
  PriorityAttentionItem,
  RiskAgingSummary,
  MineRiskCounts,
  AiRiskNarrative,
  MineRiskProfile,
  RiskEngineConfig,
  RiskSnapshot,
} from '../data/models/RiskIntelligence';

export type {
  PredictionTrajectory,
  PredictionConfidence,
  EarlyWarningBand,
  PredictionStatus,
  PredictiveHorizon,
  PredictiveSignalType,
  PredictiveSignal,
  EarlyWarningFactorType,
  EarlyWarningFactorContribution,
  PredictiveDriver,
  DomainPrediction,
  PredictiveHorizonProjection,
  InterventionRecommendation,
  HistoricalTrajectoryPoint,
  DataSufficiencyEvaluation,
  AiPredictiveNarrative,
  MinePrediction,
  PredictiveSnapshot,
} from '../data/models/PredictiveIntelligence';

export type { UserRole, AuthUser, AuthSession, AuditEvent, LoginCredentials, LoginResult } from '../auth/authTypes';

export type AppRoute =
  | 'login'
  | 'dashboard'
  | 'mines'
  | 'inspections'
  | 'compliance'
  | 'ai-analysis'
  | 'safety-vision'
  | 'risk-intelligence'
  | 'predictive-intelligence'
  | 'alerts'
  | 'reports'
  | 'analytics'
  | 'administration'
  | 'settings';

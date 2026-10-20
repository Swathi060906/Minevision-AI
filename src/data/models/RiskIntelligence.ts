import { FindingCategory, FindingSeverity } from './InspectionFinding';
import { AlertSeverity } from '../../types';

export type RiskScoreBand = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'INSUFFICIENT_DATA';

export type RiskTrendDirection = 'IMPROVING' | 'STABLE' | 'WORSENING' | 'INSUFFICIENT_DATA';

export type RiskTimeWindow = '7d' | '30d' | '90d';

export type RiskFactorType =
  | 'SEVERITY'
  | 'RECURRENCE'
  | 'AGING'
  | 'ACTIVE_ALERTS'
  | 'COMPLIANCE_EXPOSURE';

export interface RiskFactorContribution {
  factor: RiskFactorType;
  label: string;
  contributionPoints: number;
  maxPossiblePoints: number;
  percentageOfTotal: number;
  description: string;
  sourceCount: number;
  sourceRecordIds: string[];
}

export interface RiskDriver {
  id: string;
  rank: number;
  title: string;
  factorType: RiskFactorType;
  severity: FindingSeverity | AlertSeverity;
  description: string;
  sourceType: 'FINDING' | 'ALERT' | 'VISION' | 'INSPECTION';
  sourceId: string;
  sourceReference?: string;
  evidenceSummary?: string;
  verifiedKnowledge?: {
    knowledgeId?: string;
    reference?: string;
    title?: string;
    authority?: string;
  };
}

export interface CategoryRiskAnalysis {
  category: string;
  displayName: string;
  score: number; // 0 - 100
  riskLevel: RiskScoreBand;
  openIssuesCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  recurrenceCount: number;
  trend: RiskTrendDirection;
  topFindingTitle?: string;
}

export interface RecurringIssue {
  id: string;
  category: string;
  title: string;
  occurrenceCount: number;
  firstOccurrence: string;
  mostRecentOccurrence: string;
  affectedInspectionIds: string[];
  findingIds: string[];
  status: 'ACTIVE' | 'PARTIALLY_RESOLVED' | 'RESOLVED';
  regulatoryReference?: string;
}

export interface FindingAgingItem {
  findingId: string;
  inspectionId: string;
  title: string;
  category: FindingCategory;
  severity: FindingSeverity;
  openedDate: string;
  ageDays: number;
  ageBracket: '0-7' | '8-30' | '31-90' | '90+';
  dueDate?: string;
  isOverdue: boolean;
  overdueDays?: number;
  correctiveAction?: string;
}

export interface PriorityAttentionItem {
  id: string;
  rank: number;
  title: string;
  category: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  reason: string;
  recommendedAction: string;
  linkedSourceIds: string[];
  linkedSourceType: 'FINDING' | 'ALERT' | 'INSPECTION';
}

export interface RiskAgingSummary {
  open0to7Days: number;
  open8to30Days: number;
  open31to90Days: number;
  openOver90Days: number;
  totalOverdue: number;
  oldestFindingDays: number;
  items: FindingAgingItem[];
}

export interface MineRiskCounts {
  totalFindings: number;
  openFindings: number;
  openCritical: number;
  openHigh: number;
  openMedium: number;
  openLow: number;
  activeAlerts: number;
  criticalAlerts: number;
  overdueActions: number;
  lastInspectionDate?: string;
  inspectionsCount: number;
  pendingAiProposalsCount: number; // Strictly segregated advisory signal
}

export interface AiRiskNarrative {
  summaryText: string;
  isAiGenerated: boolean;
  modelName?: string;
  generatedAt: string;
  disclaimer: string;
  keyConcerns: string[];
  recommendedDirectives: string[];
}

export interface MineRiskProfile {
  mineId: string;
  mineName: string;
  mineCode?: string;
  mineType?: string;
  state: string;
  district: string;
  overallScore: number; // 0 - 100
  riskLevel: RiskScoreBand;
  previousScore?: number;
  scoreDelta?: number;
  trend: RiskTrendDirection;
  trendTimeWindow: RiskTimeWindow;
  hasSufficientData: boolean;
  dataSufficiencyReason?: string;
  factors: RiskFactorContribution[];
  drivers: RiskDriver[];
  categoryRisks: CategoryRiskAnalysis[];
  recurringIssues: RecurringIssue[];
  agingSummary: RiskAgingSummary;
  priorityAttention: PriorityAttentionItem[];
  counts: MineRiskCounts;
  aiNarrative?: AiRiskNarrative;
  calculatedAt: string;
  dataFreshness: 'CURRENT' | 'RECENTLY_CALCULATED' | 'STALE' | 'INSUFFICIENT_DATA';
}

export interface RiskEngineConfig {
  version: string;
  updatedAt: string;
  updatedBy: string;
  severityWeights: {
    critical: number; // e.g. 15
    high: number;     // e.g. 8
    medium: number;   // e.g. 3
    low: number;      // e.g. 1
  };
  factorMaxPoints: {
    severity: number;    // 35
    recurrence: number;  // 25
    aging: number;       // 20
    alerts: number;      // 10
    exposure: number;    // 10
  };
  recurrenceMultiplier: number; // e.g. 4 pts per recurrent pattern
  agingWeights: {
    bracket31to90: number; // 3 pts
    bracketOver90: number; // 6 pts
    overdueExtra: number;  // 4 pts
  };
  alertWeights: {
    critical: number; // 5 pts
    high: number;     // 3 pts
    medium: number;   // 1 pt
  };
  thresholds: {
    lowMax: number;      // 24
    moderateMax: number; // 49
    highMax: number;     // 74
  };
}

export interface RiskSnapshot {
  id: string;
  mineId: string;
  timestamp: string;
  overallScore: number;
  riskLevel: RiskScoreBand;
  openCritical: number;
  openHigh: number;
  activeAlerts: number;
}

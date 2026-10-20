import { FindingCategory, FindingSeverity } from './InspectionFinding';
import { AlertSeverity } from '../../types';

export type PredictionTrajectory =
  | 'IMPROVING'
  | 'STABLE'
  | 'DETERIORATING'
  | 'RAPIDLY_DETERIORATING'
  | 'INSUFFICIENT_DATA';

export type PredictionConfidence =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'INSUFFICIENT';

export type EarlyWarningBand =
  | 'LOW'
  | 'MODERATE'
  | 'ELEVATED'
  | 'HIGH';

export type PredictionStatus =
  | 'FORECAST_AVAILABLE'
  | 'INSUFFICIENT_DATA'
  | 'NO_TREND'
  | 'ERROR';

export type PredictiveHorizon = '7d' | '30d' | '90d';

export type PredictiveSignalType =
  | 'RISK_TRAJECTORY'
  | 'RECURRENCE'
  | 'ESCALATION'
  | 'CORRECTIVE_ACTION'
  | 'DOMAIN_DETERIORATION'
  | 'ALERT_PATTERN'
  | 'INSPECTION_PATTERN';

export interface PredictiveSignal {
  id: string;
  mineId: string;
  type: PredictiveSignalType;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  scoreContribution: number;
  confidence: PredictionConfidence;
  explanation: string;
  sourceRefs: string[];
  sourceType: 'FINDING' | 'ALERT' | 'INSPECTION' | 'SNAPSHOT' | 'DOMAIN';
  detectedAt: string;
  horizon: PredictiveHorizon;
}

export type EarlyWarningFactorType =
  | 'CURRENT_RISK_MOMENTUM'
  | 'RECURRENCE_MOMENTUM'
  | 'RESOLUTION_DELAY_TREND'
  | 'DOMAIN_DETERIORATION'
  | 'ALERT_ESCALATION_PATTERN';

export interface EarlyWarningFactorContribution {
  factor: EarlyWarningFactorType;
  label: string;
  contributionPoints: number;
  maxPossiblePoints: number;
  percentageOfTotal: number;
  description: string;
  sourceCount: number;
  sourceRecordIds: string[];
}

export interface PredictiveDriver {
  id: string;
  rank: number;
  title: string;
  signalType: PredictiveSignalType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  scoreContribution: number;
  description: string;
  sourceType: 'FINDING' | 'ALERT' | 'SNAPSHOT' | 'INSPECTION' | 'DOMAIN';
  sourceId: string;
  sourceReference?: string;
  evidenceSummary?: string;
}

export interface DomainPrediction {
  domain: string;
  displayName: string;
  previousScore: number;
  currentScore: number;
  projectedScore?: number;
  scoreDelta: number;
  trajectory: PredictionTrajectory;
  confidence: PredictionConfidence;
  openIssuesCount: number;
  recurringCount: number;
  topConcern?: string;
}

export interface PredictiveHorizonProjection {
  horizon: PredictiveHorizon;
  horizonLabel: string;
  projectedDirection: PredictionTrajectory;
  projectedScore?: number;
  confidence: PredictionConfidence;
  explanation: string;
  isAvailable: boolean;
}

export interface InterventionRecommendation {
  id: string;
  rank: number;
  title: string;
  domain: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  rationale: string;
  recommendedAction: string;
  regulatoryReference?: string;
  linkedSignalIds: string[];
  linkedFindingIds?: string[];
  isStatutoryVerified: boolean;
}

export interface HistoricalTrajectoryPoint {
  date: string;
  label: string;
  score: number;
  isProjected: boolean;
  confidence?: PredictionConfidence;
}

export interface DataSufficiencyEvaluation {
  level: PredictionConfidence;
  isSufficient: boolean;
  inspectionsCount: number;
  observationsCount: number;
  findingsCount: number;
  resolvedFindingsCount: number;
  alertsCount: number;
  timeSpanDays: number;
  reasons: string[];
}

export interface AiPredictiveNarrative {
  summaryText: string;
  isAiGenerated: boolean;
  modelName?: string;
  generatedAt: string;
  disclaimer: string;
  topConcerns: string[];
  recommendedInterventions: string[];
}

export interface MinePrediction {
  mineId: string;
  mineName: string;
  mineCode?: string;
  mineType?: string;
  state: string;
  district: string;

  // Phase 7 Official Baseline
  officialCurrentRiskScore: number;
  officialRiskLevel: string;

  // Phase 8 Predictive Early Warning
  earlyWarningIndex: number;
  earlyWarningBand: EarlyWarningBand;
  trajectory: PredictionTrajectory;
  overallConfidence: PredictionConfidence;
  status: PredictionStatus;

  dataSufficiency: DataSufficiencyEvaluation;

  horizons: {
    sevenDay: PredictiveHorizonProjection;
    thirtyDay: PredictiveHorizonProjection;
    ninetyDay: PredictiveHorizonProjection;
  };

  factors: EarlyWarningFactorContribution[];
  signals: PredictiveSignal[];
  drivers: PredictiveDriver[];
  domainPredictions: DomainPrediction[];
  interventions: InterventionRecommendation[];
  trajectoryHistory: HistoricalTrajectoryPoint[];

  pendingAiProposalsCount: number;

  aiNarrative?: AiPredictiveNarrative;

  engineVersion: string;
  calculatedAt: string;
  analysisWindowDays: number;
  disclaimer: string;
}

export interface PredictiveSnapshot {
  id: string;
  mineId: string;
  calculatedAt: string;
  engineVersion: string;
  analysisWindow: string;
  horizon: PredictiveHorizon;
  currentRisk: number;
  earlyWarningIndex: number;
  trajectory: PredictionTrajectory;
  confidence: PredictionConfidence;
  dataSufficiency: PredictionConfidence;
  signalsCount: number;
  driversCount: number;
}

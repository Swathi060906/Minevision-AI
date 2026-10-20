import { Mine } from '../../data/models/Mine';
import { Inspection } from '../../data/models/Inspection';
import { InspectionFinding, FindingCategory } from '../../data/models/InspectionFinding';
import { Alert } from '../../data/models/Alert';
import { RiskSnapshot, MineRiskProfile } from '../../data/models/RiskIntelligence';
import {
  MinePrediction,
  PredictionTrajectory,
  PredictionConfidence,
  EarlyWarningBand,
  PredictionStatus,
  PredictiveSignal,
  PredictiveDriver,
  DomainPrediction,
  PredictiveHorizonProjection,
  InterventionRecommendation,
  HistoricalTrajectoryPoint,
  DataSufficiencyEvaluation,
  EarlyWarningFactorContribution,
} from '../../data/models/PredictiveIntelligence';

export interface PredictiveEngineInput {
  mine: Mine;
  currentRiskProfile: MineRiskProfile;
  inspections: Inspection[];
  findings: InspectionFinding[];
  alerts: Alert[];
  snapshots: RiskSnapshot[];
  pendingAiCount?: number;
}

export class PredictiveRiskEngine {
  public static readonly VERSION = '1.0.0';
  public static readonly ANALYSIS_WINDOW_DAYS = 90;

  /**
   * Deterministically calculates the complete Phase 8 predictive intelligence profile for a single mine.
   */
  public calculateMinePrediction(input: PredictiveEngineInput): MinePrediction {
    const {
      mine,
      currentRiskProfile,
      inspections,
      findings,
      alerts,
      snapshots,
      pendingAiCount = 0,
    } = input;

    const now = Date.now();
    const dayMs = 86400000;

    // Filter to mine
    const mineFindings = findings.filter((f) => f.mineId === mine.id);
    const openFindings = mineFindings.filter((f) => f.status === 'OPEN' || f.status === 'IN_REVIEW');
    const resolvedFindings = mineFindings.filter((f) => f.status === 'RESOLVED' || f.status === 'CLOSED');
    const mineInspections = inspections.filter((i) => i.mineId === mine.id);
    const mineAlerts = alerts.filter((a) => a.mineId === mine.id);
    const activeAlerts = mineAlerts.filter((a) => a.status === 'Active' || a.status === 'Under Review');

    // Mine snapshots (normalized ID check)
    const altId = mine.id.includes('-0') ? mine.id.replace('-0', '-') : mine.id.replace('mine-', 'mine-0');
    const mineSnapshots = snapshots
      .filter((s) => s.mineId === mine.id || s.mineId === altId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // 1. DATA SUFFICIENCY EVALUATION
    const dataSufficiency = this.evaluateDataSufficiency({
      inspections: mineInspections,
      findings: mineFindings,
      resolvedFindings,
      alerts: mineAlerts,
      snapshots: mineSnapshots,
      now,
    });

    // 2. HISTORICAL TRAJECTORY ANALYSIS
    const { trajectory, scoreDelta, momentumSlope } = this.calculateTrajectory(
      currentRiskProfile.overallScore,
      mineSnapshots,
      dataSufficiency.isSufficient
    );

    // 3. EARLY WARNING INDEX FORMULA (Deterministic Max 100)
    const factorBreakdown = this.calculateEarlyWarningFactors({
      currentRiskScore: currentRiskProfile.overallScore,
      scoreDelta,
      trajectory,
      recurringIssues: currentRiskProfile.recurringIssues,
      openFindings,
      activeAlerts,
      categoryRisks: currentRiskProfile.categoryRisks,
      isSufficient: dataSufficiency.isSufficient,
      now,
    });

    const earlyWarningIndex = dataSufficiency.isSufficient
      ? Math.min(
          100,
          Math.max(
            0,
            factorBreakdown.factors.reduce((acc, f) => acc + f.contributionPoints, 0)
          )
        )
      : 0;

    const earlyWarningBand = this.determineEarlyWarningBand(earlyWarningIndex, dataSufficiency.isSufficient);

    const status: PredictionStatus = !dataSufficiency.isSufficient
      ? 'INSUFFICIENT_DATA'
      : trajectory === 'STABLE'
      ? 'NO_TREND'
      : 'FORECAST_AVAILABLE';

    // 4. PREDICTION HORIZONS (7d, 30d, 90d)
    const horizons = this.calculateHorizons({
      currentScore: currentRiskProfile.overallScore,
      earlyWarningIndex,
      trajectory,
      momentumSlope,
      dataSufficiency,
    });

    // 5. SIGNALS GENERATION
    const signals = this.generateSignals({
      mineId: mine.id,
      factorBreakdown,
      trajectory,
      dataSufficiency,
      openFindings,
      activeAlerts,
      recurringIssues: currentRiskProfile.recurringIssues,
    });

    // 6. RANKED PREDICTIVE DRIVERS
    const drivers = this.generatePredictiveDrivers(signals);

    // 7. DOMAIN PREDICTIONS
    const domainPredictions = this.generateDomainPredictions({
      currentRiskProfile,
      mineFindings,
      openFindings,
      dataSufficiency,
    });

    // 8. INTERVENTION RECOMMENDATIONS
    const interventions = this.generateInterventions({
      signals,
      domainPredictions,
      openFindings,
      recurringIssues: currentRiskProfile.recurringIssues,
    });

    // 9. TRAJECTORY HISTORY & PROJECTION POINTS
    const trajectoryHistory = this.generateTrajectoryHistory({
      mineSnapshots,
      currentScore: currentRiskProfile.overallScore,
      horizons,
      now,
    });

    return {
      mineId: mine.id,
      mineName: mine.name,
      mineCode: mine.mineCode || mine.code,
      mineType: mine.mineType || mine.type,
      state: mine.state,
      district: mine.district,

      // Phase 7 Official Baseline
      officialCurrentRiskScore: currentRiskProfile.overallScore,
      officialRiskLevel: currentRiskProfile.riskLevel,

      // Phase 8 Early Warning Advisory
      earlyWarningIndex,
      earlyWarningBand,
      trajectory,
      overallConfidence: dataSufficiency.level,
      status,

      dataSufficiency,
      horizons,

      factors: factorBreakdown.factors,
      signals,
      drivers,
      domainPredictions,
      interventions,
      trajectoryHistory,

      pendingAiProposalsCount: pendingAiCount,

      engineVersion: PredictiveRiskEngine.VERSION,
      calculatedAt: new Date(now).toISOString(),
      analysisWindowDays: PredictiveRiskEngine.ANALYSIS_WINDOW_DAYS,
      disclaimer: 'Predictive Advisory — Not an Official Statutory Finding',
    };
  }

  /**
   * Evaluates if sufficient historical data exists for forward projection.
   */
  public evaluateDataSufficiency(params: {
    inspections: Inspection[];
    findings: InspectionFinding[];
    resolvedFindings: InspectionFinding[];
    alerts: Alert[];
    snapshots: RiskSnapshot[];
    now: number;
  }): DataSufficiencyEvaluation {
    const { inspections, findings, resolvedFindings, alerts, snapshots } = params;

    let timeSpanDays = 0;
    const timestamps: number[] = [];

    inspections.forEach((i) => {
      const t = new Date(i.date || i.createdAt || '').getTime();
      if (!isNaN(t)) timestamps.push(t);
    });
    snapshots.forEach((s) => {
      const t = new Date(s.timestamp).getTime();
      if (!isNaN(t)) timestamps.push(t);
    });

    if (timestamps.length >= 2) {
      const minT = Math.min(...timestamps);
      const maxT = Math.max(...timestamps);
      timeSpanDays = Math.max(0, Math.floor((maxT - minT) / 86400000));
    }

    const reasons: string[] = [];
    const inspectionsCount = inspections.length;
    const observationsCount = snapshots.length;
    const findingsCount = findings.length;
    const resolvedCount = resolvedFindings.length;
    const alertsCount = alerts.length;

    // Rule: One inspection must NOT automatically produce a long-term forecast
    if (inspectionsCount <= 1 && observationsCount <= 1) {
      reasons.push(
        'The mine has insufficient historical observations for a reliable forward-looking analysis. Current official risk remains available.'
      );
      return {
        level: 'INSUFFICIENT',
        isSufficient: false,
        inspectionsCount,
        observationsCount,
        findingsCount,
        resolvedFindingsCount: resolvedCount,
        alertsCount,
        timeSpanDays,
        reasons,
      };
    }

    if (inspectionsCount >= 3 || observationsCount >= 3) {
      if (timeSpanDays >= 30) {
        return {
          level: 'HIGH',
          isSufficient: true,
          inspectionsCount,
          observationsCount,
          findingsCount,
          resolvedFindingsCount: resolvedCount,
          alertsCount,
          timeSpanDays,
          reasons: ['Multi-audit historical span and stable baseline observations available.'],
        };
      }
      return {
        level: 'MEDIUM',
        isSufficient: true,
        inspectionsCount,
        observationsCount,
        findingsCount,
        resolvedFindingsCount: resolvedCount,
        alertsCount,
        timeSpanDays,
        reasons: ['Adequate observation density across moderate time window.'],
      };
    }

    if (inspectionsCount >= 2 || observationsCount >= 2) {
      return {
        level: 'MEDIUM',
        isSufficient: true,
        inspectionsCount,
        observationsCount,
        findingsCount,
        resolvedFindingsCount: resolvedCount,
        alertsCount,
        timeSpanDays,
        reasons: ['Two distinct statutory audit cycles available for trend projection.'],
      };
    }

    return {
      level: 'LOW',
      isSufficient: true,
      inspectionsCount,
      observationsCount,
      findingsCount,
      resolvedFindingsCount: resolvedCount,
      alertsCount,
      timeSpanDays,
      reasons: ['Limited historical depth; forward projections carry wider confidence intervals.'],
    };
  }

  /**
   * Calculates historical risk trajectory from snapshots.
   */
  public calculateTrajectory(
    currentScore: number,
    snapshots: RiskSnapshot[],
    isSufficient: boolean
  ): {
    trajectory: PredictionTrajectory;
    scoreDelta: number;
    momentumSlope: number;
  } {
    if (!isSufficient || snapshots.length < 1) {
      return { trajectory: 'INSUFFICIENT_DATA', scoreDelta: 0, momentumSlope: 0 };
    }

    // Oldest snapshot in active window
    const baselineSnapshot = snapshots[0];
    const previousScore = snapshots[snapshots.length - 1]?.overallScore ?? baselineSnapshot.overallScore;
    const scoreDelta = currentScore - previousScore;
    const totalSpanDelta = currentScore - baselineSnapshot.overallScore;

    // Check consecutive trajectory progression
    let consecutiveIncreases = 0;
    let consecutiveDecreases = 0;
    for (let i = 1; i < snapshots.length; i++) {
      if (snapshots[i].overallScore > snapshots[i - 1].overallScore) consecutiveIncreases++;
      if (snapshots[i].overallScore < snapshots[i - 1].overallScore) consecutiveDecreases++;
    }

    const momentumSlope = Math.round((totalSpanDelta / Math.max(1, snapshots.length)) * 10) / 10;

    // Deterministic rules:
    // Consistent negative movement -> IMPROVING (e.g., 70 -> 65 -> 58 -> 52)
    if (totalSpanDelta <= -4 || scoreDelta <= -4) {
      return { trajectory: 'IMPROVING', scoreDelta, momentumSlope };
    }

    // Strong positive movement across observations -> RAPIDLY_DETERIORATING
    if (totalSpanDelta >= 12 || (consecutiveIncreases >= 2 && scoreDelta >= 6)) {
      return { trajectory: 'RAPIDLY_DETERIORATING', scoreDelta, momentumSlope };
    }

    // Consistent positive movement -> DETERIORATING
    if (totalSpanDelta >= 4 || scoreDelta >= 4) {
      return { trajectory: 'DETERIORATING', scoreDelta, momentumSlope };
    }

    // Small or no movement -> STABLE
    return { trajectory: 'STABLE', scoreDelta, momentumSlope };
  }

  /**
   * Early Warning Index Factor Calculation (Explainable, Max 100 points)
   * 1. Current Risk Momentum (Max 30)
   * 2. Recurrence Momentum (Max 25)
   * 3. Resolution Delay Trend (Max 20)
   * 4. Domain Deterioration (Max 15)
   * 5. Alert Escalation Pattern (Max 10)
   */
  public calculateEarlyWarningFactors(params: {
    currentRiskScore: number;
    scoreDelta: number;
    trajectory: PredictionTrajectory;
    recurringIssues: MineRiskProfile['recurringIssues'];
    openFindings: InspectionFinding[];
    activeAlerts: Alert[];
    categoryRisks: MineRiskProfile['categoryRisks'];
    isSufficient: boolean;
    now: number;
  }): {
    factors: EarlyWarningFactorContribution[];
  } {
    const {
      currentRiskScore,
      scoreDelta,
      trajectory,
      recurringIssues,
      openFindings,
      activeAlerts,
      categoryRisks,
      isSufficient,
      now,
    } = params;

    if (!isSufficient) {
      return {
        factors: [
          {
            factor: 'CURRENT_RISK_MOMENTUM',
            label: 'Current Risk Momentum',
            contributionPoints: 0,
            maxPossiblePoints: 30,
            percentageOfTotal: 0,
            description: 'Insufficient historical data to calculate momentum',
            sourceCount: 0,
            sourceRecordIds: [],
          },
          {
            factor: 'RECURRENCE_MOMENTUM',
            label: 'Recurrence Momentum',
            contributionPoints: 0,
            maxPossiblePoints: 25,
            percentageOfTotal: 0,
            description: 'Insufficient historical data to detect recurrence',
            sourceCount: 0,
            sourceRecordIds: [],
          },
          {
            factor: 'RESOLUTION_DELAY_TREND',
            label: 'Resolution Delay Trend',
            contributionPoints: 0,
            maxPossiblePoints: 20,
            percentageOfTotal: 0,
            description: 'Insufficient historical data to evaluate resolution trend',
            sourceCount: 0,
            sourceRecordIds: [],
          },
          {
            factor: 'DOMAIN_DETERIORATION',
            label: 'Domain Deterioration',
            contributionPoints: 0,
            maxPossiblePoints: 15,
            percentageOfTotal: 0,
            description: 'Insufficient domain data',
            sourceCount: 0,
            sourceRecordIds: [],
          },
          {
            factor: 'ALERT_ESCALATION_PATTERN',
            label: 'Alert Escalation Pattern',
            contributionPoints: 0,
            maxPossiblePoints: 10,
            percentageOfTotal: 0,
            description: 'Insufficient alert history',
            sourceCount: 0,
            sourceRecordIds: [],
          },
        ],
      };
    }

    // 1. Current Risk Momentum (Max 30)
    // Uses baseline Phase 7 score + historical trajectory delta
    let rawMomentum = Math.round((currentRiskScore / 100) * 18);
    if (trajectory === 'RAPIDLY_DETERIORATING') rawMomentum += 12;
    else if (trajectory === 'DETERIORATING') rawMomentum += Math.min(10, Math.max(3, scoreDelta * 1.5));
    else if (trajectory === 'IMPROVING') rawMomentum = Math.max(2, rawMomentum - Math.abs(scoreDelta));
    const momentumPoints = Math.min(30, Math.max(0, Math.round(rawMomentum)));

    const momentumFactor: EarlyWarningFactorContribution = {
      factor: 'CURRENT_RISK_MOMENTUM',
      label: 'Current Risk Momentum',
      contributionPoints: momentumPoints,
      maxPossiblePoints: 30,
      percentageOfTotal: 0,
      description: `Official baseline score ${currentRiskScore}/100 with ${trajectory.toLowerCase()} velocity (${scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts)`,
      sourceCount: 1,
      sourceRecordIds: [`score-${currentRiskScore}`],
    };

    // 2. Recurrence Momentum (Max 25)
    // Detected repeated patterns in same category
    let rawRecurrence = 0;
    const recurrenceSourceIds: string[] = [];
    recurringIssues.forEach((issue) => {
      recurrenceSourceIds.push(issue.id);
      if (issue.status === 'ACTIVE') {
        rawRecurrence += 8;
        if (issue.occurrenceCount >= 3) rawRecurrence += 4;
      } else if (issue.status === 'PARTIALLY_RESOLVED') {
        rawRecurrence += 4;
      }
    });
    const recurrencePoints = Math.min(25, Math.max(0, rawRecurrence));

    const recurrenceFactor: EarlyWarningFactorContribution = {
      factor: 'RECURRENCE_MOMENTUM',
      label: 'Recurrence Momentum',
      contributionPoints: recurrencePoints,
      maxPossiblePoints: 25,
      percentageOfTotal: 0,
      description: `${recurringIssues.filter((r) => r.status !== 'RESOLVED').length} recurring compliance pattern(s) across statutory audit cycles`,
      sourceCount: recurringIssues.length,
      sourceRecordIds: recurrenceSourceIds,
    };

    // 3. Resolution Delay Trend / Aging (Max 20)
    let rawDelay = 0;
    const dayMs = 86400000;
    let overdueCount = 0;
    let agingOver30Count = 0;
    const delaySourceIds: string[] = [];

    openFindings.forEach((f) => {
      const created = new Date(f.createdAt).getTime();
      const ageDays = Math.max(0, Math.floor((now - created) / dayMs));

      let hasOverdue = false;
      if (f.dueDate) {
        const dueTime = new Date(f.dueDate).getTime();
        if (dueTime < now) {
          hasOverdue = true;
          overdueCount++;
          rawDelay += 5;
          delaySourceIds.push(f.id);
        }
      }

      if (!hasOverdue && ageDays > 30) {
        agingOver30Count++;
        rawDelay += ageDays > 90 ? 6 : 3;
        delaySourceIds.push(f.id);
      }
    });
    const delayPoints = Math.min(20, Math.max(0, rawDelay));

    const delayFactor: EarlyWarningFactorContribution = {
      factor: 'RESOLUTION_DELAY_TREND',
      label: 'Resolution Delay Trend',
      contributionPoints: delayPoints,
      maxPossiblePoints: 20,
      percentageOfTotal: 0,
      description: `${overdueCount} overdue remediation item(s) and ${agingOver30Count} open findings aging >30 days`,
      sourceCount: delaySourceIds.length,
      sourceRecordIds: delaySourceIds,
    };

    // 4. Domain Deterioration (Max 15)
    // Tracks safety domains showing elevated or worsening indicators
    let rawDomainPoints = 0;
    const deterioratingDomains: string[] = [];
    categoryRisks.forEach((cat) => {
      if (cat.trend === 'WORSENING' || (cat.score >= 45 && cat.openIssuesCount > 0)) {
        deterioratingDomains.push(cat.displayName);
        rawDomainPoints += cat.trend === 'WORSENING' ? 5 : 3;
      }
    });
    const domainPoints = Math.min(15, Math.max(0, rawDomainPoints));

    const domainFactor: EarlyWarningFactorContribution = {
      factor: 'DOMAIN_DETERIORATION',
      label: 'Domain Deterioration',
      contributionPoints: domainPoints,
      maxPossiblePoints: 15,
      percentageOfTotal: 0,
      description:
        deterioratingDomains.length > 0
          ? `${deterioratingDomains.length} domain(s) showing negative compliance drift (${deterioratingDomains.slice(0, 2).join(', ')})`
          : 'All statutory domains operating within controlled compliance bands',
      sourceCount: deterioratingDomains.length,
      sourceRecordIds: deterioratingDomains,
    };

    // 5. Alert Escalation Pattern (Max 10)
    // Double-counting protection: alerts linked to open findings get reduced weight (0.4x)
    const openFindingIdSet = new Set(openFindings.map((f) => f.id));
    let rawAlertPoints = 0;
    const alertSourceIds: string[] = [];

    activeAlerts.forEach((a) => {
      alertSourceIds.push(a.id);
      const isLinkedToFinding = a.findingId ? openFindingIdSet.has(a.findingId) : false;
      const multiplier = isLinkedToFinding ? 0.4 : 1.0;

      if (a.severity === 'CRITICAL') {
        rawAlertPoints += 4.5 * multiplier;
      } else if (a.severity === 'HIGH') {
        rawAlertPoints += 2.5 * multiplier;
      } else {
        rawAlertPoints += 1.0 * multiplier;
      }
    });
    const alertPoints = Math.min(10, Math.max(0, Math.round(rawAlertPoints)));

    const alertFactor: EarlyWarningFactorContribution = {
      factor: 'ALERT_ESCALATION_PATTERN',
      label: 'Alert Escalation Pattern',
      contributionPoints: alertPoints,
      maxPossiblePoints: 10,
      percentageOfTotal: 0,
      description: `${activeAlerts.filter((a) => a.severity === 'CRITICAL').length} critical and ${activeAlerts.filter((a) => a.severity === 'HIGH').length} high active alert patterns (deduplicated against open findings)`,
      sourceCount: activeAlerts.length,
      sourceRecordIds: alertSourceIds,
    };

    const factors = [momentumFactor, recurrenceFactor, delayFactor, domainFactor, alertFactor];
    const totalPoints = factors.reduce((acc, f) => acc + f.contributionPoints, 0);

    // Compute percentage of total
    factors.forEach((f) => {
      f.percentageOfTotal = totalPoints > 0 ? Math.round((f.contributionPoints / totalPoints) * 100) : 0;
    });

    return { factors };
  }

  /**
   * Evaluates early warning bands:
   * 0–24: LOW, 25–49: MODERATE, 50–74: ELEVATED, 75–100: HIGH
   */
  public determineEarlyWarningBand(score: number, isSufficient = true): EarlyWarningBand {
    if (!isSufficient) return 'LOW';
    if (score <= 24) return 'LOW';
    if (score <= 49) return 'MODERATE';
    if (score <= 74) return 'ELEVATED';
    return 'HIGH';
  }

  /**
   * Calculates projections for 7d, 30d, 90d horizons.
   */
  public calculateHorizons(params: {
    currentScore: number;
    earlyWarningIndex: number;
    trajectory: PredictionTrajectory;
    momentumSlope: number;
    dataSufficiency: DataSufficiencyEvaluation;
  }): {
    sevenDay: PredictiveHorizonProjection;
    thirtyDay: PredictiveHorizonProjection;
    ninetyDay: PredictiveHorizonProjection;
  } {
    const { currentScore, earlyWarningIndex, trajectory, momentumSlope, dataSufficiency } = params;

    if (!dataSufficiency.isSufficient) {
      return {
        sevenDay: {
          horizon: '7d',
          horizonLabel: '7 Days',
          projectedDirection: 'INSUFFICIENT_DATA',
          confidence: 'INSUFFICIENT',
          explanation: 'Insufficient historical data for 7-day outlook',
          isAvailable: false,
        },
        thirtyDay: {
          horizon: '30d',
          horizonLabel: '30 Days',
          projectedDirection: 'INSUFFICIENT_DATA',
          confidence: 'INSUFFICIENT',
          explanation: 'Insufficient historical data for 30-day forecast',
          isAvailable: false,
        },
        ninetyDay: {
          horizon: '90d',
          horizonLabel: '90 Days',
          projectedDirection: 'INSUFFICIENT_DATA',
          confidence: 'INSUFFICIENT',
          explanation: 'Insufficient historical data for 90-day statutory cycle',
          isAvailable: false,
        },
      };
    }

    // 7-day outlook (High confidence if data sufficient)
    const sevenDayDelta =
      trajectory === 'RAPIDLY_DETERIORATING'
        ? 3
        : trajectory === 'DETERIORATING'
        ? 1.5
        : trajectory === 'IMPROVING'
        ? -1.5
        : 0;
    const sevenDayScore = Math.min(100, Math.max(0, Math.round(currentScore + sevenDayDelta)));

    const sevenDayConfidence: PredictionConfidence =
      dataSufficiency.level === 'HIGH' ? 'HIGH' : dataSufficiency.level === 'MEDIUM' ? 'MEDIUM' : 'LOW';

    // 30-day outlook (Medium confidence)
    const thirtyDayDelta =
      trajectory === 'RAPIDLY_DETERIORATING'
        ? 8
        : trajectory === 'DETERIORATING'
        ? 4.5
        : trajectory === 'IMPROVING'
        ? -4.5
        : 0;
    const thirtyDayScore = Math.min(100, Math.max(0, Math.round(currentScore + thirtyDayDelta)));

    const thirtyDayConfidence: PredictionConfidence =
      dataSufficiency.level === 'HIGH' ? 'MEDIUM' : 'LOW';

    // 90-day outlook (Low confidence - forward projection uncertainty)
    const ninetyDayDelta =
      trajectory === 'RAPIDLY_DETERIORATING'
        ? 14
        : trajectory === 'DETERIORATING'
        ? 8
        : trajectory === 'IMPROVING'
        ? -8
        : 0;
    const ninetyDayScore = Math.min(100, Math.max(0, Math.round(currentScore + ninetyDayDelta)));

    const ninetyDayConfidence: PredictionConfidence = 'LOW';

    return {
      sevenDay: {
        horizon: '7d',
        horizonLabel: '7 Days',
        projectedDirection: trajectory,
        projectedScore: sevenDayScore,
        confidence: sevenDayConfidence,
        explanation:
          earlyWarningIndex >= 50
            ? 'High probability of elevated inspection flags without active mitigation'
            : 'Operational trajectory expected to remain within controlled parameters',
        isAvailable: true,
      },
      thirtyDay: {
        horizon: '30d',
        horizonLabel: '30 Days',
        projectedDirection: trajectory,
        projectedScore: thirtyDayScore,
        confidence: thirtyDayConfidence,
        explanation:
          trajectory === 'DETERIORATING' || trajectory === 'RAPIDLY_DETERIORATING'
            ? 'Projected risk score increase driven by recurring violation patterns'
            : 'Statutory compliance trajectory projected to hold stable across monthly review',
        isAvailable: true,
      },
      ninetyDay: {
        horizon: '90d',
        horizonLabel: '90 Days',
        projectedDirection: trajectory,
        projectedScore: ninetyDayScore,
        confidence: ninetyDayConfidence,
        explanation:
          'Quarterly DGMS inspection cycle forecast carrying macro uncertainty band',
        isAvailable: true,
      },
    };
  }

  /**
   * Generates prioritized early warning signals.
   */
  public generateSignals(params: {
    mineId: string;
    factorBreakdown: { factors: EarlyWarningFactorContribution[] };
    trajectory: PredictionTrajectory;
    dataSufficiency: DataSufficiencyEvaluation;
    openFindings: InspectionFinding[];
    activeAlerts: Alert[];
    recurringIssues: MineRiskProfile['recurringIssues'];
  }): PredictiveSignal[] {
    const { mineId, factorBreakdown, trajectory, dataSufficiency, openFindings, activeAlerts, recurringIssues } =
      params;
    const signals: PredictiveSignal[] = [];
    const nowIso = new Date().toISOString();

    if (!dataSufficiency.isSufficient) {
      signals.push({
        id: `sig-${mineId}-insufficient`,
        mineId,
        type: 'INSPECTION_PATTERN',
        title: 'Insufficient Historical Observations',
        severity: 'LOW',
        scoreContribution: 0,
        confidence: 'INSUFFICIENT',
        explanation:
          'Baseline historical records are insufficient for statistical forward forecasting. Current statutory audits remain active.',
        sourceRefs: [],
        sourceType: 'INSPECTION',
        detectedAt: nowIso,
        horizon: '30d',
      });
      return signals;
    }

    // Trajectory Signal
    if (trajectory === 'RAPIDLY_DETERIORATING' || trajectory === 'DETERIORATING') {
      const momentumFactor = factorBreakdown.factors.find((f) => f.factor === 'CURRENT_RISK_MOMENTUM');
      signals.push({
        id: `sig-${mineId}-trajectory`,
        mineId,
        type: 'RISK_TRAJECTORY',
        title: trajectory === 'RAPIDLY_DETERIORATING' ? 'Rapid Safety Risk Escalation' : 'Deteriorating Risk Trajectory',
        severity: trajectory === 'RAPIDLY_DETERIORATING' ? 'CRITICAL' : 'HIGH',
        scoreContribution: momentumFactor?.contributionPoints || 20,
        confidence: dataSufficiency.level,
        explanation: `Historical risk score has trended upward across sequential review cycles, signaling elevated systemic risk.`,
        sourceRefs: momentumFactor?.sourceRecordIds || [],
        sourceType: 'SNAPSHOT',
        detectedAt: nowIso,
        horizon: '30d',
      });
    }

    // Recurrence Signal
    const activeRecurrences = recurringIssues.filter((r) => r.status !== 'RESOLVED');
    if (activeRecurrences.length > 0) {
      const recurrenceFactor = factorBreakdown.factors.find((f) => f.factor === 'RECURRENCE_MOMENTUM');
      const topRecur = activeRecurrences[0];
      signals.push({
        id: `sig-${mineId}-recurrence`,
        mineId,
        type: 'RECURRENCE',
        title: `Repeated ${topRecur.category} Non-Compliance (${topRecur.occurrenceCount} Occurrences)`,
        severity: 'HIGH',
        scoreContribution: recurrenceFactor?.contributionPoints || 18,
        confidence: 'HIGH',
        explanation: `Violations in ${topRecur.category} have appeared repeatedly across multiple audit cycles without permanent corrective closure.`,
        sourceRefs: topRecur.findingIds,
        sourceType: 'FINDING',
        detectedAt: nowIso,
        horizon: '30d',
      });
    }

    // Corrective Action Delay Signal
    const overdueFindings = openFindings.filter((f) => {
      if (!f.dueDate) return false;
      return new Date(f.dueDate).getTime() < Date.now();
    });
    if (overdueFindings.length > 0) {
      const delayFactor = factorBreakdown.factors.find((f) => f.factor === 'RESOLUTION_DELAY_TREND');
      signals.push({
        id: `sig-${mineId}-delay`,
        mineId,
        type: 'CORRECTIVE_ACTION',
        title: `Statutory Remediation Delay (${overdueFindings.length} Overdue)`,
        severity: overdueFindings.some((f) => f.severity === 'CRITICAL') ? 'CRITICAL' : 'HIGH',
        scoreContribution: delayFactor?.contributionPoints || 15,
        confidence: 'HIGH',
        explanation: `${overdueFindings.length} corrective action plan(s) have exceeded statutory compliance deadlines without confirmed field sign-off.`,
        sourceRefs: overdueFindings.map((f) => f.id),
        sourceType: 'FINDING',
        detectedAt: nowIso,
        horizon: '7d',
      });
    }

    // Critical Alert Pattern Signal
    const critAlerts = activeAlerts.filter((a) => a.severity === 'CRITICAL');
    if (critAlerts.length > 0) {
      const alertFactor = factorBreakdown.factors.find((f) => f.factor === 'ALERT_ESCALATION_PATTERN');
      signals.push({
        id: `sig-${mineId}-alert`,
        mineId,
        type: 'ALERT_PATTERN',
        title: `Telemetry Hazard Accumulation (${critAlerts.length} Critical Alerts)`,
        severity: 'CRITICAL',
        scoreContribution: alertFactor?.contributionPoints || 8,
        confidence: 'HIGH',
        explanation: `Multiple unacknowledged physical safety sensor or operational alert thresholds triggered in active colliery sectors.`,
        sourceRefs: critAlerts.map((a) => a.id),
        sourceType: 'ALERT',
        detectedAt: nowIso,
        horizon: '7d',
      });
    }

    return signals.sort((a, b) => b.scoreContribution - a.scoreContribution);
  }

  /**
   * Generates ranked predictive drivers.
   */
  public generatePredictiveDrivers(signals: PredictiveSignal[]): PredictiveDriver[] {
    return signals.slice(0, 5).map((s, idx) => ({
      id: `drv-${s.id}`,
      rank: idx + 1,
      title: s.title,
      signalType: s.type,
      severity: s.severity,
      scoreContribution: s.scoreContribution,
      description: s.explanation,
      sourceType: s.sourceType,
      sourceId: s.sourceRefs[0] || s.id,
      sourceReference: s.sourceRefs.length > 1 ? `${s.sourceRefs.length} linked records` : s.sourceRefs[0],
      evidenceSummary: s.explanation,
    }));
  }

  /**
   * Generates domain-level predictions (Ventilation, Electrical, PPE, Equipment, etc.).
   */
  public generateDomainPredictions(params: {
    currentRiskProfile: MineRiskProfile;
    mineFindings: InspectionFinding[];
    openFindings: InspectionFinding[];
    dataSufficiency: DataSufficiencyEvaluation;
  }): DomainPrediction[] {
    const { currentRiskProfile, openFindings, dataSufficiency } = params;

    const domainKeys: Array<{ key: FindingCategory; name: string }> = [
      { key: 'VENTILATION', name: 'Ventilation & Mine Gas' },
      { key: 'EQUIPMENT', name: 'HEMM & Mechanical' },
      { key: 'PPE', name: 'PPE & Personnel Protection' },
      { key: 'SAFETY', name: 'General & Site Safety' },
      { key: 'ENVIRONMENT', name: 'Environmental & Dust Control' },
      { key: 'DOCUMENTATION', name: 'Statutory Documentation' },
    ];

    return domainKeys.map(({ key, name }) => {
      const openInDomain = openFindings.filter((f) => f.category === key);
      const catAnalysis = currentRiskProfile.categoryRisks.find((c) => c.category === key);
      const currentScore = catAnalysis?.score || 0;
      const recurring = catAnalysis?.recurrenceCount || 0;

      // Project domain score
      let scoreDelta = 0;
      let trajectory: PredictionTrajectory = 'STABLE';

      if (!dataSufficiency.isSufficient) {
        trajectory = 'INSUFFICIENT_DATA';
      } else if (openInDomain.some((f) => f.severity === 'CRITICAL') || recurring >= 2) {
        trajectory = 'DETERIORATING';
        scoreDelta = 6;
      } else if (openInDomain.length === 0 && currentScore > 10) {
        trajectory = 'IMPROVING';
        scoreDelta = -5;
      }

      const projectedScore =
        trajectory === 'INSUFFICIENT_DATA'
          ? undefined
          : Math.min(100, Math.max(0, currentScore + scoreDelta));

      return {
        domain: key,
        displayName: name,
        previousScore: Math.max(0, currentScore - (scoreDelta > 0 ? 3 : 0)),
        currentScore,
        projectedScore,
        scoreDelta,
        trajectory,
        confidence: dataSufficiency.level,
        openIssuesCount: openInDomain.length,
        recurringCount: recurring,
        topConcern: openInDomain[0]?.title || (recurring > 0 ? `Repeated ${key} violations` : undefined),
      };
    });
  }

  /**
   * Generates actionable intervention recommendations.
   * Grounded in statutory compliance rules or labeled "MANUAL REGULATORY REVIEW REQUIRED".
   */
  public generateInterventions(params: {
    signals: PredictiveSignal[];
    domainPredictions: DomainPrediction[];
    openFindings: InspectionFinding[];
    recurringIssues: MineRiskProfile['recurringIssues'];
  }): InterventionRecommendation[] {
    const { signals, domainPredictions, recurringIssues } = params;
    const recommendations: InterventionRecommendation[] = [];
    let rank = 1;

    // Recurrence interventions
    const ppeRecurrence = recurringIssues.find((r) => r.category === 'PPE' && r.status !== 'RESOLVED');
    if (ppeRecurrence) {
      recommendations.push({
        id: `rec-${rank}`,
        rank: rank++,
        title: 'Targeted PPE Compliance & Gate Verification Audit',
        domain: 'PPE',
        urgency: 'HIGH',
        rationale: `PPE violations observed across ${ppeRecurrence.occurrenceCount} audit cycles indicate recurring supervisory breakdown.`,
        recommendedAction:
          'Conduct targeted shift-start PPE spot-checks and inspect personal safety gear distribution logs before entry to active pits.',
        regulatoryReference: 'CMR 2017 Reg. 191 (Safety Equipment & Protective Clothing)',
        linkedSignalIds: signals.filter((s) => s.type === 'RECURRENCE').map((s) => s.id),
        linkedFindingIds: ppeRecurrence.findingIds,
        isStatutoryVerified: true,
      });
    }

    // Ventilation deterioration intervention
    const ventDomain = domainPredictions.find((d) => d.domain === 'VENTILATION');
    if (ventDomain && (ventDomain.trajectory === 'DETERIORATING' || ventDomain.currentScore >= 40)) {
      recommendations.push({
        id: `rec-${rank}`,
        rank: rank++,
        title: 'Priority Ventilation & Gas Velocity Remediation',
        domain: 'VENTILATION',
        urgency: 'CRITICAL',
        rationale: 'Elevated ventilation risk indicators require immediate physical verification before next statutory cycle.',
        recommendedAction:
          'Review unresolved auxiliary fan logs, calibrate methanometers, and verify airflow velocity at tail-end headings with an anemometer.',
        regulatoryReference: 'CMR 2017 Reg. 153 (Standard of Ventilation)',
        linkedSignalIds: signals.filter((s) => s.type === 'DOMAIN_DETERIORATION').map((s) => s.id),
        isStatutoryVerified: true,
      });
    }

    // HEMM Machinery intervention
    const hemmDomain = domainPredictions.find((d) => d.domain === 'EQUIPMENT');
    if (hemmDomain && (hemmDomain.trajectory === 'DETERIORATING' || hemmDomain.openIssuesCount > 0)) {
      recommendations.push({
        id: `rec-${rank}`,
        rank: rank++,
        title: 'HEMM Heavy Earthmoving Proximity & Brake Verification',
        domain: 'EQUIPMENT',
        urgency: 'HIGH',
        rationale: 'Unresolved heavy machinery safety items increase collision risk on haul roads.',
        recommendedAction:
          'Execute fail-safe brake testing and inspect audio-visual reverse alarms (AVRA) on all active dumpers and excavators.',
        regulatoryReference: 'DGMS Tech Circular 06/2020 (HEMM Safety Systems)',
        linkedSignalIds: signals.filter((s) => s.type === 'DOMAIN_DETERIORATION').map((s) => s.id),
        isStatutoryVerified: true,
      });
    }

    // Overdue Action Plan intervention
    const delaySignal = signals.find((s) => s.type === 'CORRECTIVE_ACTION');
    if (delaySignal) {
      recommendations.push({
        id: `rec-${rank}`,
        rank: rank++,
        title: 'Escalate Past-Due Remediation Milestones',
        domain: 'STATUTORY',
        urgency: 'CRITICAL',
        rationale: 'Non-compliance items pending past statutory deadlines expose colliery to formal DGMS Section 22 stop-work notice.',
        recommendedAction:
          'Issue formal Form IV compliance summons to colliery manager and demand proof of remediation within 72 hours.',
        regulatoryReference: 'Mines Act 1952 Sec. 22 (Powers of Inspectors)',
        linkedSignalIds: [delaySignal.id],
        isStatutoryVerified: true,
      });
    }

    // Default safe baseline recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        id: `rec-1`,
        rank: 1,
        title: 'Maintain Routine Precautionary Inspection Schedule',
        domain: 'STATUTORY',
        urgency: 'MEDIUM',
        rationale: 'Predictive indicators remain within nominal safety envelope.',
        recommendedAction:
          'Continue scheduled bi-monthly DGMS inspection routine and audit environmental telemetry calibration logs.',
        regulatoryReference: 'MANUAL REGULATORY REVIEW REQUIRED',
        linkedSignalIds: [],
        isStatutoryVerified: false,
      });
    }

    return recommendations;
  }

  /**
   * Generates combined historical points (solid) and projected points (dashed/hollow).
   */
  public generateTrajectoryHistory(params: {
    mineSnapshots: RiskSnapshot[];
    currentScore: number;
    horizons: {
      sevenDay: PredictiveHorizonProjection;
      thirtyDay: PredictiveHorizonProjection;
      ninetyDay: PredictiveHorizonProjection;
    };
    now: number;
  }): HistoricalTrajectoryPoint[] {
    const { mineSnapshots, currentScore, horizons, now } = params;
    const points: HistoricalTrajectoryPoint[] = [];

    // Historical observations
    mineSnapshots.forEach((snap) => {
      const snapDate = new Date(snap.timestamp);
      const daysAgo = Math.round((now - snapDate.getTime()) / 86400000);
      points.push({
        date: snap.timestamp,
        label: daysAgo > 0 ? `-${daysAgo}d` : 'Past',
        score: snap.overallScore,
        isProjected: false,
      });
    });

    // Current observation
    points.push({
      date: new Date(now).toISOString(),
      label: 'Now',
      score: currentScore,
      isProjected: false,
    });

    // Projections
    if (horizons.sevenDay.isAvailable && horizons.sevenDay.projectedScore !== undefined) {
      points.push({
        date: new Date(now + 7 * 86400000).toISOString(),
        label: '+7d',
        score: horizons.sevenDay.projectedScore,
        isProjected: true,
        confidence: horizons.sevenDay.confidence,
      });
    }

    if (horizons.thirtyDay.isAvailable && horizons.thirtyDay.projectedScore !== undefined) {
      points.push({
        date: new Date(now + 30 * 86400000).toISOString(),
        label: '+30d',
        score: horizons.thirtyDay.projectedScore,
        isProjected: true,
        confidence: horizons.thirtyDay.confidence,
      });
    }

    if (horizons.ninetyDay.isAvailable && horizons.ninetyDay.projectedScore !== undefined) {
      points.push({
        date: new Date(now + 90 * 86400000).toISOString(),
        label: '+90d',
        score: horizons.ninetyDay.projectedScore,
        isProjected: true,
        confidence: horizons.ninetyDay.confidence,
      });
    }

    return points;
  }
}

export const predictiveRiskEngine = new PredictiveRiskEngine();

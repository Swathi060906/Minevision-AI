import {
  MineRiskProfile,
  RiskEngineConfig,
  RiskTimeWindow,
  RiskFactorContribution,
  RiskDriver,
  CategoryRiskAnalysis,
  RecurringIssue,
  RiskAgingSummary,
  FindingAgingItem,
  PriorityAttentionItem,
  RiskScoreBand,
  RiskTrendDirection,
  RiskSnapshot,
} from '../../data/models/RiskIntelligence';
import { Mine } from '../../data/models/Mine';
import { Inspection } from '../../data/models/Inspection';
import { InspectionFinding, FindingCategory } from '../../data/models/InspectionFinding';
import { Alert } from '../../data/models/Alert';
import { determineRiskBand } from './riskConfig';

export interface ScoreCalculationInput {
  mine: Mine;
  findings: InspectionFinding[];
  alerts: Alert[];
  inspections: Inspection[];
  snapshots: RiskSnapshot[];
  config: RiskEngineConfig;
  timeWindow: RiskTimeWindow;
  pendingAiProposalsCount?: number;
}

export class RiskScoringEngine {
  /**
   * Deterministically calculates the complete explainable risk profile for a single mine.
   */
  calculateMineRisk(input: ScoreCalculationInput): MineRiskProfile {
    const {
      mine,
      findings,
      alerts,
      inspections,
      snapshots,
      config,
      timeWindow,
      pendingAiProposalsCount = 0,
    } = input;

    const now = Date.now();
    const dayMs = 86400000;

    // Filter findings to this mine
    const mineFindings = findings.filter((f) => f.mineId === mine.id);
    const openFindings = mineFindings.filter(
      (f) => f.status === 'OPEN' || f.status === 'IN_REVIEW'
    );

    // Filter alerts to this mine
    const mineAlerts = alerts.filter((a) => a.mineId === mine.id);
    const activeAlerts = mineAlerts.filter(
      (a) => a.status === 'Active' || a.status === 'Under Review'
    );

    // Filter inspections to this mine
    const mineInspections = inspections.filter((i) => i.mineId === mine.id);

    // Data Sufficiency Check
    const hasSufficientData = mineFindings.length > 0 || mineInspections.length > 0;
    const dataSufficiencyReason = hasSufficientData
      ? undefined
      : 'No statutory inspection findings or audit records exist for this mine in the active period.';

    // 1. FACTOR: Severity Contribution (Max config.factorMaxPoints.severity)
    const openCritical = openFindings.filter((f) => f.severity === 'CRITICAL');
    const openHigh = openFindings.filter((f) => f.severity === 'HIGH');
    const openMedium = openFindings.filter((f) => f.severity === 'MEDIUM');
    const openLow = openFindings.filter((f) => f.severity === 'LOW');

    const rawSeverityPoints =
      openCritical.length * config.severityWeights.critical +
      openHigh.length * config.severityWeights.high +
      openMedium.length * config.severityWeights.medium +
      openLow.length * config.severityWeights.low;

    const severityPoints = Math.min(rawSeverityPoints, config.factorMaxPoints.severity);

    const severityFactor: RiskFactorContribution = {
      factor: 'SEVERITY',
      label: 'Finding Severity Impact',
      contributionPoints: severityPoints,
      maxPossiblePoints: config.factorMaxPoints.severity,
      percentageOfTotal: 0, // Will be computed after total
      description: `${openCritical.length} critical, ${openHigh.length} high, ${openMedium.length} medium unresolved findings`,
      sourceCount: openFindings.length,
      sourceRecordIds: openFindings.map((f) => f.id),
    };

    // 2. FACTOR: Recurrence Contribution (Max config.factorMaxPoints.recurrence)
    const categoryGroupMap = new Map<string, InspectionFinding[]>();
    for (const f of mineFindings) {
      const cat = f.category || 'SAFETY';
      const existing = categoryGroupMap.get(cat) || [];
      existing.push(f);
      categoryGroupMap.set(cat, existing);
    }

    const recurringIssues: RecurringIssue[] = [];
    let rawRecurrencePoints = 0;

    categoryGroupMap.forEach((catFindings, cat) => {
      if (catFindings.length >= 2) {
        // Sort by date
        const sorted = [...catFindings].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const openInCat = catFindings.filter((f) => f.status === 'OPEN' || f.status === 'IN_REVIEW');
        const affectedInspections = Array.from(new Set(catFindings.map((f) => f.inspectionId)));

        const status: 'ACTIVE' | 'PARTIALLY_RESOLVED' | 'RESOLVED' =
          openInCat.length === catFindings.length
            ? 'ACTIVE'
            : openInCat.length > 0
            ? 'PARTIALLY_RESOLVED'
            : 'RESOLVED';

        const issue: RecurringIssue = {
          id: `recur-${mine.id}-${cat.toLowerCase()}`,
          category: cat,
          title: `Repeated ${cat} Violations across ${affectedInspections.length} Audits`,
          occurrenceCount: catFindings.length,
          firstOccurrence: sorted[0].createdAt,
          mostRecentOccurrence: sorted[sorted.length - 1].createdAt,
          affectedInspectionIds: affectedInspections,
          findingIds: catFindings.map((f) => f.id),
          status,
          regulatoryReference: sorted[0].ruleReference || sorted[0].knowledgeReference,
        };

        recurringIssues.push(issue);

        // If recurring issue is active or partially resolved, add penalty
        if (status !== 'RESOLVED') {
          rawRecurrencePoints += config.recurrenceMultiplier;
        }
      }
    });

    const recurrencePoints = Math.min(rawRecurrencePoints, config.factorMaxPoints.recurrence);

    const recurrenceFactor: RiskFactorContribution = {
      factor: 'RECURRENCE',
      label: 'Recurring Violation Patterns',
      contributionPoints: recurrencePoints,
      maxPossiblePoints: config.factorMaxPoints.recurrence,
      percentageOfTotal: 0,
      description: `${recurringIssues.filter((r) => r.status !== 'RESOLVED').length} active recurring issue patterns detected`,
      sourceCount: recurringIssues.length,
      sourceRecordIds: recurringIssues.map((r) => r.id),
    };

    // 3. FACTOR: Aging & Overdue Actions (Max config.factorMaxPoints.aging)
    const agingItems: FindingAgingItem[] = [];
    let open0to7 = 0;
    let open8to30 = 0;
    let open31to90 = 0;
    let openOver90 = 0;
    let totalOverdue = 0;
    let oldestFindingDays = 0;
    let rawAgingPoints = 0;

    for (const f of openFindings) {
      const createdTime = new Date(f.createdAt).getTime();
      const ageDays = Math.max(0, Math.floor((now - createdTime) / dayMs));
      if (ageDays > oldestFindingDays) oldestFindingDays = ageDays;

      let ageBracket: '0-7' | '8-30' | '31-90' | '90+' = '0-7';
      if (ageDays > 90) {
        ageBracket = '90+';
        openOver90++;
        rawAgingPoints += config.agingWeights.bracketOver90;
      } else if (ageDays > 30) {
        ageBracket = '31-90';
        open31to90++;
        rawAgingPoints += config.agingWeights.bracket31to90;
      } else if (ageDays > 7) {
        ageBracket = '8-30';
        open8to30++;
        rawAgingPoints += 1;
      } else {
        open0to7++;
      }

      let isOverdue = false;
      let overdueDays: number | undefined;

      if (f.dueDate) {
        const dueTime = new Date(f.dueDate).getTime();
        if (dueTime < now) {
          isOverdue = true;
          overdueDays = Math.max(1, Math.floor((now - dueTime) / dayMs));
          totalOverdue++;
          rawAgingPoints += config.agingWeights.overdueExtra;
        }
      }

      agingItems.push({
        findingId: f.id,
        inspectionId: f.inspectionId,
        title: f.title,
        category: f.category,
        severity: f.severity,
        openedDate: f.createdAt,
        ageDays,
        ageBracket,
        dueDate: f.dueDate,
        isOverdue,
        overdueDays,
        correctiveAction: f.correctiveAction,
      });
    }

    const agingPoints = Math.min(rawAgingPoints, config.factorMaxPoints.aging);

    const agingSummary: RiskAgingSummary = {
      open0to7Days: open0to7,
      open8to30Days: open8to30,
      open31to90Days: open31to90,
      openOver90Days: openOver90,
      totalOverdue,
      oldestFindingDays,
      items: agingItems.sort((a, b) => b.ageDays - a.ageDays),
    };

    const agingFactor: RiskFactorContribution = {
      factor: 'AGING',
      label: 'Finding Aging & Overdue Actions',
      contributionPoints: agingPoints,
      maxPossiblePoints: config.factorMaxPoints.aging,
      percentageOfTotal: 0,
      description: `${totalOverdue} overdue actions, ${open31to90 + openOver90} findings open >30 days`,
      sourceCount: openFindings.length,
      sourceRecordIds: agingItems.filter((a) => a.isOverdue || a.ageDays > 30).map((a) => a.findingId),
    };

    // 4. FACTOR: Active Telemetry / System Alerts (Max config.factorMaxPoints.alerts)
    // Avoid double-counting: check if alert is linked to findingId that is already in openFindings
    const openFindingIdSet = new Set(openFindings.map((f) => f.id));
    let rawAlertPoints = 0;
    const alertSourceIds: string[] = [];

    for (const a of activeAlerts) {
      alertSourceIds.push(a.id);
      const isFindingAlreadyCounted = a.findingId ? openFindingIdSet.has(a.findingId) : false;

      // Full weight if standalone telemetry/operational alert; reduced marginal weight if linked finding
      const multiplier = isFindingAlreadyCounted ? 0.4 : 1.0;

      if (a.severity === 'CRITICAL') {
        rawAlertPoints += config.alertWeights.critical * multiplier;
      } else if (a.severity === 'HIGH') {
        rawAlertPoints += config.alertWeights.high * multiplier;
      } else {
        rawAlertPoints += config.alertWeights.medium * multiplier;
      }
    }

    const alertsPoints = Math.min(Math.round(rawAlertPoints), config.factorMaxPoints.alerts);

    const alertsFactor: RiskFactorContribution = {
      factor: 'ACTIVE_ALERTS',
      label: 'Active Critical Alerts',
      contributionPoints: alertsPoints,
      maxPossiblePoints: config.factorMaxPoints.alerts,
      percentageOfTotal: 0,
      description: `${activeAlerts.filter((a) => a.severity === 'CRITICAL').length} critical and ${activeAlerts.filter((a) => a.severity === 'HIGH').length} high active alerts`,
      sourceCount: activeAlerts.length,
      sourceRecordIds: alertSourceIds,
    };

    // 5. FACTOR: Compliance Exposure / Audit Gap (Max config.factorMaxPoints.exposure)
    let rawExposurePoints = 0;
    const lastInspectionDate = mine.lastInspectionDate || (mineInspections[0]?.scheduledDate);
    if (lastInspectionDate) {
      const daysSinceInspection = Math.floor((now - new Date(lastInspectionDate).getTime()) / dayMs);
      if (daysSinceInspection > 90) {
        rawExposurePoints += 6;
      } else if (daysSinceInspection > 45) {
        rawExposurePoints += 3;
      }
    } else {
      rawExposurePoints += 5; // No recorded inspection
    }

    // Exposure penalty for findings missing corrective action plans
    const missingActionPlanCount = openFindings.filter((f) => !f.correctiveAction || f.correctiveAction.trim() === '').length;
    if (missingActionPlanCount > 0) {
      rawExposurePoints += Math.min(missingActionPlanCount * 2, 4);
    }

    const exposurePoints = Math.min(rawExposurePoints, config.factorMaxPoints.exposure);

    const exposureFactor: RiskFactorContribution = {
      factor: 'COMPLIANCE_EXPOSURE',
      label: 'Compliance Exposure & Audit Recency',
      contributionPoints: exposurePoints,
      maxPossiblePoints: config.factorMaxPoints.exposure,
      percentageOfTotal: 0,
      description: `Audit cycle recency and ${missingActionPlanCount} open issues pending corrective action plans`,
      sourceCount: mineInspections.length,
      sourceRecordIds: mineInspections.map((i) => i.id),
    };

    // Total Deterministic Score (0 - 100)
    let overallScore = hasSufficientData
      ? Math.min(100, Math.max(0, severityPoints + recurrencePoints + agingPoints + alertsPoints + exposurePoints))
      : 0;

    // Calculate percentage breakdown
    const factors = [severityFactor, recurrenceFactor, agingFactor, alertsFactor, exposureFactor];
    for (const f of factors) {
      f.percentageOfTotal = overallScore > 0 ? Math.round((f.contributionPoints / overallScore) * 100) : 0;
    }

    const riskLevel: RiskScoreBand = determineRiskBand(overallScore, hasSufficientData);

    // 6. Historical Trend Calculation
    const { trend, previousScore, scoreDelta } = this.calculateTrend(
      mine.id,
      overallScore,
      snapshots,
      timeWindow,
      now
    );

    // 7. Generate Ranked Explainable Risk Drivers
    const drivers = this.generateRiskDrivers(
      openCritical,
      openHigh,
      recurringIssues,
      agingItems,
      activeAlerts
    );

    // 8. Category Risk Breakdown
    const categoryRisks = this.calculateCategoryRisks(mineFindings, recurringIssues);

    // 9. Priority Attention List
    const priorityAttention = this.generatePriorityAttention(
      openCritical,
      openHigh,
      agingItems,
      activeAlerts,
      recurringIssues
    );

    return {
      mineId: mine.id,
      mineName: mine.name,
      mineCode: mine.mineCode || mine.code,
      mineType: mine.mineType || mine.type,
      state: mine.state,
      district: mine.district,
      overallScore,
      riskLevel,
      previousScore,
      scoreDelta,
      trend,
      trendTimeWindow: timeWindow,
      hasSufficientData,
      dataSufficiencyReason,
      factors,
      drivers,
      categoryRisks,
      recurringIssues,
      agingSummary,
      priorityAttention,
      counts: {
        totalFindings: mineFindings.length,
        openFindings: openFindings.length,
        openCritical: openCritical.length,
        openHigh: openHigh.length,
        openMedium: openMedium.length,
        openLow: openLow.length,
        activeAlerts: activeAlerts.length,
        criticalAlerts: activeAlerts.filter((a) => a.severity === 'CRITICAL').length,
        overdueActions: totalOverdue,
        lastInspectionDate,
        inspectionsCount: mineInspections.length,
        pendingAiProposalsCount, // Strictly advisory
      },
      calculatedAt: new Date(now).toISOString(),
      dataFreshness: 'CURRENT',
    };
  }

  /**
   * Generates prioritized, explainable risk drivers with source linkage.
   */
  private generateRiskDrivers(
    openCritical: InspectionFinding[],
    openHigh: InspectionFinding[],
    recurringIssues: RecurringIssue[],
    agingItems: FindingAgingItem[],
    activeAlerts: Alert[]
  ): RiskDriver[] {
    const drivers: RiskDriver[] = [];
    let rank = 1;

    // 1. Critical open findings
    for (const f of openCritical) {
      drivers.push({
        id: `drv-${rank}`,
        rank: rank++,
        title: `Unresolved Critical Finding: ${f.title}`,
        factorType: 'SEVERITY',
        severity: 'CRITICAL',
        description: f.description || 'Statutory non-compliance posing immediate danger to workers.',
        sourceType: 'FINDING',
        sourceId: f.id,
        sourceReference: f.ruleReference || f.knowledgeReference || 'CMR 2017 Reg. 153',
        evidenceSummary: f.correctiveAction ? `Required: ${f.correctiveAction}` : 'Pending action plan',
        verifiedKnowledge: f.knowledgeReference
          ? {
              reference: f.knowledgeReference,
              title: f.ruleReference || 'DGMS Statutory Standard',
              authority: 'DGMS',
            }
          : undefined,
      });
    }

    // 2. Active critical alerts
    for (const a of activeAlerts.filter((x) => x.severity === 'CRITICAL')) {
      drivers.push({
        id: `drv-${rank}`,
        rank: rank++,
        title: `Active Critical Alert: ${a.issue || a.title || 'Telemetry Trigger'}`,
        factorType: 'ACTIVE_ALERTS',
        severity: 'CRITICAL',
        description: a.description || `Active event at ${a.locationDetail}`,
        sourceType: 'ALERT',
        sourceId: a.id,
        sourceReference: a.category,
        evidenceSummary: a.actionPrompt,
      });
    }

    // 3. Overdue corrective actions
    for (const a of agingItems.filter((x) => x.isOverdue)) {
      drivers.push({
        id: `drv-${rank}`,
        rank: rank++,
        title: `Overdue Action (${a.overdueDays}d late): ${a.title}`,
        factorType: 'AGING',
        severity: a.severity,
        description: `Finding has remained unrectified beyond statutory due date (${a.dueDate || 'Unrecorded'}).`,
        sourceType: 'FINDING',
        sourceId: a.findingId,
        sourceReference: `Age: ${a.ageDays} days`,
        evidenceSummary: a.correctiveAction || 'Immediate remedial execution mandatory.',
      });
    }

    // 4. Recurring violation issues
    for (const r of recurringIssues.filter((x) => x.status !== 'RESOLVED')) {
      drivers.push({
        id: `drv-${rank}`,
        rank: rank++,
        title: `Chronic Recurring Issue: ${r.category} (${r.occurrenceCount} Occurrences)`,
        factorType: 'RECURRENCE',
        severity: 'HIGH',
        description: `Violations of category ${r.category} have appeared repeatedly across multiple audit cycles.`,
        sourceType: 'INSPECTION',
        sourceId: r.affectedInspectionIds[0] || r.id,
        sourceReference: r.regulatoryReference || 'Statutory Colliery Code',
        evidenceSummary: `First observed: ${new Date(r.firstOccurrence).toLocaleDateString()}, Last observed: ${new Date(r.mostRecentOccurrence).toLocaleDateString()}`,
      });
    }

    // 5. Open high findings
    for (const f of openHigh) {
      if (rank > 6) break; // Keep top drivers focused
      drivers.push({
        id: `drv-${rank}`,
        rank: rank++,
        title: `High Severity Finding: ${f.title}`,
        factorType: 'SEVERITY',
        severity: 'HIGH',
        description: f.description || 'Elevated risk condition requiring timely rectification.',
        sourceType: 'FINDING',
        sourceId: f.id,
        sourceReference: f.ruleReference || f.knowledgeReference,
        evidenceSummary: f.correctiveAction,
      });
    }

    return drivers;
  }

  /**
   * Generates actionable priority attention items explaining WHY the officer should intervene.
   */
  private generatePriorityAttention(
    openCritical: InspectionFinding[],
    openHigh: InspectionFinding[],
    agingItems: FindingAgingItem[],
    activeAlerts: Alert[],
    recurringIssues: RecurringIssue[]
  ): PriorityAttentionItem[] {
    const items: PriorityAttentionItem[] = [];
    let rank = 1;

    // Priority 1: Overdue Critical / High actions
    const criticalOverdue = agingItems.filter((a) => a.isOverdue && a.severity === 'CRITICAL');
    if (criticalOverdue.length > 0) {
      items.push({
        id: `prio-${rank}`,
        rank: rank++,
        title: 'Rectify Overdue Critical Safety Findings',
        category: criticalOverdue[0].category,
        urgency: 'CRITICAL',
        reason: `${criticalOverdue.length} critical finding(s) have passed statutory due dates without confirmed closure.`,
        recommendedAction: 'Dispatch compliance officer to verify field remediation and issue Form IV corrective confirmation.',
        linkedSourceIds: criticalOverdue.map((c) => c.findingId),
        linkedSourceType: 'FINDING',
      });
    }

    // Priority 2: Active Critical Alerts
    const critAlerts = activeAlerts.filter((a) => a.severity === 'CRITICAL');
    if (critAlerts.length > 0) {
      items.push({
        id: `prio-${rank}`,
        rank: rank++,
        title: 'Acknowledge and Resolve Critical Telemetry Alerts',
        category: critAlerts[0].category || 'TELEMETRY',
        urgency: 'CRITICAL',
        reason: `${critAlerts.length} active critical alert(s) currently unacknowledged in colliery sensor stream.`,
        recommendedAction: 'Conduct immediate sector inspection and verify physical interlocks / ventilation status.',
        linkedSourceIds: critAlerts.map((a) => a.id),
        linkedSourceType: 'ALERT',
      });
    }

    // Priority 3: Chronic Recurring Issues
    const activeRecurring = recurringIssues.filter((r) => r.status === 'ACTIVE');
    if (activeRecurring.length > 0) {
      items.push({
        id: `prio-${rank}`,
        rank: rank++,
        title: `Address Systematic ${activeRecurring[0].category} Recurrence`,
        category: activeRecurring[0].category,
        urgency: 'HIGH',
        reason: `Repeated statutory violations (${activeRecurring[0].occurrenceCount} times) indicate process control failure.`,
        recommendedAction: 'Convene colliery safety committee and revise standard operating procedure (SOP) training.',
        linkedSourceIds: activeRecurring[0].findingIds,
        linkedSourceType: 'INSPECTION',
      });
    }

    // Priority 4: Open High Severity Findings
    if (openHigh.length > 0 && items.length < 4) {
      items.push({
        id: `prio-${rank}`,
        rank: rank++,
        title: 'Review High Severity Inspection Action Plans',
        category: openHigh[0].category,
        urgency: 'HIGH',
        reason: `${openHigh.length} high-severity condition(s) require monitored corrective milestones.`,
        recommendedAction: 'Verify procurement and assignment of qualified engineering personnel for scheduled remediation.',
        linkedSourceIds: openHigh.map((h) => h.id),
        linkedSourceType: 'FINDING',
      });
    }

    // Default safe baseline if no urgent items
    if (items.length === 0) {
      items.push({
        id: `prio-1`,
        rank: 1,
        title: 'Maintain Regular Statutory Inspection Schedule',
        category: 'STATUTORY',
        urgency: 'MEDIUM',
        reason: 'Colliery is operating within nominal safety thresholds with no active critical flags.',
        recommendedAction: 'Proceed with planned bi-monthly DGMS routine audit cycle and monitor environmental telemetry.',
        linkedSourceIds: [],
        linkedSourceType: 'INSPECTION',
      });
    }

    return items;
  }

  /**
   * Computes category-level risks for PPE, Machinery, Electrical, Ventilation, etc.
   */
  private calculateCategoryRisks(
    mineFindings: InspectionFinding[],
    recurringIssues: RecurringIssue[]
  ): CategoryRiskAnalysis[] {
    const categories: Array<{ key: FindingCategory; label: string }> = [
      { key: 'SAFETY', label: 'General & Site Safety' },
      { key: 'PPE', label: 'PPE & Personnel Protection' },
      { key: 'EQUIPMENT', label: 'Machinery & HEMM Proximity' },
      { key: 'VENTILATION', label: 'Ventilation & Toxic Gas' },
      { key: 'ENVIRONMENT', label: 'Environmental & Dust Control' },
      { key: 'DOCUMENTATION', label: 'Statutory Documentation' },
    ];

    return categories.map((cat) => {
      const catFindings = mineFindings.filter((f) => f.category === cat.key);
      const openFindings = catFindings.filter((f) => f.status === 'OPEN' || f.status === 'IN_REVIEW');
      const crit = openFindings.filter((f) => f.severity === 'CRITICAL').length;
      const high = openFindings.filter((f) => f.severity === 'HIGH').length;
      const med = openFindings.filter((f) => f.severity === 'MEDIUM').length;

      const recurrence = recurringIssues.find((r) => r.category === cat.key)?.occurrenceCount || 0;

      // Deterministic category score (0-100)
      const rawScore = crit * 25 + high * 15 + med * 6 + recurrence * 5;
      const score = Math.min(100, Math.max(0, rawScore));
      const riskLevel = determineRiskBand(score, catFindings.length > 0);

      // Trend for this category
      const trend: RiskTrendDirection =
        crit > 0 || high > 1 ? 'WORSENING' : openFindings.length === 0 ? 'IMPROVING' : 'STABLE';

      return {
        category: cat.key,
        displayName: cat.label,
        score,
        riskLevel,
        openIssuesCount: openFindings.length,
        criticalCount: crit,
        highCount: high,
        mediumCount: med,
        recurrenceCount: recurrence,
        trend,
        topFindingTitle: openFindings[0]?.title,
      };
    });
  }

  /**
   * Compares current score to historical snapshots for 7d, 30d, 90d window.
   */
  private calculateTrend(
    mineId: string,
    currentScore: number,
    snapshots: RiskSnapshot[],
    timeWindow: RiskTimeWindow,
    now: number
  ): {
    trend: RiskTrendDirection;
    previousScore?: number;
    scoreDelta?: number;
  } {
    const mineSnapshots = snapshots.filter((s) => s.mineId === mineId);
    if (mineSnapshots.length === 0) {
      return { trend: 'INSUFFICIENT_DATA' };
    }

    const dayMs = 86400000;
    const targetDays = timeWindow === '7d' ? 7 : timeWindow === '30d' ? 30 : 90;
    const targetTime = now - targetDays * dayMs;

    // Find snapshot closest to targetTime
    let closestSnapshot: RiskSnapshot | null = null;
    let minDiff = Infinity;

    for (const snap of mineSnapshots) {
      const snapTime = new Date(snap.timestamp).getTime();
      const diff = Math.abs(snapTime - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestSnapshot = snap;
      }
    }

    if (!closestSnapshot) {
      return { trend: 'INSUFFICIENT_DATA' };
    }

    const previousScore = closestSnapshot.overallScore;
    const scoreDelta = currentScore - previousScore;

    let trend: RiskTrendDirection = 'STABLE';
    if (scoreDelta > 3) {
      trend = 'WORSENING';
    } else if (scoreDelta < -3) {
      trend = 'IMPROVING';
    }

    return {
      trend,
      previousScore,
      scoreDelta,
    };
  }
}

export const riskScoringEngine = new RiskScoringEngine();

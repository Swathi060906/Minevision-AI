import { dataService } from '../dataService';
import { predictiveRiskEngine } from './predictiveRiskEngine';
import { riskIntelligenceRepository } from '../../data/repositories/riskIntelligenceRepository';
import { predictiveIntelligenceRepository } from '../../data/repositories/predictiveIntelligenceRepository';
import {
  MinePrediction,
  AiPredictiveNarrative,
} from '../../data/models/PredictiveIntelligence';
import { UserRole } from '../../auth/authTypes';
import { recordAuditEvent } from '../../auth/authService';

export interface GetMinePredictionParams {
  mineId: string;
  userContext: {
    id: string;
    email: string;
    role: UserRole;
    mineIds?: string[];
  };
  includeAiNarrative?: boolean;
}

export interface GetAllMinePredictionsParams {
  userContext: {
    id: string;
    email: string;
    role: UserRole;
    mineIds?: string[];
  };
}

export class PredictiveRiskService {
  /**
   * Retrieves the predictive early warning profile for a single authorized mine.
   */
  async getMinePrediction(params: GetMinePredictionParams): Promise<MinePrediction> {
    const { mineId, userContext, includeAiNarrative = false } = params;

    // Mine-scoping authorization check
    if (userContext.role === 'OFFICER' && userContext.mineIds && userContext.mineIds.length > 0) {
      if (!userContext.mineIds.includes(mineId)) {
        throw new Error(`Unauthorized: Officer is not assigned to mine '${mineId}'.`);
      }
    }
    if (userContext.role === 'OPERATOR' && userContext.mineIds && userContext.mineIds.length > 0) {
      if (!userContext.mineIds.includes(mineId)) {
        throw new Error(`Unauthorized: Operator is not assigned to mine '${mineId}'.`);
      }
    }

    recordAuditEvent('PREDICTIVE_ANALYSIS_REQUESTED', userContext.id, userContext.email, {
      mineId,
    });

    const [allMines, findings, alerts, inspections, snapshots, proposedFindings, currentRiskProfile] =
      await Promise.all([
        dataService.getMines(),
        dataService.getFindings({ mineId }),
        dataService.getAlerts({ mineId }),
        dataService.getInspections({ mineId }),
        riskIntelligenceRepository.getSnapshots(mineId),
        dataService.getProposedFindings({ mineId, reviewStatus: 'PENDING_REVIEW' }),
        dataService.getMineRiskProfile({
          mineId,
          timeWindow: '30d',
          userContext,
          includeAiNarrative: false,
        }),
      ]);

    const targetMine = allMines.find((m) => m.id === mineId);
    if (!targetMine) {
      throw new Error(`Mine with id '${mineId}' not found.`);
    }

    const prediction = predictiveRiskEngine.calculateMinePrediction({
      mine: targetMine,
      currentRiskProfile,
      inspections,
      findings,
      alerts,
      snapshots,
      pendingAiCount: proposedFindings.length,
    });

    // Optional Gemini narrative summary (Officers and Admins only)
    if (includeAiNarrative && userContext.role !== 'OPERATOR' && prediction.dataSufficiency.isSufficient) {
      try {
        prediction.aiNarrative = await this.generatePredictiveNarrative(prediction, userContext);
      } catch (err) {
        console.warn('AI predictive narrative skipped/failed, using deterministic summary:', err);
        prediction.aiNarrative = this.generateDeterministicNarrative(prediction);
      }
    } else {
      prediction.aiNarrative = this.generateDeterministicNarrative(prediction);
    }

    // Save snapshot in repository
    try {
      await predictiveIntelligenceRepository.saveSnapshot({
        mineId: prediction.mineId,
        calculatedAt: prediction.calculatedAt,
        engineVersion: prediction.engineVersion,
        analysisWindow: '90d',
        horizon: '30d',
        currentRisk: prediction.officialCurrentRiskScore,
        earlyWarningIndex: prediction.earlyWarningIndex,
        trajectory: prediction.trajectory,
        confidence: prediction.overallConfidence,
        dataSufficiency: prediction.dataSufficiency.level,
        signalsCount: prediction.signals.length,
        driversCount: prediction.drivers.length,
      });
    } catch {
      // Non-blocking persistence fallback
    }

    recordAuditEvent('PREDICTIVE_ANALYSIS_COMPLETED', userContext.id, userContext.email, {
      mineId,
      earlyWarningIndex: prediction.earlyWarningIndex,
      earlyWarningBand: prediction.earlyWarningBand,
      trajectory: prediction.trajectory,
      confidence: prediction.overallConfidence,
    });

    return prediction;
  }

  /**
   * Retrieves predictive profiles for all authorized mines.
   */
  async getAllAuthorizedMinePredictions(params: GetAllMinePredictionsParams): Promise<MinePrediction[]> {
    const { userContext } = params;

    const allMines = await dataService.getMines();

    const authorizedMines =
      userContext.role === 'ADMIN'
        ? allMines
        : userContext.mineIds && userContext.mineIds.length > 0
        ? allMines.filter((m) => userContext.mineIds?.includes(m.id))
        : allMines;

    if (authorizedMines.length === 0) {
      return [];
    }

    const [allFindings, allAlerts, allInspections, allSnapshots, pendingProposals, allRiskProfiles] =
      await Promise.all([
        dataService.getFindings(),
        dataService.getAlerts(),
        dataService.getInspections(),
        riskIntelligenceRepository.getSnapshots(),
        dataService.getProposedFindings({ reviewStatus: 'PENDING_REVIEW' }),
        dataService.getAllAuthorizedMinesRisk({ timeWindow: '30d', userContext }),
      ]);

    const riskProfileMap = new Map(allRiskProfiles.map((p) => [p.mineId, p]));

    return authorizedMines.map((mine) => {
      const currentRiskProfile =
        riskProfileMap.get(mine.id) || {
          mineId: mine.id,
          mineName: mine.name,
          state: mine.state || 'Jharkhand',
          district: mine.district || 'Dhanbad',
          overallScore: 30,
          riskLevel: 'LOW' as const,
          trend: 'STABLE' as const,
          trendTimeWindow: '30d' as const,
          hasSufficientData: true,
          dataFreshness: 'CURRENT' as const,
          factors: [],
          drivers: [],
          priorityAttention: [],
          categoryRisks: [],
          recurringIssues: [],
          agingSummary: {
            open0to7Days: 0,
            open8to30Days: 0,
            open31to90Days: 0,
            openOver90Days: 0,
            totalOverdue: 0,
            oldestFindingDays: 0,
            items: [],
          },
          counts: {
            totalFindings: 0,
            openFindings: 0,
            openCritical: 0,
            openHigh: 0,
            openMedium: 0,
            openLow: 0,
            activeAlerts: 0,
            criticalAlerts: 0,
            overdueActions: 0,
            inspectionsCount: 0,
            pendingAiProposalsCount: 0,
          },
          calculatedAt: new Date().toISOString(),
        };

      const mineFindings = allFindings.filter((f) => f.mineId === mine.id);
      const mineAlerts = allAlerts.filter((a) => a.mineId === mine.id);
      const mineInspections = allInspections.filter((i) => i.mineId === mine.id);
      const altId = mine.id.includes('-0') ? mine.id.replace('-0', '-') : mine.id.replace('mine-', 'mine-0');
      const mineSnapshots = allSnapshots.filter((s) => s.mineId === mine.id || s.mineId === altId);
      const pendingCount = pendingProposals.filter((p) => p.mineId === mine.id).length;

      const prediction = predictiveRiskEngine.calculateMinePrediction({
        mine,
        currentRiskProfile,
        inspections: mineInspections,
        findings: mineFindings,
        alerts: mineAlerts,
        snapshots: mineSnapshots,
        pendingAiCount: pendingCount,
      });

      prediction.aiNarrative = this.generateDeterministicNarrative(prediction);
      return prediction;
    });
  }

  /**
   * Generates AI narrative via server API route.
   */
  public async generatePredictiveNarrative(
    prediction: MinePrediction,
    userContext: { id: string; email: string; role: UserRole }
  ): Promise<AiPredictiveNarrative> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('/api/predictive/narrative', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userContext.role,
          'X-User-Id': userContext.id,
          'X-User-Email': userContext.email,
        },
        body: JSON.stringify({
          mineId: prediction.mineId,
          mineName: prediction.mineName,
          officialCurrentRiskScore: prediction.officialCurrentRiskScore,
          officialRiskLevel: prediction.officialRiskLevel,
          earlyWarningIndex: prediction.earlyWarningIndex,
          earlyWarningBand: prediction.earlyWarningBand,
          trajectory: prediction.trajectory,
          horizons: prediction.horizons,
          factors: prediction.factors,
          topSignals: prediction.signals.slice(0, 3),
          interventions: prediction.interventions.slice(0, 3),
        }),
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.summaryText) {
          recordAuditEvent('PREDICTIVE_NARRATIVE_GENERATED', userContext.id, userContext.email, {
            mineId: prediction.mineId,
            model: data.modelName || 'gemini-3.8-flash',
          });
          return {
            summaryText: data.summaryText,
            isAiGenerated: true,
            modelName: data.modelName || 'Gemini 3.8 Flash (Server)',
            generatedAt: new Date().toISOString(),
            disclaimer:
              'AI-generated executive narrative strictly summarizing deterministic early-warning indicators. No risk scores or predictions were generated autonomously.',
            topConcerns: data.topConcerns || prediction.drivers.slice(0, 3).map((d) => d.title),
            recommendedInterventions:
              data.recommendedInterventions || prediction.interventions.slice(0, 3).map((i) => i.recommendedAction),
          };
        }
      }
    } catch {
      // Fallback on network or service error
    }

    return this.generateDeterministicNarrative(prediction);
  }

  /**
   * Generates reliable deterministic structured narrative when AI is offline or disabled.
   */
  public generateDeterministicNarrative(prediction: MinePrediction): AiPredictiveNarrative {
    const {
      mineName,
      officialCurrentRiskScore,
      earlyWarningIndex,
      earlyWarningBand,
      trajectory,
      dataSufficiency,
      drivers,
      interventions,
      horizons,
    } = prediction;

    if (!dataSufficiency.isSufficient) {
      return {
        summaryText: `${mineName} has insufficient historical observations for a reliable forward-looking analysis. Current official risk score remains ${officialCurrentRiskScore}/100. Forward predictive modeling will automatically activate as subsequent DGMS statutory audit cycles accumulate.`,
        isAiGenerated: false,
        modelName: 'Deterministic Early Warning Engine',
        generatedAt: new Date().toISOString(),
        disclaimer: 'Deterministic advisory notification. Insufficient baseline historical depth.',
        topConcerns: ['Insufficient observation history for forward trend confidence.'],
        recommendedInterventions: ['Complete scheduled statutory audits to establish longitudinal baseline.'],
      };
    }

    let narrativeText = `${mineName} presents an **Early Warning Index of ${earlyWarningIndex}/100 (${earlyWarningBand} Advisory Band)** with a **${trajectory.toLowerCase()} trajectory**. `;
    narrativeText += `Official current risk stands at **${officialCurrentRiskScore}/100**. `;

    if (trajectory === 'RAPIDLY_DETERIORATING' || trajectory === 'DETERIORATING') {
      narrativeText += `Statistical drift indicates increasing likelihood of statutory compliance escalation over the next ${horizons.thirtyDay.horizonLabel} if unmitigated. `;
    } else if (trajectory === 'IMPROVING') {
      narrativeText += `Longitudinal observations demonstrate sustained remediation momentum with decreasing violation frequency. `;
    } else {
      narrativeText += `Operational indicators remain stable within the monitored compliance parameters. `;
    }

    if (drivers.length > 0) {
      narrativeText += `The foremost early-warning contributor is "${drivers[0].title}". `;
    }

    return {
      summaryText: narrativeText,
      isAiGenerated: false,
      modelName: 'Deterministic Early Warning Engine',
      generatedAt: new Date().toISOString(),
      disclaimer:
        'Deterministic advisory narrative calculated from verified colliery findings, audit aging, and telemetry records.',
      topConcerns: drivers.slice(0, 3).map((d) => d.title),
      recommendedInterventions: interventions.slice(0, 3).map((i) => i.recommendedAction),
    };
  }
}

export const predictiveRiskService = new PredictiveRiskService();

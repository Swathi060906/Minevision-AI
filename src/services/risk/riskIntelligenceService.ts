import { dataService } from '../dataService';
import { riskScoringEngine } from './riskScoringEngine';
import { riskIntelligenceRepository } from '../../data/repositories/riskIntelligenceRepository';
import {
  MineRiskProfile,
  RiskTimeWindow,
  RiskEngineConfig,
  AiRiskNarrative,
} from '../../data/models/RiskIntelligence';
import { UserRole } from '../../auth/authTypes';
import { recordAuditEvent } from '../../auth/authService';

export interface GetMineRiskParams {
  mineId: string;
  timeWindow?: RiskTimeWindow;
  userContext: {
    id: string;
    email: string;
    role: UserRole;
    mineIds?: string[];
  };
  includeAiNarrative?: boolean;
}

export interface GetAllMinesRiskParams {
  timeWindow?: RiskTimeWindow;
  userContext: {
    id: string;
    email: string;
    role: UserRole;
    mineIds?: string[];
  };
}

export class RiskIntelligenceService {
  /**
   * Retrieves the explainable risk profile for a single authorized mine.
   */
  async getMineRiskProfile(params: GetMineRiskParams): Promise<MineRiskProfile> {
    const { mineId, timeWindow = '30d', userContext, includeAiNarrative = false } = params;

    // RBAC Authorization check
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

    recordAuditEvent('RISK_ANALYSIS_REQUESTED', userContext.id, userContext.email, {
      mineId,
      timeWindow,
    });

    const [allMines, findings, alerts, inspections, config, snapshots, proposedFindings] =
      await Promise.all([
        dataService.getMines(),
        dataService.getFindings({ mineId }),
        dataService.getAlerts({ mineId }),
        dataService.getInspections({ mineId }),
        riskIntelligenceRepository.getConfig(),
        riskIntelligenceRepository.getSnapshots(mineId),
        dataService.getProposedFindings({ mineId, reviewStatus: 'PENDING_REVIEW' }),
      ]);

    const targetMine = allMines.find((m) => m.id === mineId);
    if (!targetMine) {
      throw new Error(`Mine with id '${mineId}' not found.`);
    }

    // Pending AI proposals are tracked strictly as an advisory count, NOT added to the official score
    const pendingAiCount = proposedFindings.length;

    const profile = riskScoringEngine.calculateMineRisk({
      mine: targetMine,
      findings,
      alerts,
      inspections,
      snapshots,
      config,
      timeWindow,
      pendingAiProposalsCount: pendingAiCount,
    });

    // Optional Gemini narrative summary
    if (includeAiNarrative && userContext.role !== 'OPERATOR') {
      try {
        profile.aiNarrative = await this.generateRiskNarrative(profile, userContext);
      } catch (err) {
        console.warn('AI risk narrative generation skipped/failed, using deterministic summary:', err);
        profile.aiNarrative = this.generateDeterministicNarrative(profile);
      }
    } else {
      profile.aiNarrative = this.generateDeterministicNarrative(profile);
    }

    recordAuditEvent('RISK_ANALYSIS_COMPLETED', userContext.id, userContext.email, {
      mineId,
      overallScore: profile.overallScore,
      riskLevel: profile.riskLevel,
      trend: profile.trend,
    });

    return profile;
  }

  /**
   * Retrieves risk profiles for all mines authorized for the current user.
   */
  async getAllAuthorizedMinesRisk(params: GetAllMinesRiskParams): Promise<MineRiskProfile[]> {
    const { timeWindow = '30d', userContext } = params;

    const allMines = await dataService.getMines();

    // Mine-scoping by user role
    const authorizedMines =
      userContext.role === 'ADMIN'
        ? allMines
        : userContext.mineIds && userContext.mineIds.length > 0
        ? allMines.filter((m) => userContext.mineIds?.includes(m.id))
        : allMines;

    if (authorizedMines.length === 0) {
      return [];
    }

    const [allFindings, allAlerts, allInspections, config, allSnapshots, pendingProposals] =
      await Promise.all([
        dataService.getFindings(),
        dataService.getAlerts(),
        dataService.getInspections(),
        riskIntelligenceRepository.getConfig(),
        riskIntelligenceRepository.getSnapshots(),
        dataService.getProposedFindings({ reviewStatus: 'PENDING_REVIEW' }),
      ]);

    const profiles: MineRiskProfile[] = [];

    for (const mine of authorizedMines) {
      const mineFindings = allFindings.filter((f) => f.mineId === mine.id);
      const mineAlerts = allAlerts.filter((a) => a.mineId === mine.id);
      const mineInspections = allInspections.filter((i) => i.mineId === mine.id);
      const mineSnapshots = allSnapshots.filter((s) => s.mineId === mine.id);
      const pendingCount = pendingProposals.filter((p) => p.mineId === mine.id).length;

      const profile = riskScoringEngine.calculateMineRisk({
        mine,
        findings: mineFindings,
        alerts: mineAlerts,
        inspections: mineInspections,
        snapshots: mineSnapshots,
        config,
        timeWindow,
        pendingAiProposalsCount: pendingCount,
      });

      profiles.push(profile);
    }

    // Sort by highest risk score first
    return profiles.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Generates an executive narrative using the server-side Gemini endpoint.
   * If offline or unconfigured, falls back to deterministic summary.
   */
  private async generateRiskNarrative(
    profile: MineRiskProfile,
    userContext: { id: string; email: string; role: UserRole }
  ): Promise<AiRiskNarrative> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('/api/risk/narrative', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userContext.role,
          'x-user-id': userContext.id,
          'x-user-email': userContext.email,
        },
        body: JSON.stringify({
          mineId: profile.mineId,
          mineName: profile.mineName,
          overallScore: profile.overallScore,
          riskLevel: profile.riskLevel,
          trend: profile.trend,
          counts: profile.counts,
          factors: profile.factors.map((f) => ({
            factor: f.factor,
            points: f.contributionPoints,
            description: f.description,
          })),
          topDrivers: profile.drivers.slice(0, 3).map((d) => d.title),
        }),
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.summaryText) {
          recordAuditEvent('RISK_NARRATIVE_GENERATED', userContext.id, userContext.email, {
            mineId: profile.mineId,
            model: data.modelName || 'gemini-3.8-flash',
          });
          return {
            summaryText: data.summaryText,
            isAiGenerated: true,
            modelName: data.modelName || 'Gemini 3.8 Flash (Server)',
            generatedAt: new Date().toISOString(),
            disclaimer:
              'AI-generated executive narrative strictly summarizing deterministic risk indicators. No risk scores or findings were generated autonomously.',
            keyConcerns: data.keyConcerns || profile.drivers.slice(0, 3).map((d) => d.title),
            recommendedDirectives:
              data.recommendedDirectives || profile.priorityAttention.map((p) => p.recommendedAction),
          };
        }
      }
    } catch {
      // Fallback on network or service error
    }

    return this.generateDeterministicNarrative(profile);
  }

  /**
   * Generates a reliable, deterministic structured narrative when AI is disabled or offline.
   */
  public generateDeterministicNarrative(profile: MineRiskProfile): AiRiskNarrative {
    const { counts, factors, drivers, overallScore, riskLevel, trend, mineName } = profile;

    let narrativeText = `${mineName} is currently operating at a **${riskLevel} safety risk level** with a calculated score of **${overallScore}/100** (Trend: ${trend.toLowerCase()}). `;

    if (counts.openCritical > 0 || counts.openHigh > 0) {
      narrativeText += `The primary risk drivers are ${counts.openCritical} unresolved critical finding(s) and ${counts.openHigh} high-severity finding(s). `;
    } else {
      narrativeText += `No critical statutory non-compliances are currently open. `;
    }

    if (counts.overdueActions > 0) {
      narrativeText += `Corrective action timeliness requires immediate escalation as ${counts.overdueActions} statutory remediation item(s) are past due. `;
    }

    if (counts.activeAlerts > 0) {
      narrativeText += `Additionally, ${counts.activeAlerts} active telemetry/hazard alert(s) remain unacknowledged. `;
    }

    if (counts.pendingAiProposalsCount > 0) {
      narrativeText += `Note: ${counts.pendingAiProposalsCount} pending AI vision/document proposal(s) await compliance officer review and are excluded from this official score.`;
    }

    return {
      summaryText: narrativeText,
      isAiGenerated: false,
      modelName: 'Deterministic Risk Engine',
      generatedAt: new Date().toISOString(),
      disclaimer:
        'Deterministic statutory summary calculated from verified colliery findings, audit aging, and telemetry records.',
      keyConcerns: drivers.slice(0, 3).map((d) => d.title),
      recommendedDirectives: profile.priorityAttention.map((p) => p.recommendedAction),
    };
  }

  /**
   * Configuration governance (ADMIN only).
   */
  async getConfig(): Promise<RiskEngineConfig> {
    return riskIntelligenceRepository.getConfig();
  }

  async updateConfig(
    updates: Partial<RiskEngineConfig>,
    userContext: { id: string; email: string; role: UserRole }
  ): Promise<RiskEngineConfig> {
    if (userContext.role !== 'ADMIN') {
      throw new Error('Forbidden: Only System Administrators can modify statutory risk weights.');
    }

    const previousConfig = await riskIntelligenceRepository.getConfig();
    const updated = await riskIntelligenceRepository.updateConfig(updates, userContext.email);

    recordAuditEvent('RISK_CONFIGURATION_UPDATED', userContext.id, userContext.email, {
      previousVersion: previousConfig.version,
      newVersion: updated.version,
      updates,
    });

    return updated;
  }

  async resetConfig(
    userContext: { id: string; email: string; role: UserRole }
  ): Promise<RiskEngineConfig> {
    if (userContext.role !== 'ADMIN') {
      throw new Error('Forbidden: Only System Administrators can reset statutory risk weights.');
    }

    const reset = await riskIntelligenceRepository.resetConfig(userContext.email);
    recordAuditEvent('RISK_CONFIGURATION_UPDATED', userContext.id, userContext.email, {
      action: 'RESET_TO_DEFAULTS',
      version: reset.version,
    });
    return reset;
  }
}

export const riskIntelligenceService = new RiskIntelligenceService();

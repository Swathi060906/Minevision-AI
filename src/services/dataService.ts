import { mineRepository } from '../data/repositories/mineRepository';
import { inspectionRepository, InspectionFilter } from '../data/repositories/inspectionRepository';
import { complianceRepository } from '../data/repositories/complianceRepository';
import { alertRepository } from '../data/repositories/alertRepository';
import { userRepository } from '../data/repositories/userRepository';
import { complianceKnowledgeRepository, KnowledgeFilter } from '../data/repositories/complianceKnowledgeRepository';
import { documentAnalysisRepository, DocumentAnalysisFilter, ProposedFindingFilter } from '../data/repositories/documentAnalysisRepository';
import { visionRepository, VisionAnalysisFilter, SafetyObservationFilter, ZoneFilter } from '../data/repositories/visionRepository';
import { visionAnalysisService, RunVisionAnalysisParams } from './vision/visionAnalysisService';
import { ragService } from './rag/ragService';
import { DocumentAnalysis, CreateDocumentAnalysisInput } from '../data/models/DocumentAnalysis';
import { ProposedFinding, EditAndAcceptProposalInput } from '../data/models/ProposedFinding';
import { VisionAnalysis } from '../data/models/VisionAnalysis';
import { SafetyObservation } from '../data/models/SafetyObservation';
import { ZoneDefinition, CreateZoneInput, UpdateZoneInput } from '../data/models/ZoneDefinition';
import { complianceAnalysisService, RunAnalysisParams, ReviewerContext } from './ai/complianceAnalysisService';
import { geminiClientService, AiServiceStatus } from './ai/geminiClientService';
import { riskIntelligenceService, GetMineRiskParams, GetAllMinesRiskParams } from './risk/riskIntelligenceService';
import { MineRiskProfile, RiskEngineConfig, RiskTimeWindow } from '../data/models/RiskIntelligence';
import {
  predictiveRiskService,
  GetMinePredictionParams,
  GetAllMinePredictionsParams,
} from './predictive/predictiveRiskService';
import { MinePrediction, AiPredictiveNarrative } from '../data/models/PredictiveIntelligence';

import { Mine, CreateMineInput, UpdateMineInput } from '../data/models/Mine';
import { Inspection, CreateInspectionInput, UpdateInspectionInput } from '../data/models/Inspection';
import { InspectionFinding, CreateFindingInput, UpdateFindingInput } from '../data/models/InspectionFinding';
import { Evidence, CreateEvidenceInput } from '../data/models/Evidence';
import { ComplianceRecord, CategorySummary } from '../data/models/ComplianceRecord';
import { Alert, CreateAlertInput } from '../data/models/Alert';
import { User } from '../data/models/User';
import { UserRole } from '../auth/authTypes';
import {
  ComplianceKnowledge,
  CreateKnowledgeInput,
  UpdateKnowledgeInput,
  VerificationStatus,
} from '../data/models/ComplianceKnowledge';
import { KnowledgeChunk } from '../data/models/KnowledgeChunk';
import { RetrievalQuery, RetrievalResponse } from './rag/retrievalTypes';

export interface DashboardStats {
  totalMines: number;
  activeInspections: number;
  overallComplianceScore: number;
  criticalAlertsCount: number;
  recentInspections: Inspection[];
  criticalAlerts: Alert[];
  minesOverview: Mine[];
  categoryCompliance: CategorySummary[];
  totalKnowledgeCount?: number;
  verifiedKnowledgeCount?: number;
  minesUnderNotice: number;
  scheduledInspections: number;
  inProgressInspections: number;
}

export interface PersistenceMetadata {
  storageType: string;
  persistenceStatus: 'Active' | 'Degraded' | 'Offline';
  seedDataStatus: string;
  lastDataUpdate: string;
  totalMines: number;
  totalInspections: number;
  totalFindings: number;
  totalAlerts: number;
  totalKnowledge: number;
  totalChunks: number;
}

export class DataService {
  // Mines
  async getMines(roleContext?: { role?: UserRole; assignedMineIds?: string[]; mineIds?: string[] }): Promise<Mine[]> {
    const normalized = roleContext?.role
      ? {
          role: roleContext.role,
          assignedMineIds: roleContext.assignedMineIds || roleContext.mineIds || [],
        }
      : undefined;
    return mineRepository.getMines(normalized);
  }

  async getAuthorizedMines(userContext: { role: UserRole; assignedMineIds?: string[]; mineIds?: string[] }): Promise<Mine[]> {
    return this.getMines(userContext);
  }

  async getMineById(id: string): Promise<Mine | null> {
    return mineRepository.getMineById(id);
  }

  async createMine(input: CreateMineInput): Promise<Mine> {
    return mineRepository.createMine(input);
  }

  async updateMine(id: string, input: UpdateMineInput): Promise<Mine> {
    return mineRepository.updateMine(id, input);
  }

  // Inspections
  async getInspections(
    filter?: InspectionFilter & { role?: UserRole; mineIds?: string[] }
  ): Promise<Inspection[]> {
    let normalized = filter;
    if (filter && (filter.role || filter.mineIds)) {
      normalized = {
        ...filter,
        roleContext: {
          role: (filter.role || filter.roleContext?.role) as UserRole,
          assignedMineIds: filter.mineIds || filter.roleContext?.assignedMineIds || [],
        },
      };
    }
    return inspectionRepository.getInspections(normalized);
  }

  async getInspectionById(id: string): Promise<Inspection | null> {
    return inspectionRepository.getInspectionById(id);
  }

  async createInspection(input: CreateInspectionInput): Promise<Inspection> {
    return inspectionRepository.createInspection(input);
  }

  async updateInspection(id: string, input: UpdateInspectionInput): Promise<Inspection> {
    return inspectionRepository.updateInspection(id, input);
  }

  // Findings
  async getFindings(filter?: { inspectionId?: string; mineId?: string }): Promise<InspectionFinding[]> {
    if (filter?.inspectionId) {
      return inspectionRepository.getFindingsByInspection(filter.inspectionId);
    }
    if (filter?.mineId) {
      return inspectionRepository.getFindingsByMine(filter.mineId);
    }
    return inspectionRepository.getAllFindings();
  }

  async getFindingsByInspection(inspectionId: string): Promise<InspectionFinding[]> {
    return inspectionRepository.getFindingsByInspection(inspectionId);
  }

  async getFindingsByMine(mineId: string): Promise<InspectionFinding[]> {
    return inspectionRepository.getFindingsByMine(mineId);
  }

  async createFinding(input: CreateFindingInput): Promise<InspectionFinding> {
    return inspectionRepository.createFinding(input);
  }

  async updateFinding(id: string, input: UpdateFindingInput): Promise<InspectionFinding> {
    return inspectionRepository.updateFinding(id, input);
  }

  // Evidence
  async getEvidence(filter?: { inspectionId?: string }): Promise<Evidence[]> {
    if (filter?.inspectionId) {
      return inspectionRepository.getEvidenceByInspection(filter.inspectionId);
    }
    return inspectionRepository.getAllEvidence();
  }

  async getEvidenceByInspection(inspectionId: string): Promise<Evidence[]> {
    return inspectionRepository.getEvidenceByInspection(inspectionId);
  }

  async addEvidence(input: CreateEvidenceInput): Promise<Evidence> {
    return inspectionRepository.addEvidence(input);
  }

  // Compliance
  async getComplianceRecords(mineId?: string): Promise<ComplianceRecord[]> {
    return complianceRepository.getComplianceRecords(mineId);
  }

  async getCategorySummaries(mineId?: string): Promise<CategorySummary[]> {
    return complianceRepository.getCategorySummaries(mineId);
  }

  async getOverallComplianceScore(mineId?: string): Promise<number> {
    return complianceRepository.calculateOverallComplianceScore(mineId);
  }

  // Alerts
  async getAlerts(filter?: {
    mineId?: string;
    status?: string;
    role?: UserRole;
    mineIds?: string[];
    roleContext?: { role: UserRole; assignedMineIds: string[] };
  }): Promise<Alert[]> {
    let normalized = filter;
    if (filter && (filter.role || filter.mineIds)) {
      normalized = {
        ...filter,
        roleContext: {
          role: (filter.role || filter.roleContext?.role) as UserRole,
          assignedMineIds: filter.mineIds || filter.roleContext?.assignedMineIds || [],
        },
      };
    }
    return alertRepository.getAlerts(normalized);
  }

  async getAlertById(id: string): Promise<Alert | null> {
    return alertRepository.getAlertById(id);
  }

  async acknowledgeAlert(id: string): Promise<Alert> {
    return alertRepository.acknowledgeAlert(id);
  }

  async resolveAlert(id: string): Promise<Alert> {
    return alertRepository.resolveAlert(id);
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert> {
    return alertRepository.updateAlert(id, updates);
  }

  async createAlert(input: CreateAlertInput): Promise<Alert> {
    return alertRepository.createAlert(input);
  }

  // Users
  async getUsers(): Promise<User[]> {
    return userRepository.getUsers();
  }

  async getUserById(id: string): Promise<User | null> {
    return userRepository.getUserById(id);
  }

  async updateUserAssignments(userId: string, assignedMineIds: string[]): Promise<User> {
    return userRepository.updateUserAssignments(userId, assignedMineIds);
  }

  // Dashboard Aggregator
  async getDashboardStats(roleContext?: {
    role?: UserRole;
    assignedMineIds?: string[];
    mineIds?: string[];
  }): Promise<DashboardStats> {
    const normalized = roleContext?.role
      ? {
          role: roleContext.role,
          assignedMineIds: roleContext.assignedMineIds || roleContext.mineIds || [],
        }
      : undefined;

    const [mines, inspections, complianceScore, alerts, categoryCompliance, knowledge] = await Promise.all([
      mineRepository.getMines(normalized),
      inspectionRepository.getInspections({ roleContext: normalized }),
      complianceRepository.calculateOverallComplianceScore(),
      alertRepository.getAlerts({ roleContext: normalized }),
      complianceRepository.getCategorySummaries(),
      complianceKnowledgeRepository.getAll(),
    ]);

    const activeInspections = inspections.filter(
      (ins) => ins.status === 'In Progress' || ins.status === 'Scheduled' || ins.status === 'Review Required'
    ).length;

    const scheduledInspections = inspections.filter((ins) => ins.status === 'Scheduled').length;
    const inProgressInspections = inspections.filter((ins) => ins.status === 'In Progress').length;
    const minesUnderNotice = mines.filter((m) => m.status === 'Notice Issued').length;

    const criticalAlertsCount = alerts.filter(
      (a) => (a.severity === 'CRITICAL' || a.severity === 'HIGH') && a.status !== 'Resolved'
    ).length;

    const verifiedKnowledgeCount = knowledge.filter((k) => k.verificationStatus === 'VERIFIED').length;

    return {
      totalMines: mines.length,
      activeInspections,
      overallComplianceScore: complianceScore,
      criticalAlertsCount,
      recentInspections: inspections.slice(0, 4),
      criticalAlerts: alerts.slice(0, 4),
      minesOverview: mines.slice(0, 4),
      categoryCompliance,
      totalKnowledgeCount: knowledge.length,
      verifiedKnowledgeCount,
      minesUnderNotice,
      scheduledInspections,
      inProgressInspections,
    };
  }

  // Compliance Knowledge Base & Retrieval-Augmented Generation (Phase 4)
  async getComplianceKnowledge(filter?: KnowledgeFilter): Promise<ComplianceKnowledge[]> {
    return complianceKnowledgeRepository.getAll(filter);
  }

  async getKnowledgeById(id: string): Promise<ComplianceKnowledge | null> {
    return complianceKnowledgeRepository.getById(id);
  }

  async createKnowledge(input: CreateKnowledgeInput): Promise<ComplianceKnowledge> {
    return complianceKnowledgeRepository.create(input);
  }

  async updateKnowledge(id: string, input: UpdateKnowledgeInput): Promise<ComplianceKnowledge> {
    return complianceKnowledgeRepository.update(id, input);
  }

  async deleteKnowledge(id: string): Promise<boolean> {
    return complianceKnowledgeRepository.delete(id);
  }

  async archiveKnowledge(id: string): Promise<ComplianceKnowledge> {
    return complianceKnowledgeRepository.archive(id);
  }

  async setKnowledgeVerification(
    id: string,
    status: VerificationStatus,
    verifiedBy?: string
  ): Promise<ComplianceKnowledge> {
    return complianceKnowledgeRepository.setVerificationStatus(id, status, verifiedBy);
  }

  async getKnowledgeChunks(knowledgeId?: string): Promise<KnowledgeChunk[]> {
    return complianceKnowledgeRepository.getChunks(knowledgeId);
  }

  async rebuildKnowledgeChunks(knowledgeId?: string): Promise<KnowledgeChunk[] | number> {
    if (knowledgeId) {
      return complianceKnowledgeRepository.rebuildChunks(knowledgeId);
    }
    return complianceKnowledgeRepository.rebuildAllChunks();
  }

  async queryRAG(query: RetrievalQuery): Promise<RetrievalResponse> {
    return ragService.query(query);
  }

  async getKnowledgeStats(): Promise<{
    total: number;
    verified: number;
    needsReview: number;
    draft: number;
    active: number;
    archived: number;
    chunks: number;
  }> {
    const [items, chunks] = await Promise.all([
      complianceKnowledgeRepository.getAll(),
      complianceKnowledgeRepository.getChunks(),
    ]);

    return {
      total: items.length,
      verified: items.filter((k) => k.verificationStatus === 'VERIFIED').length,
      needsReview: items.filter((k) => k.verificationStatus === 'NEEDS_REVIEW').length,
      draft: items.filter((k) => k.status === 'DRAFT').length,
      active: items.filter((k) => k.status === 'ACTIVE').length,
      archived: items.filter((k) => k.status === 'ARCHIVED').length,
      chunks: chunks.length,
    };
  }

  // AI-Assisted Document Compliance Analysis (Phase 5)
  async checkAiServiceStatus(): Promise<AiServiceStatus> {
    return geminiClientService.checkStatus();
  }

  async getDocumentAnalyses(filter?: DocumentAnalysisFilter): Promise<DocumentAnalysis[]> {
    return documentAnalysisRepository.getAllAnalyses(filter);
  }

  async getDocumentAnalysisById(id: string): Promise<DocumentAnalysis | null> {
    return documentAnalysisRepository.getAnalysisById(id);
  }

  async getProposedFindings(filter?: ProposedFindingFilter): Promise<ProposedFinding[]> {
    return documentAnalysisRepository.getProposedFindings(filter);
  }

  async getProposedFindingById(id: string): Promise<ProposedFinding | null> {
    return documentAnalysisRepository.getProposedFindingById(id);
  }

  async runDocumentAnalysis(params: RunAnalysisParams): Promise<DocumentAnalysis> {
    return complianceAnalysisService.runAnalysis(params);
  }

  async acceptProposedFinding(
    proposalId: string,
    reviewer: ReviewerContext
  ) {
    return complianceAnalysisService.acceptProposedFinding(proposalId, reviewer);
  }

  async editAndAcceptProposedFinding(
    proposalId: string,
    input: EditAndAcceptProposalInput,
    reviewer: ReviewerContext
  ) {
    return complianceAnalysisService.editAndAcceptProposedFinding(proposalId, input, reviewer);
  }

  async rejectProposedFinding(
    proposalId: string,
    reason: string,
    reviewer: ReviewerContext
  ) {
    return complianceAnalysisService.rejectProposedFinding(proposalId, reason, reviewer);
  }

  async requestMoreEvidence(
    proposalId: string,
    notes: string,
    reviewer: ReviewerContext
  ) {
    return complianceAnalysisService.requestMoreEvidence(proposalId, notes, reviewer);
  }

  // --- Computer Vision & AI Safety Vision (Phase 6) ---
  async getVisionAnalyses(filter?: VisionAnalysisFilter): Promise<VisionAnalysis[]> {
    return visionRepository.getAnalyses(filter);
  }

  async getVisionAnalysisById(id: string): Promise<VisionAnalysis | null> {
    return visionRepository.getAnalysisById(id);
  }

  async runVisionAnalysis(params: RunVisionAnalysisParams): Promise<VisionAnalysis> {
    return visionAnalysisService.runAnalysis(params);
  }

  async runVisionSimulation(params: {
    scenarioId: 'DEMO-SIM-01' | 'DEMO-SIM-02' | 'DEMO-SIM-03';
    mineId: string;
    inspectionId?: string;
    currentUser: {
      id: string;
      email: string;
      role: UserRole;
      assignedMineIds?: string[];
    };
    onProgress?: (step: string, progressPercent: number) => void;
  }): Promise<VisionAnalysis> {
    return visionAnalysisService.runSimulationScenario(params);
  }

  async getSafetyObservations(filter?: SafetyObservationFilter): Promise<SafetyObservation[]> {
    return visionRepository.getObservations(filter);
  }

  async getSafetyZones(filter?: ZoneFilter): Promise<ZoneDefinition[]> {
    return visionRepository.getZones(filter);
  }

  async createSafetyZone(input: CreateZoneInput): Promise<ZoneDefinition> {
    return visionRepository.createZone(input);
  }

  async updateSafetyZone(id: string, updates: UpdateZoneInput): Promise<ZoneDefinition> {
    return visionRepository.updateZone(id, updates);
  }

  async deleteSafetyZone(id: string): Promise<boolean> {
    return visionRepository.deleteZone(id);
  }

  // Metadata
  async getPersistenceMetadata(): Promise<PersistenceMetadata> {
    const [mines, inspections, alerts, users, knowledge, chunks] = await Promise.all([
      mineRepository.getMines(),
      inspectionRepository.getInspections(),
      alertRepository.getAlerts(),
      userRepository.getUsers(),
      complianceKnowledgeRepository.getAll(),
      complianceKnowledgeRepository.getChunks(),
    ]);

    return {
      storageType: 'Browser LocalStorage (Encapsulated Adapter)',
      persistenceStatus: 'Active',
      seedDataStatus: 'Initialized (6-8 Colliery Demo Basins & Regulatory Knowledge)',
      lastDataUpdate: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      totalMines: mines.length,
      totalInspections: inspections.length,
      totalFindings: inspections.reduce((acc, i) => acc + (i.findingCount || 0), 0),
      totalAlerts: alerts.length,
      totalKnowledge: knowledge.length,
      totalChunks: chunks.length,
    };
  }

  // --- Phase 7 Safety Risk Intelligence ---
  async getMineRiskProfile(params: GetMineRiskParams): Promise<MineRiskProfile> {
    return riskIntelligenceService.getMineRiskProfile(params);
  }

  async getAllAuthorizedMinesRisk(params: GetAllMinesRiskParams): Promise<MineRiskProfile[]> {
    return riskIntelligenceService.getAllAuthorizedMinesRisk(params);
  }

  async getRiskConfig(): Promise<RiskEngineConfig> {
    return riskIntelligenceService.getConfig();
  }

  async updateRiskConfig(
    updates: Partial<RiskEngineConfig>,
    userContext: { id: string; email: string; role: UserRole }
  ): Promise<RiskEngineConfig> {
    return riskIntelligenceService.updateConfig(updates, userContext);
  }

  async resetRiskConfig(
    userContext: { id: string; email: string; role: UserRole }
  ): Promise<RiskEngineConfig> {
    return riskIntelligenceService.resetConfig(userContext);
  }

  // --- Phase 8 Predictive Safety & Early Warning Intelligence ---
  async getMinePrediction(params: GetMinePredictionParams): Promise<MinePrediction> {
    return predictiveRiskService.getMinePrediction(params);
  }

  async getAllAuthorizedMinePredictions(params: GetAllMinePredictionsParams): Promise<MinePrediction[]> {
    return predictiveRiskService.getAllAuthorizedMinePredictions(params);
  }

  async generatePredictiveNarrative(
    prediction: MinePrediction,
    userContext: { id: string; email: string; role: UserRole }
  ): Promise<AiPredictiveNarrative> {
    return predictiveRiskService.generatePredictiveNarrative(prediction, userContext);
  }

  // Development Reset
  async resetDemoData(): Promise<void> {
    await Promise.all([
      mineRepository.resetMines(),
      inspectionRepository.resetInspections(),
      complianceRepository.resetCompliance(),
      alertRepository.resetAlerts(),
      userRepository.resetUsers(),
      complianceKnowledgeRepository.reset(),
      documentAnalysisRepository.reset(),
    ]);
  }

  async resetFlagshipDemo(currentUser?: { id: string; email: string; role: UserRole }): Promise<{ success: boolean; message: string }> {
    const { resetFlagshipDemoScenario } = await import('../data/seed/demoScenarioSeed');
    return resetFlagshipDemoScenario(currentUser);
  }
}

export const dataService = new DataService();

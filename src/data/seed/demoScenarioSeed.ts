import { DocumentAnalysis } from '../models/DocumentAnalysis';
import { ProposedFinding } from '../models/ProposedFinding';
import { ExtractedFact } from '../models/ExtractedFact';
import { RiskSnapshot } from '../models/RiskIntelligence';
import { DEFAULT_RISK_CONFIG } from '../../services/risk/riskConfig';
import { defaultStorage } from '../storage/localStorageAdapter';
import { MINES_STORAGE_KEY } from '../repositories/mineRepository';
import {
  INSPECTIONS_STORAGE_KEY,
  FINDINGS_STORAGE_KEY,
  EVIDENCE_STORAGE_KEY,
} from '../repositories/inspectionRepository';
import { ALERTS_STORAGE_KEY } from '../repositories/alertRepository';
import {
  DOCUMENT_ANALYSES_STORAGE_KEY,
  PROPOSED_FINDINGS_STORAGE_KEY,
} from '../repositories/documentAnalysisRepository';
import {
  RISK_SNAPSHOTS_KEY,
  RISK_CONFIG_KEY,
} from '../repositories/riskIntelligenceRepository';
import {
  SEED_MINES,
  SEED_INSPECTIONS,
  SEED_FINDINGS,
  SEED_EVIDENCE,
  SEED_ALERTS,
} from './seedData';
import { recordAuditEvent } from '../../auth/authService';

export const FLAGSHIP_DEMO_MINE_ID = 'DEMO-MINE-002';
export const FLAGSHIP_DEMO_MINE_NAME = 'Jharia Deep Underground Shaft';
export const FLAGSHIP_DEMO_INSPECTION_ID = 'INS-2026-1044';
export const FLAGSHIP_DEMO_ANALYSIS_ID = 'analysis-demo-vent-001';
export const FLAGSHIP_DEMO_PROPOSAL_ID = 'PROP-FND-DEMO-001';

const now = Date.now();
const dayMs = 86400000;

export const SEED_DEMO_FACTS: ExtractedFact[] = [
  {
    id: 'fact-vent-01',
    category: 'VENTILATION',
    label: 'Face Airflow Velocity',
    value: '0.28 m/s',
    unit: 'm/s',
    normalizedValue: 0.28,
    sourcePage: 3,
    sourceSection: 'Gallery 14 / 3rd Dip Coal Face',
    evidenceText:
      'Calibrated rotating-vane anemometer reading at the 3rd Dip active coal face recorded steady velocity of 0.28 m/s against DGMS prescribed minimum of 0.50 m/s.',
    confidence: 'HIGH',
    notes: 'Breach of Coal Mines Regulations (CMR) 2017, Regulation 153(2).',
  },
  {
    id: 'fact-vent-02',
    category: 'VENTILATION',
    label: 'Auxiliary Duct Setback Distance',
    value: '12.4 meters',
    unit: 'meters',
    normalizedValue: 12.4,
    sourcePage: 4,
    sourceSection: 'Auxiliary Ventilation Line 2',
    evidenceText:
      'The flexible auxiliary ventilation ducting termination point was measured 12.4 meters back from the working face, exceeding the maximum statutory setback of 4.5 meters.',
    confidence: 'HIGH',
    notes: 'Increases gas stagnation risk at active coal excavation face.',
  },
  {
    id: 'fact-vent-03',
    category: 'SAFETY',
    label: 'Methane (CH4) Sensor Calibration',
    value: '0.42% transient background',
    unit: '% CH4',
    normalizedValue: 0.42,
    sourcePage: 5,
    sourceSection: 'Continuous Telemetry Node CH4-JH-04',
    evidenceText:
      'Telemetry node CH4-JH-04 recorded baseline methane at 0.42% with transient spike to 0.68% during cutter-loader shear operation.',
    confidence: 'MEDIUM',
    notes: 'Within 0.75% trip threshold but trending upwards over last 14 days.',
  },
];

export const SEED_DEMO_PROPOSED_FINDINGS: ProposedFinding[] = [
  {
    id: FLAGSHIP_DEMO_PROPOSAL_ID,
    analysisId: FLAGSHIP_DEMO_ANALYSIS_ID,
    inspectionId: FLAGSHIP_DEMO_INSPECTION_ID,
    mineId: FLAGSHIP_DEMO_MINE_ID,
    category: 'VENTILATION',
    title: 'Sub-Standard Face Airflow Velocity & Inadequate Auxiliary Ducting Setback',
    description:
      'Anemometer audit at 3rd Dip active coal face measured airflow velocity at 0.28 m/s (below statutory minimum 0.50 m/s required by CMR 2017 Reg. 153). Furthermore, auxiliary intake ducting terminates 12.4m back from face exceeding 4.5m statutory setback limit.',
    severitySuggestion: 'HIGH',
    analysisOutcome: 'POTENTIAL_NON_COMPLIANCE',
    evidenceFactIds: ['fact-vent-01', 'fact-vent-02'],
    evidenceText:
      'Face air velocity 0.28 m/s (statutory min 0.5 m/s). Auxiliary ducting discharge terminated 12.4m from face (statutory max 4.5m).',
    sourcePage: 3,
    sourceSection: 'Section 4: Underground Auxiliary Ventilation & Gas Audit',
    knowledgeId: 'DGMS-CMR-2017-R153',
    knowledgeChunkIds: ['chunk-cmr-153-01'],
    sourceReference: 'CMR 2017 Reg. 153(2) & DGMS Technical Circular 04/2021',
    sourceTitle: 'Coal Mines Regulations 2017 — Standard of Ventilation in Underground Workings',
    authority: 'Directorate General of Mines Safety (DGMS)',
    sectionOrClause: 'Regulation 153, Sub-clause (2)',
    verificationStatus: 'VERIFIED',
    isSyntheticDemo: true,
    reasoningSummary:
      'Air velocity at the face was measured below the 0.5 m/s threshold mandated by DGMS circulars for underground gassy seams. Coupled with excessive duct setback distance (12.4m vs 4.5m limit), this condition impedes noxious gas dilution and creates a combustible methane accumulation risk.',
    recommendedCorrectiveAction:
      'Immediately advance rigid/reinforced auxiliary ducting to within 3.0 meters of working face. Calibrate booster fan throttle and verify continuous anemometer velocity exceeding 0.5 m/s before resuming mechanized coal cutting.',
    confidence: 'HIGH',
    reviewStatus: 'PENDING_REVIEW',
    createdAt: new Date(now - 2 * 3600000).toISOString(),
    updatedAt: new Date(now - 2 * 3600000).toISOString(),
  },
];

export const SEED_DEMO_DOCUMENT_ANALYSES: DocumentAnalysis[] = [
  {
    id: FLAGSHIP_DEMO_ANALYSIS_ID,
    inspectionId: FLAGSHIP_DEMO_INSPECTION_ID,
    mineId: FLAGSHIP_DEMO_MINE_ID,
    fileName: 'Jharia_Seam9_Auxiliary_Ventilation_Audit_Sep2026.pdf',
    fileType: 'application/pdf',
    fileSizeBytes: 245760,
    analysisStatus: 'REVIEW_REQUIRED',
    extractedFacts: SEED_DEMO_FACTS,
    ragQuery: 'CMR 2017 ventilation velocity standards auxiliary duct setback gassy coal mines',
    retrievedKnowledgeIds: ['DGMS-CMR-2017-R153'],
    retrievedChunkIds: ['chunk-cmr-153-01'],
    ragPolicyUsed: 'VERIFIED_ONLY',
    isDemoMode: true,
    proposedFindings: SEED_DEMO_PROPOSED_FINDINGS,
    modelProvider: 'Gemini 2.5 Flash / Statutory Compliance Engine',
    modelName: 'gemini-2.5-flash',
    startedAt: new Date(now - 2 * 3600000 - 45000).toISOString(),
    completedAt: new Date(now - 2 * 3600000).toISOString(),
    durationMs: 45000,
    createdBy: 'officer@minevision.local',
    createdAt: new Date(now - 2 * 3600000).toISOString(),
    updatedAt: new Date(now - 2 * 3600000).toISOString(),
  },
];

export const SEED_HISTORICAL_SNAPSHOTS: RiskSnapshot[] = [
  // DEMO-MINE-002 (Jharia) historical snapshots (deteriorating trend)
  {
    id: 'snap-jharia-90d',
    mineId: 'DEMO-MINE-002',
    timestamp: new Date(now - 85 * dayMs).toISOString(),
    overallScore: 54,
    riskLevel: 'HIGH',
    openCritical: 1,
    openHigh: 2,
    activeAlerts: 1,
  },
  {
    id: 'snap-jharia-30d',
    mineId: 'DEMO-MINE-002',
    timestamp: new Date(now - 28 * dayMs).toISOString(),
    overallScore: 62,
    riskLevel: 'HIGH',
    openCritical: 2,
    openHigh: 3,
    activeAlerts: 2,
  },
  {
    id: 'snap-jharia-7d',
    mineId: 'DEMO-MINE-002',
    timestamp: new Date(now - 7 * dayMs).toISOString(),
    overallScore: 68,
    riskLevel: 'HIGH',
    openCritical: 2,
    openHigh: 4,
    activeAlerts: 2,
  },

  // DEMO-MINE-001 (Neyveli) historical snapshots (moderate improving)
  {
    id: 'snap-neyveli-90d',
    mineId: 'DEMO-MINE-001',
    timestamp: new Date(now - 85 * dayMs).toISOString(),
    overallScore: 48,
    riskLevel: 'MODERATE',
    openCritical: 1,
    openHigh: 3,
    activeAlerts: 1,
  },
  {
    id: 'snap-neyveli-30d',
    mineId: 'DEMO-MINE-001',
    timestamp: new Date(now - 28 * dayMs).toISOString(),
    overallScore: 36,
    riskLevel: 'MODERATE',
    openCritical: 0,
    openHigh: 2,
    activeAlerts: 1,
  },
  {
    id: 'snap-neyveli-7d',
    mineId: 'DEMO-MINE-001',
    timestamp: new Date(now - 7 * dayMs).toISOString(),
    overallScore: 28,
    riskLevel: 'MODERATE',
    openCritical: 0,
    openHigh: 1,
    activeAlerts: 0,
  },

  // DEMO-MINE-003 (Korba) historical snapshots (stable low risk)
  {
    id: 'snap-korba-30d',
    mineId: 'DEMO-MINE-003',
    timestamp: new Date(now - 28 * dayMs).toISOString(),
    overallScore: 22,
    riskLevel: 'LOW',
    openCritical: 0,
    openHigh: 1,
    activeAlerts: 0,
  },
  {
    id: 'snap-korba-7d',
    mineId: 'DEMO-MINE-003',
    timestamp: new Date(now - 7 * dayMs).toISOString(),
    overallScore: 21,
    riskLevel: 'LOW',
    openCritical: 0,
    openHigh: 0,
    activeAlerts: 0,
  },

  // DEMO-MINE-004 (Pench Valley) historical snapshots (critical worsening)
  {
    id: 'snap-pench-30d',
    mineId: 'DEMO-MINE-004',
    timestamp: new Date(now - 28 * dayMs).toISOString(),
    overallScore: 72,
    riskLevel: 'CRITICAL',
    openCritical: 3,
    openHigh: 3,
    activeAlerts: 2,
  },
  {
    id: 'snap-pench-7d',
    mineId: 'DEMO-MINE-004',
    timestamp: new Date(now - 7 * dayMs).toISOString(),
    overallScore: 78,
    riskLevel: 'CRITICAL',
    openCritical: 3,
    openHigh: 4,
    activeAlerts: 3,
  },
];

/**
 * Resets the demo state deterministically back to pristine demonstration baseline.
 * Restores Flagship mine (Jharia DEMO-MINE-002) with 1 pending AI proposal ready to review.
 */
export async function resetFlagshipDemoScenario(currentUser?: {
  id: string;
  email: string;
  role?: string;
}): Promise<{ success: boolean; message: string }> {
  // 1. Reset Mines
  await defaultStorage.setItem(MINES_STORAGE_KEY, SEED_MINES);

  // 2. Reset Inspections
  await defaultStorage.setItem(INSPECTIONS_STORAGE_KEY, SEED_INSPECTIONS);

  // 3. Reset Findings
  await defaultStorage.setItem(FINDINGS_STORAGE_KEY, SEED_FINDINGS);

  // 4. Reset Evidence
  await defaultStorage.setItem(EVIDENCE_STORAGE_KEY, SEED_EVIDENCE);

  // 5. Reset Alerts
  await defaultStorage.setItem(ALERTS_STORAGE_KEY, SEED_ALERTS);

  // 6. Reset Document Analyses with Flagship Analysis
  await defaultStorage.setItem(DOCUMENT_ANALYSES_STORAGE_KEY, SEED_DEMO_DOCUMENT_ANALYSES);

  // 7. Reset Proposed Findings with Flagship Pending Finding
  await defaultStorage.setItem(PROPOSED_FINDINGS_STORAGE_KEY, SEED_DEMO_PROPOSED_FINDINGS);

  // 8. Reset Risk Snapshots
  await defaultStorage.setItem(RISK_SNAPSHOTS_KEY, SEED_HISTORICAL_SNAPSHOTS);

  // 9. Reset Risk Engine Configuration
  await defaultStorage.setItem(RISK_CONFIG_KEY, DEFAULT_RISK_CONFIG);

  // 10. Record Audit Log
  const actorId = currentUser?.id || 'sys-demo-reset';
  const actorEmail = currentUser?.email || 'admin@minevision.local';
  await recordAuditEvent('DEMO_SCENARIO_RESET', actorId, actorEmail, {
    action: 'RESTORE_PRISTINE_DEMO_SCENARIO',
    flagshipMineId: FLAGSHIP_DEMO_MINE_ID,
    flagshipInspectionId: FLAGSHIP_DEMO_INSPECTION_ID,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    message:
      'Synthetic Demo Scenario successfully reset to pristine state. Flagship colliery (Jharia Underground) has 1 pending AI compliance finding ready for human review.',
  };
}

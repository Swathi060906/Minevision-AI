import { VisionAnalysis, VisionAnalysisStatus } from '../../data/models/VisionAnalysis';
import { SafetyObservation } from '../../data/models/SafetyObservation';
import { VisionEvidence } from '../../data/models/VisionEvidence';
import { ZoneDefinition } from '../../data/models/ZoneDefinition';
import { visionRepository } from '../../data/repositories/visionRepository';
import { defaultVisionProvider } from './computerVisionProvider';
import { spatialEngine, SpatialAnalysisConfig } from './spatialEngine';
import { visionComplianceBridge } from './visionComplianceBridge';
import { recordAuditEvent } from '../../auth/authService';
import { UserRole } from '../../auth/authTypes';
import { RetrievalPolicy } from '../rag/retrievalTypes';

export interface RunVisionAnalysisParams {
  mineId: string;
  inspectionId?: string;
  sourceType: 'IMAGE' | 'VIDEO';
  fileName: string;
  fileSizeBytes?: number;
  imageBase64: string;
  mimeType: string;
  policy?: RetrievalPolicy;
  spatialConfig?: SpatialAnalysisConfig;
  currentUser: {
    id: string;
    email: string;
    role: UserRole;
    assignedMineIds?: string[];
  };
  onProgress?: (step: string, progressPercent: number) => void;
}

export class VisionAnalysisService {
  /**
   * Run full end-to-end computer vision analysis pipeline:
   * Uploaded Image -> CV Provider -> Detections -> Spatial Engine -> Observations -> Phase 4 RAG -> Phase 5 Proposals -> Persistence -> Audit
   */
  async runAnalysis(params: RunVisionAnalysisParams): Promise<VisionAnalysis> {
    const { currentUser, mineId, inspectionId, sourceType, fileName, fileSizeBytes, imageBase64, mimeType, policy = 'VERIFIED_ONLY' } = params;

    // 1. RBAC Verification
    if (currentUser.role === 'OPERATOR') {
      throw new Error('Unauthorized: Mine Operator role is not permitted to initiate AI computer vision monitoring.');
    }
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'OFFICER') {
      throw new Error(`Unauthorized: Role '${currentUser.role}' is not authorized to run vision analysis.`);
    }
    if (currentUser.role === 'OFFICER' && currentUser.assignedMineIds && currentUser.assignedMineIds.length > 0) {
      if (!currentUser.assignedMineIds.includes(mineId)) {
        throw new Error(`Forbidden: Officer is not authorized for target mine '${mineId}'.`);
      }
    }

    params.onProgress?.('Initializing safety vision analysis...', 10);

    // 2. Audit start
    await recordAuditEvent('VISION_ANALYSIS_STARTED', currentUser.id, currentUser.email, {
      mineId,
      inspectionId,
      sourceType,
      fileName,
    });

    // 3. Create analysis record
    const analysis = await visionRepository.createAnalysis({
      mineId,
      inspectionId,
      sourceType,
      sourceFileName: fileName,
      fileSizeBytes,
      provider: 'Gemini Vision (Multimodal)',
      model: 'gemini-3.8-flash',
      createdBy: currentUser.email,
    });

    try {
      // 4. Create Evidence Record
      params.onProgress?.('Registering visual evidence snapshot...', 20);
      const evidence = await visionRepository.createEvidence({
        analysisId: analysis.id,
        mineId,
        inspectionId,
        sourceType: sourceType === 'VIDEO' ? 'VIDEO_FRAME' : 'IMAGE',
        fileName,
        dataUrl: imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${imageBase64}`,
        detectionIds: [],
      });

      // 5. Invoke Computer Vision Provider
      params.onProgress?.('Invoking Computer Vision model for object and PPE detection...', 40);
      const cvResult = await defaultVisionProvider.analyzeImage({
        imageBase64: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        mimeType,
        fileName,
        mineId,
      });

      const detections = cvResult.detections;
      params.onProgress?.(`Detected ${detections.length} entities in industrial scene. Fetching safety zones...`, 60);

      // 6. Fetch mine safety zones
      const zones = await visionRepository.getZones({ mineId, enabledOnly: true });

      // 7. Spatial Engine: Evaluate PPE, Zones, Proximity
      params.onProgress?.('Evaluating spatial rules, PPE associations, and zone perimeters...', 70);
      const observations = spatialEngine.evaluateSafetyObservations({
        analysisId: analysis.id,
        mineId,
        inspectionId,
        evidenceId: evidence.id,
        detections,
        zones,
        config: params.spatialConfig,
        isSyntheticDemo: false,
      });

      // 8. Ground Observations in Existing Phase 4 RAG and generate Phase 5 proposals
      params.onProgress?.(`Grounding ${observations.length} safety observations against statutory compliance rules...`, 85);
      for (const obs of observations) {
        const grounded = await visionComplianceBridge.groundObservation({
          observation: obs,
          policy,
          analysisId: analysis.id,
          mineId,
          inspectionId,
        });
        obs.proposedFindingId = grounded.proposedFinding.id;
      }

      // 9. Persist Observations
      await visionRepository.saveObservations(observations);

      // 10. Finalize Analysis Record
      const completedAt = new Date().toISOString();
      const updatedAnalysis = await visionRepository.updateAnalysis(analysis.id, {
        status: 'COMPLETED',
        completedAt,
        detections,
        observations,
        evidence: [evidence],
        zonesApplied: zones.map((z) => z.id),
        summary: cvResult.sceneDescription || `Completed safety vision analysis with ${detections.length} detections and ${observations.length} safety observations.`,
      });

      // 11. Audit completion
      await recordAuditEvent('VISION_ANALYSIS_COMPLETED', currentUser.id, currentUser.email, {
        analysisId: analysis.id,
        mineId,
        detectionsCount: detections.length,
        observationsCount: observations.length,
      });

      params.onProgress?.('Safety vision analysis completed.', 100);
      return updatedAnalysis;
    } catch (err: any) {
      await visionRepository.updateAnalysis(analysis.id, {
        status: 'FAILED',
        error: err.message || 'Vision analysis failed.',
      });

      await recordAuditEvent('VISION_ANALYSIS_FAILED', currentUser.id, currentUser.email, {
        analysisId: analysis.id,
        mineId,
        error: err.message,
      });

      throw err;
    }
  }

  /**
   * Run an explicitly labelled demonstration simulation scenario
   */
  async runSimulationScenario(params: {
    scenarioId: 'DEMO-SIM-01' | 'DEMO-SIM-02' | 'DEMO-SIM-03';
    mineId: string;
    inspectionId?: string;
    policy?: RetrievalPolicy;
    currentUser: {
      id: string;
      email: string;
      role: UserRole;
      assignedMineIds?: string[];
    };
    onProgress?: (step: string, progressPercent: number) => void;
  }): Promise<VisionAnalysis> {
    const { currentUser, mineId, inspectionId, scenarioId, policy = 'VERIFIED_ONLY' } = params;

    if (currentUser.role === 'OPERATOR') {
      throw new Error('Unauthorized: OPERATOR role cannot execute vision simulations.');
    }

    params.onProgress?.('Loading simulation scenario metadata...', 15);

    const scenario = getSimulationScenario(scenarioId);

    const analysis = await visionRepository.createAnalysis({
      mineId,
      inspectionId,
      sourceType: 'IMAGE',
      sourceFileName: `${scenario.id}_${scenario.title.replace(/\s+/g, '_')}.png`,
      provider: 'Simulation Engine (Synthetic)',
      model: 'synthetic-rule-engine',
      isDemoSimulation: true,
      createdBy: currentUser.email,
    });

    params.onProgress?.('Generating synthetic visual evidence snapshot...', 35);
    const evidence = await visionRepository.createEvidence({
      analysisId: analysis.id,
      mineId,
      inspectionId,
      sourceType: 'IMAGE',
      fileName: `${scenario.id}.png`,
      dataUrl: scenario.sampleSvgDataUrl,
      detectionIds: scenario.detections.map((d) => d.id),
    });

    params.onProgress?.('Evaluating simulated spatial rules and perimeter boundaries...', 60);
    const zones = await visionRepository.getZones({ mineId, enabledOnly: true });

    const observations = spatialEngine.evaluateSafetyObservations({
      analysisId: analysis.id,
      mineId,
      inspectionId,
      evidenceId: evidence.id,
      detections: scenario.detections,
      zones,
      isSyntheticDemo: true,
    });

    params.onProgress?.('Grounding simulated observations against regulatory knowledge...', 80);
    for (const obs of observations) {
      const grounded = await visionComplianceBridge.groundObservation({
        observation: obs,
        policy,
        analysisId: analysis.id,
        mineId,
        inspectionId,
      });
      obs.proposedFindingId = grounded.proposedFinding.id;
    }

    await visionRepository.saveObservations(observations);

    const completed = await visionRepository.updateAnalysis(analysis.id, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      detections: scenario.detections,
      observations,
      evidence: [evidence],
      zonesApplied: zones.map((z) => z.id),
      summary: `[DEMO / SIMULATION — NOT A REAL DETECTION] ${scenario.description}`,
    });

    await recordAuditEvent('VISION_ANALYSIS_COMPLETED', currentUser.id, currentUser.email, {
      analysisId: analysis.id,
      mineId,
      isDemoSimulation: true,
      scenarioId,
    });

    params.onProgress?.('Simulation scenario completed.', 100);
    return completed;
  }
}

// Preset simulation scenarios with explicit DEMO labels and valid SVGs
function getSimulationScenario(id: 'DEMO-SIM-01' | 'DEMO-SIM-02' | 'DEMO-SIM-03') {
  if (id === 'DEMO-SIM-01') {
    return {
      id: 'DEMO-SIM-01',
      title: 'Pit Head Dispatch — PPE Missing Helmet Scenario',
      description: 'Simulation showing worker near coal loading conveyor without mandatory hard hat.',
      sampleSvgDataUrl: generateSampleSceneSvg('PPE Missing Hard Hat', 'Worker detected without industrial safety helmet near conveyor loading chute.'),
      detections: [
        {
          id: 'det-sim-01-person',
          type: 'PERSON' as const,
          label: 'Worker 1 (Ground Personnel)',
          confidence: 0.94,
          boundingBox: { x: 0.38, y: 0.35, width: 0.16, height: 0.52 },
        },
        {
          id: 'det-sim-01-vest',
          type: 'SAFETY_VEST' as const,
          label: 'Fluorescent Safety Vest',
          confidence: 0.91,
          boundingBox: { x: 0.40, y: 0.45, width: 0.12, height: 0.22 },
        },
        {
          id: 'det-sim-01-machinery',
          type: 'HEMM' as const,
          label: 'Conveyor Drive Motor',
          confidence: 0.88,
          boundingBox: { x: 0.05, y: 0.25, width: 0.30, height: 0.65 },
        },
      ],
    };
  }

  if (id === 'DEMO-SIM-02') {
    return {
      id: 'DEMO-SIM-02',
      title: 'Underground Substation — Zone Intrusion Scenario',
      description: 'Simulation showing pedestrian worker entering 6.6kV transformer restricted zone perimeter.',
      sampleSvgDataUrl: generateSampleSceneSvg('Restricted Electrical Zone', 'Worker footprint detected inside high-voltage transformer enclosure.'),
      detections: [
        {
          id: 'det-sim-02-person',
          type: 'PERSON' as const,
          label: 'Maintenance Worker',
          confidence: 0.92,
          boundingBox: { x: 0.22, y: 0.30, width: 0.15, height: 0.48 },
        },
        {
          id: 'det-sim-02-helmet',
          type: 'HARD_HAT' as const,
          label: 'Hard Hat (White)',
          confidence: 0.89,
          boundingBox: { x: 0.26, y: 0.30, width: 0.08, height: 0.09 },
        },
        {
          id: 'det-sim-02-vest',
          type: 'SAFETY_VEST' as const,
          label: 'Safety Vest',
          confidence: 0.87,
          boundingBox: { x: 0.24, y: 0.38, width: 0.11, height: 0.20 },
        },
      ],
    };
  }

  // DEMO-SIM-03
  return {
    id: 'DEMO-SIM-03',
    title: 'Haul Road Intersection — HEMM Proximity Scenario',
    description: 'Simulation showing pedestrian worker in close proximity (1.8m) to 100-ton rear dump truck.',
    sampleSvgDataUrl: generateSampleSceneSvg('HEMM Pedestrian Proximity', 'Pedestrian worker within 1.8m swing distance of heavy dumper truck.'),
    detections: [
      {
        id: 'det-sim-03-person',
        type: 'PERSON' as const,
        label: 'Surveyor / Pedestrian',
        confidence: 0.95,
        boundingBox: { x: 0.52, y: 0.42, width: 0.11, height: 0.42 },
      },
      {
        id: 'det-sim-03-helmet',
        type: 'HARD_HAT' as const,
        label: 'Hard Hat',
        confidence: 0.92,
        boundingBox: { x: 0.55, y: 0.42, width: 0.06, height: 0.07 },
      },
      {
        id: 'det-sim-03-vest',
        type: 'SAFETY_VEST' as const,
        label: 'Safety Vest',
        confidence: 0.90,
        boundingBox: { x: 0.54, y: 0.48, width: 0.08, height: 0.18 },
      },
      {
        id: 'det-sim-03-truck',
        type: 'HEMM' as const,
        label: '100T Rear Dumper (HEMM)',
        confidence: 0.96,
        boundingBox: { x: 0.58, y: 0.22, width: 0.38, height: 0.68 },
      },
    ],
  };
}

function generateSampleSceneSvg(title: string, subtitle: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="1000" height="600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#1e293b" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="0.5" opacity="0.4" />
      </pattern>
    </defs>
    <rect width="1000" height="600" fill="url(#bg)" />
    <rect width="1000" height="600" fill="url(#grid)" />
    <circle cx="500" cy="300" r="240" fill="#3b82f6" opacity="0.04" />
    <rect x="50" y="50" width="900" height="500" rx="8" fill="none" stroke="#475569" stroke-width="1.5" stroke-dasharray="6,6" />
    <rect x="70" y="70" width="860" height="50" rx="6" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" />
    <text x="90" y="102" fill="#fbbf24" font-family="monospace" font-size="16" font-weight="bold">DEMO / SIMULATION — NOT A REAL DETECTION SCENARIO</text>
    <text x="500" y="270" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="28" font-weight="600">${title}</text>
    <text x="500" y="315" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="16">${subtitle}</text>
    <rect x="350" y="370" width="300" height="42" rx="6" fill="#0f172a" stroke="#64748b" stroke-width="1" />
    <text x="500" y="396" text-anchor="middle" fill="#38bdf8" font-family="monospace" font-size="14">AI Safety Vision Pipeline Simulation</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export const visionAnalysisService = new VisionAnalysisService();

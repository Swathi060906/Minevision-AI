import { VisionDetection } from './VisionDetection';
import { SafetyObservation } from './SafetyObservation';
import { VisionEvidence } from './VisionEvidence';

export type VisionAnalysisStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'UNAVAILABLE';

export interface VisionAnalysis {
  id: string;
  mineId: string;
  inspectionId?: string;
  sourceType: 'IMAGE' | 'VIDEO';
  sourceFileName: string;
  fileSizeBytes?: number;
  status: VisionAnalysisStatus;
  provider: string; // e.g. 'Gemini Vision (Multimodal)' | 'Simulation Engine'
  model: string;    // e.g. 'gemini-3.8-flash'
  isDemoSimulation?: boolean;
  startedAt: string;
  completedAt?: string;
  detections: VisionDetection[];
  observations: SafetyObservation[];
  evidence: VisionEvidence[];
  zonesApplied: string[]; // zone IDs applied during spatial analysis
  error?: string;
  summary?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateVisionAnalysisInput {
  mineId: string;
  inspectionId?: string;
  sourceType: 'IMAGE' | 'VIDEO';
  sourceFileName: string;
  fileSizeBytes?: number;
  provider: string;
  model: string;
  isDemoSimulation?: boolean;
  createdBy: string;
}

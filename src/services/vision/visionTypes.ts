import { VisionDetection, DetectionType } from '../../data/models/VisionDetection';

export interface VisionProviderCapabilities {
  supportsImage: boolean;
  supportsVideo: boolean;
  supportedDetectionClasses: DetectionType[];
  maxImageSizeMB: number;
  providerName: string;
  modelName: string;
  isAvailable: boolean;
  statusMessage?: string;
}

export interface VisionAnalysisResult {
  detections: VisionDetection[];
  rawSummary?: string;
  sceneDescription?: string;
  processingTimeMs: number;
  isSimulatedDemo?: boolean;
}

export interface IComputerVisionProvider {
  getCapabilities(): Promise<VisionProviderCapabilities>;
  analyzeImage(params: {
    imageBase64: string;
    mimeType: string;
    fileName: string;
    options?: {
      targetClasses?: DetectionType[];
      minConfidence?: number;
    };
  }): Promise<VisionAnalysisResult>;
  analyzeVideoFrame?(params: {
    frameBase64: string;
    frameIndex: number;
    timestampSec: number;
    fileName: string;
  }): Promise<VisionAnalysisResult>;
}

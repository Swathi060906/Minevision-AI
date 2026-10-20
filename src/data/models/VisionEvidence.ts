export interface VisionEvidence {
  id: string;
  analysisId: string;
  mineId: string;
  inspectionId?: string;
  sourceType: 'IMAGE' | 'VIDEO_FRAME';
  fileName: string;
  frameNumber?: number;
  timestamp?: string;
  dataUrl?: string; // base64 preview or thumbnail
  detectionIds: string[];
  annotatedImageUrl?: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface CreateVisionEvidenceInput {
  analysisId: string;
  mineId: string;
  inspectionId?: string;
  sourceType: 'IMAGE' | 'VIDEO_FRAME';
  fileName: string;
  frameNumber?: number;
  timestamp?: string;
  dataUrl?: string;
  detectionIds: string[];
  annotatedImageUrl?: string;
  width?: number;
  height?: number;
}

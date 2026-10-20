export type DetectionType =
  | 'PERSON'
  | 'HARD_HAT'
  | 'SAFETY_VEST'
  | 'SAFETY_SHOE'
  | 'VEHICLE'
  | 'HEMM'
  | 'RESTRICTED_ZONE'
  | 'OTHER';

export interface BoundingBox {
  x: number;      // normalized 0.0 to 1.0 (left)
  y: number;      // normalized 0.0 to 1.0 (top)
  width: number;  // normalized 0.0 to 1.0
  height: number; // normalized 0.0 to 1.0
}

export interface VisionDetection {
  id: string;
  type: DetectionType;
  label: string;
  confidence: number; // 0.0 to 1.0
  boundingBox: BoundingBox;
  frameId?: string | number;
  timestamp?: number;
  color?: string;
  metadata?: {
    associatedPersonId?: string;
    isEstimated?: boolean;
    notes?: string;
  };
}

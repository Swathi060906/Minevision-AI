export type ObservationType =
  | 'MISSING_HARD_HAT'
  | 'MISSING_SAFETY_VEST'
  | 'MISSING_SAFETY_SHOES'
  | 'UNCERTAIN_PPE'
  | 'RESTRICTED_ZONE_INTRUSION'
  | 'VEHICLE_PERSON_PROXIMITY'
  | 'UNSAFE_EQUIPMENT_OPERATION'
  | 'UNAUTHORIZED_ENTRY'
  | 'HAZARDOUS_CONDITION';

export type ObservationStatus =
  | 'PROPOSED'
  | 'REVIEWED'
  | 'ACCEPTED'
  | 'REJECTED';

export interface SpatialDetails {
  distanceMetersEstimated?: number;
  thresholdMeters?: number;
  zoneName?: string;
  zoneId?: string;
  personDetectionId?: string;
  associatedPpeDetectionIds?: string[];
  vehicleDetectionId?: string;
}

export interface SafetyObservation {
  id: string;
  analysisId: string;
  mineId: string;
  inspectionId?: string;
  observationType: ObservationType;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number; // 0.0 to 1.0
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  detectionIds: string[];
  evidenceId: string;
  sourceFrame?: number | string;
  timestamp?: string;
  spatialDetails?: SpatialDetails;
  status: ObservationStatus;
  isSyntheticDemo?: boolean;
  proposedFindingId?: string; // Linked to Phase 5 proposal once grounded via RAG
  officialFindingId?: string; // Linked to Phase 3 finding once approved by officer/admin
  createdAt: string;
  updatedAt: string;
}

import { BoundingBox } from './VisionDetection';

export type ZoneType =
  | 'RESTRICTED'
  | 'NO_ENTRY'
  | 'VEHICLE_ONLY'
  | 'PEDESTRIAN_ONLY'
  | 'HAZARDOUS'
  | 'CUSTOM';

export interface ZonePoint {
  x: number; // normalized 0.0 to 1.0
  y: number; // normalized 0.0 to 1.0
}

export interface ZoneGeometry {
  type: 'RECTANGLE' | 'POLYGON';
  boundingBox?: BoundingBox;
  points?: ZonePoint[];
}

export interface ZoneDefinition {
  id: string;
  name: string;
  mineId: string;
  zoneType: ZoneType;
  geometry: ZoneGeometry;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  enabled: boolean;
  description?: string;
  color?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateZoneInput {
  name: string;
  mineId: string;
  zoneType: ZoneType;
  geometry: ZoneGeometry;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  enabled?: boolean;
  description?: string;
  color?: string;
  createdBy: string;
}

export interface UpdateZoneInput {
  name?: string;
  zoneType?: ZoneType;
  geometry?: ZoneGeometry;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  enabled?: boolean;
  description?: string;
  color?: string;
}

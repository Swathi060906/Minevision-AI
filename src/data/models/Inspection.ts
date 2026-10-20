import { RiskLevel, InspectionStatus } from '../../types';

export type InspectionType =
  | 'Safety Inspection'
  | 'Environmental'
  | 'Equipment'
  | 'PPE Compliance'
  | 'Ventilation & Air'
  | 'Statutory Audit'
  | 'Routine'
  | 'Special';

export interface Inspection {
  id: string;
  inspectionNumber?: string;
  mineId: string;
  mineName: string;
  inspectionType: InspectionType;
  inspectionDate?: string;
  scheduledDate?: string;
  inspectorId?: string;
  inspectorName?: string;
  status: InspectionStatus;
  overallComplianceScore?: number;
  riskLevel: RiskLevel;
  summary?: string;
  findingCount?: number;
  criticalFindingCount?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;

  // Compatibility aliases for Phase 1 components
  inspector?: string;
  complianceScore?: number;
  date?: string;
}

export interface CreateInspectionInput {
  mineId: string;
  mineName?: string;
  inspectionNumber?: string;
  inspectionType: InspectionType;
  scheduledDate: string;
  date?: string;
  inspectorId?: string;
  inspectorName?: string;
  inspector?: string;
  status?: InspectionStatus;
  notes?: string;
  summary?: string;
  complianceScore?: number;
  overallComplianceScore?: number;
  riskLevel?: RiskLevel;
}

export interface UpdateInspectionInput {
  status?: InspectionStatus;
  overallComplianceScore?: number;
  riskLevel?: RiskLevel;
  summary?: string;
  notes?: string;
  inspectionDate?: string;
  scheduledDate?: string;
  inspectorName?: string;
}

import { RiskLevel } from '../../types';

export type MineType = 'Open Cast' | 'Underground' | 'Mixed';

export type MineStatus = 'Operational' | 'Under Audit' | 'Notice Issued' | 'Suspended' | 'Inactive';

export function getNormalizedMineAliases(mineId: string): Set<string> {
  const ids = new Set<string>([mineId]);
  const numMatch = mineId.match(/(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    ids.add(`DEMO-MINE-${String(n).padStart(3, '0')}`);
    ids.add(`DEMO-MINE-${String(n).padStart(2, '0')}`);
    ids.add(`DEMO-MINE-${n}`);
    ids.add(`mine-${n}`);
    ids.add(`mine-${String(n).padStart(2, '0')}`);
    ids.add(`mine-${String(n).padStart(3, '0')}`);
  }
  return ids;
}

export interface Mine {
  id: string;
  mineCode?: string;
  name: string;
  operator: string;
  owner?: string;
  state: string;
  district: string;
  basin?: string;
  location: string;
  mineType?: MineType;
  status: MineStatus;
  latitude?: number;
  longitude?: number;
  registeredWorkforce?: number;
  currentWorkforce?: number;
  activePits: number;
  contactOfficer?: string;
  contactPhone?: string;
  registrationDate?: string;
  lastInspectionDate: string;
  nextInspectionDue?: string;
  complianceScore: number;
  riskLevel: RiskLevel;
  createdAt?: string;
  updatedAt?: string;

  // Compatibility aliases for Phase 1 components
  code?: string;
  type?: MineType;
  workforceCount?: number;
}

export interface CreateMineInput {
  mineCode: string;
  name: string;
  operator: string;
  owner?: string;
  state: string;
  district: string;
  basin: string;
  location?: string;
  mineType: MineType;
  status?: MineStatus;
  latitude?: number;
  longitude?: number;
  registeredWorkforce: number;
  currentWorkforce?: number;
  activePits?: number;
  contactOfficer?: string;
  contactPhone?: string;
  registrationDate?: string;
  nextInspectionDue?: string;
}

export interface UpdateMineInput {
  name?: string;
  operator?: string;
  owner?: string;
  state?: string;
  district?: string;
  basin?: string;
  location?: string;
  mineType?: MineType;
  status?: MineStatus;
  latitude?: number;
  longitude?: number;
  registeredWorkforce?: number;
  currentWorkforce?: number;
  activePits?: number;
  contactOfficer?: string;
  contactPhone?: string;
  nextInspectionDue?: string;
  complianceScore?: number;
  riskLevel?: RiskLevel;
  lastInspectionDate?: string;
}

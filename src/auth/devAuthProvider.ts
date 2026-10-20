import { AuthUser } from './authTypes';

export interface DevAccountRecord {
  user: AuthUser;
  // In development provider only (hashed or simulated in Phase 2, real auth in Phase 3)
  allowedPasswords: string[];
}

export const DEV_USERS: Record<string, DevAccountRecord> = {
  'admin@minevision.local': {
    user: {
      id: 'usr_dev_admin_001',
      name: 'System Administrator',
      email: 'admin@minevision.local',
      role: 'ADMIN',
      organization: 'National Coal Regulatory & Systems Authority',
      mineIds: [
        'DEMO-MINE-001',
        'DEMO-MINE-002',
        'DEMO-MINE-003',
        'DEMO-MINE-004',
        'DEMO-MINE-005',
        'DEMO-MINE-006',
        'DEMO-MINE-007',
        'DEMO-MINE-008',
      ],
      officerId: 'MV-SYS-ADMIN-01',
      department: 'Central Systems & Governance Directorate',
      avatarInitials: 'SA',
      avatarColor: 'bg-purple-600',
      accountStatus: 'Active',
    },
    allowedPasswords: ['admin123', 'password123', 'admin'],
  },
  'officer@minevision.local': {
    user: {
      id: 'usr_dev_officer_002',
      name: 'Compliance Officer',
      email: 'officer@minevision.local',
      role: 'OFFICER',
      organization: 'Directorate General of Mines Safety (DGMS)',
      mineIds: ['DEMO-MINE-001', 'DEMO-MINE-002', 'DEMO-MINE-004'],
      officerId: 'DGMS-NZ-4091',
      department: 'Zonal Colliery Safety & Ventilation Inspection',
      avatarInitials: 'CO',
      avatarColor: 'bg-amber-600',
      accountStatus: 'Active',
    },
    allowedPasswords: ['officer123', 'password123', 'officer'],
  },
  'operator@minevision.local': {
    user: {
      id: 'usr_dev_operator_003',
      name: 'Mine Operator',
      email: 'operator@minevision.local',
      role: 'OPERATOR',
      organization: 'Neyveli Lignite Mining Operations',
      mineIds: ['DEMO-MINE-001'],
      officerId: 'NL-PIT-OPER-09',
      department: 'Pit Head Operational Safety & Dispatch',
      avatarInitials: 'MO',
      avatarColor: 'bg-blue-600',
      accountStatus: 'Active',
    },
    allowedPasswords: ['operator123', 'password123', 'operator'],
  },
  // Compatibility alias for Phase 1 demo credentials
  'officer.sharma@coalnet.gov.in': {
    user: {
      id: 'usr_dev_officer_004',
      name: 'Compliance Officer',
      email: 'officer.sharma@coalnet.gov.in',
      role: 'OFFICER',
      organization: 'Directorate General of Mines Safety (DGMS)',
      mineIds: ['DEMO-MINE-001', 'DEMO-MINE-002'],
      officerId: 'DGMS-NZ-4091',
      department: 'Zonal Colliery Safety & Ventilation Inspection',
      avatarInitials: 'CO',
      avatarColor: 'bg-amber-600',
      accountStatus: 'Active',
    },
    allowedPasswords: ['••••••••••••', 'password123', 'officer123'],
  },
};

export function getDevUserList(): AuthUser[] {
  return [
    DEV_USERS['admin@minevision.local'].user,
    DEV_USERS['officer@minevision.local'].user,
    DEV_USERS['operator@minevision.local'].user,
  ];
}

import { UserRole } from '../../auth/authTypes';

export type UserAccountStatus = 'Active' | 'Under Review' | 'Suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  officerId?: string;
  department?: string;
  assignedMineIds: string[];
  status: UserAccountStatus;
  avatarInitials: string;
  avatarColor?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UpdateUserAssignmentsInput {
  userId: string;
  assignedMineIds: string[];
}

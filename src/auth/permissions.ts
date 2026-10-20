import { AppRoute } from '../types';
import { UserRole } from './authTypes';

export const ROUTE_PERMISSIONS: Record<AppRoute, UserRole[]> = {
  login: ['ADMIN', 'OFFICER', 'OPERATOR'],
  dashboard: ['ADMIN', 'OFFICER', 'OPERATOR'],
  mines: ['ADMIN', 'OFFICER', 'OPERATOR'],
  inspections: ['ADMIN', 'OFFICER', 'OPERATOR'],
  compliance: ['ADMIN', 'OFFICER', 'OPERATOR'],
  'ai-analysis': ['ADMIN', 'OFFICER'],
  'safety-vision': ['ADMIN', 'OFFICER'],
  'risk-intelligence': ['ADMIN', 'OFFICER', 'OPERATOR'],
  'predictive-intelligence': ['ADMIN', 'OFFICER', 'OPERATOR'],
  alerts: ['ADMIN', 'OFFICER'],
  reports: ['ADMIN', 'OFFICER', 'OPERATOR'],
  analytics: ['ADMIN', 'OFFICER'],
  administration: ['ADMIN'],
  settings: ['ADMIN', 'OFFICER', 'OPERATOR'],
};

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  ADMIN: 'System Administrator',
  OFFICER: 'Compliance Officer',
  OPERATOR: 'Mine Operator',
};

export const ROLE_SHORT_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  OFFICER: 'Compliance Officer',
  OPERATOR: 'Mine Operator',
};

export function hasRoutePermission(role: UserRole | undefined, route: AppRoute): boolean {
  if (!role) return false;
  const allowedRoles = ROUTE_PERMISSIONS[route];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

export function getRequiredRolesForRoute(route: AppRoute): UserRole[] {
  return ROUTE_PERMISSIONS[route] || [];
}

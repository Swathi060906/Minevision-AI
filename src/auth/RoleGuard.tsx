import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { AppRoute } from '../types';
import { hasRoutePermission } from './permissions';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { recordAuditEvent } from './authService';

interface RoleGuardProps {
  route: AppRoute;
  onNavigateHome: () => void;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  route,
  onNavigateHome,
  children,
}) => {
  const { user, role } = useAuth();

  const isAllowed = hasRoutePermission(role, route);

  useEffect(() => {
    if (!isAllowed && user) {
      recordAuditEvent(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        user.id,
        user.email,
        {
          attemptedRoute: route,
          userRole: role,
        }
      );
    }
  }, [isAllowed, user, role, route]);

  if (!isAllowed) {
    return (
      <UnauthorizedPage
        currentRole={role}
        attemptedRoute={route}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  return <>{children}</>;
};

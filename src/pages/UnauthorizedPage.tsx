import React from 'react';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { AppRoute } from '../types';
import { UserRole } from '../auth/authTypes';
import { ROLE_DISPLAY_NAMES, getRequiredRolesForRoute } from '../auth/permissions';

interface UnauthorizedPageProps {
  currentRole?: UserRole;
  attemptedRoute: AppRoute;
  onNavigateHome: () => void;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({
  currentRole,
  attemptedRoute,
  onNavigateHome,
}) => {
  const requiredRoles = getRequiredRolesForRoute(attemptedRoute);
  const requiredRoleLabel = requiredRoles
    .map((r) => ROLE_DISPLAY_NAMES[r] || r)
    .join(' or ');

  const currentRoleLabel = currentRole
    ? ROLE_DISPLAY_NAMES[currentRole] || currentRole
    : 'Unauthenticated User';

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md rounded-2xl border border-rose-900/60 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xs">
        {/* Shield Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-5">
          <ShieldAlert className="h-8 w-8" />
        </div>

        {/* Access Restricted Header */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-300 border border-rose-500/20 mb-3">
          <Lock className="h-3 w-3" />
          <span>Statutory RBAC Enforcement</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white">
          Access Restricted
        </h1>

        <p className="mt-2 text-xs text-slate-300 leading-relaxed">
          Your current role does not have permission to access this section.
        </p>

        {/* Role Comparison Details Box */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4 text-left text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">Current Role:</span>
            <span className="font-semibold text-amber-400">{currentRoleLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Required Role:</span>
            <span className="font-semibold text-rose-400">{requiredRoleLabel || 'Administrator'}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-2">
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 px-4 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm"
          >
            <Home className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

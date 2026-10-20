import React from 'react';
import {
  LayoutDashboard,
  Pickaxe,
  ClipboardList,
  ShieldCheck,
  BrainCircuit,
  Scan,
  Bell,
  FileText,
  BarChart3,
  ShieldAlert,
  TrendingUp,
  Settings,
  HelpCircle,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react';
import { AppRoute } from '../../types';
import { AuthUser } from '../../auth/authTypes';
import { hasRoutePermission, ROLE_DISPLAY_NAMES, ROLE_SHORT_LABELS } from '../../auth/permissions';

interface SidebarProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  user: AuthUser;
  onLogout: () => void;
  onOpenProfile?: () => void;
  onOpenDemoGuide?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onRouteChange,
  user,
  onLogout,
  onOpenProfile,
  onOpenDemoGuide,
  onCloseMobile,
}) => {
  interface NavItem {
    route: AppRoute;
    label: string;
    icon: any;
    badge?: string;
    alertCount?: number;
  }

  const allNavItems: NavItem[] = [
    { route: 'dashboard' as AppRoute, label: 'Dashboard', icon: LayoutDashboard },
    { route: 'mines' as AppRoute, label: 'Mines', icon: Pickaxe },
    { route: 'inspections' as AppRoute, label: 'Inspections', icon: ClipboardList },
    { route: 'compliance' as AppRoute, label: 'Compliance', icon: ShieldCheck },
    {
      route: 'ai-analysis' as AppRoute,
      label: 'AI Analysis',
      icon: BrainCircuit,
    },
    {
      route: 'safety-vision' as AppRoute,
      label: 'AI Safety Vision',
      icon: Scan,
    },
    {
      route: 'risk-intelligence' as AppRoute,
      label: 'Risk Intelligence',
      icon: ShieldAlert,
    },
    {
      route: 'predictive-intelligence' as AppRoute,
      label: 'Predictive Safety',
      icon: TrendingUp,
    },
    { route: 'alerts' as AppRoute, label: 'Alerts', icon: Bell, alertCount: 4 },
    { route: 'reports' as AppRoute, label: 'Reports', icon: FileText },
    { route: 'analytics' as AppRoute, label: 'Analytics', icon: BarChart3 },
  ];

  const allAdminNavItems = [
    { route: 'administration' as AppRoute, label: 'Administration', icon: ShieldAlert },
    { route: 'settings' as AppRoute, label: 'Settings', icon: Settings },
  ];

  // Role-based permission filtering
  const visibleNavItems = allNavItems.filter((item) =>
    hasRoutePermission(user.role, item.route)
  );

  const visibleAdminNavItems = allAdminNavItems.filter((item) =>
    hasRoutePermission(user.role, item.route)
  );

  const handleNavClick = (route: AppRoute) => {
    onRouteChange(route);
    onCloseMobile?.();
  };

  const roleLabel = ROLE_SHORT_LABELS[user.role] || user.role;

  return (
    <aside className="flex h-full w-64 flex-col bg-slate-950 border-r border-slate-800 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-slate-800/80">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Pickaxe className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-white">MineVision</span>
            <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-950">
              AI
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium truncate max-w-[145px]">
            Coal Compliance Platform
          </p>
        </div>
      </div>

      {/* Main Nav Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Primary Navigation Group */}
        <div>
          <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </span>
          <nav className="mt-2 space-y-1" aria-label="Main Navigation">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.route;

              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => handleNavClick(item.route)}
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30 shadow-xs'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 ${
                        isActive
                          ? 'text-amber-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300 border border-slate-700">
                      {item.badge}
                    </span>
                  )}

                  {item.alertCount && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                      {item.alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Administration / Preferences Group (if any permitted) */}
        {visibleAdminNavItems.length > 0 && (
          <div className="border-t border-slate-800/80 pt-4">
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {user.role === 'ADMIN' ? 'Administration' : 'System'}
            </span>
            <nav className="mt-2 space-y-1" aria-label="Administration Navigation">
              {visibleAdminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.route;

                return (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => handleNavClick(item.route)}
                    className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30 shadow-xs'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4 w-4 ${
                          isActive
                            ? 'text-amber-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer Area: Help & Current User */}
      <div className="border-t border-slate-800/90 bg-slate-950/90 p-3 space-y-3">
        {/* SIH 2026 Demo Suite & DGMS Regulations */}
        <button
          type="button"
          onClick={onOpenDemoGuide}
          className="flex w-full items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/25 px-2.5 py-2 text-xs text-amber-300 hover:bg-amber-500/20 transition-all font-medium group"
          title="Open SIH 2026 Demonstration Suite and Flagship Colliery Guide"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>SIH 2026 Demo Suite</span>
          </div>
          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/30">
            PS:26024
          </span>
        </button>

        {/* User Card */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 overflow-hidden text-left group hover:opacity-90 transition-opacity"
              title="View User Profile"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 font-semibold text-xs text-amber-300 border border-slate-700">
                {user.avatarInitials}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate group-hover:text-amber-300 transition-colors">
                  {user.name}
                </p>
                <span className="inline-block text-[10px] font-medium text-amber-400 truncate">
                  {roleLabel}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors ml-1 shrink-0"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

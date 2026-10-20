import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  Shield,
  X,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { AppRoute } from '../../types';
import { AuthUser } from '../../auth/authTypes';
import { ROLE_SHORT_LABELS } from '../../auth/permissions';
import { DEMO_ALERTS } from '../../data/demo/alerts';
import { getAlertDisplayText, getAlertMineName, getAlertDate } from '../../data/models/Alert';

interface HeaderProps {
  currentRoute: AppRoute;
  user: AuthUser;
  onOpenMobileMenu: () => void;
  onNavigate: (route: AppRoute) => void;
  onOpenProfile: () => void;
  onOpenDemoGuide?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  user,
  onOpenMobileMenu,
  onNavigate,
  onOpenProfile,
  onOpenDemoGuide,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const routeTitles: Record<AppRoute, { title: string; breadcrumb: string }> = {
    login: { title: 'Sign In', breadcrumb: 'Authentication' },
    dashboard: { title: 'Dashboard', breadcrumb: 'Compliance Overview' },
    mines: { title: 'Mines Directory', breadcrumb: 'Registered Collieries' },
    inspections: { title: 'Inspections', breadcrumb: 'Statutory Audits' },
    compliance: { title: 'Compliance Engine', breadcrumb: 'CMR 2017 Rules' },
    'ai-analysis': { title: 'AI Analysis', breadcrumb: 'Computer Vision & RAG' },
    'safety-vision': { title: 'AI Safety Vision', breadcrumb: 'Computer Vision & Zone Monitoring' },
    'risk-intelligence': { title: 'Risk Intelligence', breadcrumb: 'Explainable Multi-Factor Scoring' },
    'predictive-intelligence': { title: 'Predictive Intelligence', breadcrumb: 'Early Warning & Advisory Signals' },
    alerts: { title: 'Alerts & Anomalies', breadcrumb: 'Telemetry Triggers' },
    reports: { title: 'Reports', breadcrumb: 'DGMS Statutory Filings' },
    analytics: { title: 'Analytics', breadcrumb: 'Safety & Risk Trends' },
    administration: { title: 'Administration', breadcrumb: 'System Controls' },
    settings: { title: 'Settings', breadcrumb: 'User Preferences' },
  };

  const currentInfo = routeTitles[currentRoute] || { title: 'MineVision AI', breadcrumb: 'Portal' };
  const roleLabel = ROLE_SHORT_LABELS[user.role] || user.role;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 sm:px-6 backdrop-blur-xs">
        {/* Left: Hamburger (mobile) + Breadcrumb & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Open sidebar navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex flex-col">
            <nav className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <span>MineVision AI</span>
              <span>/</span>
              <span className="text-amber-400">{currentInfo.breadcrumb}</span>
            </nav>
            <span className="text-base font-bold text-white tracking-tight sm:text-lg">
              {currentInfo.title}
            </span>
          </div>
        </div>

        {/* Right: Quick Tools & Authenticated Identity */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* SIH 2026 Demo Suite Pill */}
          <button
            type="button"
            onClick={onOpenDemoGuide || (() => setShowHelpModal(true))}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all shadow-xs"
            title="Open Smart India Hackathon 2026 Guided Demo Suite (PS 26024)"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">SIH 2026 Demo</span>
            <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[10px] text-amber-200">PS:26024</span>
          </button>

          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200"
            title="Search database (Ctrl+K)"
            aria-label="Search"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span className="hidden md:inline">Search...</span>
            <kbd className="hidden md:inline rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 border border-slate-700 font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Notification Button & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Statutory Notifications
                    </span>
                  </div>
                  <span className="rounded bg-rose-950 px-1.5 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-800">
                    4 Action Req.
                  </span>
                </div>

                <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                  {DEMO_ALERTS.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        setShowNotifications(false);
                        onNavigate('alerts');
                      }}
                      className="cursor-pointer rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 hover:border-amber-500/40 hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-rose-400">{alert.severity}</span>
                        <span className="text-slate-400">{getAlertDate(alert)}</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-200 line-clamp-2">
                        {getAlertDisplayText(alert)}
                      </p>
                      <span className="mt-1 block text-[10px] text-slate-400 font-medium">
                        {getAlertMineName(alert)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 border-t border-slate-800 pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('alerts');
                    }}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300"
                  >
                    View All Active Alerts →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Help & Regulations Popover Trigger */}
          <button
            type="button"
            onClick={onOpenDemoGuide || (() => setShowHelpModal(true))}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
            title="Help & Problem Statement Details"
            aria-label="Help"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* User Menu Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-900 transition-colors text-left"
              title={`Logged in as ${roleLabel}`}
              aria-label="User menu"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                {user.avatarInitials}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-semibold text-slate-100 leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-amber-400 font-medium leading-tight">
                  {roleLabel}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="border-b border-slate-800 px-2.5 py-2">
                  <p className="text-xs font-bold text-white">{user.name}</p>
                  <p className="text-[11px] font-mono text-amber-400">{user.email}</p>
                  <span className="mt-1 inline-block text-[10px] text-slate-400">
                    {user.organization}
                  </span>
                </div>

                <div className="mt-1.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenProfile();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>Profile & Assigned Mines</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate('settings');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-slate-400" />
                    <span>Settings & Security</span>
                  </button>
                </div>

                <div className="mt-1.5 border-t border-slate-800 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-xs p-4 pt-20">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search mines, regulation codes, inspection IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-9 text-sm text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                Quick Navigation
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    onNavigate('mines');
                  }}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-left hover:border-amber-500/40 text-slate-200"
                >
                  <strong className="block text-white">Mines Directory</strong>
                  <span className="text-[11px] text-slate-400">24 registered coal sites</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    onNavigate('inspections');
                  }}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-left hover:border-amber-500/40 text-slate-200"
                >
                  <strong className="block text-white">Inspections</strong>
                  <span className="text-[11px] text-slate-400">18 active audit records</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    onNavigate('compliance');
                  }}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-left hover:border-amber-500/40 text-slate-200"
                >
                  <strong className="block text-white">Compliance Rules</strong>
                  <span className="text-[11px] text-slate-400">CMR 2017 & DGMS</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    onNavigate('alerts');
                  }}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-left hover:border-amber-500/40 text-slate-200"
                >
                  <strong className="block text-white">Critical Alerts</strong>
                  <span className="text-[11px] text-slate-400">Ventilation & PPE alerts</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  MineVision AI — Platform Brief
                </h3>
                <p className="text-xs text-amber-400 font-medium">
                  Smart India Hackathon • Problem ID: 26024
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">Problem Statement:</strong> AI-Based Smart Compliance Monitoring System for Coal Mines under the Smart Automation Theme.
              </p>
              <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-1.5">
                <span className="font-semibold text-slate-200 text-xs">Phase 2 Architecture Scope:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Authentication & Session Management with persistence</li>
                  <li>Role-Based Access Control (Admin, Officer, Operator)</li>
                  <li>Route Guards & Unauthorized Access Restrictor</li>
                  <li>User Profile & Mine Assignment mapping</li>
                </ul>
              </div>
              <p className="text-[11px] text-slate-400">
                Statutory guidelines mapped against Directorate General of Mines Safety (DGMS) circulars and Coal Mines Regulations 2017 (CMR 2017).
              </p>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

import React, { useState } from 'react';
import { User, Bell, Palette, Sliders, Shield, Save, CheckCircle2, Key, Clock, LogOut, MapPin } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { AuthUser } from '../auth/authTypes';
import { useAuth } from '../auth/AuthContext';
import { ROLE_DISPLAY_NAMES } from '../auth/permissions';
import { DEMO_MINES } from '../data/demo/mines';

interface SettingsPageProps {
  user: AuthUser;
  onLogout?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, onLogout }) => {
  const { session, logout } = useAuth();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [notificationsEmail, setNotificationsEmail] = useState(true);
  const [notificationsSms, setNotificationsSms] = useState(true);
  const [themeMode, setThemeMode] = useState('dark');
  const [statutoryAlertAudio, setStatutoryAlertAudio] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const assignedMines = DEMO_MINES.filter((m) => user.mineIds?.includes(m.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & System Preferences"
        subtitle="Manage user credentials, security session status, notifications, and display preferences."
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Section 1: User Profile */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              User Identity & Statutory Clearance
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Official Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Designation / Role</label>
              <input
                type="text"
                disabled
                value={ROLE_DISPLAY_NAMES[user.role]}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-slate-400 text-xs cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Officer / Staff ID Code</label>
              <input
                type="text"
                disabled
                value={user.officerId || 'SYS-DEFAULT-01'}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-slate-400 text-xs font-mono cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Session & Role-Based Access */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                Active Session & RBAC Clearance
              </h2>
            </div>
            <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800">
              Session Authenticated
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Active Role Level</span>
                <span className="font-semibold text-amber-400 mt-0.5 block">
                  {user.role} ({ROLE_DISPLAY_NAMES[user.role]})
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Session Expiration</span>
                <span className="font-mono text-slate-200 mt-0.5 block">
                  {session?.expiresAt ? new Date(session.expiresAt).toLocaleTimeString() : '8 Hours (Active)'}
                </span>
              </div>
            </div>

            {/* Assigned Mines */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[11px] mb-1.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-amber-400" />
                Assigned Collieries
              </span>
              {user.role === 'ADMIN' ? (
                <span className="text-slate-200 font-medium">All 24 Registered National Coal Mines</span>
              ) : assignedMines.length > 0 ? (
                <span className="text-slate-200 font-medium">
                  {assignedMines.map((m) => `${m.name} (${m.code})`).join(', ')}
                </span>
              ) : (
                <span className="text-slate-400">None assigned</span>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onLogout || logout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-900/80 bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out of Current Session</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Appearance & Theme */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Palette className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              Appearance & Contrast
            </h2>
          </div>

          <div className="text-xs space-y-3">
            <label className="block text-slate-300 font-medium">Platform Theme Profile</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setThemeMode('dark')}
                className={`cursor-pointer rounded-lg border p-3 flex items-center justify-between ${
                  themeMode === 'dark'
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div>
                  <span className="font-semibold block text-white">Industrial Charcoal (Default)</span>
                  <span className="text-[11px] text-slate-400">High contrast for control rooms and pit offices</span>
                </div>
                {themeMode === 'dark' && <CheckCircle2 className="h-4 w-4 text-amber-400" />}
              </div>

              <div
                onClick={() => setThemeMode('light')}
                className={`cursor-pointer rounded-lg border p-3 flex items-center justify-between ${
                  themeMode === 'light'
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div>
                  <span className="font-semibold block text-slate-200">High Contrast Neutral</span>
                  <span className="text-[11px] text-slate-400">Optimized for daylight mobile tablet inspection</span>
                </div>
                {themeMode === 'light' && <CheckCircle2 className="h-4 w-4 text-amber-400" />}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Statutory Notifications */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Bell className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              Regulatory Alerts & Notifications
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Critical Ventilation & Gas Surge Alerts</span>
                <span className="text-slate-400 text-[11px]">Instant dispatch when methane exceeds 0.75% volume</span>
              </div>
              <input
                type="checkbox"
                checked={notificationsEmail}
                onChange={(e) => setNotificationsEmail(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">SMS Incident Escalation to DGMS Zonal Director</span>
                <span className="text-slate-400 text-[11px]">Auto-SMS broadcast for high-risk notices</span>
              </div>
              <input
                type="checkbox"
                checked={notificationsSms}
                onChange={(e) => setNotificationsSms(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500"
              />
            </label>
          </div>
        </div>

        {/* Section 5: System Preferences */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              System & Telemetry Preferences
            </h2>
          </div>

          <div className="text-xs space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
              <div>
                <span className="font-semibold text-slate-200 block">Audible Telemetry Siren</span>
                <span className="text-slate-400 text-[11px]">Sound alert on control room dashboard during Critical events</span>
              </div>
              <input
                type="checkbox"
                checked={statutoryAlertAudio}
                onChange={(e) => setStatutoryAlertAudio(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500"
              />
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <span className="font-semibold text-slate-200 block">Data Refresh Polling Frequency</span>
                <span className="text-slate-400 text-[11px]">Operates on local session cache; live telemetry polling</span>
              </div>
              <span className="font-mono text-xs text-amber-400 font-semibold">60s (Mock)</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Preferences saved for current session</span>
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              Settings persist in memory for the Phase 2 demonstration.
            </span>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};

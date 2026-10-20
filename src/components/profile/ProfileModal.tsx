import React from 'react';
import { X, User, Shield, MapPin, Building, Key, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { AuthUser } from '../../auth/authTypes';
import { ROLE_DISPLAY_NAMES } from '../../auth/permissions';
import { DEMO_MINES } from '../../data/demo/mines';

interface ProfileModalProps {
  user: AuthUser;
  isOpen: boolean;
  onClose: () => void;
  onSwitchRole?: (role: 'ADMIN' | 'OFFICER' | 'OPERATOR') => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onSwitchRole,
}) => {
  if (!isOpen) return null;

  // Resolve assigned mine details from demo mines
  const assignedMines = DEMO_MINES.filter((m) => user.mineIds?.includes(m.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-base font-bold">
              {user.avatarInitials}
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-snug">
                {user.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold text-amber-400">
                  {ROLE_DISPLAY_NAMES[user.role]}
                </span>
                <span className="text-slate-500">•</span>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-300 border border-emerald-800">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {user.accountStatus}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-4 space-y-4 text-xs">
          {/* Organization & Identification Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Building className="h-3 w-3 text-slate-500" />
                Organization
              </span>
              <p className="mt-1 font-semibold text-slate-200 line-clamp-2">
                {user.organization}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Key className="h-3 w-3 text-slate-500" />
                Officer ID Code
              </span>
              <p className="mt-1 font-mono font-semibold text-amber-400">
                {user.officerId || 'SYS-DEFAULT-01'}
              </p>
            </div>
          </div>

          {/* Email & Department */}
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Email Address:</span>
              <span className="font-mono text-white">{user.email}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Department:</span>
              <span className="text-slate-200">{user.department || 'Statutory Monitoring'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Security Classification:</span>
              <span className="font-semibold text-amber-300">Statutory RBAC Level 2</span>
            </div>
          </div>

          {/* Assigned Mines Section */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                Assigned Colliery Jurisdiction
              </span>
              <span className="text-[10px] text-slate-400">
                {user.role === 'ADMIN'
                  ? 'National Fleet (24 Mines)'
                  : `${user.mineIds?.length || 0} Designated Site(s)`}
              </span>
            </div>

            {user.role === 'ADMIN' ? (
              <p className="text-[11px] text-slate-300">
                System Administrator holds global regulatory oversight across all 24 monitored collieries in Eastern, Central, and Southern basins.
              </p>
            ) : assignedMines.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {assignedMines.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">{m.name}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({m.code})</span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-medium">
                      {m.state}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Mine ID(s): {user.mineIds?.join(', ') || 'None specified'}
              </p>
            )}
          </div>

          {/* Dev Role Quick Switcher */}
          {onSwitchRole && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Phase 2 Quick Role Switcher (Evaluation Utility)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['ADMIN', 'OFFICER', 'OPERATOR'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      onSwitchRole(r);
                      onClose();
                    }}
                    className={`rounded-lg py-1.5 px-2 text-[11px] font-bold transition-all ${
                      user.role === r
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

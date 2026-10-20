import React from 'react';
import { Pickaxe, Shield } from 'lucide-react';

export const AuthLoadingScreen: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 text-slate-100 p-4 select-none">
      <div className="flex flex-col items-center max-w-sm text-center">
        {/* Animated Brand Icon */}
        <div className="relative mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse">
            <Pickaxe className="h-8 w-8" />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-amber-500/10 blur-sm pointer-events-none -z-10" />
        </div>

        {/* Brand Text */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-black tracking-tight text-white">MineVision</span>
          <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-slate-950">
            AI
          </span>
        </div>

        {/* Loading Message */}
        <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">
          Restoring secure session...
        </p>

        {/* Subtle Loading Bar */}
        <div className="mt-6 h-1 w-48 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full animate-[shimmer_1.5s_infinite]" style={{ width: '60%' }} />
        </div>

        <div className="mt-8 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Shield className="h-3.5 w-3.5 text-slate-600" />
          <span>Statutory Compliance Architecture • DGMS Standard</span>
        </div>
      </div>
    </div>
  );
};

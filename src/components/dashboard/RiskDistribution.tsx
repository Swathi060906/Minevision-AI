import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { RISK_DISTRIBUTION } from '../../data/demo/analytics';

export const RiskDistribution: React.FC = () => {
  const { critical, high, medium, low, total } = RISK_DISTRIBUTION;

  const criticalPct = Math.round((critical / total) * 100);
  const highPct = Math.round((high / total) * 100);
  const mediumPct = Math.round((medium / total) * 100);
  const lowPct = Math.round((low / total) * 100);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-rose-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Risk Distribution
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Total Findings: <strong className="text-slate-200">{total}</strong>
        </span>
      </div>

      {/* Multi-segment stacked bar */}
      <div className="mt-5">
        <div className="flex h-4 w-full overflow-hidden rounded-lg bg-slate-800 p-0.5 ring-1 ring-slate-800">
          <div
            style={{ width: `${criticalPct}%` }}
            className="bg-rose-500 rounded-l-md hover:opacity-90 transition-opacity"
            title={`Critical: ${critical} (${criticalPct}%)`}
          />
          <div
            style={{ width: `${highPct}%` }}
            className="bg-orange-500 hover:opacity-90 transition-opacity"
            title={`High: ${high} (${highPct}%)`}
          />
          <div
            style={{ width: `${mediumPct}%` }}
            className="bg-amber-500 hover:opacity-90 transition-opacity"
            title={`Medium: ${medium} (${mediumPct}%)`}
          />
          <div
            style={{ width: `${lowPct}%` }}
            className="bg-emerald-500 rounded-r-md hover:opacity-90 transition-opacity"
            title={`Low: ${low} (${lowPct}%)`}
          />
        </div>
      </div>

      {/* Detailed Risk Breakdown Items */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Critical */}
        <div className="rounded-lg border border-rose-900/60 bg-rose-950/20 p-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500 ring-2 ring-rose-500/30" />
            <span className="text-xs font-semibold text-rose-300">Critical</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-100">{critical}</span>
            <span className="text-[11px] text-rose-300/80 font-medium">{criticalPct}%</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-400/70 truncate">Mandatory DGMS action</p>
        </div>

        {/* High */}
        <div className="rounded-lg border border-orange-900/60 bg-orange-950/20 p-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-500 ring-2 ring-orange-500/30" />
            <span className="text-xs font-semibold text-orange-300">High</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-orange-100">{high}</span>
            <span className="text-[11px] text-orange-300/80 font-medium">{highPct}%</span>
          </div>
          <p className="mt-1 text-[11px] text-orange-400/70 truncate">Notice issued</p>
        </div>

        {/* Medium */}
        <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-500/30" />
            <span className="text-xs font-semibold text-amber-300">Medium</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-100">{medium}</span>
            <span className="text-[11px] text-amber-300/80 font-medium">{mediumPct}%</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-400/70 truncate">Under monitoring</p>
        </div>

        {/* Low */}
        <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
            <span className="text-xs font-semibold text-emerald-300">Low</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-100">{low}</span>
            <span className="text-[11px] text-emerald-300/80 font-medium">{lowPct}%</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-400/70 truncate">Standard operation</p>
        </div>
      </div>
    </div>
  );
};

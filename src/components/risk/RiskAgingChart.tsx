import React from 'react';
import { Clock, AlertTriangle, Calendar, CheckCircle2 } from 'lucide-react';
import { RiskAgingSummary } from '../../data/models/RiskIntelligence';

interface RiskAgingChartProps {
  aging: RiskAgingSummary;
}

export const RiskAgingChart: React.FC<RiskAgingChartProps> = ({ aging }) => {
  const totalFindings =
    aging.open0to7Days + aging.open8to30Days + aging.open31to90Days + aging.openOver90Days;

  const getPercent = (count: number) => {
    if (totalFindings === 0) return 0;
    return Math.round((count / totalFindings) * 100);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Unresolved Finding Aging & Statutory Timelines
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit findings categorized by duration since discovery and rectification deadlines
          </p>
        </div>
        {aging.totalOverdue > 0 ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30 shrink-0 self-start sm:self-auto">
            <AlertTriangle className="h-3.5 w-3.5" />
            {aging.totalOverdue} Overdue Actions
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 self-start sm:self-auto">
            <CheckCircle2 className="h-3.5 w-3.5" />
            All Actions on Schedule
          </span>
        )}
      </div>

      {/* Bracket Bar Visualization */}
      <div className="space-y-2">
        <div className="h-3 w-full bg-slate-800 rounded-full flex overflow-hidden">
          <div
            className="bg-emerald-500 transition-all"
            style={{ width: `${getPercent(aging.open0to7Days)}%` }}
            title={`0-7 Days: ${aging.open0to7Days} findings`}
          />
          <div
            className="bg-amber-500 transition-all"
            style={{ width: `${getPercent(aging.open8to30Days)}%` }}
            title={`8-30 Days: ${aging.open8to30Days} findings`}
          />
          <div
            className="bg-orange-500 transition-all"
            style={{ width: `${getPercent(aging.open31to90Days)}%` }}
            title={`31-90 Days: ${aging.open31to90Days} findings`}
          />
          <div
            className="bg-red-500 transition-all"
            style={{ width: `${getPercent(aging.openOver90Days)}%` }}
            title={`90+ Days: ${aging.openOver90Days} findings`}
          />
        </div>

        {/* Legend / Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>0–7 Days</span>
            </div>
            <div className="mt-1 text-xl font-bold text-white">{aging.open0to7Days}</div>
            <span className="text-[10px] text-slate-500">Fresh findings</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>8–30 Days</span>
            </div>
            <div className="mt-1 text-xl font-bold text-white">{aging.open8to30Days}</div>
            <span className="text-[10px] text-slate-500">Standard monitoring</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span>31–90 Days</span>
            </div>
            <div className="mt-1 text-xl font-bold text-white">{aging.open31to90Days}</div>
            <span className="text-[10px] text-slate-500">Elevated concern</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>90+ Days</span>
            </div>
            <div className="mt-1 text-xl font-bold text-white">{aging.openOver90Days}</div>
            <span className="text-[10px] text-slate-500">Chronic breach</span>
          </div>
        </div>
      </div>

      {/* Overdue Items List if any */}
      {aging.items.filter((i) => i.isOverdue).length > 0 && (
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="text-xs font-semibold text-red-400 uppercase tracking-wider">
            Critical Overdue Items Requiring Immediate Filing
          </div>
          <div className="space-y-1.5">
            {aging.items
              .filter((i) => i.isOverdue)
              .slice(0, 3)
              .map((item) => (
                <div
                  key={item.findingId}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-red-950/20 border border-red-500/20 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{item.title}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({item.findingId})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold">
                      {item.overdueDays} days overdue
                    </span>
                    <span className="text-slate-500 text-[11px]">Due: {item.dueDate}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

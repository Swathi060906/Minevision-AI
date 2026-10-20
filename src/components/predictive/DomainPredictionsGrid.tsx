import React from 'react';
import { Flame, Wind, Truck, HardHat, FileCheck, Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DomainPrediction } from '../../data/models/PredictiveIntelligence';

interface DomainPredictionsGridProps {
  domains: DomainPrediction[];
}

export const DomainPredictionsGrid: React.FC<DomainPredictionsGridProps> = ({ domains }) => {
  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case 'VENTILATION':
        return Wind;
      case 'EQUIPMENT':
        return Truck;
      case 'PPE':
        return HardHat;
      case 'DOCUMENTATION':
        return FileCheck;
      case 'ENVIRONMENT':
        return Flame;
      default:
        return Shield;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Statutory Domain Deterioration Matrix
          </h3>
        </div>
        <span className="text-xs text-slate-400">DGMS Category Tracking</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {domains.map((d) => {
          const Icon = getDomainIcon(d.domain);
          const isDeteriorating = d.trajectory === 'DETERIORATING';
          const isImproving = d.trajectory === 'IMPROVING';

          return (
            <div
              key={d.domain}
              className={`rounded-xl border p-4 transition-all ${
                isDeteriorating
                  ? 'border-rose-500/30 bg-rose-500/5'
                  : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-slate-800/90 text-amber-400 border border-slate-700">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{d.displayName}</h4>
                    <span className="text-[10px] text-slate-400">{d.domain}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isDeteriorating && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" /> +{d.scoreDelta}
                    </span>
                  )}
                  {isImproving && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5">
                      <TrendingDown className="h-3 w-3" /> {d.scoreDelta}
                    </span>
                  )}
                  {!isDeteriorating && !isImproving && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      STABLE
                    </span>
                  )}
                </div>
              </div>

              {/* Current vs Projected */}
              <div className="mt-3.5 grid grid-cols-2 gap-2 bg-slate-900/80 rounded-lg p-2.5 border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Current Risk</span>
                  <div className="text-base font-black text-white">{d.currentScore} / 100</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Projected (+30d)</span>
                  <div className={`text-base font-black ${isDeteriorating ? 'text-rose-400' : 'text-slate-300'}`}>
                    {d.projectedScore !== undefined ? `${d.projectedScore} / 100` : '—'}
                  </div>
                </div>
              </div>

              {/* Open vs Recurring */}
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Open issues: <strong className="text-white">{d.openIssuesCount}</strong>
                </span>
                {d.recurringCount > 0 && (
                  <span className="text-purple-300 font-semibold">
                    Recurring: {d.recurringCount} cycles
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { AlertTriangle, ShieldAlert, ArrowUpRight, RotateCcw, Clock, Flame, CheckCircle } from 'lucide-react';
import { PredictiveSignal } from '../../data/models/PredictiveIntelligence';

interface PredictiveSignalsListProps {
  signals: PredictiveSignal[];
  onOpenExplainability: () => void;
}

export const PredictiveSignalsList: React.FC<PredictiveSignalsListProps> = ({
  signals,
  onOpenExplainability,
}) => {
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'RECURRENCE':
        return RotateCcw;
      case 'CORRECTIVE_ACTION':
        return Clock;
      case 'DOMAIN_DETERIORATION':
        return Flame;
      case 'ALERT_PATTERN':
        return AlertTriangle;
      default:
        return ShieldAlert;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Active Early-Warning Deterioration Signals ({signals.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={onOpenExplainability}
          className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline underline-offset-2"
        >
          View Full Breakdown
        </button>
      </div>

      {signals.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
          No active deterioration warning signals detected. All monitoring factors are within baseline compliance parameters.
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((sig) => {
            const Icon = getSignalIcon(sig.type);

            return (
              <div
                key={sig.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-800/90 text-amber-400 border border-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">{sig.title}</h4>
                      <span className="text-[10px] text-slate-400">
                        Signal Type: <strong className="text-slate-300">{sig.type.replace('_', ' ')}</strong> | Horizon: {sig.horizon}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-xs font-black text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                      +{sig.scoreContribution} pts
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityBadge(sig.severity)} uppercase`}>
                      {sig.severity}
                    </span>
                  </div>
                </div>

                <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                  {sig.explanation}
                </p>

                {sig.sourceRefs.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">Grounded Evidence:</span>
                    <span className="truncate max-w-md">
                      {sig.sourceRefs.slice(0, 3).join(', ')}
                      {sig.sourceRefs.length > 3 ? ` (+${sig.sourceRefs.length - 3} more)` : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

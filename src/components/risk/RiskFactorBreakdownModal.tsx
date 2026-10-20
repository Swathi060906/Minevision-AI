import React from 'react';
import { X, Calculator, ShieldAlert, Layers, Clock, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { MineRiskProfile, RiskFactorContribution } from '../../data/models/RiskIntelligence';

interface RiskFactorBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MineRiskProfile;
}

export const RiskFactorBreakdownModal: React.FC<RiskFactorBreakdownModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  if (!isOpen) return null;

  const getFactorIcon = (factor: RiskFactorContribution['factor']) => {
    switch (factor) {
      case 'SEVERITY':
        return <ShieldAlert className="h-4 w-4 text-red-400" />;
      case 'RECURRENCE':
        return <Layers className="h-4 w-4 text-orange-400" />;
      case 'AGING':
        return <Clock className="h-4 w-4 text-amber-400" />;
      case 'ACTIVE_ALERTS':
        return <AlertTriangle className="h-4 w-4 text-rose-400" />;
      case 'COMPLIANCE_EXPOSURE':
        return <FileText className="h-4 w-4 text-cyan-400" />;
      default:
        return <Calculator className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Explainable Risk Score Audit Trail
              </h2>
              <p className="text-xs text-slate-400">
                Mathematical factor addition for {profile.mineName} ({profile.district})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Mathematical Formula Banner */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Deterministic Formula
            </div>
            <div className="mt-1 text-sm font-mono font-medium text-white flex flex-wrap items-center gap-2">
              <span className="font-bold text-amber-400">Total ({profile.overallScore})</span>
              <span>=</span>
              {profile.factors.map((f, idx) => (
                <span key={f.factor} className="inline-flex items-center">
                  <span className="text-slate-200">{f.label.split(' ')[0]}</span>
                  <span className="text-amber-400 ml-1 font-bold">(+{f.contributionPoints})</span>
                  {idx < profile.factors.length - 1 && <span className="text-slate-500 mx-1.5">+</span>}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-300">
              DGMS Colliery Safety Standard. Max normalized score is 100. AI vision and document proposals in pending review are strictly segregated and do not alter this score.
            </p>
          </div>

          {/* Factor Breakdown List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Factor-by-Factor Point Contributions
            </h3>

            {profile.factors.map((f) => {
              const fillPercent = Math.min(100, Math.round((f.contributionPoints / f.maxPossiblePoints) * 100));

              return (
                <div
                  key={f.factor}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {getFactorIcon(f.factor)}
                      <span className="text-sm font-bold text-white">{f.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-black text-amber-400">
                        +{f.contributionPoints}
                      </span>
                      <span className="text-xs text-slate-500">
                        / {f.maxPossiblePoints} max pts
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 ml-1 bg-slate-800 px-1.5 py-0.5 rounded">
                        {f.percentageOfTotal}% of total
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>

                  {/* Explanation & Source Records */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2 pt-1 border-t border-slate-800/60">
                    <span>{f.description}</span>
                    <span className="text-[11px] text-slate-500 shrink-0">
                      Based on {f.sourceCount} record(s)
                    </span>
                  </div>

                  {/* Underlying Record IDs if any */}
                  {f.sourceRecordIds.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-500 font-semibold">Evidence IDs:</span>
                      {f.sourceRecordIds.slice(0, 4).map((id) => (
                        <span
                          key={id}
                          className="font-mono text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded"
                        >
                          {id}
                        </span>
                      ))}
                      {f.sourceRecordIds.length > 4 && (
                        <span className="text-[10px] text-slate-500">
                          +{f.sourceRecordIds.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Audit Trail Verification Note */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">
                Statutory Verifiability Guarantee
              </span>
              <p>
                This calculation is fully reproducible, deterministic, and traceable to original field inspection reports, DGMS Form IV statutory filings, and calibrated telemetry streams.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4 bg-slate-950/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};

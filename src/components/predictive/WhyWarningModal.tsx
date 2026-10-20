import React, { useEffect } from 'react';
import { X, HelpCircle, ShieldAlert, CheckCircle, Info, Calculator } from 'lucide-react';
import { MinePrediction, EarlyWarningFactorContribution } from '../../data/models/PredictiveIntelligence';
import { recordAuditEvent } from '../../auth/authService';
import { useAuth } from '../../auth/AuthContext';

interface WhyWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  prediction: MinePrediction;
}

export const WhyWarningModal: React.FC<WhyWarningModalProps> = ({
  isOpen,
  onClose,
  prediction,
}) => {
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      recordAuditEvent('EARLY_WARNING_EXPLANATION_OPENED', user.id, user.email, {
        mineId: prediction.mineId,
        earlyWarningIndex: prediction.earlyWarningIndex,
      });
    }
  }, [isOpen, user, prediction.mineId, prediction.earlyWarningIndex]);

  if (!isOpen) return null;

  const totalPoints = prediction.factors.reduce((acc, f) => acc + f.contributionPoints, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Why Are We Warning You? (Explainable Scoring Model)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {prediction.mineName} — Early Warning Index Breakdown ({prediction.earlyWarningIndex} / 100)
              </p>
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

        {/* Explainability Formula Summary */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200/90 leading-relaxed space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Info className="h-4 w-4 text-amber-400" />
            Deterministic Component Contribution Breakdown (Max 100 Points)
          </div>
          <p>
            The Early Warning Index evaluates 5 independent deterioration factors to identify emerging safety and compliance vulnerabilities before formal statutory notices are triggered.
          </p>
        </div>

        {/* Factors Breakdown List */}
        <div className="space-y-3">
          {prediction.factors.map((factor) => {
            const pct = Math.round((factor.contributionPoints / factor.maxPossiblePoints) * 100);

            return (
              <div
                key={factor.factor}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{factor.label}</span>
                    <span className="text-[10px] text-slate-400">
                      (Max {factor.maxPossiblePoints} pts)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-400">
                      {factor.contributionPoints} / {factor.maxPossiblePoints} pts
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({factor.percentageOfTotal}% of total)
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct >= 70
                        ? 'bg-rose-500'
                        : pct >= 40
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="text-xs text-slate-300">{factor.description}</p>

                {factor.sourceRecordIds.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">Grounded Records: </span>
                    {factor.sourceRecordIds.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Total Calculated Score:{' '}
            <strong className="text-white text-sm">{prediction.earlyWarningIndex} / 100</strong> (Band: {prediction.earlyWarningBand})
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  Clock,
  Info,
  Layers,
} from 'lucide-react';
import { MinePrediction } from '../../data/models/PredictiveIntelligence';

interface EarlyWarningScoreCardProps {
  prediction: MinePrediction;
  onOpenExplainability: () => void;
}

export const EarlyWarningScoreCard: React.FC<EarlyWarningScoreCardProps> = ({
  prediction,
  onOpenExplainability,
}) => {
  const {
    mineName,
    officialCurrentRiskScore,
    officialRiskLevel,
    earlyWarningIndex,
    earlyWarningBand,
    trajectory,
    dataSufficiency,
    pendingAiProposalsCount,
  } = prediction;

  const bandStyles: Record<
    string,
    { bg: string; border: string; text: string; label: string }
  > = {
    LOW: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      label: 'LOW ADVISORY BAND (0-24)',
    },
    MODERATE: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      label: 'MODERATE ADVISORY BAND (25-49)',
    },
    ELEVATED: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      label: 'ELEVATED ADVISORY BAND (50-74)',
    },
    HIGH: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      label: 'HIGH ADVISORY BAND (75-100)',
    },
  };

  const currentBandStyle = bandStyles[earlyWarningBand] || bandStyles.LOW;

  const trajectoryStyles: Record<
    string,
    { icon: React.ComponentType<{ className?: string }>; text: string; bg: string; label: string }
  > = {
    IMPROVING: {
      icon: TrendingDown,
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/15 border-emerald-500/30',
      label: 'Improving Trajectory',
    },
    STABLE: {
      icon: Minus,
      text: 'text-slate-300',
      bg: 'bg-slate-800/60 border-slate-700',
      label: 'Stable Trajectory',
    },
    DETERIORATING: {
      icon: TrendingUp,
      text: 'text-amber-400',
      bg: 'bg-amber-500/15 border-amber-500/30',
      label: 'Deteriorating Trajectory',
    },
    RAPIDLY_DETERIORATING: {
      icon: TrendingUp,
      text: 'text-rose-400',
      bg: 'bg-rose-500/15 border-rose-500/30',
      label: 'Rapidly Deteriorating',
    },
    INSUFFICIENT_DATA: {
      icon: Info,
      text: 'text-slate-400',
      bg: 'bg-slate-800/60 border-slate-700',
      label: 'Insufficient Baseline',
    },
  };

  const TrajIcon = trajectoryStyles[trajectory]?.icon || Minus;
  const trajStyle = trajectoryStyles[trajectory] || trajectoryStyles.STABLE;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-xl space-y-4">
      {/* Prominent Statutory Disclaimer Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-amber-300 font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            <strong>Predictive Advisory Notice:</strong> Forward-looking early warning index is an operational advisory tool. Official statutory compliance risk remains the deterministic score.
          </span>
        </div>
        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200 border border-amber-500/30 uppercase tracking-wide">
          Advisory Layer
        </span>
      </div>

      {/* Side-by-side Risk & Early Warning Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Official Current Risk */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                Official Current Risk
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Authoritative Baseline
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">{officialCurrentRiskScore}</span>
              <span className="text-sm font-semibold text-slate-400">/ 100</span>
              <span className="ml-2 text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-800 text-amber-400 border border-amber-500/30">
                {officialRiskLevel} RISK
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Current deterministic multi-factor score derived from verified inspections, open non-compliances, and active alerts.
          </p>
        </div>

        {/* Right: Early Warning Index */}
        <div className={`rounded-xl border ${currentBandStyle.border} ${currentBandStyle.bg} p-4 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className={`h-4 w-4 ${currentBandStyle.text}`} />
                Early Warning Index
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentBandStyle.border} ${currentBandStyle.text} uppercase`}>
                {earlyWarningBand}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-4xl font-black ${currentBandStyle.text}`}>
                {dataSufficiency.isSufficient ? earlyWarningIndex : '—'}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ 100</span>
              <div className={`ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-semibold ${trajStyle.bg} ${trajStyle.text}`}>
                <TrajIcon className="h-3.5 w-3.5" />
                <span>{trajStyle.label}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Confidence: <strong className="text-white">{dataSufficiency.level}</strong> ({dataSufficiency.inspectionsCount} audits, {dataSufficiency.observationsCount} snapshots)
            </span>
            <button
              type="button"
              onClick={onOpenExplainability}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Why are we warning you?</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segregated Pending AI Advisory Notice */}
      {pendingAiProposalsCount > 0 && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 flex items-center justify-between text-xs text-purple-200">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-400 shrink-0" />
            <span>
              <strong>{pendingAiProposalsCount} Pending AI Finding Proposal(s)</strong> awaiting statutory officer review. These are quarantined and strictly excluded from both official risk and confirmed predictive models.
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
            Quarantined Evidence
          </span>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Clock,
  Flame,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { MinePrediction } from '../../data/models/PredictiveIntelligence';

interface PredictiveKpiCardsProps {
  predictions: MinePrediction[];
}

export const PredictiveKpiCards: React.FC<PredictiveKpiCardsProps> = ({ predictions }) => {
  // 1. Mines Under Early Warning (Early Warning Index >= 25 or deteriorating trajectory)
  const minesUnderWarning = predictions.filter(
    (p) =>
      p.dataSufficiency.isSufficient &&
      (p.earlyWarningIndex >= 25 ||
        p.trajectory === 'DETERIORATING' ||
        p.trajectory === 'RAPIDLY_DETERIORATING')
  ).length;

  // 2. Escalation Warnings (Count of high/critical trajectory signals)
  const escalationWarnings = predictions.reduce(
    (acc, p) =>
      acc +
      p.signals.filter(
        (s) =>
          (s.type === 'RISK_TRAJECTORY' || s.type === 'ESCALATION') &&
          (s.severity === 'CRITICAL' || s.severity === 'HIGH')
      ).length,
    0
  );

  // 3. Recurrence Warnings (Count of active recurrence signals)
  const recurrenceWarnings = predictions.reduce(
    (acc, p) => acc + p.signals.filter((s) => s.type === 'RECURRENCE').length,
    0
  );

  // 4. Corrective Action Risk (Count of corrective action delay signals)
  const correctiveActionRisk = predictions.reduce(
    (acc, p) => acc + p.signals.filter((s) => s.type === 'CORRECTIVE_ACTION').length,
    0
  );

  // 5. Deteriorating Domains (Count of unique domains showing worsening/deteriorating trajectory across mines)
  const deterioratingDomainsCount = predictions.reduce(
    (acc, p) => acc + p.domainPredictions.filter((d) => d.trajectory === 'DETERIORATING').length,
    0
  );

  // 6. Prediction Confidence (Aggregate confidence calculation)
  const confidenceLevels = predictions.map((p) => p.dataSufficiency.level);
  const highCount = confidenceLevels.filter((c) => c === 'HIGH').length;
  const medCount = confidenceLevels.filter((c) => c === 'MEDIUM').length;
  const aggregateConfidence =
    highCount >= predictions.length / 2
      ? 'HIGH'
      : highCount + medCount >= predictions.length / 2
      ? 'MEDIUM'
      : predictions.length > 0
      ? 'LOW'
      : 'INSUFFICIENT';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Mines Under Early Warning */}
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3.5 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-rose-300 truncate">Early Warning</span>
          <AlertTriangle className="h-4 w-4 text-rose-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-white">{minesUnderWarning}</span>
          <span className="text-[10px] text-slate-400">/ {predictions.length} mines</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-400 truncate">Collieries with active warning</p>
      </div>

      {/* 2. Escalation Warnings */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-amber-300 truncate">Escalation Warnings</span>
          <TrendingUp className="h-4 w-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-white">{escalationWarnings}</span>
          <span className="text-[10px] text-slate-400">active</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-400 truncate">Elevated trend velocity</p>
      </div>

      {/* 3. Recurrence Warnings */}
      <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3.5 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-purple-300 truncate">Recurrence Warnings</span>
          <RotateCcw className="h-4 w-4 text-purple-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-white">{recurrenceWarnings}</span>
          <span className="text-[10px] text-slate-400">patterns</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-400 truncate">Repeated violation trends</p>
      </div>

      {/* 4. Corrective Action Risk */}
      <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-3.5 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-orange-300 truncate">Remediation Delay</span>
          <Clock className="h-4 w-4 text-orange-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-white">{correctiveActionRisk}</span>
          <span className="text-[10px] text-slate-400">delayed</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-400 truncate">Overdue action plans</p>
      </div>

      {/* 5. Deteriorating Domains */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3.5 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-blue-300 truncate">Domain Drift</span>
          <Flame className="h-4 w-4 text-blue-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-white">{deterioratingDomainsCount}</span>
          <span className="text-[10px] text-slate-400">domains</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-400 truncate">Worsening sector indicators</p>
      </div>

      {/* 6. Forecast Confidence */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-emerald-300 truncate">Confidence</span>
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-xl font-black text-emerald-400">{aggregateConfidence}</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-400 truncate">Longitudinal data quality</p>
      </div>
    </div>
  );
};

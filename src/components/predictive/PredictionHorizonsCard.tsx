import React from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, HelpCircle, ShieldCheck } from 'lucide-react';
import {
  PredictiveHorizonProjection,
  PredictionConfidence,
} from '../../data/models/PredictiveIntelligence';

interface PredictionHorizonsCardProps {
  horizons: {
    sevenDay: PredictiveHorizonProjection;
    thirtyDay: PredictiveHorizonProjection;
    ninetyDay: PredictiveHorizonProjection;
  };
}

export const PredictionHorizonsCard: React.FC<PredictionHorizonsCardProps> = ({ horizons }) => {
  const items = [
    {
      title: '7-Day Tactical Outlook',
      horizon: horizons.sevenDay,
      recommendedScope: 'Immediate shift-level hazard mitigation & alert closure',
    },
    {
      title: '30-Day Operational Horizon',
      horizon: horizons.thirtyDay,
      recommendedScope: 'Monthly statutory compliance review & audit cycle',
    },
    {
      title: '90-Day Statutory Forecast',
      horizon: horizons.ninetyDay,
      recommendedScope: 'Quarterly DGMS Form IV reporting & long-term strata safety',
    },
  ];

  const getConfidenceBadge = (confidence: PredictionConfidence) => {
    switch (confidence) {
      case 'HIGH':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'LOW':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Forward Prediction Horizons (7d / 30d / 90d)
          </h3>
        </div>
        <span className="text-xs text-slate-400">Longitudinal Advisory Bounds</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {items.map(({ title, horizon, recommendedScope }) => {
          const isImproving = horizon.projectedDirection === 'IMPROVING';
          const isDeteriorating =
            horizon.projectedDirection === 'DETERIORATING' ||
            horizon.projectedDirection === 'RAPIDLY_DETERIORATING';

          return (
            <div
              key={horizon.horizon}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{title}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getConfidenceBadge(
                      horizon.confidence
                    )} uppercase`}
                  >
                    {horizon.confidence} CONFIDENCE
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">
                    {horizon.isAvailable && horizon.projectedScore !== undefined
                      ? `${horizon.projectedScore}/100`
                      : 'Unavailable'}
                  </span>

                  <div className="flex items-center gap-1 text-xs font-semibold">
                    {isImproving && (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <TrendingDown className="h-3.5 w-3.5" /> Improving
                      </span>
                    )}
                    {isDeteriorating && (
                      <span className="text-rose-400 flex items-center gap-0.5">
                        <TrendingUp className="h-3.5 w-3.5" /> Deteriorating
                      </span>
                    )}
                    {!isImproving && !isDeteriorating && (
                      <span className="text-slate-400 flex items-center gap-0.5">
                        <Minus className="h-3.5 w-3.5" /> {horizon.projectedDirection}
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-300 line-clamp-2">
                  {horizon.explanation}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] text-slate-400">
                <span className="font-semibold text-slate-300">Focus: </span>
                {recommendedScope}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ArrowRight,
  BookmarkCheck,
} from 'lucide-react';
import { InterventionRecommendation } from '../../data/models/PredictiveIntelligence';

interface InterventionsPanelProps {
  interventions: InterventionRecommendation[];
  mineName: string;
}

export const InterventionsPanel: React.FC<InterventionsPanelProps> = ({
  interventions,
  mineName,
}) => {
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  const handleToggleAcknowledge = (id: string) => {
    setAcknowledgedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Recommended Proactive Interventions ({interventions.length})
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Ranked by statutory urgency & deterioration momentum
        </span>
      </div>

      <div className="space-y-3.5">
        {interventions.map((rec) => {
          const isDone = acknowledgedIds.has(rec.id);

          return (
            <div
              key={rec.id}
              className={`rounded-xl border p-4 transition-all ${
                isDone
                  ? 'border-emerald-500/30 bg-emerald-500/5 opacity-85'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-amber-400 border border-slate-700">
                    {rec.rank}
                  </span>
                  <div>
                    <h4 className={`text-xs font-bold ${isDone ? 'text-emerald-300 line-through' : 'text-white'}`}>
                      {rec.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">Domain: {rec.domain}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getUrgencyBadge(
                      rec.urgency
                    )} uppercase`}
                  >
                    {rec.urgency} URGENCY
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleAcknowledge(rec.id)}
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <BookmarkCheck className="h-3.5 w-3.5" />
                    <span>{isDone ? 'Acknowledged' : 'Acknowledge'}</span>
                  </button>
                </div>
              </div>

              {/* Rationale */}
              <div className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                <strong className="text-slate-200">Deterioration Rationale: </strong>
                {rec.rationale}
              </div>

              {/* Recommended Proactive Action */}
              <div className="mt-2 rounded-lg bg-slate-900/90 p-2.5 border border-slate-800 text-xs text-amber-300/90 flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Field Directive: </strong>
                  {rec.recommendedAction}
                </div>
              </div>

              {/* Statutory Grounding (CMR 2017 or Manual Review) */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  <span>Statutory Grounding:</span>
                  <span
                    className={`font-semibold ${
                      rec.isStatutoryVerified ? 'text-amber-400' : 'text-slate-400 italic'
                    }`}
                  >
                    {rec.regulatoryReference || 'MANUAL REGULATORY REVIEW REQUIRED'}
                  </span>
                </div>

                {rec.isStatutoryVerified ? (
                  <span className="text-[10px] text-emerald-400 font-medium">
                    Verified DGMS Standard
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">
                    Review Required Prior to Statutory Enforcement
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

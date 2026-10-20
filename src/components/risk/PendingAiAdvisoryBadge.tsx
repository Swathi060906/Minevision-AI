import React from 'react';
import { Eye, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AppRoute } from '../../types';

interface PendingAiAdvisoryBadgeProps {
  count: number;
  onNavigateToReviews?: (route: AppRoute) => void;
}

export const PendingAiAdvisoryBadge: React.FC<PendingAiAdvisoryBadgeProps> = ({
  count,
  onNavigateToReviews,
}) => {
  if (count === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>All AI safety proposals reviewed. No unverified proposals pending officer sign-off.</span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">Official Audit Clean</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
          <Eye className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-amber-300">
              {count} Unreviewed AI Safety Proposal{count > 1 ? 's' : ''} Detected
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-amber-400 border border-amber-500/40 uppercase">
              Advisory Signal Only
            </span>
          </div>
          <p className="text-slate-300 mt-1 leading-relaxed">
            <strong>Pending review — not included in official risk score.</strong> Computer vision detections and document analysis extractions remain provisional until formally accepted by a compliance officer.
          </p>
        </div>
      </div>

      {onNavigateToReviews && (
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => onNavigateToReviews('safety-vision')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs transition-colors shadow-sm"
          >
            <span>Review Proposals</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

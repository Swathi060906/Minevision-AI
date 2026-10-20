import React from 'react';
import { ClipboardList, AlertOctagon, CheckSquare, ArrowRight } from 'lucide-react';
import { PriorityAttentionItem } from '../../data/models/RiskIntelligence';

interface PriorityAttentionPanelProps {
  items: PriorityAttentionItem[];
  onTakeAction?: (item: PriorityAttentionItem) => void;
}

export const PriorityAttentionPanel: React.FC<PriorityAttentionPanelProps> = ({
  items,
  onTakeAction,
}) => {
  const getUrgencyBadge = (urgency: PriorityAttentionItem['urgency']) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      default:
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-amber-400 shrink-0" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Priority Action Checklist (Where to Intervene First)
          </h3>
        </div>
        <span className="text-xs text-slate-400">DGMS Field Directive</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2 hover:border-slate-700 transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/30">
                  {item.rank}
                </span>
                <span className="text-sm font-bold text-white">{item.title}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getUrgencyBadge(
                  item.urgency
                )}`}
              >
                {item.urgency} PRIORITY
              </span>
            </div>

            {/* Justification / Why ranked here */}
            <div className="rounded-lg bg-slate-900/80 border border-slate-800/80 p-2.5 text-xs text-slate-300">
              <span className="font-semibold text-amber-400/90">Reason for Escalation: </span>
              <span>{item.reason}</span>
            </div>

            {/* Actionable Recommended Next Step */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckSquare className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 font-medium">Directive:</span>
                <span className="text-slate-400">{item.recommendedAction}</span>
              </div>

              {onTakeAction && (
                <button
                  type="button"
                  onClick={() => onTakeAction(item)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 self-end sm:self-auto shrink-0 transition-colors"
                >
                  <span>Execute</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

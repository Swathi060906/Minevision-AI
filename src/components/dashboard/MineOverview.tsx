import React from 'react';
import { Pickaxe, ArrowRight, MapPin, Calendar, Activity } from 'lucide-react';
import { Mine } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface MineOverviewProps {
  mines: Mine[];
  onNavigateToMines?: () => void;
  onSelectMine?: (mine: Mine) => void;
}

export const MineOverview: React.FC<MineOverviewProps> = ({
  mines,
  onNavigateToMines,
  onSelectMine,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Pickaxe className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Mine Overview
          </h2>
        </div>
        {onNavigateToMines && (
          <button
            type="button"
            onClick={onNavigateToMines}
            className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>All Mines Directory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {mines.slice(0, 4).map((mine) => (
          <div
            key={mine.id}
            className="group rounded-xl border border-slate-800 bg-slate-950/40 p-4 hover:border-slate-700 hover:bg-slate-800/40 transition-all duration-150 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-white group-hover:text-amber-300 transition-colors">
                    {mine.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span>{mine.state} • {mine.type}</span>
                  </div>
                </div>
                <StatusBadge type="risk" value={mine.riskLevel} size="sm" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-y border-slate-800/70 py-2.5 my-2">
                <div>
                  <span className="text-slate-400">Compliance:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-sm font-bold ${
                        mine.complianceScore >= 85
                          ? 'text-emerald-400'
                          : mine.complianceScore >= 75
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {mine.complianceScore}%
                    </span>
                    <span className="text-[10px] text-slate-400">DGMS Score</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Last inspection:</span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-slate-300">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span className="text-xs font-medium">{mine.lastInspectionDate}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 font-mono">
                {mine.code}
              </span>
              <button
                type="button"
                onClick={() => onSelectMine?.(mine)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all"
              >
                <span>View Mine</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

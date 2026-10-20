import React from 'react';
import { ShieldCheck, HardHat, Cog, Wind, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { CategoryRiskAnalysis } from '../../data/models/RiskIntelligence';
import { getRiskBandBadgeStyle, getTrendBadgeStyle } from '../../services/risk/riskConfig';

interface CategoryRiskHeatmapProps {
  categories: CategoryRiskAnalysis[];
  onSelectCategory?: (category: string) => void;
}

export const CategoryRiskHeatmap: React.FC<CategoryRiskHeatmapProps> = ({
  categories,
  onSelectCategory,
}) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat.toUpperCase()) {
      case 'PPE':
        return <HardHat className="h-4 w-4 text-amber-400" />;
      case 'EQUIPMENT':
        return <Cog className="h-4 w-4 text-orange-400" />;
      case 'VENTILATION':
        return <Wind className="h-4 w-4 text-cyan-400" />;
      case 'SAFETY':
        return <ShieldCheck className="h-4 w-4 text-red-400" />;
      case 'DOCUMENTATION':
        return <FileSpreadsheet className="h-4 w-4 text-emerald-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Statutory Domain Risk Heatmap
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Sector-by-sector risk distribution and recurrent pattern frequency
          </p>
        </div>
        <span className="text-xs text-slate-400 shrink-0">DGMS Code Classifications</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {categories.map((cat) => {
          const bandStyle = getRiskBandBadgeStyle(cat.riskLevel);
          const trendStyle = getTrendBadgeStyle(cat.trend);

          return (
            <div
              key={cat.category}
              onClick={() => onSelectCategory && onSelectCategory(cat.category)}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3 hover:border-slate-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    {getCategoryIcon(cat.category)}
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                    {cat.displayName}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bandStyle.bg} ${bandStyle.text} ${bandStyle.border}`}
                >
                  {cat.riskLevel}
                </span>
              </div>

              {/* Score bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Domain Risk Score</span>
                  <span className="font-bold text-white">{cat.score}/100</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800/60 text-center text-[11px]">
                <div className="bg-slate-900/60 p-1.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Open</span>
                  <span className="font-bold text-white">{cat.openIssuesCount}</span>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Critical</span>
                  <span className={`font-bold ${cat.criticalCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {cat.criticalCount}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Recurrent</span>
                  <span className={`font-bold ${cat.recurrenceCount > 0 ? 'text-orange-400' : 'text-slate-400'}`}>
                    {cat.recurrenceCount}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { CategorySummary } from '../../types';

interface ComplianceOverviewProps {
  score?: number;
  categories?: CategorySummary[];
}

export const ComplianceOverview: React.FC<ComplianceOverviewProps> = ({
  score: propScore,
  categories: propCategories,
}) => {
  const [overallScore, setOverallScore] = useState<number>(propScore ?? 82);
  const [categories, setCategories] = useState<CategorySummary[]>(propCategories ?? []);
  const [isLoading, setIsLoading] = useState(!propScore || !propCategories);

  useEffect(() => {
    if (propScore !== undefined && propCategories !== undefined) {
      setOverallScore(propScore);
      setCategories(propCategories);
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [sc, cats] = await Promise.all([
          dataService.getOverallComplianceScore(),
          dataService.getCategorySummaries(),
        ]);
        setOverallScore(sc);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load compliance overview from dataService', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [propScore, propCategories]);

  // SVG circular progress calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Overall Compliance
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Benchmark: 80% Min.
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center justify-center sm:flex-row sm:gap-6 py-1">
        {/* Donut Progress Visualizer */}
        <div className="relative flex items-center justify-center">
          <svg className="h-36 w-36 transform -rotate-90" viewBox="0 0 130 130">
            {/* Background ring */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-800"
              fill="transparent"
            />
            {/* Value progress ring */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="#f59e0b"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold tracking-tight text-white">
              {overallScore}%
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400">
              {overallScore >= 80 ? 'Compliant' : 'Warning'}
            </span>
          </div>
        </div>

        <div className="mt-4 sm:mt-0 text-center sm:text-left max-w-[200px]">
          <p className="text-xs text-slate-300 leading-relaxed">
            Composite regulatory health index calculated across statutory Coal Mines Regulations (CMR 2017).
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="text-xs">▲ +3.2%</span>
            <span className="text-slate-400">vs prev quarter</span>
          </div>
        </div>
      </div>

      {/* Categories Breakdown */}
      <div className="mt-6 space-y-3.5 border-t border-slate-800/80 pt-4">
        {categories.map((cat) => {
          const barColor =
            cat.score >= 90
              ? 'bg-emerald-500'
              : cat.score >= 80
              ? 'bg-amber-500'
              : cat.score >= 70
              ? 'bg-orange-500'
              : 'bg-rose-500';

          return (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">{cat.category}</span>
                <span className="font-semibold text-slate-100">{cat.score}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${cat.score}%` }}
                  role="progressbar"
                  aria-valuenow={cat.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${cat.category} compliance score`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

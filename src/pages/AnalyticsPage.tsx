import React from 'react';
import { BarChart3, TrendingUp, PieChart, Map, ShieldAlert, Award } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { CATEGORY_COMPLIANCE, REGIONAL_STATISTICS } from '../../src/data/demo/analytics';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance & Risk Analytics"
        subtitle="Cross-basin statistical modeling, regional compliance scores, and statutory trend analytics."
        badge="Analytics Engine"
      />

      {/* Regional Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {REGIONAL_STATISTICS.map((region) => (
          <div
            key={region.region}
            className="rounded-xl border border-slate-800 bg-slate-900/90 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 truncate">
                {region.region}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                region.risk === 'High' ? 'bg-orange-950 text-orange-300 border-orange-800' :
                region.risk === 'Medium' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}>
                {region.risk}
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">{region.compliance}%</span>
              <span className="text-xs text-slate-400">{region.mines} mines</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${region.compliance}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Category Benchmarking Matrix */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              Statutory Benchmark Comparison by Category
            </h2>
          </div>
          <span className="text-xs text-slate-400">Target: National DGMS Threshold</span>
        </div>

        <div className="mt-4 space-y-4">
          {CATEGORY_COMPLIANCE.map((cat) => {
            const meetsBenchmark = cat.score >= cat.benchmark;
            return (
              <div key={cat.category} className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{cat.category}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        meetsBenchmark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {meetsBenchmark ? 'Target Satisfied' : 'Below Benchmark'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{cat.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Actual</span>
                      <span className="text-lg font-bold text-amber-400">{cat.score}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Threshold</span>
                      <span className="text-lg font-semibold text-slate-300">{cat.benchmark}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 relative h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${cat.score}%` }}
                  />
                  {/* Benchmark needle */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                    style={{ left: `${cat.benchmark}%` }}
                    title={`Benchmark: ${cat.benchmark}%`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

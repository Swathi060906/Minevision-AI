import React, { useState } from 'react';
import {
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { MinePrediction } from '../../data/models/PredictiveIntelligence';

interface PredictiveMineComparisonTableProps {
  predictions: MinePrediction[];
  onSelectMine: (mineId: string) => void;
}

export const PredictiveMineComparisonTable: React.FC<PredictiveMineComparisonTableProps> = ({
  predictions,
  onSelectMine,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'earlyWarningIndex' | 'officialCurrentRiskScore'>('earlyWarningIndex');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'earlyWarningIndex' | 'officialCurrentRiskScore') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filtered = predictions.filter(
    (p) =>
      p.mineName.toLowerCase().includes(search.toLowerCase()) ||
      p.district.toLowerCase().includes(search.toLowerCase()) ||
      p.state.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];
    return sortOrder === 'desc' ? valB - valA : valA - valB;
  });

  const getBandBadge = (band: string) => {
    switch (band) {
      case 'HIGH':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'ELEVATED':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  const getTrajectoryIcon = (traj: string) => {
    switch (traj) {
      case 'RAPIDLY_DETERIORATING':
        return <TrendingUp className="h-3.5 w-3.5 text-rose-400" />;
      case 'DETERIORATING':
        return <TrendingUp className="h-3.5 w-3.5 text-amber-400" />;
      case 'IMPROVING':
        return <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />;
      default:
        return <Minus className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Cross-Colliery Predictive Comparison ({predictions.length} Mines)
          </h3>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mine, district..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Mine & Region</th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-white"
                onClick={() => handleSort('officialCurrentRiskScore')}
              >
                <div className="flex items-center gap-1">
                  <span>Current Risk (P7)</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-white"
                onClick={() => handleSort('earlyWarningIndex')}
              >
                <div className="flex items-center gap-1">
                  <span>Early Warning (P8)</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Trajectory</th>
              <th className="py-2.5 px-3">7d Outlook</th>
              <th className="py-2.5 px-3">30d Outlook</th>
              <th className="py-2.5 px-3">Confidence</th>
              <th className="py-2.5 px-3">Primary Warning Driver</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sorted.map((pred) => (
              <tr key={pred.mineId} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-bold text-white">{pred.mineName}</div>
                  <div className="text-[10px] text-slate-400">
                    {pred.district}, {pred.state}
                  </div>
                </td>
                <td className="py-3 px-3 font-semibold text-white">
                  {pred.officialCurrentRiskScore}/100
                  <span className="ml-1 text-[10px] text-slate-400">({pred.officialRiskLevel})</span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${getBandBadge(
                      pred.earlyWarningBand
                    )}`}
                  >
                    {pred.earlyWarningIndex}/100
                    <span className="text-[9px] uppercase">({pred.earlyWarningBand})</span>
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5 font-medium">
                    {getTrajectoryIcon(pred.trajectory)}
                    <span className="text-[11px] capitalize">{pred.trajectory.toLowerCase().replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="py-3 px-3 font-mono text-[11px]">
                  {pred.horizons.sevenDay.projectedScore !== undefined
                    ? `${pred.horizons.sevenDay.projectedScore}/100`
                    : '—'}
                </td>
                <td className="py-3 px-3 font-mono text-[11px]">
                  {pred.horizons.thirtyDay.projectedScore !== undefined
                    ? `${pred.horizons.thirtyDay.projectedScore}/100`
                    : '—'}
                </td>
                <td className="py-3 px-3">
                  <span className="text-[10px] font-semibold text-slate-300">
                    {pred.dataSufficiency.level}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                  {pred.drivers[0]?.title || 'Nominal monitoring'}
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectMine(pred.mineId)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold transition-colors"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

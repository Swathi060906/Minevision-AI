import React, { useState, useMemo } from 'react';
import {
  MineRiskProfile,
  RiskScoreBand,
} from '../../data/models/RiskIntelligence';
import { getRiskBandBadgeStyle, getTrendBadgeStyle } from '../../services/risk/riskConfig';
import { Search, ArrowUpDown, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RiskMatrixTableProps {
  profiles: MineRiskProfile[];
  onSelectMine: (mineId: string) => void;
  selectedMineId?: string;
}

type SortField = 'overallScore' | 'openCritical' | 'overdueActions' | 'activeAlerts' | 'mineName';

export const RiskMatrixTable: React.FC<RiskMatrixTableProps> = ({
  profiles,
  onSelectMine,
  selectedMineId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBand, setSelectedBand] = useState<RiskScoreBand | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<SortField>('overallScore');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredProfiles = useMemo(() => {
    return profiles
      .filter((p) => {
        const matchesSearch =
          p.mineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.mineCode && p.mineCode.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesBand = selectedBand === 'ALL' || p.riskLevel === selectedBand;
        return matchesSearch && matchesBand;
      })
      .sort((a, b) => {
        let valA: any = a[sortField as keyof MineRiskProfile];
        let valB: any = b[sortField as keyof MineRiskProfile];

        if (sortField === 'openCritical') {
          valA = a.counts.openCritical;
          valB = b.counts.openCritical;
        } else if (sortField === 'overdueActions') {
          valA = a.counts.overdueActions;
          valB = b.counts.overdueActions;
        } else if (sortField === 'activeAlerts') {
          valA = a.counts.activeAlerts;
          valB = b.counts.activeAlerts;
        }

        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      });
  }, [profiles, searchTerm, selectedBand, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
      {/* Controls Bar */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Colliery Risk Comparison Matrix
          </h3>
          <p className="text-xs text-slate-400">
            Cross-basin statutory risk index across {profiles.length} monitored collieries
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter colliery or basin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Band Filters */}
          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
            {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as Array<RiskScoreBand | 'ALL'>).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setSelectedBand(b)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  selectedBand === b
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 uppercase text-[11px] font-semibold text-slate-400 border-b border-slate-800">
            <tr>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-white"
                onClick={() => handleSort('mineName')}
              >
                <div className="flex items-center gap-1">
                  <span>Colliery</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-white text-center"
                onClick={() => handleSort('overallScore')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Risk Score</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-center">Status Band</th>
              <th className="py-3.5 px-4 text-center">Trend</th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-white text-center"
                onClick={() => handleSort('openCritical')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Open Critical</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-white text-center"
                onClick={() => handleSort('overdueActions')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Overdue</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-white text-center"
                onClick={() => handleSort('activeAlerts')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Alerts</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Primary Risk Driver</th>
              <th className="py-3.5 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredProfiles.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No collieries match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredProfiles.map((p) => {
                const bandStyle = getRiskBandBadgeStyle(p.riskLevel);
                const trendStyle = getTrendBadgeStyle(p.trend);
                const isSelected = p.mineId === selectedMineId;

                return (
                  <tr
                    key={p.mineId}
                    onClick={() => onSelectMine(p.mineId)}
                    className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-500/10' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{p.mineName}</div>
                      <div className="text-[11px] text-slate-400">
                        {p.mineType || 'Colliery'} • {p.district}, {p.state}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-base font-black text-white">
                        {p.hasSufficientData ? p.overallScore : '–'}
                      </span>
                      <span className="text-[10px] text-slate-500">/100</span>
                    </td>

                    {/* Band */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${bandStyle.bg} ${bandStyle.text} ${bandStyle.border}`}
                      >
                        <span className={`h-1 w-1 rounded-full ${bandStyle.dot}`} />
                        {p.riskLevel}
                      </span>
                    </td>

                    {/* Trend */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`font-semibold flex items-center justify-center gap-1 ${trendStyle.text}`}>
                        <span>{trendStyle.arrow}</span>
                        <span>{trendStyle.label}</span>
                      </span>
                    </td>

                    {/* Open Critical */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-semibold ${
                          p.counts.openCritical > 0 ? 'text-red-400 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {p.counts.openCritical}
                      </span>
                    </td>

                    {/* Overdue Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-semibold ${
                          p.counts.overdueActions > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {p.counts.overdueActions}
                      </span>
                    </td>

                    {/* Active Alerts */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-semibold ${
                          p.counts.activeAlerts > 0 ? 'text-orange-400 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {p.counts.activeAlerts}
                      </span>
                    </td>

                    {/* Primary Driver */}
                    <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-300 text-[11px]">
                      {p.drivers[0]?.title || 'No active high-risk drivers'}
                    </td>

                    {/* View Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMine(p.mineId);
                        }}
                        className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 transition-colors"
                        title="View detailed risk profile"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

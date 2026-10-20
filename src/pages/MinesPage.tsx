import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Pickaxe,
  MapPin,
  Building,
  Users,
  Eye,
  Plus,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { FilterButton } from '../components/common/FilterButton';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { Mine, CreateMineInput } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from '../auth/AuthContext';
import { MineDetailsView } from '../components/mines/MineDetailsView';
import { MineFormModal } from '../components/mines/MineFormModal';

interface MinesPageProps {
  selectedMineId?: string;
  onSelectMineId?: (mineId: string | null) => void;
  onNavigateToInspection?: (inspectionId: string) => void;
  onScheduleInspection?: (mineId: string) => void;
}

export const MinesPage: React.FC<MinesPageProps> = ({
  selectedMineId: propSelectedMineId,
  onSelectMineId: propOnSelectMineId,
  onNavigateToInspection,
  onScheduleInspection,
}) => {
  const { user, logAuditEvent } = useAuth();
  const [internalSelectedMineId, setInternalSelectedMineId] = useState<string | null>(null);
  const [mines, setMines] = useState<Mine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Determine active selected mine id
  const activeMineId = propSelectedMineId !== undefined ? propSelectedMineId : internalSelectedMineId;

  const handleSelectMine = (id: string | null) => {
    if (propOnSelectMineId) {
      propOnSelectMineId(id);
    } else {
      setInternalSelectedMineId(id);
    }
  };

  const loadMines = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dataService.getMines({
        role: user?.role,
        mineIds: user?.mineIds,
      });
      setMines(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch registered coal collieries');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMines();
  }, [loadMines]);

  const handleCreateMine = async (input: CreateMineInput) => {
    try {
      const created = await dataService.createMine(input);
      logAuditEvent('MINE_CREATED', {
        mineId: created.id,
        mineCode: created.code || created.mineCode,
        name: created.name,
        operator: created.operator,
      });
      await loadMines();
      handleSelectMine(created.id);
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Colliery registration failed.');
    }
  };

  const filteredMines = useMemo(() => {
    return mines.filter((mine) => {
      const searchTarget = `${mine.name} ${mine.code || mine.mineCode} ${mine.location} ${mine.state} ${mine.district} ${mine.basin || ''} ${mine.operator}`.toLowerCase();
      const matchesSearch = searchTarget.includes(search.toLowerCase());

      const matchesRisk =
        riskFilter === 'ALL' || mine.riskLevel.toUpperCase() === riskFilter.toUpperCase();
      const matchesType =
        typeFilter === 'ALL' || (mine.type || mine.mineType) === typeFilter;
      const matchesStatus =
        statusFilter === 'ALL' || mine.status === statusFilter;

      return matchesSearch && matchesRisk && matchesType && matchesStatus;
    });
  }, [mines, search, riskFilter, typeFilter, statusFilter]);

  const isAdmin = user?.role === 'ADMIN';

  // If a specific mine is selected, display the complete Mine Details view
  if (activeMineId) {
    return (
      <MineDetailsView
        mineId={activeMineId}
        onBack={() => handleSelectMine(null)}
        onNavigateToInspection={onNavigateToInspection}
        onScheduleInspection={onScheduleInspection}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mines Directory"
        subtitle="Registered coal mines under statutory compliance surveillance across national coalfields."
        badge={`${mines.length} Registered Units`}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadMines}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              title="Refresh colliery records"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Register Colliery</span>
              </button>
            )}
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by mine name, code, basin, state, or operator..."
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <FilterButton
            label="Risk Tier"
            selectedValue={riskFilter}
            onSelect={setRiskFilter}
            options={[
              { label: 'All Risks', value: 'ALL' },
              { label: 'Critical', value: 'CRITICAL' },
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Low', value: 'LOW' },
            ]}
          />

          <FilterButton
            label="Mine Type"
            selectedValue={typeFilter}
            onSelect={setTypeFilter}
            options={[
              { label: 'All Types', value: 'ALL' },
              { label: 'Open Cast', value: 'Open Cast' },
              { label: 'Underground', value: 'Underground' },
              { label: 'Mixed', value: 'Mixed' },
            ]}
          />

          <FilterButton
            label="Status"
            selectedValue={statusFilter}
            onSelect={setStatusFilter}
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Operational', value: 'Operational' },
              { label: 'Under Audit', value: 'Under Audit' },
              { label: 'Notice Issued', value: 'Notice Issued' },
              { label: 'Suspended', value: 'Suspended' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12">
          <LoadingState message="Fetching registered colliery records..." />
        </div>
      ) : error ? (
        <div className="py-12">
          <ErrorState message={error} onRetry={loadMines} />
        </div>
      ) : filteredMines.length === 0 ? (
        <EmptyState
          title="No coal mines found"
          description="There are no registered colliery records matching your active filters."
          onAction={() => {
            setSearch('');
            setRiskFilter('ALL');
            setTypeFilter('ALL');
            setStatusFilter('ALL');
          }}
        />
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Colliery Name & Code</th>
                  <th className="py-3 px-4 font-semibold">Basin / State</th>
                  <th className="py-3 px-4 font-semibold">Operating Agency</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Workforce</th>
                  <th className="py-3 px-4 font-semibold text-center">Compliance</th>
                  <th className="py-3 px-4 font-semibold text-center">Risk Tier</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMines.map((mine) => (
                  <tr
                    key={mine.id}
                    onClick={() => handleSelectMine(mine.id)}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {mine.name}
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {mine.code || mine.mineCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{mine.basin || mine.location}</div>
                      <span className="text-[11px] text-slate-400">{mine.district}, {mine.state}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {mine.operator}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium border border-slate-700">
                        {mine.type || mine.mineType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span>{(mine.registeredWorkforce || mine.workforceCount).toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{mine.activePits} active pits</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
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
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge type="risk" value={mine.riskLevel} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge type="mineStatus" value={mine.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectMine(mine.id);
                        }}
                        className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-slate-700 hover:text-amber-200 border border-slate-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Dossier</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Create Mine Modal */}
      {isCreateModalOpen && (
        <MineFormModal
          isOpen={isCreateModalOpen}
          mode="create"
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateMine}
        />
      )}
    </div>
  );
};

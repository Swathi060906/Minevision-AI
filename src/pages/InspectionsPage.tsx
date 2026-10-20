import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardList,
  Plus,
  Filter,
  Search,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { FilterButton } from '../components/common/FilterButton';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { Inspection } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from '../auth/AuthContext';
import { InspectionDetailsView } from '../components/inspections/InspectionDetailsView';
import { CreateInspectionModal } from '../components/inspections/CreateInspectionModal';

interface InspectionsPageProps {
  selectedInspectionId?: string;
  onSelectInspectionId?: (inspectionId: string | null) => void;
  onNavigateToMine?: (mineId: string) => void;
  onNavigateToAiAnalysis?: (inspectionId: string) => void;
  initialScheduleMineId?: string;
}

export const InspectionsPage: React.FC<InspectionsPageProps> = ({
  selectedInspectionId: propSelectedInspectionId,
  onSelectInspectionId: propOnSelectInspectionId,
  onNavigateToMine,
  onNavigateToAiAnalysis,
  initialScheduleMineId,
}) => {
  const { user } = useAuth();
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal
  const [showNewModal, setShowNewModal] = useState(!!initialScheduleMineId);
  const [targetMineIdForNew, setTargetMineIdForNew] = useState<string | undefined>(
    initialScheduleMineId
  );

  const activeInspectionId =
    propSelectedInspectionId !== undefined ? propSelectedInspectionId : internalSelectedId;

  const handleSelectInspection = (id: string | null) => {
    if (propOnSelectInspectionId) {
      propOnSelectInspectionId(id);
    } else {
      setInternalSelectedId(id);
    }
  };

  const loadInspections = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dataService.getInspections({
        role: user?.role,
        mineIds: user?.mineIds,
      });
      setInspections(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inspections records');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  const filteredInspections = useMemo(() => {
    return inspections.filter((ins) => {
      const target = `${ins.id} ${ins.inspectionNumber || ''} ${ins.mineName} ${ins.inspector} ${ins.inspectionType}`.toLowerCase();
      const matchesSearch = target.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || ins.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesType =
        typeFilter === 'ALL' || ins.inspectionType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [inspections, search, statusFilter, typeFilter]);

  const canCreate = user?.role === 'ADMIN' || user?.role === 'OFFICER';

  // If a specific inspection is selected, render the full Inspection Details View
  if (activeInspectionId) {
    return (
      <InspectionDetailsView
        inspectionId={activeInspectionId}
        onBack={() => handleSelectInspection(null)}
        onNavigateToMine={onNavigateToMine}
        onNavigateToAiAnalysis={onNavigateToAiAnalysis}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statutory Inspections"
        subtitle="DGMS statutory colliery audits, compliance verification, and field hazard findings."
        badge={`${inspections.length} Audit Dossiers`}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadInspections}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              title="Refresh audit records"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {canCreate && (
              <button
                type="button"
                onClick={() => {
                  setTargetMineIdForNew(undefined);
                  setShowNewModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Inspection</span>
              </button>
            )}
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by inspection number, mine, inspector, or type..."
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <FilterButton
            label="Audit Status"
            selectedValue={statusFilter}
            onSelect={setStatusFilter}
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Scheduled', value: 'Scheduled' },
              { label: 'In Progress', value: 'In Progress' },
              { label: 'Completed', value: 'Completed' },
              { label: 'Review Required', value: 'Review Required' },
            ]}
          />

          <FilterButton
            label="Inspection Type"
            selectedValue={typeFilter}
            onSelect={setTypeFilter}
            options={[
              { label: 'All Types', value: 'ALL' },
              { label: 'Safety Inspection', value: 'Safety Inspection' },
              { label: 'Ventilation & Air', value: 'Ventilation & Air' },
              { label: 'Environmental', value: 'Environmental' },
              { label: 'Equipment', value: 'Equipment' },
              { label: 'PPE Compliance', value: 'PPE Compliance' },
              { label: 'Statutory Audit', value: 'Statutory Audit' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12">
          <LoadingState message="Fetching statutory inspection records..." />
        </div>
      ) : error ? (
        <div className="py-12">
          <ErrorState message={error} onRetry={loadInspections} />
        </div>
      ) : filteredInspections.length === 0 ? (
        <EmptyState
          title="No inspection dossiers found"
          description="There are no statutory audit records matching your current filter criteria."
          onAction={() => {
            setSearch('');
            setStatusFilter('ALL');
            setTypeFilter('ALL');
          }}
        />
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Inspection No.</th>
                  <th className="py-3 px-4 font-semibold">Colliery</th>
                  <th className="py-3 px-4 font-semibold">Statutory Type</th>
                  <th className="py-3 px-4 font-semibold">Lead Inspector</th>
                  <th className="py-3 px-4 font-semibold">Audit Date</th>
                  <th className="py-3 px-4 font-semibold text-center">Score</th>
                  <th className="py-3 px-4 font-semibold text-center">Risk Tier</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInspections.map((ins) => (
                  <tr
                    key={ins.id}
                    onClick={() => handleSelectInspection(ins.id)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-amber-400 group-hover:text-amber-300">
                      {ins.inspectionNumber || ins.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {ins.mineName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {ins.inspectionType}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {ins.inspector}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {ins.date}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-sm font-bold ${
                          ins.complianceScore >= 85
                            ? 'text-emerald-400'
                            : ins.complianceScore >= 75
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {ins.complianceScore}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge type="risk" value={ins.riskLevel} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge type="inspection" value={ins.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectInspection(ins.id);
                        }}
                        className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-slate-700 hover:text-amber-200 border border-slate-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Open</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Inspection Modal */}
      {showNewModal && (
        <CreateInspectionModal
          isOpen={showNewModal}
          preselectedMineId={targetMineIdForNew}
          onClose={() => {
            setShowNewModal(false);
            setTargetMineIdForNew(undefined);
          }}
          onSuccess={async (newId) => {
            await loadInspections();
            handleSelectInspection(newId);
          }}
        />
      )}
    </div>
  );
};

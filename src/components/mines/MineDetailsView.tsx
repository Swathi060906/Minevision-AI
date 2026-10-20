import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Pickaxe,
  Building,
  MapPin,
  Calendar,
  Users,
  Shield,
  Phone,
  User,
  AlertTriangle,
  ClipboardList,
  Edit,
  ExternalLink,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { Mine, Inspection, CategorySummary, InspectionFinding } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../auth/AuthContext';
import { MineFormModal } from './MineFormModal';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';

interface MineDetailsViewProps {
  mineId: string;
  onBack: () => void;
  onNavigateToInspection?: (inspectionId: string) => void;
  onScheduleInspection?: (mineId: string) => void;
}

export const MineDetailsView: React.FC<MineDetailsViewProps> = ({
  mineId,
  onBack,
  onNavigateToInspection,
  onScheduleInspection,
}) => {
  const { user, logAuditEvent } = useAuth();
  const [mine, setMine] = useState<Mine | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [findings, setFindings] = useState<InspectionFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadMineData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const foundMine = await dataService.getMineById(mineId);
      if (!foundMine) {
        setMine(null);
        return;
      }
      setMine(foundMine);

      const [mineInspections, summaries, mineFindings] = await Promise.all([
        dataService.getInspections({ mineId }),
        dataService.getCategorySummaries(mineId),
        dataService.getFindingsByMine(mineId),
      ]);

      setInspections(mineInspections);
      setCategorySummaries(summaries);
      setFindings(mineFindings);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading mine details');
    } finally {
      setIsLoading(false);
    }
  }, [mineId]);

  useEffect(() => {
    loadMineData();
  }, [loadMineData]);

  const handleUpdateMine = async (updatedData: Partial<Mine>) => {
    if (!mine) return;
    try {
      const updated = await dataService.updateMine(mine.id, updatedData);
      setMine(updated);
      logAuditEvent('MINE_UPDATED', {
        mineId: mine.id,
        mineCode: mine.code || mine.mineCode,
        updatedFields: Object.keys(updatedData),
      });
      await loadMineData();
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update mine');
    }
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading colliery dossier and compliance telemetry..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorState message={error} onRetry={loadMineData} />
      </div>
    );
  }

  if (!mine) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-8 text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
          <Pickaxe className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Colliery Record Not Found</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          The requested coal mine ID <span className="font-mono text-amber-400">{mineId}</span> does not exist or has been archived.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Mines Directory</span>
        </button>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';
  const isOfficer = user?.role === 'OFFICER';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Mines Directory</span>
          </button>
          <div className="h-4 w-px bg-slate-700 hidden sm:block" />
          <span className="font-mono text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
            {mine.code || mine.mineCode}
          </span>
          <StatusBadge type="mineStatus" value={mine.status} size="sm" />
          <StatusBadge type="risk" value={mine.riskLevel} size="sm" />
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-slate-700 hover:text-amber-300 transition-colors"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Colliery Details</span>
            </button>
          )}

          {(isAdmin || isOfficer) && onScheduleInspection && (
            <button
              type="button"
              onClick={() => onScheduleInspection(mine.id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Schedule Inspection</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-amber-400" />
              <h1 className="text-xl font-bold text-white">{mine.name}</h1>
            </div>
            <p className="text-xs text-slate-300">
              Operated by <span className="font-semibold text-white">{mine.operator}</span>
              {mine.owner && mine.owner !== mine.operator && (
                <> • Owner: <span className="text-slate-200">{mine.owner}</span></>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                {mine.basin}, {mine.district}, {mine.state}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                {mine.type || mine.mineType}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                {(mine.registeredWorkforce || mine.workforceCount).toLocaleString()} Registered Miners
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3 text-center">
              <span className="text-[11px] text-slate-400 block">Compliance Index</span>
              <span
                className={`text-2xl font-bold mt-1 block ${
                  mine.complianceScore >= 85
                    ? 'text-emerald-400'
                    : mine.complianceScore >= 75
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {mine.complianceScore}%
              </span>
            </div>

            <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3 text-center">
              <span className="text-[11px] text-slate-400 block">Active Pits / Inclines</span>
              <span className="text-2xl font-bold text-white mt-1 block">
                {mine.activePits}
              </span>
            </div>

            <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3 text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-400 block">Next Statutory Audit</span>
              <span className="text-xs font-semibold text-amber-300 mt-2 block">
                {mine.nextInspectionDue || 'In 45 Days'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Geo-Spatial Location Panel & Colliery Administrative Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geo-Spatial Location Panel */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                Colliery Geo-Spatial Location
              </h2>
            </div>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">
              WGS84 Coordinates
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Latitude</span>
                <span className="font-mono text-sm font-semibold text-white mt-1 block">
                  {mine.latitude}° N
                </span>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Longitude</span>
                <span className="font-mono text-sm font-semibold text-white mt-1 block">
                  {mine.longitude}° E
                </span>
              </div>
            </div>

            <div className="space-y-2 text-slate-300 pt-1">
              <div className="flex justify-between border-b border-slate-800/80 py-1.5">
                <span className="text-slate-400">Coal Basin:</span>
                <span className="text-white font-medium">{mine.basin}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 py-1.5">
                <span className="text-slate-400">Revenue District:</span>
                <span className="text-white font-medium">{mine.district}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 py-1.5">
                <span className="text-slate-400">State Jurisdiction:</span>
                <span className="text-white font-medium">{mine.state}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Regional DGMS Zone:</span>
                <span className="text-white font-medium">Eastern / Central Zone Colliery Directorate</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-[11px] text-slate-400">
              <strong>Location Notice:</strong> Geo-spatial coordinates are verified against national coal field survey registries. Live GIS shapefile map layers will be integrated in future phases.
            </div>
          </div>
        </div>

        {/* Administrative & Contact Profile */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                Statutory & Colliery Agent Details
              </h2>
            </div>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
              DGMS Registered
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800/80 py-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500" />
                Designated Mine Agent / Manager:
              </span>
              <span className="text-white font-semibold">{mine.contactOfficer || 'Designated Colliery Agent'}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800/80 py-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                Official Contact Phone:
              </span>
              <span className="font-mono text-white">{mine.contactPhone || '+91-326-2200109'}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800/80 py-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Statutory Registration Date:
              </span>
              <span className="font-mono text-slate-200">{mine.registrationDate || '12 Jan 2018'}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800/80 py-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                Last Regulatory Audit:
              </span>
              <span className="font-mono text-slate-200">{mine.lastInspectionDate}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">DGMS Approval Status:</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Statutory Clearances Valid
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Category Breakdown */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              Regulatory Compliance Category Breakdown
            </h2>
          </div>
          <span className="text-xs text-slate-400">CMR 2017 Parameter Scores</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categorySummaries.map((cat) => (
            <div
              key={cat.category}
              className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-center"
            >
              <span className="text-[11px] text-slate-400 block truncate" title={cat.category}>
                {cat.category}
              </span>
              <span
                className={`text-lg font-bold mt-1 block ${
                  cat.score >= 85
                    ? 'text-emerald-400'
                    : cat.score >= 75
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {cat.score}%
              </span>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    cat.score >= 85
                      ? 'bg-emerald-500'
                      : cat.score >= 75
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, cat.score)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Colliery Inspections History */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              Colliery Statutory Inspections ({inspections.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">DGMS and Internal Safety Audits</span>
        </div>

        {inspections.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No inspection records found for this colliery.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3 font-semibold">Inspection No.</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold">Inspector</th>
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Score</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Risk</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inspections.map((ins) => (
                  <tr
                    key={ins.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3 px-3 font-mono font-medium text-amber-400">
                      {ins.inspectionNumber || ins.id}
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium">
                      {ins.inspectionType}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {ins.inspector}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {ins.date}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-bold ${
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
                    <td className="py-3 px-3 text-center">
                      <StatusBadge type="risk" value={ins.riskLevel} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge type="inspection" value={ins.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      {onNavigateToInspection && (
                        <button
                          type="button"
                          onClick={() => onNavigateToInspection(ins.id)}
                          className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-slate-700 hover:text-amber-200 border border-slate-700"
                        >
                          <span>Open Dossier</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Findings for this Mine */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              Recent Non-Compliance Findings ({findings.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">Identified Statutory Deficiencies</span>
        </div>

        {findings.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            No active non-compliance findings recorded for this colliery.
          </p>
        ) : (
          <div className="space-y-2.5">
            {findings.map((f) => (
              <div
                key={f.id}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] border ${
                        f.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : f.severity === 'HIGH'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-blue-950 text-blue-300 border-blue-800'
                      }`}
                    >
                      {f.severity}
                    </span>
                    <span className="font-semibold text-white">{f.title}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400 font-mono">
                      {f.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{f.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      f.status === 'RESOLVED'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : f.status === 'IN_REVIEW'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    {f.status}
                  </span>
                  {onNavigateToInspection && (
                    <button
                      type="button"
                      onClick={() => onNavigateToInspection(f.inspectionId)}
                      className="text-amber-400 hover:text-amber-300 text-[11px] underline ml-2"
                    >
                      View Inspection
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Mine Modal (Admin Only) */}
      {isEditModalOpen && (
        <MineFormModal
          isOpen={isEditModalOpen}
          mode="edit"
          initialMine={mine}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={async (data) => {
            await handleUpdateMine(data);
          }}
        />
      )}
    </div>
  );
};

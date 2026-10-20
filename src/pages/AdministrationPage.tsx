import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Users,
  Scale,
  FileSpreadsheet,
  Activity,
  Key,
  Lock,
  CheckCircle2,
  Shield,
  Database,
  RefreshCw,
  Edit3,
  X,
  Check,
  RotateCcw,
  Building2,
  HardHat,
  BookOpen,
  Sparkles,
  Plus,
  Edit,
  Archive,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { useAuth } from '../auth/AuthContext';
import { ROLE_DISPLAY_NAMES } from '../auth/permissions';
import { dataService, PersistenceMetadata } from '../services/dataService';
import { User } from '../data/models/User';
import { Mine, ComplianceKnowledge, VerificationStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { KnowledgeFormModal } from '../components/compliance/KnowledgeFormModal';

export const AdministrationPage: React.FC = () => {
  const { auditEvents, logAuditEvent, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [metadata, setMetadata] = useState<PersistenceMetadata | null>(null);
  const [knowledgeList, setKnowledgeList] = useState<ComplianceKnowledge[]>([]);
  const [knowledgeStats, setKnowledgeStats] = useState<{
    total: number;
    verified: number;
    needsReview: number;
    draft: number;
    active: number;
    archived: number;
    chunks: number;
  }>({
    total: 0,
    verified: 0,
    needsReview: 0,
    draft: 0,
    active: 0,
    archived: 0,
    chunks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedMineIds, setSelectedMineIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Knowledge form modal state
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [knowledgeModalMode, setKnowledgeModalMode] = useState<'create' | 'edit'>('create');
  const [editingKnowledge, setEditingKnowledge] = useState<ComplianceKnowledge | null>(null);

  const loadAdminData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usersData, minesData, metaData, kList, kStats] = await Promise.all([
        dataService.getUsers(),
        dataService.getMines(),
        dataService.getPersistenceMetadata(),
        dataService.getComplianceKnowledge(),
        dataService.getKnowledgeStats(),
      ]);
      setUsers(usersData);
      setMines(minesData);
      setMetadata(metaData);
      setKnowledgeList(kList);
      setKnowledgeStats(kStats);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setSelectedMineIds([...user.assignedMineIds]);
  };

  const handleToggleMine = (mineId: string) => {
    setSelectedMineIds((prev) =>
      prev.includes(mineId) ? prev.filter((id) => id !== mineId) : [...prev, mineId]
    );
  };

  const handleSelectAllMines = () => {
    setSelectedMineIds(mines.map((m) => m.id));
  };

  const handleDeselectAllMines = () => {
    setSelectedMineIds([]);
  };

  const handleSaveAssignments = async () => {
    if (!editingUser) return;
    try {
      setIsSaving(true);
      const updated = await dataService.updateUserAssignments(editingUser.id, selectedMineIds);
      logAuditEvent('USER_MINE_ASSIGNED', {
        userId: updated.id,
        userEmail: updated.email,
        assignedMineCount: selectedMineIds.length,
        assignedMineIds: selectedMineIds,
      });

      setSuccessMessage(
        `Updated mine assignments for ${updated.name} (${selectedMineIds.length} colliery site${selectedMineIds.length === 1 ? '' : 's'}). Changes are persisted locally.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);

      setEditingUser(null);
      await loadAdminData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update user mine assignments');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset all development storage to initial seed data? This will restore the 8 default colliery basins and seed inspections.'
      )
    ) {
      return;
    }

    try {
      setIsResetting(true);
      await dataService.resetDemoData();
      logAuditEvent('DEMO_DATA_RESET', {
        resetTime: new Date().toISOString(),
      });
      setSuccessMessage('Development seed data reinitialized successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadAdminData();
    } catch (err) {
      alert('Failed to reset demonstration data');
    } finally {
      setIsResetting(false);
    }
  };

  const handleOpenCreateKnowledge = () => {
    setEditingKnowledge(null);
    setKnowledgeModalMode('create');
    setIsKnowledgeModalOpen(true);
  };

  const handleOpenEditKnowledge = (k: ComplianceKnowledge) => {
    setEditingKnowledge(k);
    setKnowledgeModalMode('edit');
    setIsKnowledgeModalOpen(true);
  };

  const handleArchiveKnowledge = async (k: ComplianceKnowledge) => {
    if (!window.confirm(`Archive compliance knowledge "${k.title}"?`)) return;
    try {
      await dataService.archiveKnowledge(k.id);
      logAuditEvent('COMPLIANCE_KNOWLEDGE_ARCHIVED', {
        knowledgeId: k.id,
        title: k.title,
      });
      setSuccessMessage(`Archived "${k.title}".`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadAdminData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to archive');
    }
  };

  const handleVerificationChange = async (id: string, newStatus: VerificationStatus) => {
    try {
      const updated = await dataService.setKnowledgeVerification(id, newStatus, user?.email);
      logAuditEvent('COMPLIANCE_KNOWLEDGE_VERIFICATION_CHANGED', {
        knowledgeId: updated.id,
        title: updated.title,
        newStatus,
      });
      setSuccessMessage(`Verification status updated to ${newStatus} for "${updated.title}".`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadAdminData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update verification');
    }
  };

  const handleRebuildChunks = async () => {
    try {
      const count = await dataService.rebuildKnowledgeChunks();
      logAuditEvent('COMPLIANCE_CHUNKS_REBUILT', { count, timestamp: new Date().toISOString() });
      setSuccessMessage(`Rebuilt ${count} RAG chunks across all active compliance records.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadAdminData();
    } catch (err) {
      alert('Failed to rebuild chunks');
    }
  };

  const adminCards = [
    {
      title: 'Users & Role Management',
      description: 'Configure DGMS inspectors, colliery safety officers, and mine manager access roles with RBAC policies.',
      count: `${users.length} Active Dev Accounts`,
      icon: Users,
      badge: 'Phase 3: Persisted User Model',
      status: 'Ready for assignment',
    },
    {
      title: 'Compliance Knowledge & RAG Rules',
      description: 'Maintain statutory parameter boundaries, verified regulations, and deterministic retrieval chunks.',
      count: `${knowledgeList.length} Records • ${knowledgeStats.chunks} Chunks`,
      icon: BookOpen,
      badge: 'RAG Engine',
      status: `${knowledgeStats.verified} Verified Documents`,
    },
    {
      title: 'Statutory Audit Logs',
      description: 'Immutable cryptographically timestamped audit trail of all inspection submissions and alert acknowledgments.',
      count: `${auditEvents.length} Auth Events`,
      icon: FileSpreadsheet,
      badge: 'Phase 9: Full Audit Ledger',
      status: 'Ledger active',
    },
    {
      title: 'System & Edge Telemetry Health',
      description: 'Monitor IoT telemetry gateways, pithead edge compute servers, and camera streaming uptime.',
      count: '99.8% Gateway Uptime',
      icon: Activity,
      badge: 'System Monitoring',
      status: 'Operational',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration Console"
        subtitle="System governance, role-based access controls, compliance parameter configuration, and audit logging."
        badge="ADMIN Access Only"
        action={
          <button
            type="button"
            onClick={loadAdminData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh State</span>
          </button>
        }
      />

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs text-emerald-300 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Development Persistence Metadata Panel */}
      <div className="rounded-xl border border-amber-500/40 bg-slate-900/90 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide text-white uppercase flex items-center gap-2">
                Phase 3 Development Persistence Engine
                <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800">
                  Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Encapsulated Browser LocalStorage Adapter (Namespace: <code className="text-amber-300 font-mono">minevision_v3_*</code>)
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isResetting}
            onClick={handleResetDemoData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:border-rose-700 hover:text-rose-200 transition-colors disabled:opacity-50"
            title="Reset development database to seed state"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{isResetting ? 'Resetting...' : 'Reset Seed Data'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Persisted Mines</span>
            <span className="text-lg font-bold text-white mt-1 block">
              {metadata?.totalMines ?? mines.length} Sites
            </span>
          </div>
          <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Persisted Inspections</span>
            <span className="text-lg font-bold text-white mt-1 block">
              {metadata?.totalInspections ?? 0} Audits
            </span>
          </div>
          <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Active Alerts</span>
            <span className="text-lg font-bold text-white mt-1 block">
              {metadata?.totalAlerts ?? 0} Anomalies
            </span>
          </div>
          <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Development Users</span>
            <span className="text-lg font-bold text-white mt-1 block">
              {users.length} Personas
            </span>
          </div>
        </div>
      </div>

      {/* Admin Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mt-3">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-5 border-t border-slate-800 pt-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-400">{card.count}</span>
                <span className="text-slate-400">{card.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Users & Role Management Directory with Mine Assignment Action */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              Phase 3 Persisted Users & Colliery Mine Assignments
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Editable Development Directory
          </span>
        </div>

        <p className="text-xs text-slate-400">
          The following development user personas are persisted in local browser storage. Administrators can update mine assignments to test role-scoped filtering for Compliance Officers and Mine Operators. Changes persist across browser refreshes and apply immediately upon role switching.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3 font-semibold">User</th>
                <th className="py-2.5 px-3 font-semibold">Email</th>
                <th className="py-2.5 px-3 font-semibold">Role</th>
                <th className="py-2.5 px-3 font-semibold">Organization</th>
                <th className="py-2.5 px-3 font-semibold">Assigned Mines</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const assignedNames = u.assignedMineIds
                  .map((mId) => {
                    const found = mines.find((m) => m.id === mId || m.mineCode === mId);
                    return found ? found.name : mId;
                  })
                  .slice(0, 2);

                const remainingCount = u.assignedMineIds.length - 2;

                return (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full font-bold text-[11px] text-white border border-slate-700 ${
                            u.avatarColor || 'bg-slate-800'
                          }`}
                        >
                          {u.avatarInitials}
                        </div>
                        <div>
                          <span className="font-semibold text-white block">{u.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{u.officerId || u.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">
                      {u.email}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                            : u.role === 'OFFICER'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : 'bg-blue-950/80 text-blue-300 border-blue-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {u.organization}
                    </td>
                    <td className="py-3 px-3">
                      <div>
                        <span className="font-semibold text-amber-400 block">
                          {u.assignedMineIds.length} Mine{u.assignedMineIds.length === 1 ? '' : 's'}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                          {assignedNames.join(', ')}
                          {remainingCount > 0 ? ` +${remainingCount} more` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(u)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-slate-700 hover:text-amber-200 transition-colors"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Assign Mines</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mine Assignment Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Assign Colliery Mines — {editingUser.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Role: <span className="text-amber-400 font-semibold">{editingUser.role}</span> • Email:{' '}
                  <span className="font-mono text-slate-300">{editingUser.email}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-3 flex items-center justify-between border-b border-slate-800/80 text-xs">
              <span className="text-slate-300 font-medium">
                Authorized Mines ({selectedMineIds.length} of {mines.length} selected):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllMines}
                  className="text-amber-400 hover:underline text-[11px]"
                >
                  Select All
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAllMines}
                  className="text-slate-400 hover:underline text-[11px]"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="my-3 overflow-y-auto space-y-2 pr-1 flex-1">
              {mines.map((mine) => {
                const isSelected = selectedMineIds.includes(mine.id);
                return (
                  <label
                    key={mine.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500/60 bg-amber-500/10'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleMine(mine.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-white truncate">
                          {mine.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {mine.code || mine.mineCode}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                        <span>{mine.basin} Basin</span>
                        <span>•</span>
                        <span>{mine.state}</span>
                        <span>•</span>
                        <span className="text-amber-400/90">{mine.mineType || mine.type}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveAssignments}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Assignments'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Knowledge & RAG Governance Section (Phase 4) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2">
                <span>Compliance Knowledge Base & RAG Governance</span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                  RAG Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Statutory regulatory documents, verification statuses, and deterministic retrieval chunk index.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRebuildChunks}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              title="Re-run deterministic text chunker across all compliance documents"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Rebuild Chunks</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateKnowledge}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Document</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
            <span className="text-slate-400 block text-[11px]">Total Documents</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{knowledgeStats.total}</span>
          </div>
          <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
            <span className="text-emerald-400 block text-[11px]">Verified Safe Chunks</span>
            <span className="text-xl font-bold text-emerald-300 mt-0.5 block">{knowledgeStats.verified}</span>
          </div>
          <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
            <span className="text-amber-400 block text-[11px]">Needs Review (Gated)</span>
            <span className="text-xl font-bold text-amber-300 mt-0.5 block">{knowledgeStats.needsReview}</span>
          </div>
          <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
            <span className="text-slate-400 block text-[11px]">RAG Retrieval Nodes</span>
            <span className="text-xl font-bold text-amber-400 font-mono mt-0.5 block">{knowledgeStats.chunks}</span>
          </div>
        </div>

        {/* Knowledge Table */}
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 font-semibold">Reference</th>
                  <th className="py-2.5 px-3 font-semibold">Title & Category</th>
                  <th className="py-2.5 px-3 font-semibold">Verification Gate</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
                {knowledgeList.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                      {k.sourceReference}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-white block">{k.title}</span>
                      <span className="text-[11px] text-slate-400">{k.category} • {k.authority}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={k.verificationStatus}
                        onChange={(e) =>
                          handleVerificationChange(k.id, e.target.value as VerificationStatus)
                        }
                        className="rounded bg-slate-900 border border-slate-700 px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="VERIFIED">VERIFIED</option>
                        <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
                        <option value="UNVERIFIED">UNVERIFIED</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge type="knowledgeStatus" value={k.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditKnowledge(k)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Edit Document"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        {k.status !== 'ARCHIVED' && (
                          <button
                            type="button"
                            onClick={() => handleArchiveKnowledge(k)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                            title="Archive Document"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Authentication Audit Events Stream */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              Authentication & Security Audit Events (Session Log)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            {auditEvents.length} Captured Events
          </span>
        </div>

        {auditEvents.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            No authentication audit events recorded in the current session.
          </p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {auditEvents.slice(0, 8).map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/50 p-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      evt.action === 'LOGIN_SUCCESS'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : evt.action === 'LOGIN_FAILURE'
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : evt.action === 'USER_MINE_ASSIGNED'
                        ? 'bg-purple-950 text-purple-300 border-purple-800'
                        : evt.action === 'ALERT_ACKNOWLEDGED'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : evt.action === 'DEMO_DATA_RESET'
                        ? 'bg-blue-950 text-blue-300 border-blue-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {evt.action}
                  </span>
                  <span className="text-slate-300 font-medium">{evt.userEmail}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400 flex items-center gap-3">
        <Shield className="h-4 w-4 text-amber-400 shrink-0" />
        <span>
          Development Persistence Notice: Mine assignments and local records are stored in browser development persistence (<code className="text-slate-300 font-mono">minevision_v3_*</code>). Switching to an Officer or Operator persona will immediately scope visible mines, inspections, and alerts to these persisted assignments.
        </span>
      </div>

      {/* Admin Knowledge Create / Edit Modal */}
      <KnowledgeFormModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
        onSuccess={loadAdminData}
        initialKnowledge={editingKnowledge}
        mode={knowledgeModalMode}
      />
    </div>
  );
};

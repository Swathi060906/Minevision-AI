import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Sparkles,
  ShieldCheck,
  Search,
  Plus,
  Filter,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Clock,
  RefreshCw,
  Sliders,
  Archive,
  Eye,
  Check,
  Tag,
  LayoutGrid,
  List,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import {
  ComplianceKnowledge,
  CategorySummary,
  UserRole,
  VerificationStatus,
  KnowledgeStatus,
} from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from '../auth/AuthContext';
import { KnowledgeCard } from '../components/compliance/KnowledgeCard';
import { KnowledgeDetailModal } from '../components/compliance/KnowledgeDetailModal';
import { KnowledgeFormModal } from '../components/compliance/KnowledgeFormModal';
import { RagPlayground } from '../components/compliance/RagPlayground';
import { DEMO_COMPLIANCE_RULES } from '../data/demo/complianceRules';

export const CompliancePage: React.FC = () => {
  const { user, logAuditEvent } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Tabs
  const [activeTab, setActiveTab] = useState<'knowledge' | 'rag' | 'benchmarks'>('knowledge');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedVerification, setSelectedVerification] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMineType, setSelectedMineType] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Data states
  const [knowledgeList, setKnowledgeList] = useState<ComplianceKnowledge[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [overallScore, setOverallScore] = useState<number>(82);
  const [stats, setStats] = useState<{
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

  // Modals state
  const [selectedKnowledge, setSelectedKnowledge] = useState<ComplianceKnowledge | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingKnowledge, setEditingKnowledge] = useState<ComplianceKnowledge | null>(null);

  // RAG pre-fill query state
  const [ragInitialQuery, setRagInitialQuery] = useState<string>('');

  // Status Notification Message
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allKnowledge, summaries, score, kStats] = await Promise.all([
        dataService.getComplianceKnowledge({
          role: user?.role,
        }),
        dataService.getCategorySummaries(),
        dataService.getOverallComplianceScore(),
        dataService.getKnowledgeStats(),
      ]);

      setKnowledgeList(allKnowledge);
      setCategorySummaries(summaries);
      setOverallScore(score);
      setStats(kStats);
    } catch (err) {
      console.error('Failed to load compliance knowledge:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle RAG navigation from card or detail modal
  const handleTestInRag = (queryText: string) => {
    setRagInitialQuery(queryText);
    setActiveTab('rag');
  };

  // Admin Actions
  const handleOpenCreateModal = () => {
    setEditingKnowledge(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (k: ComplianceKnowledge) => {
    setEditingKnowledge(k);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleArchiveKnowledge = async (k: ComplianceKnowledge) => {
    if (!window.confirm(`Are you sure you want to archive "${k.title}"?`)) return;
    try {
      await dataService.archiveKnowledge(k.id);
      logAuditEvent('COMPLIANCE_KNOWLEDGE_ARCHIVED', {
        knowledgeId: k.id,
        title: k.title,
      });
      setActionNotice(`Archived knowledge document: ${k.title}`);
      setTimeout(() => setActionNotice(null), 4000);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to archive knowledge');
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
      setActionNotice(`Updated verification status for "${updated.title}" to ${newStatus}`);
      setTimeout(() => setActionNotice(null), 4000);
      if (selectedKnowledge && selectedKnowledge.id === id) {
        setSelectedKnowledge(updated);
      }
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to change verification status');
    }
  };

  const handleRebuildChunks = async () => {
    try {
      const totalRebuilt = await dataService.rebuildKnowledgeChunks();
      logAuditEvent('COMPLIANCE_CHUNKS_REBUILT', {
        totalRebuilt,
        timestamp: new Date().toISOString(),
      });
      setActionNotice(`Successfully rebuilt ${totalRebuilt} RAG retrieval chunks across all documents.`);
      setTimeout(() => setActionNotice(null), 4000);
      await loadData();
    } catch (err) {
      alert('Failed to rebuild chunks');
    }
  };

  // Filter knowledge records
  const filteredKnowledge = knowledgeList.filter((item) => {
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchShort = item.shortTitle?.toLowerCase().includes(q);
      const matchRef = item.sourceReference.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchAuth = item.authority.toLowerCase().includes(q);
      const matchContent = item.content.toLowerCase().includes(q);
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
      const matchKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
      if (
        !matchTitle &&
        !matchShort &&
        !matchRef &&
        !matchDesc &&
        !matchAuth &&
        !matchContent &&
        !matchTags &&
        !matchKeywords
      ) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }

    // Verification filter
    if (selectedVerification !== 'ALL' && item.verificationStatus !== selectedVerification) {
      return false;
    }

    // Status filter
    if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
      return false;
    }

    // Mine type filter
    if (selectedMineType !== 'ALL') {
      const matches = item.applicableMineTypes.some(
        (t) => t.toLowerCase() === selectedMineType.toLowerCase() || t === 'Mixed'
      );
      if (!matches) return false;
    }

    return true;
  });

  // Filtered CMR Rules for Benchmarks tab
  const filteredRules = DEMO_COMPLIANCE_RULES.filter((rule) => {
    const matchesSearch =
      rule.title.toLowerCase().includes(search.toLowerCase()) ||
      rule.code.toLowerCase().includes(search.toLowerCase()) ||
      rule.actReference.toLowerCase().includes(search.toLowerCase()) ||
      rule.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || rule.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Knowledge Base"
        subtitle="Verified regulatory and operational compliance knowledge for mine safety monitoring"
        badge="RAG Foundation"
        action={
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={handleRebuildChunks}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  title="Re-run deterministic text chunker across all compliance documents"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Rebuild Chunks</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Knowledge</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Action Notification */}
      {actionNotice && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs text-emerald-300 flex items-center gap-2.5 animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{actionNotice}</span>
        </div>
      )}

      {/* Synthetic Demonstration Notice Banner */}
      <div className="rounded-xl border border-amber-500/40 bg-slate-900/90 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Demonstration Data & Synthetic Regulatory Corpus
                </h3>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                  DEVELOPMENT SEED
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-300 leading-relaxed max-w-3xl">
                Knowledge records marked as <code className="text-amber-300 font-mono">[DEMO]</code> are synthetic demonstration representations developed specifically for testing the MineVision AI RAG retrieval pipeline and safety verification gates. They are <strong>not official gazetted regulatory texts</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('rag')}
            className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Launch Retrieval Test</span>
          </button>
        </div>
      </div>

      {/* Knowledge Repository Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
            DGMS Compliance
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">{overallScore}%</span>
            <span className="text-[10px] text-amber-400 font-medium">Persisted</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Total Knowledge</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{stats.total}</span>
            <span className="text-[10px] text-slate-500">Documents</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-2">Active regulatory scope</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-emerald-400">Verified Knowledge</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-300">{stats.verified}</span>
            <span className="text-[10px] text-emerald-500 font-mono">
              {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
            </span>
          </div>
          <span className="text-[10px] text-emerald-400/80 mt-2">Safe for RAG grounding</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-amber-400">Needs Review</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-300">{stats.needsReview}</span>
            <span className="text-[10px] text-amber-500">Gated</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-2">Pending verification</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">RAG Chunks</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{stats.chunks}</span>
            <span className="text-[10px] text-slate-500">Index</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-2">Parsed retrieval nodes</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Active Regulations</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{stats.active}</span>
            <span className="text-[10px] text-slate-500">Enforced</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-2">CMR 2017 & Guidelines</span>
        </div>
      </div>

      {/* Primary Section Tabs */}
      <div className="border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'knowledge'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Knowledge Base Repository ({filteredKnowledge.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rag')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'rag'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Compliance Retrieval Test (RAG Playground)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('benchmarks')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'benchmarks'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Statutory Benchmarks & Rules</span>
          </button>
        </div>

        {activeTab === 'knowledge' && (
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${
                viewMode === 'grid' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${
                viewMode === 'table' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Knowledge Base Repository */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          {/* Search & Comprehensive Filters Bar */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="flex-1">
                <SearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder="Search compliance knowledge by title, source reference, authority, keywords..."
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedVerification}
                  onChange={(e) => setSelectedVerification(e.target.value)}
                  className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="ALL">Verification: All</option>
                  <option value="VERIFIED">Verified Only</option>
                  <option value="NEEDS_REVIEW">Needs Review</option>
                  <option value="UNVERIFIED">Unverified</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="ALL">Status: All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="SUPERSEDED">Superseded</option>
                </select>

                <select
                  value={selectedMineType}
                  onChange={(e) => setSelectedMineType(e.target.value)}
                  className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="ALL">Mine Scope: All</option>
                  <option value="Underground">Underground</option>
                  <option value="Open Cast">Open Cast</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Categories:</span>
              {[
                'ALL',
                'Mine Safety',
                'Ventilation',
                'Occupational Health',
                'Electrical Safety',
                'Explosives & Blasting',
                'Emergency Preparedness',
                'Personal Protective Equipment',
                'Environmental Compliance',
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Records Display (Grid or Table) */}
          {isLoading ? (
            <LoadingState message="Loading compliance knowledge base..." />
          ) : filteredKnowledge.length === 0 ? (
            <EmptyState
              title="No compliance knowledge found"
              description="No documents match your current query or filter criteria. Try adjusting the search term or switching filter options."
              actionLabel={search || selectedCategory !== 'ALL' ? 'Clear Filters' : undefined}
              onAction={() => {
                setSearch('');
                setSelectedCategory('ALL');
                setSelectedVerification('ALL');
                setSelectedStatus('ALL');
                setSelectedMineType('ALL');
              }}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredKnowledge.map((k) => (
                <KnowledgeCard
                  key={k.id}
                  knowledge={k}
                  userRole={user?.role}
                  onSelect={(item) => {
                    setSelectedKnowledge(item);
                    setIsDetailOpen(true);
                  }}
                  onTestRag={handleTestInRag}
                  onEdit={handleOpenEditModal}
                  onArchive={handleArchiveKnowledge}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 font-semibold">Reference</th>
                      <th className="py-3 px-4 font-semibold">Title & Category</th>
                      <th className="py-3 px-4 font-semibold">Authority</th>
                      <th className="py-3 px-4 font-semibold">Scope</th>
                      <th className="py-3 px-4 font-semibold">Verification</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredKnowledge.map((k) => (
                      <tr key={k.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          {k.sourceReference}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedKnowledge(k);
                              setIsDetailOpen(true);
                            }}
                            className="font-bold text-white hover:text-amber-400 text-left block"
                          >
                            {k.title}
                          </button>
                          <span className="text-[11px] text-slate-400">{k.category}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <span className="truncate block max-w-xs">{k.authority}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] text-slate-400">
                            {k.applicableMineTypes.join(', ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge type="verification" value={k.verificationStatus} size="sm" />
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge type="knowledgeStatus" value={k.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedKnowledge(k);
                                setIsDetailOpen(true);
                              }}
                              className="rounded bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 text-[11px] font-semibold"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTestInRag(k.keywords[0] || k.title)}
                              className="rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 text-[11px] font-semibold"
                            >
                              RAG
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Retrieval Test (RAG Playground) */}
      {activeTab === 'rag' && (
        <RagPlayground
          userRole={user?.role}
          initialQuery={ragInitialQuery}
          onOpenKnowledgeDetail={(id) => {
            dataService.getKnowledgeById(id).then((k) => {
              if (k) {
                setSelectedKnowledge(k);
                setIsDetailOpen(true);
              }
            });
          }}
        />
      )}

      {/* Tab 3: Statutory Benchmarks & Category Rules (Phase 1 & Phase 3 Preserved) */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-6">
          {/* Persisted Category Benchmark Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categorySummaries.map((cat) => (
              <div
                key={cat.category}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 flex flex-col justify-between"
              >
                <span className="text-[11px] font-medium text-slate-400 truncate" title={cat.category}>
                  {cat.category}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-bold text-white">{cat.score}%</span>
                  <span className="text-[10px] text-slate-500">BM {cat.benchmark}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      cat.score >= cat.benchmark ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(cat.score, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Statutory Rule Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {rule.code}
                      </span>
                      <h3 className="text-base font-semibold text-white mt-0.5">
                        {rule.title}
                      </h3>
                    </div>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
                      {rule.criticality}
                    </span>
                  </div>

                  <span className="mt-1 block text-xs text-slate-400">
                    {rule.actReference}
                  </span>

                  <p className="mt-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-2.5">
                    {rule.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span>Audit: {rule.frequency}</span>
                  </span>
                  <span className="text-[11px] font-medium text-amber-400/90">
                    Statutory Rule Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <KnowledgeDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        knowledge={selectedKnowledge}
        userRole={user?.role}
        onUseInRag={handleTestInRag}
        onVerificationChange={handleVerificationChange}
      />

      {/* Admin Create / Edit Modal */}
      {isAdmin && (
        <KnowledgeFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={loadData}
          initialKnowledge={editingKnowledge}
          mode={formMode}
        />
      )}
    </div>
  );
};

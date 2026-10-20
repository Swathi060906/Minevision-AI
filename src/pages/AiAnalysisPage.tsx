import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Inbox,
  History,
  Shield,
  Layers,
  FileSpreadsheet,
  Eye,
  Cpu,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { useAuth } from '../auth/AuthContext';
import { dataService } from '../services/dataService';
import { DocumentAnalysis } from '../data/models/DocumentAnalysis';
import { ProposedFinding } from '../data/models/ProposedFinding';
import { Inspection } from '../data/models/Inspection';
import { Mine } from '../data/models/Mine';
import { InspectionFinding } from '../data/models/InspectionFinding';
import { AnalysisWorkspace } from '../components/ai/AnalysisWorkspace';
import { GlobalReviewQueueView } from '../components/ai/GlobalReviewQueueView';
import { AnalysisHistoryView } from '../components/ai/AnalysisHistoryView';
import { EditProposalModal } from '../components/ai/EditProposalModal';
import { RejectProposalModal } from '../components/ai/RejectProposalModal';
import { ExplainabilityModal } from '../components/ai/ExplainabilityModal';
import { EditAndAcceptProposalInput } from '../data/models/ProposedFinding';
import { AiServiceStatus } from '../services/ai/geminiClientService';

export const AiAnalysisPage: React.FC = () => {
  const { user } = useAuth();

  const [activeMainView, setActiveMainView] = useState<'WORKSPACE' | 'QUEUE' | 'HISTORY' | 'ROADMAP'>(
    'WORKSPACE'
  );

  const [analyses, setAnalyses] = useState<DocumentAnalysis[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<DocumentAnalysis | null>(null);
  const [proposals, setProposals] = useState<ProposedFinding[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [existingFindings, setExistingFindings] = useState<InspectionFinding[]>([]);
  const [aiStatus, setAiStatus] = useState<AiServiceStatus>({ configured: false, error: null });
  const [loading, setLoading] = useState(true);

  // Modals for Global Review Queue
  const [editingProposal, setEditingProposal] = useState<ProposedFinding | null>(null);
  const [rejectingProposal, setRejectingProposal] = useState<ProposedFinding | null>(null);
  const [rejectModalMode, setRejectModalMode] = useState<'REJECT' | 'MORE_EVIDENCE'>('REJECT');
  const [explainingProposal, setExplainingProposal] = useState<ProposedFinding | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);

      // Check AI backend service status
      const status = await dataService.checkAiServiceStatus();
      setAiStatus(status);

      // Fetch scoped data based on role
      const roleFilter =
        user?.role && user.role !== 'ADMIN'
          ? { role: user.role, assignedMineIds: user.mineIds }
          : undefined;

      const [allMines, allInspections, allAnalyses, allProposals] = await Promise.all([
        dataService.getMines(
          user?.role === 'ADMIN' ? undefined : { mineIds: user?.mineIds, role: user?.role }
        ),
        dataService.getInspections(
          user?.role === 'ADMIN' ? undefined : { mineIds: user?.mineIds, role: user?.role }
        ),
        dataService.getDocumentAnalyses(roleFilter ? { roleContext: roleFilter } : undefined),
        dataService.getProposedFindings(roleFilter ? { roleContext: roleFilter } : undefined),
      ]);

      setMines(allMines);
      setInspections(allInspections);
      setAnalyses(allAnalyses);
      setProposals(allProposals);

      // Collect all existing findings from accessible inspections
      const findingPromises = allInspections.map((i) =>
        dataService.getFindingsByInspection(i.id)
      );
      const findingsNested = await Promise.all(findingPromises);
      setExistingFindings(findingsNested.flat());

      // If there's an existing active analysis, refresh it
      if (activeAnalysis) {
        const fresh = await dataService.getDocumentAnalysisById(activeAnalysis.id);
        if (fresh) setActiveAnalysis(fresh);
      }
    } catch (err) {
      console.error('Failed to load AI Analysis page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Run Analysis Handler
  const handleRunAnalysis = async (params: {
    inspectionId: string;
    mineId: string;
    fileName: string;
    fileType: string;
    content?: string;
    base64Data?: string;
    mimeType?: string;
    policy: 'VERIFIED_ONLY' | 'ALLOW_DEMO';
    onProgress: (stage: string, percent: number) => void;
  }): Promise<DocumentAnalysis> => {
    if (!user) throw new Error('Authentication required');

    const result = await dataService.runDocumentAnalysis({
      ...params,
      currentUser: {
        id: user.id,
        email: user.email,
        role: user.role,
        assignedMineIds: user.mineIds,
      },
    });

    setActiveAnalysis(result);
    await loadData();
    // Re-ensure activeAnalysis is set to the freshly returned analysis
    setActiveAnalysis(result);
    return result;
  };

  // Human Review Handlers
  const handleAcceptProposal = async (proposalId: string) => {
    if (!user) return;
    await dataService.acceptProposedFinding(proposalId, {
      id: user.id,
      email: user.email,
      role: user.role,
      assignedMineIds: user.mineIds,
    });
    await loadData();
  };

  const handleEditAndAcceptProposal = async (
    proposalId: string,
    input: EditAndAcceptProposalInput
  ) => {
    if (!user) return;
    await dataService.editAndAcceptProposedFinding(proposalId, input, {
      id: user.id,
      email: user.email,
      role: user.role,
      assignedMineIds: user.mineIds,
    });
    await loadData();
  };

  const handleRejectProposal = async (proposalId: string, reason: string) => {
    if (!user) return;
    await dataService.rejectProposedFinding(proposalId, reason, {
      id: user.id,
      email: user.email,
      role: user.role,
      assignedMineIds: user.mineIds,
    });
    await loadData();
  };

  const handleRequestMoreEvidence = async (proposalId: string, notes: string) => {
    if (!user) return;
    await dataService.requestMoreEvidence(proposalId, notes, {
      id: user.id,
      email: user.email,
      role: user.role,
      assignedMineIds: user.mineIds,
    });
    await loadData();
  };

  const pendingReviewCount = proposals.filter((p) => p.reviewStatus === 'PENDING_REVIEW').length;
  const isOfficerOrAdmin = user?.role === 'ADMIN' || user?.role === 'OFFICER';

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Compliance Analysis & Statutory Review"
        subtitle="Gemini-powered document fact extraction grounded against Coal Mines Regulations 2017 with human review."
        badge="Production Engine"
      />

      {/* Primary Module Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveMainView('WORKSPACE')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
              activeMainView === 'WORKSPACE'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Analysis Workspace
          </button>

          <button
            onClick={() => setActiveMainView('QUEUE')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
              activeMainView === 'QUEUE'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Inbox className="h-4 w-4" />
            Review Queue
            {pendingReviewCount > 0 && (
              <span
                className={`ml-1 rounded-full px-2 py-0.2 text-[10px] font-mono font-bold ${
                  activeMainView === 'QUEUE'
                    ? 'bg-slate-950 text-amber-400'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {pendingReviewCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMainView('HISTORY')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
              activeMainView === 'HISTORY'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <History className="h-4 w-4" />
            Analysis History ({analyses.length})
          </button>

          <button
            onClick={() => setActiveMainView('ROADMAP')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
              activeMainView === 'ROADMAP'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Eye className="h-4 w-4" />
            Vision & Telemetry Architecture
          </button>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* View 1: Workspace */}
      {activeMainView === 'WORKSPACE' && (
        <AnalysisWorkspace
          currentUser={{
            id: user?.id || 'usr_dev_officer_002',
            email: user?.email || 'officer@minevision.local',
            role: user?.role || 'OFFICER',
            assignedMineIds: user?.mineIds || ['DEMO-MINE-001', 'DEMO-MINE-002', 'DEMO-MINE-004'],
          }}
          inspections={inspections}
          mines={mines}
          existingFindings={existingFindings}
          activeAnalysis={activeAnalysis}
          aiStatus={aiStatus}
          onRunAnalysis={handleRunAnalysis}
          onAcceptProposal={handleAcceptProposal}
          onEditAndAcceptProposal={handleEditAndAcceptProposal}
          onRejectProposal={handleRejectProposal}
          onRequestMoreEvidence={handleRequestMoreEvidence}
          onClearActiveAnalysis={() => setActiveAnalysis(null)}
          onViewSourceDoc={(kId) => {
            // Can be extended or inspected
          }}
        />
      )}

      {/* View 2: Global Review Queue */}
      {activeMainView === 'QUEUE' && (
        <GlobalReviewQueueView
          proposals={proposals}
          allFacts={analyses.flatMap((a) => a.extractedFacts || [])}
          allFindings={existingFindings}
          isOfficerOrAdmin={isOfficerOrAdmin}
          onAccept={handleAcceptProposal}
          onOpenEditModal={(p) => setEditingProposal(p)}
          onOpenRejectModal={(p, mode) => {
            setRejectingProposal(p);
            setRejectModalMode(mode);
          }}
          onOpenExplainModal={(p) => setExplainingProposal(p)}
          onViewSourceDoc={(kId) => {}}
        />
      )}

      {/* View 3: Analysis History */}
      {activeMainView === 'HISTORY' && (
        <AnalysisHistoryView
          analyses={analyses}
          inspections={inspections}
          mines={mines}
          onSelectAnalysis={async (id) => {
            const found = analyses.find((a) => a.id === id);
            if (found) {
              setActiveAnalysis(found);
              setActiveMainView('WORKSPACE');
            }
          }}
          onNewAnalysis={() => {
            setActiveAnalysis(null);
            setActiveMainView('WORKSPACE');
          }}
        />
      )}

      {/* View 4: Future Roadmap Architecture (Phase 6 & 7) */}
      {activeMainView === 'ROADMAP' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-4">
              <Eye className="h-8 w-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-300 border border-sky-500/30 mb-2">
              <span>Next Planned Modules</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Computer Vision & IoT Telemetry Architecture
            </h2>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              With <strong>Document Compliance Analysis & Review</strong> now active and verified, subsequent modules will introduce real-time optical safety feeds and continuous environmental telemetry monitoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Planned Capability
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Computer Vision PPE & Perimeter Guard
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time RTSP pithead camera feed analysis to verify safety helmets, fluorescent reflective harnesses, and restricted boundary ingress near heavy dump trucks.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  Planned Capability
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Multi-Sensor Gas & Ventilation Telemetry
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Predictive time-series anomaly detection on underground methane (CH4), carbon monoxide (CO), and airflow sensors to alert before statutory thresholds breach.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global Review Modals */}
      {editingProposal && (
        <EditProposalModal
          proposal={editingProposal}
          isOpen={Boolean(editingProposal)}
          onClose={() => setEditingProposal(null)}
          onConfirm={async (input) => {
            await handleEditAndAcceptProposal(editingProposal.id, input);
          }}
        />
      )}

      {rejectingProposal && (
        <RejectProposalModal
          proposal={rejectingProposal}
          isOpen={Boolean(rejectingProposal)}
          mode={rejectModalMode}
          onClose={() => setRejectingProposal(null)}
          onConfirm={async (notes) => {
            if (rejectModalMode === 'REJECT') {
              await handleRejectProposal(rejectingProposal.id, notes);
            } else {
              await handleRequestMoreEvidence(rejectingProposal.id, notes);
            }
          }}
        />
      )}

      {explainingProposal && (
        <ExplainabilityModal
          proposal={explainingProposal}
          facts={analyses.flatMap((a) => a.extractedFacts || [])}
          isOpen={Boolean(explainingProposal)}
          onClose={() => setExplainingProposal(null)}
        />
      )}
    </div>
  );
};

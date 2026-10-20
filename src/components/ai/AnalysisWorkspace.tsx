import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Search,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Eye,
  Lock,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Inspection } from '../../data/models/Inspection';
import { Mine } from '../../data/models/Mine';
import { DocumentAnalysis } from '../../data/models/DocumentAnalysis';
import { ProposedFinding } from '../../data/models/ProposedFinding';
import { ExtractedFact } from '../../data/models/ExtractedFact';
import { InspectionFinding } from '../../data/models/InspectionFinding';
import { UserRole } from '../../auth/authTypes';
import { SAMPLE_INSPECTION_DOCUMENTS, SampleInspectionDocument } from '../../data/seed/sampleInspectionDocuments';
import { ProposedFindingCard } from './ProposedFindingCard';
import { ExtractedFactsTable } from './ExtractedFactsTable';
import { EditProposalModal } from './EditProposalModal';
import { RejectProposalModal } from './RejectProposalModal';
import { ExplainabilityModal } from './ExplainabilityModal';
import { EditAndAcceptProposalInput } from '../../data/models/ProposedFinding';
import { AiServiceStatus } from '../../services/ai/geminiClientService';

interface AnalysisWorkspaceProps {
  currentUser: {
    id: string;
    email: string;
    role: UserRole;
    assignedMineIds?: string[];
  };
  inspections: Inspection[];
  mines: Mine[];
  existingFindings: InspectionFinding[];
  activeAnalysis: DocumentAnalysis | null;
  aiStatus: AiServiceStatus;
  selectedInspectionId?: string;
  onRunAnalysis: (params: {
    inspectionId: string;
    mineId: string;
    fileName: string;
    fileType: string;
    content?: string;
    base64Data?: string;
    mimeType?: string;
    policy: 'VERIFIED_ONLY' | 'ALLOW_DEMO';
    onProgress: (stage: string, percent: number) => void;
  }) => Promise<DocumentAnalysis>;
  onAcceptProposal: (proposalId: string) => Promise<void>;
  onEditAndAcceptProposal: (proposalId: string, input: EditAndAcceptProposalInput) => Promise<void>;
  onRejectProposal: (proposalId: string, reason: string) => Promise<void>;
  onRequestMoreEvidence: (proposalId: string, notes: string) => Promise<void>;
  onClearActiveAnalysis: () => void;
  onViewSourceDoc?: (knowledgeId: string) => void;
}

export const AnalysisWorkspace: React.FC<AnalysisWorkspaceProps> = ({
  currentUser,
  inspections,
  mines,
  existingFindings,
  activeAnalysis,
  aiStatus,
  selectedInspectionId: initialInspectionId,
  onRunAnalysis,
  onAcceptProposal,
  onEditAndAcceptProposal,
  onRejectProposal,
  onRequestMoreEvidence,
  onClearActiveAnalysis,
  onViewSourceDoc,
}) => {
  // Form State
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>(
    initialInspectionId || (inspections[0]?.id || '')
  );
  const [selectedSampleDocId, setSelectedSampleDocId] = useState<string>(
    SAMPLE_INSPECTION_DOCUMENTS[0].id
  );
  const [docSourceType, setDocSourceType] = useState<'SAMPLE' | 'UPLOAD' | 'MANUAL'>('SAMPLE');
  const [documentContent, setDocumentContent] = useState<string>(
    SAMPLE_INSPECTION_DOCUMENTS[0].content
  );
  const [fileName, setFileName] = useState<string>(
    SAMPLE_INSPECTION_DOCUMENTS[0].fileName
  );
  const [fileType, setFileType] = useState<string>('text/plain');
  const [base64Data, setBase64Data] = useState<string | undefined>(undefined);
  const [retrievalPolicy, setRetrievalPolicy] = useState<'VERIFIED_ONLY' | 'ALLOW_DEMO'>(
    'VERIFIED_ONLY'
  );

  // Execution & Progress State
  const [isRunning, setIsRunning] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Active Analysis View State
  const [activeTab, setActiveTab] = useState<'PROPOSALS' | 'FACTS' | 'RAG_CONTEXT'>('PROPOSALS');

  // Modal State
  const [editingProposal, setEditingProposal] = useState<ProposedFinding | null>(null);
  const [rejectingProposal, setRejectingProposal] = useState<ProposedFinding | null>(null);
  const [rejectModalMode, setRejectModalMode] = useState<'REJECT' | 'MORE_EVIDENCE'>('REJECT');
  const [explainingProposal, setExplainingProposal] = useState<ProposedFinding | null>(null);

  // Sync initial inspection ID if passed from parent or when inspections load
  useEffect(() => {
    if (initialInspectionId) {
      setSelectedInspectionId(initialInspectionId);
    } else if (!selectedInspectionId && inspections.length > 0) {
      // Prioritize Jharia Underground Colliery (DEMO-MINE-002) as flagship demo
      const jharia = inspections.find((i) => i.mineId === 'DEMO-MINE-002');
      setSelectedInspectionId(jharia ? jharia.id : inspections[0].id);
    }
  }, [initialInspectionId, inspections, selectedInspectionId]);

  // Handle sample doc switch
  const handleSelectSampleDoc = (docId: string) => {
    setSelectedSampleDocId(docId);
    const doc = SAMPLE_INSPECTION_DOCUMENTS.find((d) => d.id === docId);
    if (doc) {
      setDocumentContent(doc.content);
      setFileName(doc.fileName);
      setFileType(doc.fileType);
      setBase64Data(undefined);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileType(file.type || 'text/plain');

    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.json') || file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setDocumentContent(text || '');
        setBase64Data(undefined);
      };
      reader.readAsText(file);
    } else {
      // Multimodal binary (PDF or Image)
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        // Strip data:url prefix
        const base64 = result.split(',')[1];
        setBase64Data(base64);
        setDocumentContent(`[Binary document file: ${file.name} (${file.size} bytes)]`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run Analysis Handler
  const handleStartAnalysis = async () => {
    let inspectionIdToUse = selectedInspectionId;
    if (!inspectionIdToUse && inspections.length > 0) {
      const jharia = inspections.find((i) => i.mineId === 'DEMO-MINE-002');
      inspectionIdToUse = jharia ? jharia.id : inspections[0].id;
      setSelectedInspectionId(inspectionIdToUse);
    }

    if (!inspectionIdToUse) {
      setAnalysisError('Please select an active inspection record to analyze.');
      return;
    }
    if (!documentContent.trim() && !base64Data) {
      setAnalysisError('Please provide or select document content to analyze.');
      return;
    }

    const inspection = inspections.find((i) => i.id === inspectionIdToUse);
    if (!inspection) {
      setAnalysisError('Selected inspection was not found.');
      return;
    }

    try {
      setIsRunning(true);
      setAnalysisError(null);
      setProgressStage('Initializing AI compliance pipeline...');
      setProgressPercent(10);

      await onRunAnalysis({
        inspectionId: inspection.id,
        mineId: inspection.mineId,
        fileName,
        fileType,
        content: documentContent,
        base64Data,
        mimeType: fileType,
        policy: retrievalPolicy,
        onProgress: (stage, percent) => {
          setProgressStage(stage);
          setProgressPercent(percent);
        },
      });

      setActiveTab('PROPOSALS');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('AI Compliance Analysis error:', err);
      setAnalysisError(err.message || 'Failed to complete document analysis.');
    } finally {
      setIsRunning(false);
    }
  };

  const selectedInspection = inspections.find((i) => i.id === selectedInspectionId);
  const selectedMine = mines.find((m) => m.id === selectedInspection?.mineId);

  const isOfficerOrAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'OFFICER';

  return (
    <div className="space-y-6">
      {/* Statutory AI Notice Banner */}
      <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-4 text-xs text-sky-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Shield className="h-4 w-4 text-sky-400 shrink-0" />
          <span>
            <strong>AI-Assisted Analysis:</strong> All findings require compliance officer review
            before becoming part of an official inspection record.
          </span>
        </div>
        <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-500/30">
          DGMS CMR 2017 Grounded
        </span>
      </div>

      {/* AI Configuration Status Banner */}
      {!aiStatus.configured && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-white text-sm">AI service is not configured</h4>
            <p className="text-amber-300/90 leading-relaxed">
              The Gemini API service requires a valid <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-200">GEMINI_API_KEY</code> environment secret in your AI Studio project. In accordance with strict security standards, API keys are never exposed in browser code.
            </p>
            <p className="text-slate-400 text-[11px]">
              Configure your secret in the AI Studio Settings menu to enable live Gemini extraction and analysis.
            </p>
          </div>
        </div>
      )}

      {/* If Active Analysis is loaded, show Analysis Results View */}
      {activeAnalysis ? (
        <div className="space-y-5">
          {/* Active Analysis Header */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-bold text-sky-400 border border-sky-500/20">
                    Analysis Record #{activeAnalysis.id.substring(activeAnalysis.id.length - 8)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(activeAnalysis.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {activeAnalysis.fileName}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClearActiveAnalysis}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Analyze Another Document
                </button>
              </div>
            </div>

            {/* Prominent Demo Notice Banner if synthetic knowledge mode */}
            {(activeAnalysis.isDemoMode ||
              activeAnalysis.ragPolicyUsed === 'ALLOW_DEMO' ||
              activeAnalysis.proposedFindings?.some((p) => p.isSyntheticDemo)) && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-200 shadow-lg">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <span className="font-bold block text-amber-300">
                    This analysis uses synthetic demonstration compliance knowledge and is not an official regulatory determination.
                  </span>
                  <span className="text-xs text-amber-300/80 mt-0.5 block">
                    Source regulations and clauses are illustrative demonstration benchmarks. Official statutory findings require verified regulatory source material.
                  </span>
                </div>
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Target Mine</span>
                <span className="font-bold text-white text-sm">
                  {selectedMine?.name || 'Assigned Mine'}
                </span>
              </div>
              <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Inspection Reference</span>
                <span className="font-mono font-bold text-white text-sm">
                  {selectedInspection?.inspectionNumber || activeAnalysis.inspectionId.substring(0, 10)}
                </span>
              </div>
              <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Extracted Facts</span>
                <span className="font-bold text-sky-400 text-sm font-mono">
                  {activeAnalysis.extractedFacts?.length || 0} items
                </span>
              </div>
              <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Proposed Findings</span>
                <span className="font-bold text-amber-400 text-sm font-mono">
                  {activeAnalysis.proposedFindings?.length || 0} findings
                </span>
              </div>
            </div>

            {/* Review Progress Tracker */}
            {activeAnalysis.proposedFindings?.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">
                    Statutory Review Status:{' '}
                    <strong className="text-white">
                      {
                        activeAnalysis.proposedFindings.filter(
                          (p) => p.reviewStatus !== 'PENDING_REVIEW'
                        ).length
                      }{' '}
                      / {activeAnalysis.proposedFindings.length} Reviewed
                    </strong>
                  </span>
                  <span className="font-mono text-slate-400">
                    {Math.round(
                      (activeAnalysis.proposedFindings.filter(
                        (p) => p.reviewStatus !== 'PENDING_REVIEW'
                      ).length /
                        activeAnalysis.proposedFindings.length) *
                        100
                    )}
                    % Complete
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (activeAnalysis.proposedFindings.filter(
                          (p) => p.reviewStatus !== 'PENDING_REVIEW'
                        ).length /
                          activeAnalysis.proposedFindings.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('PROPOSALS')}
              className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'PROPOSALS'
                  ? 'border-amber-500 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Proposed Findings ({activeAnalysis.proposedFindings?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('FACTS')}
              className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'FACTS'
                  ? 'border-sky-500 text-sky-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" />
              Extracted Facts ({activeAnalysis.extractedFacts?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('RAG_CONTEXT')}
              className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'RAG_CONTEXT'
                  ? 'border-indigo-500 text-indigo-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Retrieved Knowledge Chunks ({activeAnalysis.retrievedChunkIds?.length || 0})
            </button>
          </div>

          {/* Tab 1: Proposed Findings */}
          {activeTab === 'PROPOSALS' && (
            <div className="space-y-4">
              {(!activeAnalysis.proposedFindings ||
                activeAnalysis.proposedFindings.length === 0) ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">No Compliance Violations Flagged</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    All extracted observations were assessed against retrieved regulatory knowledge and found to be supported compliant or non-hazardous.
                  </p>
                </div>
              ) : (
                activeAnalysis.proposedFindings.map((proposal) => (
                  <ProposedFindingCard
                    key={proposal.id}
                    proposal={proposal}
                    allFacts={activeAnalysis.extractedFacts || []}
                    existingFindings={existingFindings}
                    isOfficerOrAdmin={isOfficerOrAdmin}
                    onAccept={onAcceptProposal}
                    onOpenEditModal={(p) => setEditingProposal(p)}
                    onOpenRejectModal={(p, mode) => {
                      setRejectingProposal(p);
                      setRejectModalMode(mode);
                    }}
                    onOpenExplainModal={(p) => setExplainingProposal(p)}
                    onViewSourceDoc={onViewSourceDoc}
                  />
                ))
              )}
            </div>
          )}

          {/* Tab 2: Extracted Facts */}
          {activeTab === 'FACTS' && (
            <ExtractedFactsTable facts={activeAnalysis.extractedFacts || []} />
          )}

          {/* Tab 3: Retrieved Knowledge Chunks */}
          {activeTab === 'RAG_CONTEXT' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-bold text-white">Targeted RAG Retrieval Query</span>
                  <span className="font-mono text-indigo-400">
                    Policy: {activeAnalysis.ragPolicyUsed}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-300 border border-slate-800">
                  {activeAnalysis.ragQuery || 'Regulatory extraction query'}
                </div>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-400" />
                <span>
                  Retrieved <strong>{activeAnalysis.retrievedChunkIds?.length || 0}</strong> verified
                  clauses from the MineVision Compliance Knowledge Base.
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Workspace Setup & Form */
        <div className="space-y-6">
          {/* Progress Tracker when running */}
          {isRunning && (
            <div className="rounded-2xl border border-amber-500/40 bg-slate-900 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">AI Compliance Analysis in Progress</h4>
                    <p className="text-xs text-slate-400">{progressStage}</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {progressPercent}%
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[10px] text-slate-400 pt-1">
                <span className={progressPercent >= 10 ? 'text-amber-400 font-bold' : ''}>
                  1. Evidence Ingestion
                </span>
                <span className={progressPercent >= 30 ? 'text-amber-400 font-bold' : ''}>
                  2. Fact Extraction
                </span>
                <span className={progressPercent >= 60 ? 'text-amber-400 font-bold' : ''}>
                  3. RAG Query
                </span>
                <span className={progressPercent >= 80 ? 'text-amber-400 font-bold' : ''}>
                  4. Grounded Analysis
                </span>
                <span className={progressPercent >= 100 ? 'text-emerald-400 font-bold' : ''}>
                  5. Review Ready
                </span>
              </div>
            </div>
          )}

          {analysisError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/20 p-4 text-xs text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <span>{analysisError}</span>
            </div>
          )}

          {/* Step 1: Select Inspection */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400 border border-amber-500/30">
                  1
                </span>
                <h3 className="text-sm font-bold text-white">Select Inspection Target</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Scoped to assigned mines for {currentUser.email}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Active / Scheduled Inspection
                </label>
                <select
                  value={selectedInspectionId}
                  onChange={(e) => setSelectedInspectionId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  {inspections.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.mineName} — {ins.inspectionType} ({ins.inspectionNumber || ins.id.substring(0, 8)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedInspection && (
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mine:</span>
                    <strong className="text-white">{selectedInspection.mineName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span>{selectedInspection.inspectionType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Inspector:</span>
                    <span>{selectedInspection.inspectorName || 'Assigned Officer'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Document Selection */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400 border border-amber-500/30">
                  2
                </span>
                <h3 className="text-sm font-bold text-white">Select or Upload Inspection Document</h3>
              </div>
              <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setDocSourceType('SAMPLE');
                    handleSelectSampleDoc(selectedSampleDocId);
                  }}
                  className={`rounded px-3 py-1 font-semibold transition-colors ${
                    docSourceType === 'SAMPLE'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sample Documents
                </button>
                <button
                  type="button"
                  onClick={() => setDocSourceType('UPLOAD')}
                  className={`rounded px-3 py-1 font-semibold transition-colors ${
                    docSourceType === 'UPLOAD'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setDocSourceType('MANUAL')}
                  className={`rounded px-3 py-1 font-semibold transition-colors ${
                    docSourceType === 'MANUAL'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Direct Text
                </button>
              </div>
            </div>

            {/* Sub-view: Sample Documents */}
            {docSourceType === 'SAMPLE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_INSPECTION_DOCUMENTS.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectSampleDoc(doc.id)}
                    className={`cursor-pointer rounded-xl border p-3 text-xs transition-all ${
                      selectedSampleDocId === doc.id
                        ? 'border-amber-500 bg-amber-950/20 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs">{doc.title}</span>
                      {doc.isPromptInjectionTest && (
                        <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-300 border border-purple-500/30">
                          Security Test
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{doc.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-view: File Upload */}
            {docSourceType === 'UPLOAD' && (
              <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-6 text-center hover:border-slate-600 transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                <label className="cursor-pointer">
                  <span className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 inline-block mb-1">
                    Select Inspection File
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".txt,.json,.csv,.pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-2">
                  Supports .txt, .json, .csv, .pdf, and image files (.jpg, .png) up to 10MB.
                </p>
                {fileName && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs text-sky-300 border border-slate-700">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{fileName}</span>
                  </div>
                )}
              </div>
            )}

            {/* Document Content Preview / Editor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Document Content ({documentContent.length} characters) —{' '}
                  <span className="text-amber-400 font-semibold">Treated strictly as untrusted data</span>
                </span>
                <span className="font-mono text-slate-400">{fileName}</span>
              </div>
              <textarea
                rows={7}
                value={documentContent}
                onChange={(e) => setDocumentContent(e.target.value)}
                placeholder="Enter or paste raw inspection logs, air sample certificates, or equipment audit logs..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Step 3: Retrieval Policy */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400 border border-amber-500/30">
                3
              </span>
              <h3 className="text-sm font-bold text-white">Compliance Retrieval Policy</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`cursor-pointer rounded-xl border p-3.5 text-xs transition-all ${
                  retrievalPolicy === 'VERIFIED_ONLY'
                    ? 'border-emerald-500 bg-emerald-950/20 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="policy"
                    checked={retrievalPolicy === 'VERIFIED_ONLY'}
                    onChange={() => setRetrievalPolicy('VERIFIED_ONLY')}
                    className="accent-emerald-500"
                  />
                  <span className="font-bold text-emerald-400">
                    VERIFIED_ONLY (Statutory Standard)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-5">
                  Restricts retrieval strictly to knowledge documents with status VERIFIED. Recommended for statutory and legal auditing.
                </p>
              </label>

              <label
                className={`cursor-pointer rounded-xl border p-3.5 text-xs transition-all ${
                  retrievalPolicy === 'ALLOW_DEMO'
                    ? 'border-amber-500 bg-amber-950/20 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="policy"
                    checked={retrievalPolicy === 'ALLOW_DEMO'}
                    onChange={() => setRetrievalPolicy('ALLOW_DEMO')}
                    className="accent-amber-500"
                  />
                  <span className="font-bold text-amber-400">
                    ALLOW_DEMO (Synthetic Demo Standards)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-5">
                  Allows demonstration records. Flags results with synthetic warnings.
                </p>
              </label>
            </div>

            {retrievalPolicy === 'ALLOW_DEMO' && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span className="font-semibold">
                  This analysis uses synthetic demonstration compliance knowledge and is not an official regulatory determination.
                </span>
              </div>
            )}
          </div>

          {/* Bottom Action Area: Errors, Progress & Run Button */}
          {analysisError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-xs text-red-300 shadow-md">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <div className="flex-1">
                <strong className="block font-semibold text-red-200">Analysis Error</strong>
                <span>{analysisError}</span>
              </div>
            </div>
          )}

          {isRunning && (
            <div className="rounded-xl border border-amber-500/40 bg-slate-900/95 p-4 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-400 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
                  {progressStage}
                </span>
                <span className="font-mono font-bold text-amber-400">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Grounded compliance verification pipeline executing via Gemini and RAG engine. Please wait...
              </p>
            </div>
          )}

          {/* Run Action Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs text-slate-400">
              {!isOfficerOrAdmin ? (
                <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Analysis is restricted to Compliance Officers and Administrators (Current role: {currentUser.role}).
                </span>
              ) : (
                <span>Analysis pipeline executes server-side with Gemini and RAG engine.</span>
              )}
            </div>
            <button
              type="button"
              disabled={isRunning || !isOfficerOrAdmin}
              onClick={handleStartAnalysis}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Analyzing Document ({progressPercent}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Run AI Compliance Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {editingProposal && (
        <EditProposalModal
          proposal={editingProposal}
          isOpen={Boolean(editingProposal)}
          onClose={() => setEditingProposal(null)}
          onConfirm={async (input) => {
            await onEditAndAcceptProposal(editingProposal.id, input);
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
              await onRejectProposal(rejectingProposal.id, notes);
            } else {
              await onRequestMoreEvidence(rejectingProposal.id, notes);
            }
          }}
        />
      )}

      {explainingProposal && (
        <ExplainabilityModal
          proposal={explainingProposal}
          facts={activeAnalysis?.extractedFacts || []}
          isOpen={Boolean(explainingProposal)}
          onClose={() => setExplainingProposal(null)}
          onViewSourceDoc={onViewSourceDoc}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  ShieldAlert,
  UploadCloud,
  Play,
  History,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
  Info,
  Filter,
  FileVideo,
  FileImage,
  Tag,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { useAuth } from '../auth/AuthContext';
import { dataService } from '../services/dataService';
import { Mine } from '../data/models/Mine';
import { Inspection } from '../data/models/Inspection';
import { VisionAnalysis } from '../data/models/VisionAnalysis';
import { VisionDetection } from '../data/models/VisionDetection';
import { SafetyObservation } from '../data/models/SafetyObservation';
import { ZoneDefinition, CreateZoneInput } from '../data/models/ZoneDefinition';
import { ProposedFinding, EditAndAcceptProposalInput } from '../data/models/ProposedFinding';
import { VisionCanvas } from '../components/vision/VisionCanvas';
import { VisionObservationPanel } from '../components/vision/VisionObservationPanel';
import { ZoneEditorModal } from '../components/vision/ZoneEditorModal';
import { VisionHistoryModal } from '../components/vision/VisionHistoryModal';
import { EditProposalModal } from '../components/ai/EditProposalModal';
import { RejectProposalModal } from '../components/ai/RejectProposalModal';

export const AiSafetyVisionPage: React.FC = () => {
  const { user } = useAuth();

  // Mines & Inspections state
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>('');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>('');

  // Vision Workspace State
  const [zones, setZones] = useState<ZoneDefinition[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<VisionAnalysis | null>(null);
  const [detections, setDetections] = useState<VisionDetection[]>([]);
  const [observations, setObservations] = useState<SafetyObservation[]>([]);
  const [proposals, setProposals] = useState<ProposedFinding[]>([]);

  // Selected item highlighting
  const [selectedDetectionId, setSelectedDetectionId] = useState<string | null>(null);
  const [selectedObservationId, setSelectedObservationId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Progress
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ step: string; percent: number }>({
    step: '',
    percent: 0,
  });
  const [providerStatus, setProviderStatus] = useState<{
    configured: boolean;
    provider: string;
    model: string;
    message?: string;
  }>({
    configured: false,
    provider: 'Gemini Vision (Multimodal)',
    model: 'gemini-3.8-flash',
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [pastAnalyses, setPastAnalyses] = useState<VisionAnalysis[]>([]);
  const [editingProposal, setEditingProposal] = useState<ProposedFinding | null>(null);
  const [rejectingProposal, setRejectingProposal] = useState<ProposedFinding | null>(null);

  // Role permissions
  const canAnalyze = user?.role === 'ADMIN' || user?.role === 'OFFICER';
  const canReview = user?.role === 'ADMIN' || user?.role === 'OFFICER';

  // Load mines and initial provider status
  useEffect(() => {
    async function init() {
      try {
        const allMines = await dataService.getMines();
        // Scoped for Officer
        const authorizedMines =
          user?.role === 'OFFICER' && user.mineIds?.length
            ? allMines.filter((m) => user.mineIds?.includes(m.id))
            : allMines;

        setMines(authorizedMines);
        if (authorizedMines.length > 0) {
          setSelectedMineId(authorizedMines[0].id);
        }

        // Fetch vision status from server
        try {
          const res = await fetch('/api/vision/status');
          if (res.ok) {
            const data = await res.json();
            setProviderStatus({
              configured: data.configured,
              provider: data.provider || 'Gemini Vision',
              model: data.model || 'gemini-3.8-flash',
              message: data.message,
            });
          }
        } catch {
          // fallback
        }
      } catch (err: any) {
        setError(err.message || 'Failed to initialize safety vision workspace.');
      }
    }
    init();
  }, [user]);

  // When selected mine changes, load inspections, zones, and history
  useEffect(() => {
    if (!selectedMineId) return;

    async function loadMineData() {
      try {
        const [inspList, zoneList, historyList] = await Promise.all([
          dataService.getInspections({ mineId: selectedMineId }),
          dataService.getSafetyZones({ mineId: selectedMineId }),
          dataService.getVisionAnalyses({ mineId: selectedMineId }),
        ]);

        setInspections(inspList);
        if (inspList.length > 0) {
          setSelectedInspectionId(inspList[0].id);
        } else {
          setSelectedInspectionId('');
        }

        setZones(zoneList);
        setPastAnalyses(historyList);

        // Load most recent analysis if available and no active analysis
        if (historyList.length > 0 && !activeAnalysis) {
          loadAnalysis(historyList[0]);
        }
      } catch (err: any) {
        console.error('Error loading mine safety vision data:', err);
      }
    }

    loadMineData();
  }, [selectedMineId]);

  const loadAnalysis = async (analysis: VisionAnalysis) => {
    setActiveAnalysis(analysis);
    setDetections(analysis.detections || []);
    const evidenceUrl =
      analysis.evidence?.[0]?.dataUrl ||
      analysis.evidence?.[0]?.annotatedImageUrl ||
      null;
    setImagePreviewUrl(evidenceUrl);
    setImageBase64(null);
    setUploadedFile(null);

    // Load observations & proposals
    const [obsList, proposalList] = await Promise.all([
      dataService.getSafetyObservations({ analysisId: analysis.id }),
      dataService.getProposedFindings({ analysisId: analysis.id }),
    ]);

    setObservations(obsList);
    setProposals(proposalList);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    setError(null);
    setSuccessMessage(null);
    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreviewUrl(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAnalysis = async () => {
    if (!user || !canAnalyze) {
      setError('You are not authorized to run AI vision analysis.');
      return;
    }
    if (!selectedMineId) {
      setError('Please select a target mine.');
      return;
    }
    if (!imageBase64 && !imagePreviewUrl) {
      setError('Please upload an image or video frame to analyze.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      setSuccessMessage(null);
      setAnalysisProgress({ step: 'Initializing vision pipeline...', percent: 10 });

      const isVideo = uploadedFile?.type.startsWith('video/') || false;

      const result = await dataService.runVisionAnalysis({
        mineId: selectedMineId,
        inspectionId: selectedInspectionId || undefined,
        sourceType: isVideo ? 'VIDEO' : 'IMAGE',
        fileName: uploadedFile?.name || 'Inspection_Visual_Evidence.jpg',
        imageBase64: imageBase64 || imagePreviewUrl || '',
        mimeType: uploadedFile?.type || 'image/jpeg',
        currentUser: {
          id: user.id,
          email: user.email,
          role: user.role,
          assignedMineIds: user.mineIds,
        },
        onProgress: (step, percent) => {
          setAnalysisProgress({ step, percent });
        },
      });

      await loadAnalysis(result);
      setSuccessMessage('Vision analysis completed with regulatory compliance grounding.');

      // Refresh history
      const historyList = await dataService.getVisionAnalyses({ mineId: selectedMineId });
      setPastAnalyses(historyList);
    } catch (err: any) {
      console.error('Vision analysis failure:', err);
      setError(err.message || 'Vision analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunSimulation = async (
    scenarioId: 'DEMO-SIM-01' | 'DEMO-SIM-02' | 'DEMO-SIM-03'
  ) => {
    if (!user || !canAnalyze) {
      setError('You are not authorized to run simulations.');
      return;
    }
    if (!selectedMineId) {
      setError('Please select a target mine.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      setSuccessMessage(null);
      setAnalysisProgress({ step: 'Initializing scenario simulation...', percent: 10 });

      const result = await dataService.runVisionSimulation({
        scenarioId,
        mineId: selectedMineId,
        inspectionId: selectedInspectionId || undefined,
        currentUser: {
          id: user.id,
          email: user.email,
          role: user.role,
          assignedMineIds: user.mineIds,
        },
        onProgress: (step, percent) => {
          setAnalysisProgress({ step, percent });
        },
      });

      await loadAnalysis(result);
      setSuccessMessage(`Simulation scenario "${scenarioId}" executed successfully.`);

      // Refresh history
      const historyList = await dataService.getVisionAnalyses({ mineId: selectedMineId });
      setPastAnalyses(historyList);
    } catch (err: any) {
      setError(err.message || 'Failed to execute simulation scenario.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Proposal review handlers (reusing Phase 5 workflow)
  const handleAcceptProposal = async (proposalId: string) => {
    if (!user) return;
    try {
      await dataService.acceptProposedFinding(proposalId, {
        id: user.id,
        email: user.email,
        role: user.role,
        assignedMineIds: user.mineIds,
      });

      // Reload proposals and observations
      if (activeAnalysis) {
        const [obsList, propList] = await Promise.all([
          dataService.getSafetyObservations({ analysisId: activeAnalysis.id }),
          dataService.getProposedFindings({ analysisId: activeAnalysis.id }),
        ]);
        setObservations(obsList);
        setProposals(propList);
      }
      setSuccessMessage('Proposed finding accepted and logged to official inspection findings.');
    } catch (err: any) {
      setError(err.message || 'Failed to accept proposal.');
    }
  };

  const handleEditProposalConfirm = async (input: EditAndAcceptProposalInput) => {
    if (!user || !editingProposal) return;
    try {
      await dataService.editAndAcceptProposedFinding(editingProposal.id, input, {
        id: user.id,
        email: user.email,
        role: user.role,
        assignedMineIds: user.mineIds,
      });

      setEditingProposal(null);
      if (activeAnalysis) {
        const [obsList, propList] = await Promise.all([
          dataService.getSafetyObservations({ analysisId: activeAnalysis.id }),
          dataService.getProposedFindings({ analysisId: activeAnalysis.id }),
        ]);
        setObservations(obsList);
        setProposals(propList);
      }
      setSuccessMessage('Edited proposal accepted into official inspection findings.');
    } catch (err: any) {
      setError(err.message || 'Failed to edit and accept proposal.');
    }
  };

  const handleRejectProposalConfirm = async (notes: string) => {
    if (!user || !rejectingProposal) return;
    try {
      await dataService.rejectProposedFinding(rejectingProposal.id, notes, {
        id: user.id,
        email: user.email,
        role: user.role,
        assignedMineIds: user.mineIds,
      });

      setRejectingProposal(null);
      if (activeAnalysis) {
        const [obsList, propList] = await Promise.all([
          dataService.getSafetyObservations({ analysisId: activeAnalysis.id }),
          dataService.getProposedFindings({ analysisId: activeAnalysis.id }),
        ]);
        setObservations(obsList);
        setProposals(propList);
      }
      setSuccessMessage('Proposed finding marked as rejected.');
    } catch (err: any) {
      setError(err.message || 'Failed to reject proposal.');
    }
  };

  const handleSaveZone = async (input: CreateZoneInput) => {
    await dataService.createSafetyZone(input);
    const updatedZones = await dataService.getSafetyZones({ mineId: selectedMineId });
    setZones(updatedZones);
    setSuccessMessage('Safety zone perimeter updated.');
  };

  const handleDeleteZone = async (zoneId: string) => {
    await dataService.deleteSafetyZone(zoneId);
    const updatedZones = await dataService.getSafetyZones({ mineId: selectedMineId });
    setZones(updatedZones);
    setSuccessMessage('Safety zone removed.');
  };

  const selectedMine = mines.find((m) => m.id === selectedMineId);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <PageHeader
        title="AI Safety Vision"
        subtitle="Computer vision-assisted monitoring of personal protective equipment (PPE), restricted perimeter intrusions, and heavy machinery safety conditions."
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsZoneModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <ShieldAlert className="h-4 w-4 text-red-400" />
            <span>Safety Zones ({zones.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <History className="h-4 w-4 text-amber-400" />
            <span>Audit History ({pastAnalyses.length})</span>
          </button>
        </div>
      </PageHeader>

      {/* Provider Status / Alert Banners */}
      {!providerStatus.configured && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-xs text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold uppercase tracking-wider text-amber-300">
              Computer Vision Provider Unavailable
            </h4>
            <p className="mt-0.5 text-slate-300">
              {providerStatus.message ||
                'GEMINI_API_KEY environment secret is not configured on the server. Live image analysis is offline.'}
            </p>
            <p className="mt-1 text-slate-400">
              You can still evaluate all spatial safety engines, zone perimeters, and regulatory compliance grounding using the built-in{' '}
              <strong className="text-amber-400">Demonstration Scenarios</strong> below.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Scope Control Bar (Mine, Inspection, Simulation Presets) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        {/* Mine Selector */}
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Target Mine Basin *
          </label>
          <select
            value={selectedMineId}
            onChange={(e) => setSelectedMineId(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
          >
            {mines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.type.replace('_', ' ')}) - {m.state}
              </option>
            ))}
          </select>
          {selectedMine && (
            <p className="mt-1 text-[11px] text-slate-400">
              District: {selectedMine.district} • Region: {selectedMine.state}
            </p>
          )}
        </div>

        {/* Inspection Selector (Optional) */}
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Associated Inspection (Optional)
          </label>
          <select
            value={selectedInspectionId}
            onChange={(e) => setSelectedInspectionId(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="">-- Ad-hoc Safety Monitoring --</option>
            {inspections.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title} ({i.type})
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-400">
            Link findings directly to inspection record
          </p>
        </div>

        {/* Demo Scenarios Quick Runner */}
        <div className="md:col-span-5 flex flex-col justify-between">
          <div>
            <label className="block text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Simulate Visual Safety Scenarios (Hackathon Demo)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => handleRunSimulation('DEMO-SIM-01')}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 hover:border-amber-500 hover:text-white transition-colors disabled:opacity-50"
                title="Personnel walking within 5m of moving 100T Haul Dumper"
              >
                1. Haul Dumper Proximity
              </button>
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => handleRunSimulation('DEMO-SIM-02')}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 hover:border-amber-500 hover:text-white transition-colors disabled:opacity-50"
                title="Unauthorized personnel inside 6.6kV substation restricted perimeter"
              >
                2. Substation Zone Intrusion
              </button>
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => handleRunSimulation('DEMO-SIM-03')}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 hover:border-amber-500 hover:text-white transition-colors disabled:opacity-50"
                title="Miners working without industrial hard hats and reflective safety vests"
              >
                3. Coal Face PPE Violation
              </button>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">
            Simulations execute the full CV spatial engine and RAG compliance grounding.
          </span>
        </div>
      </div>

      {/* Upload Dropzone Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            <UploadCloud className="h-4 w-4 text-cyan-400" />
            <span>Upload Image or Video</span>
          </button>
          {uploadedFile ? (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-mono text-cyan-400">{uploadedFile.name}</span>
              <span className="text-slate-400">
                ({(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              Accepts inspection photos, CCTV clips, or drone frames (JPG, PNG, MP4, WebM)
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={isAnalyzing || (!imageBase64 && !imagePreviewUrl)}
          onClick={handleRunAnalysis}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Analyzing Visual Scene...</span>
            </>
          ) : (
            <>
              <Scan className="h-4 w-4" />
              <span>Run AI Vision Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Progress Bar during Analysis */}
      {isAnalyzing && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span className="font-semibold flex items-center gap-2">
              <Cpu className="h-4 w-4 animate-spin" />
              {analysisProgress.step}
            </span>
            <span className="font-mono font-bold">{analysisProgress.percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${analysisProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Layout (Canvas on Left, Observations on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Visual Evidence Canvas */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <VisionCanvas
            imageUrl={imagePreviewUrl}
            fileName={activeAnalysis?.fileName || uploadedFile?.name}
            detections={detections}
            zones={zones}
            selectedDetectionId={selectedDetectionId}
            selectedZoneId={selectedZoneId}
            isDemoSimulation={activeAnalysis?.isDemoSimulation}
            onSelectDetection={(id) => {
              setSelectedDetectionId(id);
              // also find linked observation
              if (id) {
                const linkedObs = observations.find((o) => o.detectionIds.includes(id));
                if (linkedObs) setSelectedObservationId(linkedObs.id);
              }
            }}
            onSelectZone={(id) => setSelectedZoneId(id)}
          />

          {/* Active Analysis Metadata Footer */}
          {activeAnalysis && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold">Analysis Run: {activeAnalysis.id}</span>
                <span className="font-mono text-[11px] text-slate-400">
                  {new Date(activeAnalysis.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-slate-300">
                Model: <span className="font-mono text-cyan-400">{activeAnalysis.modelName}</span> •
                Provider: <span className="text-white">{activeAnalysis.provider}</span>
              </p>
              {activeAnalysis.summary && (
                <p className="mt-2 text-slate-300 italic">"{activeAnalysis.summary}"</p>
              )}
            </div>
          )}
        </div>

        {/* Right: Safety Observations & Human-in-the-Loop Review */}
        <div className="lg:col-span-5">
          <VisionObservationPanel
            observations={observations}
            detections={detections}
            proposals={proposals}
            selectedObservationId={selectedObservationId}
            onSelectObservation={(id) => {
              setSelectedObservationId(id);
              // also select first detection if available
              if (id) {
                const obs = observations.find((o) => o.id === id);
                if (obs && obs.detectionIds.length > 0) {
                  setSelectedDetectionId(obs.detectionIds[0]);
                }
              }
            }}
            onAcceptProposal={handleAcceptProposal}
            onEditProposal={(prop) => setEditingProposal(prop)}
            onRejectProposal={(prop) => setRejectingProposal(prop)}
            canReview={canReview}
          />
        </div>
      </div>

      {/* Modals */}
      {selectedMine && (
        <ZoneEditorModal
          isOpen={isZoneModalOpen}
          onClose={() => setIsZoneModalOpen(false)}
          mine={selectedMine}
          zones={zones}
          onSaveZone={handleSaveZone}
          onDeleteZone={handleDeleteZone}
          currentUserEmail={user?.email || 'officer@dgms.gov.in'}
        />
      )}

      <VisionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        analyses={pastAnalyses}
        onSelectAnalysis={(item) => loadAnalysis(item)}
        selectedAnalysisId={activeAnalysis?.id}
      />

      {editingProposal && (
        <EditProposalModal
          isOpen={true}
          proposal={editingProposal}
          onClose={() => setEditingProposal(null)}
          onConfirm={handleEditProposalConfirm}
        />
      )}

      {rejectingProposal && (
        <RejectProposalModal
          isOpen={true}
          mode="REJECT"
          proposal={rejectingProposal}
          onClose={() => setRejectingProposal(null)}
          onConfirm={handleRejectProposalConfirm}
        />
      )}
    </div>
  );
};

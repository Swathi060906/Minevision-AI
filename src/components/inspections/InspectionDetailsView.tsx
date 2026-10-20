import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  Building,
  User,
  Calendar,
  AlertTriangle,
  FileText,
  Plus,
  Shield,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit,
  UploadCloud,
  Check,
  BookOpen,
  Sparkles,
  Mic,
  Save,
  Radio,
  ShieldAlert,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import {
  Inspection,
  InspectionFinding,
  Evidence,
  Mine,
  InspectionStatus,
} from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../auth/AuthContext';
import { hasRoutePermission } from '../../auth/permissions';
import { FindingFormModal } from './FindingFormModal';
import { EvidenceFormModal } from './EvidenceFormModal';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';
import { VoiceToTextButton } from '../common/VoiceToTextButton';

interface InspectionDetailsViewProps {
  inspectionId: string;
  onBack: () => void;
  onNavigateToMine?: (mineId: string) => void;
  onNavigateToAiAnalysis?: (inspectionId: string) => void;
}

export const InspectionDetailsView: React.FC<InspectionDetailsViewProps> = ({
  inspectionId,
  onBack,
  onNavigateToMine,
  onNavigateToAiAnalysis,
}) => {
  const { user, logAuditEvent } = useAuth();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [mine, setMine] = useState<Mine | null>(null);
  const [findings, setFindings] = useState<InspectionFinding[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isFindingModalOpen, setIsFindingModalOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<InspectionFinding | null>(null);
  const [findingModalMode, setFindingModalMode] = useState<'create' | 'edit'>('create');
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  // On-Site Field Report & Voice Dictation state
  const [fieldReportNotes, setFieldReportNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);

  const loadInspectionData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const found = await dataService.getInspectionById(inspectionId);
      if (!found) {
        setInspection(null);
        return;
      }
      setInspection(found);
      setFieldReportNotes(found.notes || '');

      const [inspectionFindings, inspectionEvidence, mineRecord] = await Promise.all([
        dataService.getFindings(inspectionId),
        dataService.getEvidence(inspectionId),
        dataService.getMineById(found.mineId),
      ]);

      setFindings(inspectionFindings);
      setEvidenceList(inspectionEvidence);
      setMine(mineRecord || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading inspection data');
    } finally {
      setIsLoading(false);
    }
  }, [inspectionId]);

  useEffect(() => {
    loadInspectionData();
  }, [loadInspectionData]);

  const handleVoiceTranscript = (dictatedText: string) => {
    setFieldReportNotes((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${dictatedText}` : dictatedText;
    });
    setNotesSaveSuccess(false);
  };

  const handleSaveFieldReport = async () => {
    if (!inspection) return;
    try {
      setIsSavingNotes(true);
      const updated = await dataService.updateInspection(inspection.id, {
        notes: fieldReportNotes.trim(),
      });
      setInspection(updated);
      setNotesSaveSuccess(true);
      logAuditEvent('INSPECTION_UPDATED', {
        inspectionId: inspection.id,
        inspectionNumber: inspection.inspectionNumber,
        action: 'VOICE_REPORT_SAVED',
      });
      setTimeout(() => setNotesSaveSuccess(false), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save field report notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleStatusChange = async (newStatus: InspectionStatus) => {
    if (!inspection) return;
    try {
      const updated = await dataService.updateInspection(inspection.id, {
        status: newStatus,
      });
      setInspection(updated);
      logAuditEvent('INSPECTION_UPDATED', {
        inspectionId: inspection.id,
        inspectionNumber: inspection.inspectionNumber,
        newStatus,
      });
      await loadInspectionData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update inspection status');
    }
  };

  const handleQuickResolveFinding = async (finding: InspectionFinding) => {
    try {
      await dataService.updateFinding(finding.id, {
        status: 'RESOLVED',
        resolvedAt: new Date().toISOString(),
      });
      logAuditEvent('FINDING_UPDATED', {
        findingId: finding.id,
        action: 'QUICK_RESOLVE',
        inspectionId,
      });
      await loadInspectionData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to resolve finding');
    }
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading statutory inspection record and findings dossier..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorState message={error} onRetry={loadInspectionData} />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-8 text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
          <ClipboardList className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Inspection Record Not Found</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          The requested inspection dossier <span className="font-mono text-amber-400">{inspectionId}</span> does not exist or has been removed.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Statutory Inspections</span>
        </button>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';
  const isOfficer = user?.role === 'OFFICER';
  const canEdit = isAdmin || isOfficer;

  const criticalFindingsCount = findings.filter(
    (f) => f.severity === 'CRITICAL' || f.severity === 'HIGH'
  ).length;
  const openFindingsCount = findings.filter((f) => f.status === 'OPEN').length;

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
            <span>Statutory Inspections</span>
          </button>
          <div className="h-4 w-px bg-slate-700 hidden sm:block" />
          <span className="font-mono text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
            {inspection.inspectionNumber || inspection.id}
          </span>
          <StatusBadge type="inspection" value={inspection.status} size="sm" />
          <StatusBadge type="risk" value={inspection.riskLevel} size="sm" />
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            {inspection.status === 'Scheduled' && (
              <button
                type="button"
                onClick={() => handleStatusChange('In Progress')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-700 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/60"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Mark In Progress</span>
              </button>
            )}

            {inspection.status === 'In Progress' && (
              <button
                type="button"
                onClick={() => handleStatusChange('Completed')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark Completed</span>
              </button>
            )}

            {onNavigateToAiAnalysis && hasRoutePermission(user?.role, 'ai-analysis') && (
              <button
                type="button"
                onClick={() => onNavigateToAiAnalysis(inspection.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>AI Document Analysis</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const reportElement = document.getElementById('on-site-field-report');
                if (reportElement) {
                  reportElement.scrollIntoView({ behavior: 'smooth' });
                  reportElement.querySelector('textarea')?.focus();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors shadow-sm"
              title="Dictate observations and findings into field report"
            >
              <Mic className="h-3.5 w-3.5 text-amber-400" />
              <span>Voice Dictate</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedFinding(null);
                setFindingModalMode('create');
                setIsFindingModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Record Finding</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEvidenceModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <UploadCloud className="h-3.5 w-3.5 text-amber-400" />
              <span>Add Evidence</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Header Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-400" />
              <h1 className="text-xl font-bold text-white">
                {inspection.inspectionType} Dossier
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span>Target Colliery:</span>
              <span className="font-semibold text-white">{inspection.mineName}</span>
              {mine && onNavigateToMine && (
                <button
                  type="button"
                  onClick={() => onNavigateToMine(mine.id)}
                  className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-mono text-[11px] underline"
                >
                  <span>({mine.code || mine.mineCode})</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-500" />
                Lead Inspector: <strong className="text-slate-200">{inspection.inspector}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Audit Date: <strong className="text-slate-200">{inspection.date}</strong>
              </span>
              {inspection.scheduledDate && (
                <>
                  <span>•</span>
                  <span>Scheduled: {inspection.scheduledDate}</span>
                </>
              )}
            </div>
          </div>

          {/* Compliance & Findings Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3 text-center">
              <span className="text-[11px] text-slate-400 block">Compliance Score</span>
              <span
                className={`text-2xl font-bold mt-1 block ${
                  inspection.complianceScore >= 85
                    ? 'text-emerald-400'
                    : inspection.complianceScore >= 75
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {inspection.complianceScore}%
              </span>
            </div>

            <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3 text-center">
              <span className="text-[11px] text-slate-400 block">Total Findings</span>
              <span className="text-2xl font-bold text-white mt-1 block">
                {findings.length}
              </span>
            </div>

            <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3 text-center">
              <span className="text-[11px] text-slate-400 block">Critical / High</span>
              <span className={`text-2xl font-bold mt-1 block ${criticalFindingsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {criticalFindingsCount}
              </span>
            </div>

            <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-3 text-center">
              <span className="text-[11px] text-slate-400 block">Open Actions</span>
              <span className={`text-2xl font-bold mt-1 block ${openFindingsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {openFindingsCount}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* On-Site Field Report & Safety Observations (Voice-to-Text) */}
      <div id="on-site-field-report" className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Mic className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2">
                <span>On-Site Field Report & Safety Observations</span>
                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/20">
                  <Radio className="h-2.5 w-2.5 text-amber-400 animate-pulse" />
                  Voice-to-Text Active
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Dictate statutory observations, physical condition readings, and hazard findings directly into the report field while on-site.
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <VoiceToTextButton
                label="Dictate Finding / Report"
                variant="primary"
                onTranscript={handleVoiceTranscript}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="relative">
            <textarea
              rows={4}
              value={fieldReportNotes}
              onChange={(e) => {
                setFieldReportNotes(e.target.value);
                setNotesSaveSuccess(false);
              }}
              disabled={!canEdit}
              placeholder={
                canEdit
                  ? "Click 'Dictate Finding / Report' to speak directly into this report field using your microphone, or type your field notes here..."
                  : "No field observations recorded for this statutory inspection."
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950/80 p-3 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none leading-relaxed resize-y"
            />
          </div>

          {canEdit && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Supports live microphone speech recognition & DGMS mining terminology presets.</span>
                {notesSaveSuccess && (
                  <span className="flex items-center gap-1 font-semibold text-emerald-400 ml-2 animate-in fade-in">
                    <Check className="h-3.5 w-3.5" />
                    Report updated in statutory dossier
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {fieldReportNotes.trim() && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFinding({
                          id: '',
                          inspectionId: inspection.id,
                          mineId: inspection.mineId,
                          title: fieldReportNotes.trim().slice(0, 60),
                          description: fieldReportNotes.trim(),
                          category: 'SAFETY',
                          severity: 'MEDIUM',
                          status: 'OPEN',
                        });
                        setFindingModalMode('create');
                        setIsFindingModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-700/60 bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/50 transition-colors"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Create Finding from Dictation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFieldReportNotes('');
                        setNotesSaveSuccess(false);
                      }}
                      className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
                    >
                      Clear
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleSaveFieldReport}
                  disabled={isSavingNotes || fieldReportNotes === (inspection.notes || '')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    fieldReportNotes !== (inspection.notes || '')
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSavingNotes ? 'Saving...' : 'Save Field Report'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Findings Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              Statutory Findings & Observed Deficiencies ({findings.length})
            </h2>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setSelectedFinding(null);
                setFindingModalMode('create');
                setIsFindingModalOpen(true);
              }}
              className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-slate-700 border border-slate-700 self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Finding</span>
            </button>
          )}
        </div>

        {findings.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-8 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Non-Compliance Findings Recorded</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              This statutory inspection currently reflects zero open safety violations (100% compliance).
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {findings.map((f) => {
              const isCritical = f.severity === 'CRITICAL';
              const isHigh = f.severity === 'HIGH';

              return (
                <div
                  key={f.id}
                  className={`rounded-xl border p-4 text-xs transition-all space-y-3 ${
                    isCritical
                      ? 'border-rose-800/80 bg-rose-950/20'
                      : isHigh
                      ? 'border-amber-800/60 bg-amber-950/15'
                      : 'border-slate-800 bg-slate-950/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isCritical
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : isHigh
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-blue-950 text-blue-300 border-blue-800'
                          }`}
                        >
                          {f.severity}
                        </span>

                        <span className="font-bold text-white text-sm">
                          {f.title}
                        </span>

                        <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                          {f.category}
                        </span>

                        {f.ruleReference && (
                          <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            {f.ruleReference}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-300 text-xs leading-relaxed pt-1">
                        {f.description}
                      </p>

                      {f.knowledgeReference && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-medium pt-0.5">
                          <BookOpen className="h-3 w-3 text-amber-400 shrink-0" />
                          <span>Knowledge Base: <strong>{f.knowledgeReference}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start">
                      <span
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                          f.status === 'RESOLVED' || f.status === 'CLOSED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : f.status === 'IN_REVIEW'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}
                      >
                        {f.status}
                      </span>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFinding(f);
                            setFindingModalMode('edit');
                            setIsFindingModalOpen(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Edit Finding"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {f.correctiveAction && (
                    <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5 text-[11px] space-y-0.5">
                      <strong className="text-amber-400">Mandatory Corrective Directive:</strong>
                      <p className="text-slate-300">{f.correctiveAction}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                    <div className="flex items-center gap-3">
                      {f.dueDate && <span>Compliance Deadline: <strong className="text-slate-200">{f.dueDate}</strong></span>}
                      {f.resolvedAt && <span>Resolved On: <strong className="text-emerald-400">{new Date(f.resolvedAt).toLocaleDateString()}</strong></span>}
                    </div>

                    {canEdit && f.status === 'OPEN' && (
                      <button
                        type="button"
                        onClick={() => handleQuickResolveFinding(f)}
                        className="inline-flex items-center gap-1 rounded bg-emerald-950/80 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-900 border border-emerald-800"
                      >
                        <Check className="h-3 w-3" />
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Evidentiary Records & Chain of Custody */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              Evidentiary Records & Field Artifacts ({evidenceList.length})
            </h2>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsEvidenceModalOpen(true)}
              className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 border border-slate-700 self-start sm:self-auto"
            >
              <UploadCloud className="h-3.5 w-3.5 text-amber-400" />
              <span>Add Artifact Metadata</span>
            </button>
          )}
        </div>

        {evidenceList.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            No inspection evidence metadata currently registered for this audit dossier.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {evidenceList.map((ev) => (
              <div
                key={ev.id}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-semibold text-white block truncate max-w-xs" title={ev.fileName}>
                      {ev.fileName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Uploaded by {ev.uploadedBy} • {new Date(ev.capturedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-amber-400 border border-slate-700 shrink-0">
                    {ev.fileType}
                  </span>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">{ev.description}</p>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] text-slate-400 font-mono">
                  <span>Size: {(ev.fileSizeBytes / 1024).toFixed(1)} KB</span>
                  <span className="truncate max-w-[180px]" title={ev.storageReference}>
                    {ev.storageReference}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Finding Create/Edit Modal */}
      {isFindingModalOpen && (
        <FindingFormModal
          isOpen={isFindingModalOpen}
          mode={findingModalMode}
          initialFinding={selectedFinding}
          inspectionId={inspection.id}
          mineId={inspection.mineId}
          onClose={() => setIsFindingModalOpen(false)}
          onSuccess={async () => {
            await loadInspectionData();
          }}
        />
      )}

      {/* Evidence Modal */}
      {isEvidenceModalOpen && (
        <EvidenceFormModal
          isOpen={isEvidenceModalOpen}
          inspectionId={inspection.id}
          mineId={inspection.mineId}
          findings={findings}
          onClose={() => setIsEvidenceModalOpen(false)}
          onSuccess={async () => {
            await loadInspectionData();
          }}
        />
      )}
    </div>
  );
};

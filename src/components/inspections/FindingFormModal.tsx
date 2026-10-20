import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2, ShieldAlert, BookOpen } from 'lucide-react';
import {
  InspectionFinding,
  CreateFindingInput,
  UpdateFindingInput,
  FindingCategory,
  FindingSeverity,
  FindingStatus,
  ComplianceKnowledge,
} from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../auth/AuthContext';
import { VoiceToTextButton } from '../common/VoiceToTextButton';

interface FindingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inspectionId: string;
  mineId: string;
  initialFinding?: InspectionFinding | null;
  mode: 'create' | 'edit';
}

export const FindingFormModal: React.FC<FindingFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  inspectionId,
  mineId,
  initialFinding,
  mode,
}) => {
  const { logAuditEvent } = useAuth();
  const [title, setTitle] = useState(initialFinding?.title || '');
  const [category, setCategory] = useState<FindingCategory>(
    initialFinding?.category || 'SAFETY'
  );
  const [severity, setSeverity] = useState<FindingSeverity>(
    initialFinding?.severity || 'MEDIUM'
  );
  const [status, setStatus] = useState<FindingStatus>(
    initialFinding?.status || 'OPEN'
  );
  const [description, setDescription] = useState(
    initialFinding?.description || ''
  );
  const [ruleReference, setRuleReference] = useState(
    initialFinding?.ruleReference || 'CMR 2017 Reg. 153'
  );
  const [knowledgeList, setKnowledgeList] = useState<ComplianceKnowledge[]>([]);
  const [complianceKnowledgeId, setComplianceKnowledgeId] = useState<string>(
    initialFinding?.complianceKnowledgeId || ''
  );
  const [knowledgeReference, setKnowledgeReference] = useState<string>(
    initialFinding?.knowledgeReference || ''
  );
  const [correctiveAction, setCorrectiveAction] = useState(
    initialFinding?.correctiveAction || ''
  );
  const [dueDate, setDueDate] = useState(
    initialFinding?.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dataService.getComplianceKnowledge().then((list) => {
        setKnowledgeList(list);
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectKnowledge = (kId: string) => {
    setComplianceKnowledgeId(kId);
    const found = knowledgeList.find((k) => k.id === kId);
    if (found) {
      setKnowledgeReference(`${found.sourceReference} - ${found.shortTitle || found.title}`);
      if (!ruleReference || ruleReference === 'CMR 2017 Reg. 153') {
        setRuleReference(found.sourceReference);
      }
    } else {
      setKnowledgeReference('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Finding title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Detailed description of non-compliance is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === 'create') {
        const input: CreateFindingInput = {
          inspectionId,
          mineId,
          title: title.trim(),
          category,
          severity,
          status,
          description: description.trim(),
          ruleReference: ruleReference.trim() || undefined,
          complianceKnowledgeId: complianceKnowledgeId || undefined,
          knowledgeReference: knowledgeReference || undefined,
          correctiveAction: correctiveAction.trim() || undefined,
          dueDate: dueDate.trim() || undefined,
        };

        const created = await dataService.createFinding(input);

        logAuditEvent('FINDING_CREATED', {
          findingId: created.id,
          inspectionId,
          mineId,
          title: created.title,
          severity: created.severity,
          category: created.category,
        });
      } else if (initialFinding) {
        const update: UpdateFindingInput = {
          title: title.trim(),
          category,
          severity,
          status,
          description: description.trim(),
          ruleReference: ruleReference.trim() || undefined,
          complianceKnowledgeId: complianceKnowledgeId || undefined,
          knowledgeReference: knowledgeReference || undefined,
          correctiveAction: correctiveAction.trim() || undefined,
          dueDate: dueDate.trim() || undefined,
          resolvedAt: status === 'RESOLVED' || status === 'CLOSED' ? new Date().toISOString() : undefined,
        };

        await dataService.updateFinding(initialFinding.id, update);

        logAuditEvent('FINDING_UPDATED', {
          findingId: initialFinding.id,
          inspectionId,
          mineId,
          status,
          severity,
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save finding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {mode === 'create' ? 'Record Non-Compliance Finding' : 'Edit Inspection Finding'}
              </h3>
              <p className="text-xs text-slate-400">
                Statutory Hazard Identification & Corrective Directive
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-800/80 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Finding Title <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Methane telemetry sensor calibration lapse at Seam 3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FindingCategory)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-2.5 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="SAFETY">SAFETY</option>
                <option value="VENTILATION">VENTILATION</option>
                <option value="EQUIPMENT">EQUIPMENT</option>
                <option value="ENVIRONMENT">ENVIRONMENT</option>
                <option value="PPE">PPE</option>
                <option value="DOCUMENTATION">DOCUMENTATION</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Severity Tier</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as FindingSeverity)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-2.5 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="CRITICAL">CRITICAL (High Hazard)</option>
                <option value="HIGH">HIGH (Immediate Notice)</option>
                <option value="MEDIUM">MEDIUM (Corrective Due)</option>
                <option value="LOW">LOW (Advisory)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FindingStatus)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-2.5 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_REVIEW">IN REVIEW</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-medium">
                Detailed Observation Description <span className="text-amber-400">*</span>
              </label>
              <VoiceToTextButton
                size="sm"
                variant="secondary"
                label="Voice Dictate"
                onTranscript={(dictatedText) => {
                  setDescription((prev) => {
                    const trimmed = prev.trim();
                    return trimmed ? `${trimmed} ${dictatedText}` : dictatedText;
                  });
                }}
              />
            </div>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe exact physical location, observed condition, readings, and hazard risk (or click Voice Dictate to speak)..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          {/* Compliance Knowledge Base Linking */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Link Compliance Knowledge Record (RAG Knowledge Base)
            </label>
            <select
              value={complianceKnowledgeId}
              onChange={(e) => handleSelectKnowledge(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-2.5 text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="">-- Optional: Link to Knowledge Base Record --</option>
              {knowledgeList.map((k) => (
                <option key={k.id} value={k.id}>
                  [{k.sourceReference}] {k.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Statutory Rule Reference
              </label>
              <input
                type="text"
                value={ruleReference}
                onChange={(e) => setRuleReference(e.target.value)}
                placeholder="e.g. CMR 2017 Reg. 153"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Demonstration regulatory clause reference
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Compliance Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Mandatory Corrective Action
            </label>
            <textarea
              rows={2}
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              placeholder="Prescribed action required by colliery manager before next shift / audit..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-[11px] text-slate-400">
            <strong>Impact Note:</strong> Saving this finding will dynamically recalculate the parent inspection compliance score, risk level tier, and colliery compliance metrics.
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-800 pt-4">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? (
                <span>Saving Finding...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{mode === 'create' ? 'Record Finding' : 'Update Finding'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

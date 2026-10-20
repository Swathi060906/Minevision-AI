import React, { useState } from 'react';
import { X, FileText, AlertTriangle, CheckCircle2, UploadCloud } from 'lucide-react';
import { CreateEvidenceInput, InspectionFinding } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../auth/AuthContext';

interface EvidenceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inspectionId: string;
  mineId: string;
  findings?: InspectionFinding[];
}

export const EvidenceFormModal: React.FC<EvidenceFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  inspectionId,
  mineId,
  findings = [],
}) => {
  const { user, logAuditEvent } = useAuth();
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'IMAGE' | 'DOCUMENT' | 'SENSOR_DATA' | 'AUDIO' | 'VIDEO'>('IMAGE');
  const [fileSizeKb, setFileSizeKb] = useState('2450');
  const [description, setDescription] = useState('');
  const [findingId, setFindingId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fileName.trim()) {
      setError('File name is required.');
      return;
    }
    if (!description.trim()) {
      setError('Evidence description is required.');
      return;
    }

    const parsedKb = parseInt(fileSizeKb, 10);
    const fileSizeBytes = !isNaN(parsedKb) && parsedKb > 0 ? parsedKb * 1024 : 1024 * 500;

    try {
      setIsSubmitting(true);
      const input: CreateEvidenceInput = {
        inspectionId,
        mineId,
        findingId: findingId ? findingId : undefined,
        fileName: fileName.trim(),
        fileType,
        fileSizeBytes,
        storageReference: `evidence/${mineId}/${inspectionId}/${Date.now()}_${fileName.trim()}`,
        description: description.trim(),
        capturedAt: new Date().toISOString(),
        uploadedBy: user?.name || 'Authorized Inspector',
      };

      await dataService.addEvidence(input);

      logAuditEvent('FINDING_UPDATED', {
        action: 'EVIDENCE_ATTACHED',
        inspectionId,
        mineId,
        fileName: input.fileName,
        fileType: input.fileType,
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register evidence.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Register Inspection Evidence Metadata
              </h3>
              <p className="text-xs text-slate-400">
                DGMS Chain of Custody & Telemetry Records
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
              Evidence File Name <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. pit4_methane_sensor_housing_damaged.jpg"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Artifact Media Type</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="IMAGE">Image (Photograph / Scan)</option>
                <option value="DOCUMENT">Document (Statutory Log / PDF)</option>
                <option value="SENSOR_DATA">Sensor Data (CSV / JSON Stream)</option>
                <option value="AUDIO">Audio (Radio Dispatch)</option>
                <option value="VIDEO">Video (CCTV / Drone footage)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Estimated Size (KB)</label>
              <input
                type="number"
                min={1}
                value={fileSizeKb}
                onChange={(e) => setFileSizeKb(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {findings.length > 0 && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Associate with Non-Compliance Finding (Optional)
              </label>
              <select
                value={findingId}
                onChange={(e) => setFindingId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="">General Inspection Evidence</option>
                {findings.map((f) => (
                  <option key={f.id} value={f.id}>
                    [{f.severity}] {f.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Field Evidence Description <span className="text-amber-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the exact capture angle, observed defect, and evidentiary context..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          <div className="rounded-lg border border-blue-900/40 bg-blue-950/20 p-3 text-[11px] text-blue-200/90 leading-relaxed">
            <strong>Data Architecture Note:</strong> This form registers cryptographic custody metadata, timestamps, and storage pointers into the inspection repository. Binary file object uploads and AI-based image verification are integrated in the AI Analysis module.
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
                <span>Registering...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Register Evidence Metadata</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

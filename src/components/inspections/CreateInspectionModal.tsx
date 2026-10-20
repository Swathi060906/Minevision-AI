import React, { useState, useEffect } from 'react';
import { X, ClipboardList, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Mine, CreateInspectionInput, InspectionType } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../auth/AuthContext';

interface CreateInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newInspectionId: string) => void;
  preselectedMineId?: string;
}

export const CreateInspectionModal: React.FC<CreateInspectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedMineId,
}) => {
  const { user, logAuditEvent } = useAuth();
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>(preselectedMineId || '');
  const [inspectionType, setInspectionType] = useState<InspectionType>('Safety Inspection');
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [inspector, setInspector] = useState<string>(user?.name || 'Er. S. Chatterjee');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadMines = async () => {
      try {
        const list = await dataService.getMines({
          role: user?.role,
          mineIds: user?.mineIds,
        });
        setMines(list);
        if (!selectedMineId && list.length > 0) {
          setSelectedMineId(preselectedMineId || list[0].id);
        }
      } catch (err) {
        console.error('Failed to load mines for inspection scheduler', err);
      }
    };
    if (isOpen) {
      loadMines();
    }
  }, [isOpen, user, preselectedMineId, selectedMineId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMineId) {
      setError('Please select a target colliery for inspection.');
      return;
    }
    if (!scheduledDate) {
      setError('Scheduled inspection date is required.');
      return;
    }
    if (!inspector.trim()) {
      setError('Inspector name is required.');
      return;
    }

    const targetMine = mines.find((m) => m.id === selectedMineId);
    if (!targetMine) {
      setError('Selected colliery does not exist in registry.');
      return;
    }

    try {
      setIsSubmitting(true);
      const generatedNumber = `INS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const input: CreateInspectionInput = {
        mineId: targetMine.id,
        mineName: targetMine.name,
        inspectionNumber: generatedNumber,
        inspectionType,
        inspector: inspector.trim(),
        date: scheduledDate,
        scheduledDate,
        status: 'Scheduled',
        notes: notes.trim() || undefined,
        complianceScore: 100, // Starts at 100% until findings are added
        riskLevel: 'Low',
      };

      const created = await dataService.createInspection(input);

      logAuditEvent('INSPECTION_CREATED', {
        inspectionId: created.id,
        inspectionNumber: created.inspectionNumber,
        mineId: created.mineId,
        mineName: created.mineName,
        inspector: created.inspector,
        type: created.inspectionType,
      });

      onSuccess(created.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create inspection record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Schedule Statutory Colliery Inspection
              </h3>
              <p className="text-xs text-slate-400">
                DGMS Regulatory Compliance Dispatch Form IV
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Target Coal Colliery <span className="text-amber-400">*</span>
            </label>
            <select
              value={selectedMineId}
              onChange={(e) => setSelectedMineId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
            >
              {mines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code || m.mineCode}) — {m.state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Statutory Inspection Type <span className="text-amber-400">*</span>
            </label>
            <select
              value={inspectionType}
              onChange={(e) => setInspectionType(e.target.value as InspectionType)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="Safety Inspection">Safety Inspection (CMR 2017)</option>
              <option value="Ventilation & Air">Ventilation & Air Gas Telemetry</option>
              <option value="Environmental">Environmental Effluent & PM10 Dust</option>
              <option value="Equipment">HEMM Machinery Brake Fail-Safe</option>
              <option value="PPE Compliance">PPE Compliance & Personnel Safety</option>
              <option value="Statutory Audit">Comprehensive Statutory Colliery Audit</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Audit / Scheduled Date <span className="text-amber-400">*</span>
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Lead Inspector Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                placeholder="e.g. Er. Rajeshwar Singh (DGMS)"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Initial Scope & Field Observations
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specify initial statutory directive, targeted pit seams, and special areas for inspection..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-[11px] text-slate-400">
            <strong>Audit Ledger Notice:</strong> Upon creation, a persistent statutory inspection record will be generated in the repository with an auto-generated DGMS reference number. Findings and evidence can be attached subsequently.
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
                <span>Scheduling...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Dispatch Statutory Inspection</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, AlertCircle, HelpCircle } from 'lucide-react';
import { ProposedFinding } from '../../data/models/ProposedFinding';

interface RejectProposalModalProps {
  proposal: ProposedFinding;
  isOpen: boolean;
  mode: 'REJECT' | 'MORE_EVIDENCE';
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
}

export const RejectProposalModal: React.FC<RejectProposalModalProps> = ({
  proposal,
  isOpen,
  mode,
  onClose,
  onConfirm,
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isReject = mode === 'REJECT';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError(
        isReject
          ? 'Please enter a justification for rejecting this proposed finding.'
          : 'Please describe what additional evidence or measurement is required.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(notes.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            {isReject ? (
              <AlertCircle className="h-5 w-5 text-red-400" />
            ) : (
              <HelpCircle className="h-5 w-5 text-amber-400" />
            )}
            <h3 className="text-base font-bold text-white">
              {isReject ? 'Reject Proposed Finding' : 'Request Additional Evidence'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
            <span className="font-semibold text-slate-400 block mb-1">Target Finding:</span>
            <span className="font-bold text-white">{proposal.title}</span>
            <p className="text-slate-400 mt-1 line-clamp-2">{proposal.description}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isReject ? 'Rejection Reason & Justification' : 'Evidence Clarification Request'}
            </label>
            <textarea
              rows={4}
              placeholder={
                isReject
                  ? 'e.g. Physical examination confirmed stone dusting barrier was already replenished on afternoon shift; reading was from temporary inactive section.'
                  : 'e.g. Requesting second methanometer calibration certificate and shift log for Seam 3 heading 4 before confirming finding.'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold ${
                isReject
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              } disabled:opacity-50`}
            >
              {isSubmitting
                ? 'Processing...'
                : isReject
                ? 'Confirm Rejection'
                : 'Submit Evidence Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

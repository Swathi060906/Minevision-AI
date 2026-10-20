import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';
import { ProposedFinding, EditAndAcceptProposalInput } from '../../data/models/ProposedFinding';
import { FindingCategory, FindingSeverity } from '../../data/models/InspectionFinding';

interface EditProposalModalProps {
  proposal: ProposedFinding;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (input: EditAndAcceptProposalInput) => Promise<void>;
}

export const EditProposalModal: React.FC<EditProposalModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [title, setTitle] = useState(proposal.title);
  const [description, setDescription] = useState(proposal.description);
  const [category, setCategory] = useState<FindingCategory>(proposal.category);
  const [severity, setSeverity] = useState<FindingSeverity>(proposal.severitySuggestion);
  const [correctiveAction, setCorrectiveAction] = useState(
    proposal.recommendedCorrectiveAction || ''
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm({
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        correctiveAction: correctiveAction.trim() || undefined,
        dueDate: dueDate || undefined,
        reviewNotes: reviewNotes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to accept finding');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Officer Review Gate
            </span>
            <h3 className="text-lg font-bold text-white">Edit & Accept Proposed Finding</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Finding Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FindingCategory)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="VENTILATION">VENTILATION</option>
                <option value="SAFETY">SAFETY</option>
                <option value="ELECTRICAL">ELECTRICAL</option>
                <option value="PPE">PPE</option>
                <option value="EQUIPMENT">EQUIPMENT</option>
                <option value="DOCUMENTATION">DOCUMENTATION</option>
                <option value="ENVIRONMENT">ENVIRONMENT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as FindingSeverity)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH (Will trigger Alert)</option>
                <option value="CRITICAL">CRITICAL (Will trigger Critical Alert)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Detailed Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Recommended Corrective Action
              </label>
              <input
                type="text"
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Remediation Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Officer Review Notes / Edit Justification
            </label>
            <input
              type="text"
              placeholder="e.g. Adjusted severity from HIGH to CRITICAL based on physical overman confirmation"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
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
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              {isSubmitting ? 'Creating Official Finding...' : 'Confirm & Create Finding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

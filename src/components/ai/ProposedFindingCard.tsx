import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  BookOpen,
  Edit3,
  Check,
  X,
  Sparkles,
  Info,
  Copy,
} from 'lucide-react';
import { ProposedFinding } from '../../data/models/ProposedFinding';
import { ExtractedFact } from '../../data/models/ExtractedFact';
import { InspectionFinding } from '../../data/models/InspectionFinding';

interface ProposedFindingCardProps {
  proposal: ProposedFinding;
  allFacts: ExtractedFact[];
  existingFindings?: InspectionFinding[];
  isOfficerOrAdmin: boolean;
  onAccept: (proposalId: string) => Promise<void>;
  onOpenEditModal: (proposal: ProposedFinding) => void;
  onOpenRejectModal: (proposal: ProposedFinding, mode: 'REJECT' | 'MORE_EVIDENCE') => void;
  onOpenExplainModal: (proposal: ProposedFinding) => void;
  onViewSourceDoc?: (knowledgeId: string) => void;
}

export const ProposedFindingCard: React.FC<ProposedFindingCardProps> = ({
  proposal,
  allFacts,
  existingFindings = [],
  isOfficerOrAdmin,
  onAccept,
  onOpenEditModal,
  onOpenRejectModal,
  onOpenExplainModal,
  onViewSourceDoc,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  // Duplicate finding check
  const duplicateFinding = existingFindings.find(
    (f) =>
      f.title.toLowerCase().trim() === proposal.title.toLowerCase().trim() ||
      (proposal.sourceReference && f.ruleReference === proposal.sourceReference)
  );

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'POTENTIAL_NON_COMPLIANCE':
        return {
          label: 'Potential Non-Compliance',
          style: 'bg-red-500/15 text-red-300 border-red-500/30',
          icon: ShieldAlert,
        };
      case 'SUPPORTED_COMPLIANT':
        return {
          label: 'Supported Compliant',
          style: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          icon: CheckCircle2,
        };
      case 'INSUFFICIENT_EVIDENCE':
        return {
          label: 'Insufficient Evidence',
          style: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
          icon: HelpCircle,
        };
      case 'MANUAL_REVIEW_REQUIRED':
      default:
        return {
          label: 'Manual Review Required',
          style: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          icon: AlertTriangle,
        };
    }
  };

  const outcomeInfo = getOutcomeBadge(proposal.analysisOutcome);
  const OutcomeIcon = outcomeInfo.icon;

  const handleQuickAccept = async () => {
    try {
      setIsAccepting(true);
      await onAccept(proposal.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div
      className={`rounded-xl border transition-all ${
        proposal.reviewStatus === 'ACCEPTED' || proposal.reviewStatus === 'EDITED_AND_ACCEPTED'
          ? 'border-emerald-500/40 bg-emerald-950/10'
          : proposal.reviewStatus === 'REJECTED'
          ? 'border-red-500/30 bg-red-950/10 opacity-75'
          : proposal.reviewStatus === 'NEEDS_MORE_EVIDENCE'
          ? 'border-amber-500/30 bg-amber-950/10'
          : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
      } p-5 space-y-4`}
    >
      {/* Top Badges & Meta */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Suggestion */}
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${getSeverityStyle(
              proposal.severitySuggestion
            )}`}
          >
            {proposal.severitySuggestion} RISK
          </span>

          {/* Category */}
          <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
            {proposal.category}
          </span>

          {/* Analysis Outcome */}
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${outcomeInfo.style}`}
          >
            <OutcomeIcon className="h-3 w-3" />
            <span>{outcomeInfo.label}</span>
          </span>

          {/* Confidence */}
          <span className="text-[11px] font-medium text-slate-400">
            Confidence: <strong className="text-slate-200">{proposal.confidence}</strong>
          </span>
        </div>

        {/* Review Status Pill */}
        <div>
          {proposal.reviewStatus === 'PENDING_REVIEW' ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400">
              <Clock className="h-3 w-3" />
              Pending Officer Review
            </span>
          ) : proposal.reviewStatus === 'ACCEPTED' ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Accepted
            </span>
          ) : proposal.reviewStatus === 'EDITED_AND_ACCEPTED' ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
              <Edit3 className="h-3 w-3" />
              Edited & Accepted
            </span>
          ) : proposal.reviewStatus === 'REJECTED' ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-400">
              <X className="h-3 w-3" />
              Rejected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400">
              <HelpCircle className="h-3 w-3" />
              Needs More Evidence
            </span>
          )}
        </div>
      </div>

      {/* Synthetic Demo Warning Banner */}
      {proposal.isSyntheticDemo && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="font-semibold">
            SYNTHETIC DEMONSTRATION KNOWLEDGE — NOT OFFICIAL REGULATORY TEXT
          </span>
        </div>
      )}

      {/* Duplicate Warning if already recorded in inspection */}
      {duplicateFinding && proposal.reviewStatus === 'PENDING_REVIEW' && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-300">
          <Copy className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            <strong>Potential Duplicate:</strong> Finding "{duplicateFinding.title}" is already
            recorded in this inspection. Review before creating a duplicate record.
          </span>
        </div>
      )}

      {/* Title & Description */}
      <div>
        <h4 className="text-base font-bold text-white tracking-tight">{proposal.title}</h4>
        <p className="mt-1 text-xs text-slate-300 leading-relaxed">{proposal.description}</p>
      </div>

      {/* Extracted Evidence Block */}
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
            <FileText className="h-3.5 w-3.5" />
            <span>Extracted Document Evidence</span>
          </div>
          {proposal.sourceSection && (
            <span className="text-[10px] text-slate-400 font-mono">
              Section: {proposal.sourceSection}
            </span>
          )}
        </div>
        <div className="font-mono text-slate-200 text-xs bg-slate-900/90 rounded p-2 border border-slate-800/80">
          "{proposal.evidenceText}"
        </div>
      </div>

      {/* Grounded Regulatory Source Card */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Retrieved Compliance Standard</span>
          </div>
          {proposal.verificationStatus && (
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                proposal.verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {proposal.verificationStatus}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-2 text-xs">
          <span className="font-bold text-white">
            {proposal.sourceTitle || (proposal.isSyntheticDemo ? 'Synthetic Demonstration Reference' : 'Regulatory Standard')}
          </span>
          <span className="font-mono text-xs font-semibold text-indigo-300">
            {proposal.sourceReference || (proposal.isSyntheticDemo ? 'DEMO-SAFETY-001' : 'Compliance Reference')}
          </span>
          {proposal.sectionOrClause && (
            <span className="text-slate-400 text-[11px] font-mono">
              ({proposal.sectionOrClause})
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-400">
          Authority: {proposal.authority || (proposal.isSyntheticDemo ? 'Demonstration Authority' : 'Competent Safety Authority')}
        </p>

        {proposal.knowledgeId && onViewSourceDoc && (
          <button
            type="button"
            onClick={() => onViewSourceDoc(proposal.knowledgeId!)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 pt-1"
          >
            <ExternalLink className="h-3 w-3" />
            Inspect regulation in Knowledge Base
          </button>
        )}
      </div>

      {/* Expandable Reasoning Details */}
      {isExpanded && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs space-y-2">
          <div>
            <span className="font-semibold text-slate-300 block mb-1">Grounded Reasoning:</span>
            <p className="text-slate-400 leading-relaxed">{proposal.reasoningSummary}</p>
          </div>
          {proposal.recommendedCorrectiveAction && (
            <div>
              <span className="font-semibold text-amber-400 block mb-0.5">
                Recommended Corrective Action:
              </span>
              <p className="text-slate-300 leading-relaxed">
                {proposal.recommendedCorrectiveAction}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Audit Banner if Reviewed */}
      {proposal.reviewStatus !== 'PENDING_REVIEW' && (
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Decision by: <strong className="text-white">{proposal.reviewedBy || 'Officer'}</strong>
            </span>
            <span>{proposal.reviewedAt ? new Date(proposal.reviewedAt).toLocaleString() : ''}</span>
          </div>
          {proposal.reviewNotes && (
            <p className="text-[11px] text-slate-400 italic">"{proposal.reviewNotes}"</p>
          )}
          {proposal.officialFindingId && (
            <div className="text-[11px] text-emerald-400 font-semibold pt-1">
              Official Finding ID: <span className="font-mono">{proposal.officialFindingId}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer Controls & Human Review Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
        <div className="flex items-center gap-2">
          {/* Explainability Button */}
          <button
            type="button"
            onClick={() => onOpenExplainModal(proposal)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Why was this flagged?
          </button>

          {/* Toggle details */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> Less details
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" /> More details
              </>
            )}
          </button>
        </div>

        {/* Action Buttons for Authorized Officers/Admins */}
        {isOfficerOrAdmin && proposal.reviewStatus === 'PENDING_REVIEW' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenRejectModal(proposal, 'MORE_EVIDENCE')}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Needs Evidence
            </button>
            <button
              type="button"
              onClick={() => onOpenRejectModal(proposal, 'REJECT')}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => onOpenEditModal(proposal)}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
            >
              Edit & Accept
            </button>
            <button
              type="button"
              disabled={isAccepting}
              onClick={handleQuickAccept}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {isAccepting ? 'Accepting...' : 'Accept'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

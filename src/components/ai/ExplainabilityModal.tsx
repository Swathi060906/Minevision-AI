import React from 'react';
import {
  X,
  FileText,
  Binary,
  BookOpen,
  Brain,
  ShieldCheck,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { ProposedFinding } from '../../data/models/ProposedFinding';
import { ExtractedFact } from '../../data/models/ExtractedFact';

interface ExplainabilityModalProps {
  proposal: ProposedFinding;
  facts: ExtractedFact[];
  isOpen: boolean;
  onClose: () => void;
  onViewSourceDoc?: (knowledgeId: string) => void;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({
  proposal,
  facts,
  isOpen,
  onClose,
  onViewSourceDoc,
}) => {
  if (!isOpen) return null;

  // Find matching extracted facts
  const matchedFacts = facts.filter(
    (f) =>
      proposal.evidenceFactIds?.includes(f.id) ||
      proposal.evidenceText?.toLowerCase().includes(f.label.toLowerCase()) ||
      proposal.evidenceText?.toLowerCase().includes(f.value.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-400 border border-sky-500/20">
                Grounding & Explainability
              </span>
              <span className="text-xs text-slate-400">DGMS / CMR 2017 Audit Trail</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">Why was this finding flagged?</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Target Finding Summary */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {proposal.category}
            </span>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                proposal.severitySuggestion === 'CRITICAL'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : proposal.severitySuggestion === 'HIGH'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              Suggested Severity: {proposal.severitySuggestion}
            </span>
          </div>
          <h4 className="text-base font-bold text-white mt-1">{proposal.title}</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{proposal.description}</p>
        </div>

        {/* 6-Stage Traceability Pipeline */}
        <div className="mt-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Automated Audit & Verification Traceability Chain
          </h4>

          {/* Stage 1: Document Evidence */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 mb-2 text-slate-300">
              <FileText className="h-4 w-4 text-sky-400" />
              <span className="text-xs font-bold text-sky-300">Stage 1: Document Evidence</span>
              {proposal.sourceSection && (
                <span className="text-[10px] text-slate-400">({proposal.sourceSection})</span>
              )}
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-200 font-mono leading-relaxed">
              "{proposal.evidenceText || 'Physical inspection record entry'}"
            </div>
          </div>

          {/* Stage 2: Extracted Structured Facts */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 mb-2 text-slate-300">
              <Binary className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">
                Stage 2: Extracted Structured Parameter(s)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(matchedFacts.length > 0 ? matchedFacts : facts.slice(0, 2)).map((fact) => (
                <div
                  key={fact.id}
                  className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{fact.label}</span>
                    <span className="text-[10px] font-bold text-emerald-400">
                      {fact.confidence} CONFIDENCE
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {fact.value} {fact.unit || ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stage 3: Retrieved Regulation */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300">
                  Stage 3: Retrieved Statutory Requirement (RAG Retrieval)
                </span>
              </div>
              {proposal.verificationStatus && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    proposal.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {proposal.verificationStatus}
                </span>
              )}
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                <span className="font-semibold text-slate-200">
                  {proposal.sourceTitle || 'Coal Mines Regulations 2017'}
                </span>
                <span className="font-mono text-indigo-400 font-bold">
                  {proposal.sourceReference || 'DGMS CMR-2017'}
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Authority: {proposal.authority || 'Directorate General of Mines Safety (DGMS)'}
                {proposal.sectionOrClause && ` | ${proposal.sectionOrClause}`}
              </p>
              {proposal.knowledgeId && onViewSourceDoc && (
                <button
                  type="button"
                  onClick={() => onViewSourceDoc(proposal.knowledgeId!)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View complete regulatory clause in Knowledge Base
                </button>
              )}
            </div>
          </div>

          {/* Stage 4: AI Grounded Evaluation */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 mb-2 text-slate-300">
              <Brain className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-bold text-purple-300">
                Stage 4: Grounded Compliance Reasoning
              </span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300 leading-relaxed space-y-2">
              <p>{proposal.reasoningSummary}</p>
              {proposal.recommendedCorrectiveAction && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-300">
                  <span className="font-bold text-amber-400">Suggested Action: </span>
                  {proposal.recommendedCorrectiveAction}
                </div>
              )}
            </div>
          </div>

          {/* Stage 5: Human Review Gate */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">
                Stage 5: Statutory Human Review Gate
              </span>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              {proposal.reviewStatus === 'PENDING_REVIEW' ? (
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    Awaiting Compliance Officer review. This proposed finding has NOT been recorded
                    as an official inspection finding.
                  </span>
                </div>
              ) : proposal.reviewStatus === 'ACCEPTED' ||
                proposal.reviewStatus === 'EDITED_AND_ACCEPTED' ? (
                <div className="space-y-1 text-emerald-400">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle className="h-4 w-4" />
                    <span>Official Inspection Finding Created ({proposal.reviewStatus})</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Reviewed by: <span className="text-slate-200">{proposal.reviewedBy}</span> on{' '}
                    {proposal.reviewedAt ? new Date(proposal.reviewedAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
              ) : (
                <div className="text-red-400 font-semibold">
                  Status: {proposal.reviewStatus}
                  {proposal.reviewNotes && ` (${proposal.reviewNotes})`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
          >
            Close Traceability View
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Inbox,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { ProposedFinding } from '../../data/models/ProposedFinding';
import { ExtractedFact } from '../../data/models/ExtractedFact';
import { InspectionFinding } from '../../data/models/InspectionFinding';
import { ProposedFindingCard } from './ProposedFindingCard';

interface GlobalReviewQueueViewProps {
  proposals: ProposedFinding[];
  allFacts: ExtractedFact[];
  allFindings: InspectionFinding[];
  isOfficerOrAdmin: boolean;
  onAccept: (proposalId: string) => Promise<void>;
  onOpenEditModal: (proposal: ProposedFinding) => void;
  onOpenRejectModal: (proposal: ProposedFinding, mode: 'REJECT' | 'MORE_EVIDENCE') => void;
  onOpenExplainModal: (proposal: ProposedFinding) => void;
  onViewSourceDoc?: (knowledgeId: string) => void;
}

export const GlobalReviewQueueView: React.FC<GlobalReviewQueueViewProps> = ({
  proposals,
  allFacts,
  allFindings,
  isOfficerOrAdmin,
  onAccept,
  onOpenEditModal,
  onOpenRejectModal,
  onOpenExplainModal,
  onViewSourceDoc,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('PENDING_REVIEW');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const pendingCount = proposals.filter((p) => p.reviewStatus === 'PENDING_REVIEW').length;
  const acceptedCount = proposals.filter(
    (p) => p.reviewStatus === 'ACCEPTED' || p.reviewStatus === 'EDITED_AND_ACCEPTED'
  ).length;

  const filteredProposals = proposals.filter((p) => {
    if (filterStatus !== 'ALL' && p.reviewStatus !== filterStatus) {
      return false;
    }
    if (filterSeverity !== 'ALL' && p.severitySuggestion !== filterSeverity) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.sourceReference && p.sourceReference.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Metric summary banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-4">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
            <span>Pending Officer Review</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{pendingCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Requires statutory compliance sign-off</p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
            <span>Accepted Official Findings</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{acceptedCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Converted into statutory mine findings</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>Total AI Proposals</span>
            <Inbox className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{proposals.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Grounded against CMR 2017 standards</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search proposals by title, standard, or evidence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
            <button
              onClick={() => setFilterStatus('PENDING_REVIEW')}
              className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                filterStatus === 'PENDING_REVIEW'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('ACCEPTED')}
              className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                filterStatus === 'ACCEPTED'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setFilterStatus('REJECTED')}
              className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                filterStatus === 'REJECTED'
                  ? 'bg-red-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Rejected
            </button>
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                filterStatus === 'ALL'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
          </div>

          {/* Severity filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 py-1.5 px-2.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-500">
            <Inbox className="h-10 w-10 mx-auto mb-3 text-slate-600" />
            <h4 className="text-sm font-semibold text-slate-300">No proposals in this view</h4>
            <p className="text-xs text-slate-500 mt-1">
              All proposed findings have either been reviewed or match other criteria.
            </p>
          </div>
        ) : (
          filteredProposals.map((proposal) => (
            <ProposedFindingCard
              key={proposal.id}
              proposal={proposal}
              allFacts={allFacts}
              existingFindings={allFindings}
              isOfficerOrAdmin={isOfficerOrAdmin}
              onAccept={onAccept}
              onOpenEditModal={onOpenEditModal}
              onOpenRejectModal={onOpenRejectModal}
              onOpenExplainModal={onOpenExplainModal}
              onViewSourceDoc={onViewSourceDoc}
            />
          ))
        )}
      </div>
    </div>
  );
};

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3,
  ShieldCheck,
  ExternalLink,
  Info,
  Clock,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { SafetyObservation } from '../../data/models/SafetyObservation';
import { VisionDetection } from '../../data/models/VisionDetection';
import { ProposedFinding } from '../../data/models/ProposedFinding';

interface VisionObservationPanelProps {
  observations: SafetyObservation[];
  detections: VisionDetection[];
  proposals: ProposedFinding[];
  selectedObservationId?: string | null;
  onSelectObservation?: (id: string | null) => void;
  onAcceptProposal?: (proposalId: string) => Promise<void>;
  onEditProposal?: (proposal: ProposedFinding) => void;
  onRejectProposal?: (proposal: ProposedFinding) => void;
  canReview?: boolean;
}

export const VisionObservationPanel: React.FC<VisionObservationPanelProps> = ({
  observations,
  detections,
  proposals,
  selectedObservationId,
  onSelectObservation,
  onAcceptProposal,
  onEditProposal,
  onRejectProposal,
  canReview = false,
}) => {
  // Detection category summary counts
  const personsCount = detections.filter((d) => d.type === 'PERSON').length;
  const hardHatsCount = detections.filter((d) => d.type === 'HARD_HAT').length;
  const vestsCount = detections.filter((d) => d.type === 'SAFETY_VEST').length;
  const hemmCount = detections.filter((d) => d.type === 'HEMM' || d.type === 'VEHICLE').length;

  const proposalMap = new Map<string, ProposedFinding>(proposals.map((p) => [p.id, p]));

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Entity Detection Summary Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Scene Entity Inventory
        </h4>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
            <span className="block text-lg font-bold text-cyan-400">{personsCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Workers</span>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
            <span className="block text-lg font-bold text-emerald-400">{hardHatsCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Hard Hats</span>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
            <span className="block text-lg font-bold text-amber-400">{vestsCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Vests</span>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
            <span className="block text-lg font-bold text-purple-400">{hemmCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">HEMM</span>
          </div>
        </div>
      </div>

      {/* Safety Observations List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Safety Observations ({observations.length})
          </h4>
          <span className="text-[11px] text-slate-400">AI assists, humans decide</span>
        </div>

        {observations.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-emerald-400 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-300">No safety observations detected</p>
            <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
              No safety observations were generated from this analysis. This does not by itself establish that the scene is compliant.
            </p>
          </div>
        ) : (
          observations.map((obs) => {
            const isSelected = selectedObservationId === obs.id;
            const linkedProposal = obs.proposedFindingId
              ? proposalMap.get(obs.proposedFindingId)
              : undefined;

            return (
              <div
                key={obs.id}
                onClick={() => onSelectObservation?.(isSelected ? null : obs.id)}
                className={`rounded-xl border p-4 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-slate-900 ring-1 ring-amber-500/40'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {/* Header with Title & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getSeverityBadge(
                          obs.severity
                        )}`}
                      >
                        {obs.severity}
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                        {obs.confidenceLevel} CONFIDENCE ({(obs.confidence * 100).toFixed(0)}%)
                      </span>
                      {obs.isSyntheticDemo && (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                          DEMO
                        </span>
                      )}
                    </div>
                    <h5 className="text-sm font-semibold text-white">{obs.title}</h5>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-2 text-xs leading-relaxed text-slate-300">{obs.description}</p>

                {/* Spatial Context Detail */}
                {obs.spatialDetails && (
                  <div className="mt-2.5 rounded-md bg-slate-950/70 border border-slate-800/80 px-2.5 py-1.5 text-[11px] text-slate-400 font-mono flex flex-wrap gap-x-3 gap-y-1">
                    {obs.spatialDetails.zoneName && (
                      <span>Zone: {obs.spatialDetails.zoneName}</span>
                    )}
                    {obs.spatialDetails.distanceMetersEstimated !== undefined && (
                      <span>
                        Est. Distance: {obs.spatialDetails.distanceMetersEstimated}m (Threshold: {obs.spatialDetails.thresholdMeters}m)
                      </span>
                    )}
                    <span>Detections Linked: {obs.detectionIds.length}</span>
                  </div>
                )}

                {/* Phase 4 RAG Regulatory Grounding */}
                {linkedProposal && (
                  <div className="mt-3 border-t border-slate-800/80 pt-3 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Regulatory Grounding (RAG)</span>
                    </div>

                    {linkedProposal.analysisOutcome === 'MANUAL_REVIEW_REQUIRED' ? (
                      <div className="rounded border border-amber-500/30 bg-amber-950/20 p-2 text-amber-300 text-[11px]">
                        <p className="font-medium">No verified regulatory match</p>
                        <p className="text-slate-400 mt-0.5">
                          The existing verified knowledge base does not contain sufficient information to determine the statutory requirement. Manual review is required.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded border border-slate-800 bg-slate-950/60 p-2 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="font-semibold text-emerald-400">
                            {linkedProposal.sourceReference || 'DGMS Statutory Standard'}
                          </span>
                          <span className="text-slate-400">{linkedProposal.authority || 'DGMS'}</span>
                        </div>
                        {linkedProposal.sourceTitle && (
                          <p className="text-slate-300 italic">"{linkedProposal.sourceTitle}"</p>
                        )}
                        <p className="text-slate-400 line-clamp-2">
                          {linkedProposal.recommendedCorrectiveAction}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Review Actions (Human-in-the-Loop) */}
                {canReview && linkedProposal && linkedProposal.reviewStatus === 'PENDING_REVIEW' && (
                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-800/80 pt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRejectProposal?.(linkedProposal);
                      }}
                      className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-slate-700 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProposal?.(linkedProposal);
                      }}
                      className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-medium text-amber-400 hover:bg-slate-700 transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit & Accept
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptProposal?.(linkedProposal.id);
                      }}
                      className="inline-flex items-center gap-1 rounded bg-amber-500 px-2.5 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Accept Proposal
                    </button>
                  </div>
                )}

                {/* Reviewed Status Badge */}
                {linkedProposal && linkedProposal.reviewStatus !== 'PENDING_REVIEW' && (
                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px]">
                    <span className="text-slate-400">Review Decision:</span>
                    <span
                      className={`font-semibold uppercase tracking-wider ${
                        linkedProposal.reviewStatus === 'ACCEPTED' ||
                        linkedProposal.reviewStatus === 'EDITED_AND_ACCEPTED'
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {linkedProposal.reviewStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

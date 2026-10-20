import React from 'react';
import {
  BookOpen,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Archive,
  Edit,
  Tag,
} from 'lucide-react';
import { ComplianceKnowledge, UserRole } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface KnowledgeCardProps {
  knowledge: ComplianceKnowledge;
  userRole?: UserRole;
  onSelect: (knowledge: ComplianceKnowledge) => void;
  onTestRag?: (query: string) => void;
  onEdit?: (knowledge: ComplianceKnowledge) => void;
  onArchive?: (knowledge: ComplianceKnowledge) => void;
  onToggleVerification?: (knowledge: ComplianceKnowledge) => void;
}

export const KnowledgeCard: React.FC<KnowledgeCardProps> = ({
  knowledge,
  userRole,
  onSelect,
  onTestRag,
  onEdit,
  onArchive,
  onToggleVerification,
}) => {
  const isAdmin = userRole === 'ADMIN';
  const isVerified = knowledge.verificationStatus === 'VERIFIED';
  const isNeedsReview = knowledge.verificationStatus === 'NEEDS_REVIEW';

  return (
    <div
      className={`rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
        isVerified
          ? 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
          : isNeedsReview
          ? 'border-amber-500/30 bg-slate-900/90 hover:border-amber-500/50'
          : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
      }`}
    >
      {/* Synthetic Demo Banner if applicable */}
      {knowledge.isSyntheticDemo && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-300">
          <span className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            SYNTHETIC DEMONSTRATION KNOWLEDGE — NOT OFFICIAL REGULATORY TEXT
          </span>
          <span className="font-mono text-[10px] text-amber-400/80 bg-amber-500/20 px-1.5 py-0.5 rounded">DEMO</span>
        </div>
      )}

      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              {knowledge.sourceReference}
            </span>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {knowledge.category}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <StatusBadge type="verification" value={knowledge.verificationStatus} size="sm" />
            <StatusBadge type="knowledgeStatus" value={knowledge.status} size="sm" />
          </div>
        </div>

        {/* Title & Short Title */}
        <div className="mt-3">
          <h3
            onClick={() => onSelect(knowledge)}
            className="text-base font-bold text-white hover:text-amber-400 transition-colors cursor-pointer leading-snug"
          >
            {knowledge.title}
          </h3>
          {knowledge.shortTitle && knowledge.shortTitle !== knowledge.title && (
            <p className="text-xs text-slate-400 mt-0.5">{knowledge.shortTitle}</p>
          )}
        </div>

        {/* Description / Summary */}
        <p className="mt-2.5 text-xs text-slate-300 leading-relaxed line-clamp-3">
          {knowledge.summary || knowledge.description}
        </p>

        {/* Authority & Document Details */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
          <div>
            <span className="text-slate-500 block">Authority:</span>
            <span className="font-medium text-slate-300 truncate block" title={knowledge.authority}>
              {knowledge.authority}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Type & Version:</span>
            <span className="font-medium text-slate-300 truncate block">
              {knowledge.documentType} (v{knowledge.documentVersion})
            </span>
          </div>
        </div>

        {/* Applicable Scope Pills & Chunks */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60 text-[10px]">
          <span className="text-slate-500">Mines:</span>
          {knowledge.applicableMineTypes.map((mt) => (
            <span key={mt} className="rounded bg-slate-800/80 px-1.5 py-0.5 text-slate-300 border border-slate-700/60">
              {mt}
            </span>
          ))}

          <span className="text-slate-500 ml-2">Chunks:</span>
          <span className="font-mono text-amber-400 font-semibold">
            {knowledge.chunkIds?.length || 0}
          </span>
        </div>

        {/* Tags */}
        {knowledge.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1 pt-1">
            {knowledge.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800"
              >
                <Tag className="h-2.5 w-2.5 text-slate-500" />
                <span>{t}</span>
              </span>
            ))}
            {knowledge.tags.length > 4 && (
              <span className="text-[10px] text-slate-500 font-mono">
                +{knowledge.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer with Actions */}
      <div className="px-4 py-3 bg-slate-950/70 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-500" />
            <span>Eff: {knowledge.effectiveDate}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onTestRag && (
            <button
              type="button"
              onClick={() => onTestRag(knowledge.keywords[0] || knowledge.shortTitle || knowledge.title)}
              className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 text-[11px] font-medium transition-colors border border-slate-700"
              title="Test this knowledge record in RAG query"
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Test RAG</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelect(knowledge)}
            className="inline-flex items-center gap-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 text-[11px] font-semibold transition-colors"
          >
            <span>Details</span>
            <ChevronRight className="h-3 w-3" />
          </button>

          {isAdmin && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(knowledge)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Edit Knowledge"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          )}

          {isAdmin && onArchive && knowledge.status !== 'ARCHIVED' && (
            <button
              type="button"
              onClick={() => onArchive(knowledge)}
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Archive Knowledge"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

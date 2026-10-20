import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Tag,
  CheckCircle2,
  Clock,
  Building,
  Key,
  Database,
  ArrowRight,
} from 'lucide-react';
import { ComplianceKnowledge, KnowledgeChunk, UserRole, VerificationStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { dataService } from '../../services/dataService';

interface KnowledgeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledge: ComplianceKnowledge | null;
  userRole?: UserRole;
  onUseInRag?: (query: string) => void;
  onVerificationChange?: (id: string, newStatus: VerificationStatus) => void;
}

export const KnowledgeDetailModal: React.FC<KnowledgeDetailModalProps> = ({
  isOpen,
  onClose,
  knowledge,
  userRole,
  onUseInRag,
  onVerificationChange,
}) => {
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'sections' | 'chunks'>('content');
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  useEffect(() => {
    if (knowledge?.id) {
      setIsLoadingChunks(true);
      dataService
        .getKnowledgeChunks(knowledge.id)
        .then((res) => setChunks(res))
        .catch(() => setChunks([]))
        .finally(() => setIsLoadingChunks(false));
    }
  }, [knowledge?.id]);

  if (!isOpen || !knowledge) return null;

  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Synthetic Demo Banner */}
        {knowledge.isSyntheticDemo && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
            <span className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>SYNTHETIC DEMONSTRATION KNOWLEDGE — NOT OFFICIAL REGULATORY TEXT</span>
            </span>
            <span className="font-mono text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
              NON-OFFICIAL DEMO
            </span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded">
                {knowledge.sourceReference}
              </span>
              <span className="text-xs font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {knowledge.category}
              </span>
              <StatusBadge type="verification" value={knowledge.verificationStatus} size="sm" />
              <StatusBadge type="knowledgeStatus" value={knowledge.status} size="sm" />
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug pt-1">
              {knowledge.title}
            </h2>

            {knowledge.shortTitle && (
              <p className="text-xs text-slate-400">
                Alias: <strong className="text-slate-200">{knowledge.shortTitle}</strong> • Subcategory: {knowledge.subcategory}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Metadata Strip */}
        <div className="bg-slate-950/40 border-b border-slate-800/80 px-4 sm:px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Authority</span>
            <span className="text-slate-200 font-medium truncate block">{knowledge.authority}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Source Name</span>
            <span className="text-slate-200 font-medium truncate block">{knowledge.sourceName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Effective Date</span>
            <span className="text-slate-200 font-medium">{knowledge.effectiveDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Jurisdiction</span>
            <span className="text-slate-200 font-medium">{knowledge.jurisdiction}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-4 sm:px-6 bg-slate-900 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'content'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Statutory Content & Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'sections'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Clauses & Sections ({knowledge.sections?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chunks')}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'chunks'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            RAG Knowledge Chunks ({chunks.length})
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'content' && (
            <div className="space-y-4">
              {/* Summary Card */}
              {knowledge.summary && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
                    Executive Compliance Summary
                  </span>
                  <p className="text-slate-200 leading-relaxed text-xs">{knowledge.summary}</p>
                </div>
              )}

              {/* Full Text Content */}
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 font-sans text-xs text-slate-300 space-y-3 whitespace-pre-wrap leading-relaxed">
                {knowledge.content}
              </div>

              {/* Scope & Applicable Roles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                  <span className="text-slate-400 font-semibold block text-[11px] mb-1.5">
                    Applicable Mine Classifications
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {knowledge.applicableMineTypes.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300 border border-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                  <span className="text-slate-400 font-semibold block text-[11px] mb-1.5">
                    Target Role Scopes
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {knowledge.applicableRoles.map((r) => (
                      <span
                        key={r}
                        className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300 border border-slate-700 font-mono"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags and Keywords */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-semibold block text-[11px]">Tags & Retrieval Keywords</span>
                <div className="flex flex-wrap gap-1.5">
                  {knowledge.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-700"
                    >
                      <Tag className="h-3 w-3 text-slate-500" />
                      <span>{tag}</span>
                    </span>
                  ))}
                  {knowledge.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded bg-slate-950 px-2 py-0.5 text-[11px] text-amber-300/80 border border-slate-800 font-mono"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sections' && (
            <div className="space-y-3">
              {knowledge.sections && knowledge.sections.length > 0 ? (
                knowledge.sections.map((sec, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {sec.sectionNumber}
                      </span>
                      <h4 className="font-bold text-white text-sm">{sec.title}</h4>
                    </div>

                    <div className="space-y-2 pl-2">
                      {sec.clauses.map((clause, cIdx) => (
                        <div
                          key={cIdx}
                          className="border-l-2 border-slate-800 pl-3 py-1 space-y-1 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-300">
                              {clause.clauseNumber}
                            </span>
                            {clause.title && (
                              <span className="text-slate-400 italic font-medium">
                                {clause.title}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 leading-relaxed">{clause.text}</p>
                          {clause.penaltiesOrMandates && (
                            <p className="text-[11px] text-amber-400/90 font-mono">
                              Mandate: {clause.penaltiesOrMandates}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 py-6 text-center">No structured sections parsed.</p>
              )}
            </div>
          )}

          {activeTab === 'chunks' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs">
                The compliance document is split into <strong>{chunks.length} deterministic retrieval chunks</strong> with isolated metadata for vector search & keyword matching.
              </p>

              {isLoadingChunks ? (
                <div className="py-8 text-center text-slate-400">Loading chunks...</div>
              ) : (
                chunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Chunk #{chunk.chunkIndex + 1}
                        </span>
                        <span className="font-semibold text-white">{chunk.heading}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>{chunk.characterCount} chars</span>
                        <span>•</span>
                        <span>~{chunk.tokenEstimate} tokens</span>
                      </div>
                    </div>

                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap pl-1 font-mono text-[11px]">
                      {chunk.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-1 pt-1 text-[10px] text-slate-500">
                      <span>Keywords:</span>
                      {chunk.keywords.slice(0, 6).map((k) => (
                        <span key={k} className="bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {isAdmin && onVerificationChange && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Verification Status:</span>
                <select
                  value={knowledge.verificationStatus}
                  onChange={(e) =>
                    onVerificationChange(knowledge.id, e.target.value as VerificationStatus)
                  }
                  className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
                  <option value="UNVERIFIED">UNVERIFIED</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onUseInRag && (
              <button
                type="button"
                onClick={() => {
                  onUseInRag(knowledge.keywords[0] || knowledge.shortTitle || knowledge.title);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Use in RAG Search</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

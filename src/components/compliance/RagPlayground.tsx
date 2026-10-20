import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Sliders,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Tag,
  Copy,
  Check,
} from 'lucide-react';
import {
  RetrievalPolicy,
  RetrievalResponse,
  RetrievalResultItem,
  SourceCitation,
  UserRole,
} from '../../types';
import { dataService } from '../../services/dataService';
import { StatusBadge } from '../common/StatusBadge';

interface RagPlaygroundProps {
  userRole?: UserRole;
  initialQuery?: string;
  onOpenKnowledgeDetail?: (knowledgeId: string) => void;
}

const SAMPLE_QUERIES = [
  'PPE requirements',
  'mine ventilation safety',
  'electrical inspection',
  'emergency preparedness',
  'blasting safety',
  'methane gas threshold',
  'tailings dam inspection',
];

export const RagPlayground: React.FC<RagPlaygroundProps> = ({
  userRole = 'ADMIN',
  initialQuery = '',
  onOpenKnowledgeDetail,
}) => {
  const [query, setQuery] = useState(initialQuery || 'mine ventilation safety');
  const [policy, setPolicy] = useState<RetrievalPolicy>('VERIFIED_ONLY');
  const [mineType, setMineType] = useState<string>('ALL');
  const [scopedRole, setScopedRole] = useState<UserRole>(userRole);
  const [minScore, setMinScore] = useState<number>(0.15);
  const [limit, setLimit] = useState<number>(5);

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<RetrievalResponse | null>(null);
  const [copiedContext, setCopiedContext] = useState(false);

  const handleRunRetrieval = async (overrideQuery?: string) => {
    const q = overrideQuery !== undefined ? overrideQuery : query;
    if (!q.trim()) return;

    setIsLoading(true);
    try {
      const res = await dataService.queryRAG({
        query: q.trim(),
        policy,
        mineType: mineType === 'ALL' ? undefined : mineType,
        role: scopedRole,
        limit,
        minScore,
      });
      setResponse(res);
    } catch (err) {
      console.error('RAG Retrieval Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyContext = () => {
    if (!response?.groundedContext) return;
    navigator.clipboard.writeText(response.groundedContext);
    setCopiedContext(true);
    setTimeout(() => setCopiedContext(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-slate-900/90 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Compliance Retrieval Test (RAG Playground)
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                  RAG Foundation
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic text retriever testing verified knowledge grounding and chunk relevance prior to Gemini integration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Gate: {policy}</span>
            </span>
          </div>
        </div>

        {/* Sample Query Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Sample Queries:</span>
          {SAMPLE_QUERIES.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setQuery(sample);
                handleRunRetrieval(sample);
              }}
              className={`rounded-lg px-2.5 py-1 text-xs transition-colors border ${
                query === sample
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Query Controls & Filter Parameters */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 space-y-4">
        {/* Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunRetrieval()}
              placeholder="Enter search phrase (e.g. minimum return air velocity, methane auto trip, blasting shelter)..."
              className="w-full rounded-lg bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="button"
            disabled={isLoading || !query.trim()}
            onClick={() => handleRunRetrieval()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>{isLoading ? 'Retrieving...' : 'Run Retrieval'}</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          {/* Policy Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Retrieval Policy Gate
            </label>
            <select
              value={policy}
              onChange={(e) => setPolicy(e.target.value as RetrievalPolicy)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
            >
              <option value="VERIFIED_ONLY">VERIFIED_ONLY (Production)</option>
              <option value="ALLOW_DEMO">ALLOW_DEMO (Include Demo)</option>
              <option value="INCLUDE_ALL">INCLUDE_ALL (Dev Unfiltered)</option>
            </select>
          </div>

          {/* Mine Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Applicable Mine Scope
            </label>
            <select
              value={mineType}
              onChange={(e) => setMineType(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Mine Classifications</option>
              <option value="Underground">Underground Collieries</option>
              <option value="Open Cast">Open Cast Mines</option>
              <option value="Mixed">Mixed Operations</option>
            </select>
          </div>

          {/* Scoped Role */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Scoping Role Filter
            </label>
            <select
              value={scopedRole}
              onChange={(e) => setScopedRole(e.target.value as UserRole)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
            >
              <option value="ADMIN">ADMIN (Full Access)</option>
              <option value="OFFICER">OFFICER (Assigned Collieries)</option>
              <option value="OPERATOR">OPERATOR (Shift Scope)</option>
            </select>
          </div>

          {/* Min Score & Limit */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Min Score ({minScore})
              </label>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={minScore}
                onChange={(e) => setMinScore(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
            <div className="w-16">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Top K</label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2 py-1.5 text-white text-center focus:outline-none focus:border-amber-400"
              >
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {response && (
        <div className="space-y-5">
          {/* Result Execution Overview Strip */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-400">
                Found <strong>{response.results.length}</strong> matching chunks
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-400">
                Confidence:{' '}
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    response.confidence === 'HIGH'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : response.confidence === 'MEDIUM'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {response.confidence}
                </span>
              </span>
              <span>•</span>
              <span className="text-slate-500 font-mono">{response.retrievalDurationMs} ms</span>
            </div>

            <div className="flex items-center gap-2">
              {response.hasVerifiedInformation && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified Evidence
                </span>
              )}
              {response.hasDemoInformation && (
                <span className="inline-flex items-center gap-1 rounded bg-amber-950/80 border border-amber-800 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  <AlertTriangle className="h-3 w-3" />
                  Synthetic Demo Data
                </span>
              )}
            </div>
          </div>

          {/* No-Hallucination Fallback Banner */}
          {response.results.length === 0 && (
            <div className="rounded-xl border border-rose-800/80 bg-rose-950/30 p-6 text-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto" />
              <h3 className="text-sm font-bold text-rose-200">
                {response.fallbackMessage || 'No verified information found in the current compliance knowledge base.'}
              </h3>
              <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
                In adherence to statutory safety standards, the retrieval layer enforces a strict zero-hallucination gate. When no verified documents pass policy filters, the system abstains from formulating fabricated regulatory mandates.
              </p>
            </div>
          )}

          {/* Retrieved Chunks Grid */}
          {response.results.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-400" />
                <span>Ranked Knowledge Chunks ({response.results.length})</span>
              </h3>

              <div className="space-y-3">
                {response.results.map((item, idx) => (
                  <div
                    key={item.chunkId}
                    className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 hover:border-slate-700 transition-all text-xs"
                  >
                    {/* Header with Rank & Score */}
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold font-mono">
                            Rank #{idx + 1}
                          </span>
                          <span className="font-bold text-white text-sm">
                            {item.heading}
                          </span>
                          {item.section && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({item.section})
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">
                          From: <strong className="text-slate-200">{item.title}</strong> • Ref: <span className="text-amber-400 font-mono">{item.sourceReference}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Relevance Score</span>
                          <span className="font-mono font-bold text-amber-400 text-xs">
                            {(item.score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <StatusBadge type="verification" value={item.verificationStatus} size="sm" />
                      </div>
                    </div>

                    {/* Content Snippet */}
                    <div className="rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed border border-slate-800/80">
                      {item.content}
                    </div>

                    {/* Matched Terms & Category */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] pt-1">
                      <div className="flex flex-wrap items-center gap-1 text-slate-500">
                        <span>Matched terms:</span>
                        {item.matchedTerms.map((term) => (
                          <span
                            key={term}
                            className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono"
                          >
                            {term}
                          </span>
                        ))}
                      </div>

                      {onOpenKnowledgeDetail && (
                        <button
                          type="button"
                          onClick={() => onOpenKnowledgeDetail(item.knowledgeId)}
                          className="text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-1"
                        >
                          <span>View Full Document</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grounded Context Prompt Card (Phase 5 Gemini Contract) */}
          {response.groundedContext && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Grounded RAG Context Prompt (Ready for Gemini Injection)
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleCopyContext}
                  className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 text-[11px] font-semibold transition-colors border border-slate-700"
                >
                  {copiedContext ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedContext ? 'Copied' : 'Copy Context'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-400">
                This grounded context block represents the deterministic boundary passed to the Gemini service. No AI hallucination can occur beyond these retrieved sources.
              </p>

              <pre className="rounded-lg bg-slate-950 p-3.5 text-slate-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60 border border-slate-800">
                {response.groundedContext}
              </pre>
            </div>
          )}

          {/* Sources and Citations */}
          {response.sources.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Source Citations & Statutory References ({response.sources.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {response.sources.map((src) => (
                  <div
                    key={src.id}
                    className="rounded-lg bg-slate-950 p-3 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-amber-400 font-bold text-[11px]">
                        {src.sourceReference}
                      </span>
                      <StatusBadge type="verification" value={src.verificationStatus} size="sm" />
                    </div>
                    <h4 className="font-bold text-white">{src.title}</h4>
                    <p className="text-slate-400 text-[11px]">
                      {src.sourceName} • {src.authority} (v{src.documentVersion})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

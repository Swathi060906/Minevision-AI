import React from 'react';
import { Sparkles, Shield, AlertTriangle, ArrowRight, RefreshCw, Cpu } from 'lucide-react';
import { AiRiskNarrative } from '../../data/models/RiskIntelligence';

interface AiNarrativeCardProps {
  narrative?: AiRiskNarrative;
  onRefreshNarrative?: () => void;
  isLoading?: boolean;
  canGenerateAi?: boolean;
}

export const AiNarrativeCard: React.FC<AiNarrativeCardProps> = ({
  narrative,
  onRefreshNarrative,
  isLoading,
  canGenerateAi = true,
}) => {
  if (!narrative) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4 relative overflow-hidden backdrop-blur-sm">
      {/* Decorative subtle ambient border gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 opacity-60" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5 sm:mt-0">
            {narrative.isAiGenerated ? (
              <Sparkles className="h-4 w-4" />
            ) : (
              <Cpu className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Executive Safety Briefing
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  narrative.isAiGenerated
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {narrative.isAiGenerated ? 'Gemini AI Synthesized' : 'Deterministic Statutory Summary'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {narrative.modelName || 'System Intelligence Engine'} • {new Date(narrative.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {canGenerateAi && onRefreshNarrative && (
          <button
            type="button"
            onClick={onRefreshNarrative}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors disabled:opacity-50 shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isLoading ? 'Synthesizing...' : 'Regenerate Briefing'}</span>
          </button>
        )}
      </div>

      {/* Main Narrative Text */}
      <div className="text-sm text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        {narrative.summaryText}
      </div>

      {/* Key Concerns & Recommended Directives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Concerns */}
        {narrative.keyConcerns && narrative.keyConcerns.length > 0 && (
          <div className="space-y-2 rounded-xl bg-slate-950/40 border border-slate-800 p-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Key Statutory Concerns</span>
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {narrative.keyConcerns.map((concern, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Directives */}
        {narrative.recommendedDirectives && narrative.recommendedDirectives.length > 0 && (
          <div className="space-y-2 rounded-xl bg-slate-950/40 border border-slate-800 p-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>Recommended Directives</span>
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {narrative.recommendedDirectives.map((dir, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{dir}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Explicit Disclaimer */}
      <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 flex items-center justify-between">
        <span>{narrative.disclaimer}</span>
      </div>
    </div>
  );
};

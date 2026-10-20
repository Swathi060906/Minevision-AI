import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { MinePrediction, AiPredictiveNarrative } from '../../data/models/PredictiveIntelligence';
import { predictiveRiskService } from '../../services/predictive/predictiveRiskService';
import { useAuth } from '../../auth/AuthContext';

interface AiPredictiveNarrativeCardProps {
  prediction: MinePrediction;
  onNarrativeGenerated?: (narrative: AiPredictiveNarrative) => void;
}

export const AiPredictiveNarrativeCard: React.FC<AiPredictiveNarrativeCardProps> = ({
  prediction,
  onNarrativeGenerated,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<AiPredictiveNarrative | undefined>(
    prediction.aiNarrative
  );

  const canGenerate = user && (user.role === 'ADMIN' || user.role === 'OFFICER');

  const handleGenerate = async () => {
    if (!user || !canGenerate) return;
    setLoading(true);
    setError(null);

    try {
      const result = await predictiveRiskService.generatePredictiveNarrative(prediction, {
        id: user.id,
        email: user.email,
        role: user.role,
      });
      setNarrative(result);
      onNarrativeGenerated?.(result);
    } catch (err: any) {
      console.error('Error generating predictive narrative:', err);
      setError(err.message || 'Failed to generate advisory narrative');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                AI Executive Predictive Advisory
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                Explanatory Synthesis
              </span>
            </div>
            <p className="text-[11px] text-purple-200/70">
              DGMS Safety Narrative Synthesis (Gemini 2.5 Flash Grounded)
            </p>
          </div>
        </div>

        {canGenerate && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer self-start sm:self-center"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{narrative ? 'Regenerate Synthesis' : 'Generate AI Advisory'}</span>
          </button>
        )}
      </div>

      {/* Prominent Statutory Disclaimer */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-[11px] text-amber-300/90 flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <span>
          <strong>Statutory Disclaimer:</strong> This text is an AI-generated advisory narrative synthesizing verified operational trends. It does not replace statutory DGMS inspections or formal enforcement notices.
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Narrative Content */}
      {narrative ? (
        <div className="space-y-4 text-xs">
          {/* Summary Text */}
          <div className="rounded-xl bg-slate-950/60 p-4 border border-purple-500/20 text-slate-200 leading-relaxed font-sans text-sm">
            {narrative.summaryText}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Top Concerns */}
            <div className="rounded-xl bg-slate-950/60 p-3.5 border border-purple-500/20 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                Key Deterioration Concerns
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {narrative.topConcerns.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 mt-1">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Proactive Interventions */}
            <div className="rounded-xl bg-slate-950/60 p-3.5 border border-purple-500/20 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Recommended Directives
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {narrative.recommendedInterventions.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-purple-300/60 pt-1">
            <span>Model: {narrative.modelName || 'Gemini 2.5 Flash Grounded'}</span>
            <span>Generated: {new Date(narrative.generatedAt).toLocaleString()}</span>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-slate-400 text-xs">
          Click &quot;Generate AI Advisory&quot; to synthesize an executive early warning brief for this colliery.
        </div>
      )}
    </div>
  );
};

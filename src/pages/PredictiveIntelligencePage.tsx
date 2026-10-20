import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Layers,
  RefreshCw,
  AlertTriangle,
  Building2,
  Calendar,
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { PredictiveKpiCards } from '../components/predictive/PredictiveKpiCards';
import { EarlyWarningScoreCard } from '../components/predictive/EarlyWarningScoreCard';
import { TrajectoryChart } from '../components/predictive/TrajectoryChart';
import { PredictionHorizonsCard } from '../components/predictive/PredictionHorizonsCard';
import { PredictiveSignalsList } from '../components/predictive/PredictiveSignalsList';
import { DomainPredictionsGrid } from '../components/predictive/DomainPredictionsGrid';
import { InterventionsPanel } from '../components/predictive/InterventionsPanel';
import { PredictiveMineComparisonTable } from '../components/predictive/PredictiveMineComparisonTable';
import { AiPredictiveNarrativeCard } from '../components/predictive/AiPredictiveNarrativeCard';
import { WhyWarningModal } from '../components/predictive/WhyWarningModal';
import { MinePrediction } from '../data/models/PredictiveIntelligence';
import { dataService } from '../services/dataService';
import { useAuth } from '../auth/AuthContext';
import { AppRoute, Mine } from '../types';

interface PredictiveIntelligencePageProps {
  onNavigate: (route: AppRoute, params?: { mineId?: string }) => void;
  initialMineId?: string;
}

export const PredictiveIntelligencePage: React.FC<PredictiveIntelligencePageProps> = ({
  onNavigate,
  initialMineId,
}) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'deep-dive' | 'comparison'>('deep-dive');
  const [authorizedMines, setAuthorizedMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>(initialMineId || '');
  const [currentPrediction, setCurrentPrediction] = useState<MinePrediction | null>(null);
  const [allPredictions, setAllPredictions] = useState<MinePrediction[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);

  // Load authorized mines
  const loadMines = useCallback(async () => {
    if (!user) return;
    try {
      const mines = await dataService.getAuthorizedMines(user);
      setAuthorizedMines(mines);
      if (mines.length > 0 && !selectedMineId) {
        setSelectedMineId(initialMineId || mines[0].id);
      }
    } catch (err) {
      console.error('Error loading authorized mines:', err);
    }
  }, [user, initialMineId, selectedMineId]);

  // Load predictions
  const loadPredictions = useCallback(
    async (targetMineId?: string) => {
      if (!user) return;
      const mineToFetch = targetMineId || selectedMineId;
      if (!mineToFetch) return;

      try {
        setIsRefreshing(true);
        const [singlePred, allPreds] = await Promise.all([
          dataService.getMinePrediction({
            mineId: mineToFetch,
            userContext: { id: user.id, email: user.email, role: user.role },
          }),
          dataService.getAllAuthorizedMinePredictions({
            userContext: { id: user.id, email: user.email, role: user.role },
          }),
        ]);

        setCurrentPrediction(singlePred);
        setAllPredictions(allPreds);
      } catch (err) {
        console.error('Error loading predictions:', err);
      } finally {
        setIsRefreshing(false);
        setIsLoading(false);
      }
    },
    [user, selectedMineId]
  );

  useEffect(() => {
    loadMines();
  }, [loadMines]);

  useEffect(() => {
    if (selectedMineId) {
      loadPredictions(selectedMineId);
    }
  }, [selectedMineId, loadPredictions]);

  const handleSelectMine = (mineId: string) => {
    setSelectedMineId(mineId);
    setActiveTab('deep-dive');
  };

  const isOperator = user?.role === 'OPERATOR';

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Calculating predictive trajectories and early warning signals..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Page Header */}
      <PageHeader
        title="Predictive Safety & Early Warning Intelligence"
        subtitle="Forward-looking operational deterioration signals, multi-horizon trajectory forecasts, and explainable intervention guidance."
        badge="Advisory Layer"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadPredictions()}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Forecasts</span>
            </button>
          </div>
        }
      />

      {/* KPI Overview Cards */}
      <PredictiveKpiCards predictions={allPredictions} />

      {/* Navigation Tabs & Mine Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('deep-dive')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'deep-dive'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            Colliery Deep-Dive
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            Cross-Colliery Comparison Matrix ({allPredictions.length})
          </button>
        </div>

        {/* Mine Selector */}
        {activeTab === 'deep-dive' && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
            {isOperator ? (
              <span className="text-xs font-bold text-white bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                {currentPrediction?.mineName || 'Assigned Colliery'} (Scoped)
              </span>
            ) : (
              <select
                value={selectedMineId}
                onChange={(e) => setSelectedMineId(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {authorizedMines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Tab 1: Deep Dive View */}
      {activeTab === 'deep-dive' && currentPrediction && (
        <div className="space-y-6">
          {/* Top: Side-by-side Official vs Early Warning Score Card */}
          <EarlyWarningScoreCard
            prediction={currentPrediction}
            onOpenExplainability={() => setIsExplainModalOpen(true)}
          />

          {/* Row: Prediction Horizons (7d / 30d / 90d) */}
          <PredictionHorizonsCard horizons={currentPrediction.horizons} />

          {/* Row: Historical vs Projected Trajectory Chart */}
          <TrajectoryChart
            points={currentPrediction.trajectoryHistory}
            trajectory={currentPrediction.trajectory}
            mineName={currentPrediction.mineName}
          />

          {/* 2-Column Row: Deterioration Signals + Domain Predictions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PredictiveSignalsList
              signals={currentPrediction.signals}
              onOpenExplainability={() => setIsExplainModalOpen(true)}
            />
            <DomainPredictionsGrid domains={currentPrediction.domainPredictions} />
          </div>

          {/* Recommended Proactive Interventions */}
          <InterventionsPanel
            interventions={currentPrediction.interventions}
            mineName={currentPrediction.mineName}
          />

          {/* AI Executive Predictive Advisory Card */}
          <AiPredictiveNarrativeCard
            prediction={currentPrediction}
            onNarrativeGenerated={(narrative) => {
              setCurrentPrediction((prev) => (prev ? { ...prev, aiNarrative: narrative } : null));
            }}
          />
        </div>
      )}

      {/* Tab 2: Cross-Colliery Comparison Matrix */}
      {activeTab === 'comparison' && (
        <PredictiveMineComparisonTable
          predictions={allPredictions}
          onSelectMine={handleSelectMine}
        />
      )}

      {/* Explainability Modal ("Why are we warning you?") */}
      {currentPrediction && (
        <WhyWarningModal
          isOpen={isExplainModalOpen}
          onClose={() => setIsExplainModalOpen(false)}
          prediction={currentPrediction}
        />
      )}
    </div>
  );
};

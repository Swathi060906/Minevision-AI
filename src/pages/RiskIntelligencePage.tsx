import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Layers,
  FileSpreadsheet,
  RefreshCw,
  Settings,
  Download,
  AlertTriangle,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { RiskScoreCard } from '../components/risk/RiskScoreCard';
import { RiskFactorBreakdownModal } from '../components/risk/RiskFactorBreakdownModal';
import { RiskDriversPanel } from '../components/risk/RiskDriversPanel';
import { PriorityAttentionPanel } from '../components/risk/PriorityAttentionPanel';
import { RiskMatrixTable } from '../components/risk/RiskMatrixTable';
import { CategoryRiskHeatmap } from '../components/risk/CategoryRiskHeatmap';
import { RiskAgingChart } from '../components/risk/RiskAgingChart';
import { AiNarrativeCard } from '../components/risk/AiNarrativeCard';
import { PendingAiAdvisoryBadge } from '../components/risk/PendingAiAdvisoryBadge';
import { RiskConfigModal } from '../components/risk/RiskConfigModal';
import {
  MineRiskProfile,
  RiskTimeWindow,
  RiskEngineConfig,
} from '../data/models/RiskIntelligence';
import { dataService } from '../services/dataService';
import { useAuth } from '../auth/AuthContext';
import { AppRoute, Mine } from '../types';

interface RiskIntelligencePageProps {
  onNavigate: (route: AppRoute, params?: { mineId?: string; inspectionId?: string }) => void;
  initialMineId?: string;
}

export const RiskIntelligencePage: React.FC<RiskIntelligencePageProps> = ({
  onNavigate,
  initialMineId,
}) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'deep-dive' | 'matrix'>('deep-dive');
  const [authorizedMines, setAuthorizedMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>(initialMineId || '');
  const [timeWindow, setTimeWindow] = useState<RiskTimeWindow>('30d');

  const [currentProfile, setCurrentProfile] = useState<MineRiskProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<MineRiskProfile[]>([]);
  const [config, setConfig] = useState<RiskEngineConfig | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSynthesizingAi, setIsSynthesizingAi] = useState(false);

  // Modals
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isOfficer = user?.role === 'OFFICER';
  const isOperator = user?.role === 'OPERATOR';

  // 1. Initial Load of Mines and Config
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const roleContext = {
        role: user?.role,
        mineIds: user?.mineIds,
      };

      const [minesList, engineConfig] = await Promise.all([
        dataService.getMines(roleContext),
        dataService.getRiskConfig(),
      ]);

      setAuthorizedMines(minesList);
      setConfig(engineConfig);

      // Select default mine if none selected or initialMineId provided
      let targetMineId = initialMineId;
      if (!targetMineId && minesList.length > 0) {
        targetMineId = minesList[0].id;
      }

      if (targetMineId) {
        setSelectedMineId(targetMineId);
      }
    } catch (err) {
      console.error('Failed to load initial risk data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, initialMineId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Load Profiles whenever selected mine or time window changes
  const loadRiskProfiles = useCallback(
    async (triggerAi = false) => {
      if (!user) return;
      try {
        setIsRecalculating(true);
        const userContext = {
          id: user.id,
          email: user.email,
          role: user.role,
          mineIds: user.mineIds,
        };

        // Fetch all authorized profiles for the comparison matrix
        const matrixProfiles = await dataService.getAllAuthorizedMinesRisk({
          timeWindow,
          userContext,
        });
        setAllProfiles(matrixProfiles);

        // Fetch single detailed profile for current mine
        if (selectedMineId) {
          const profile = await dataService.getMineRiskProfile({
            mineId: selectedMineId,
            timeWindow,
            userContext,
            includeAiNarrative: triggerAi,
          });
          setCurrentProfile(profile);
        } else if (matrixProfiles.length > 0) {
          setSelectedMineId(matrixProfiles[0].mineId);
          setCurrentProfile(matrixProfiles[0]);
        }
      } catch (err) {
        console.error('Failed to calculate risk profiles:', err);
      } finally {
        setIsRecalculating(false);
        setIsSynthesizingAi(false);
      }
    },
    [user, selectedMineId, timeWindow]
  );

  useEffect(() => {
    if (selectedMineId) {
      loadRiskProfiles();
    }
  }, [selectedMineId, timeWindow, loadRiskProfiles]);

  // Handler for explicit AI narrative refresh
  const handleRefreshNarrative = async () => {
    if (isOperator) return;
    setIsSynthesizingAi(true);
    await loadRiskProfiles(true);
  };

  // Handler for config save
  const handleSaveConfig = async (updated: Partial<RiskEngineConfig>) => {
    if (!user || user.role !== 'ADMIN') return;
    const newConfig = await dataService.updateRiskConfig(updated, {
      id: user.id,
      email: user.email,
      role: user.role,
    });
    setConfig(newConfig);
    // Recalculate with updated weights
    await loadRiskProfiles();
  };

  // Handler for config reset
  const handleResetConfig = async () => {
    if (!user || user.role !== 'ADMIN') return;
    const reset = await dataService.resetRiskConfig({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    setConfig(reset);
    await loadRiskProfiles();
  };

  // Navigation to source records
  const handleNavigateToSource = (sourceType: string, sourceId: string) => {
    if (sourceType === 'FINDING' || sourceType === 'INSPECTION') {
      onNavigate('inspections', { mineId: selectedMineId });
    } else if (sourceType === 'ALERT') {
      onNavigate('alerts', { mineId: selectedMineId });
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading Safety Risk Intelligence & Statutory Profiles..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <PageHeader
          title="Safety Risk Intelligence"
          subtitle="Explainable, multi-factor colliery risk scoring, recurrent violation tracking, and statutory intervention priorities."
          badge="Intelligence Engine"
        />

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('deep-dive')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'deep-dive'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Colliery Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'matrix'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Comparison Matrix</span>
            </button>
          </div>

          {/* Recalculate Button */}
          <button
            type="button"
            onClick={() => loadRiskProfiles(false)}
            disabled={isRecalculating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            title="Re-run deterministic scoring engine"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRecalculating ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isRecalculating ? 'Calculating...' : 'Recalculate'}</span>
          </button>

          {/* Config Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            title="Inspect or adjust statutory scoring weights"
          >
            <Settings className="h-3.5 w-3.5 text-amber-400" />
            <span>Risk Weights</span>
            {isAdmin && (
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded">
                Admin
              </span>
            )}
          </button>

          {/* Export to Reports */}
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-300" />
            <span>Export Dossier</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === 'deep-dive' ? (
        <div className="space-y-6">
          {/* Mine Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-400" />
              <label htmlFor="mine-select" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Active Colliery:
              </label>
              <select
                id="mine-select"
                value={selectedMineId}
                onChange={(e) => setSelectedMineId(e.target.value)}
                disabled={isOperator && authorizedMines.length <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
              >
                {authorizedMines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.mineCode || 'DGMS'} - {m.district}, {m.state})
                  </option>
                ))}
              </select>
            </div>

            {isOperator && (
              <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                Mine Operator Scope (Colliery-Restricted)
              </span>
            )}
          </div>

          {currentProfile ? (
            <>
              {/* Top Score & Metric Card */}
              <RiskScoreCard
                profile={currentProfile}
                timeWindow={timeWindow}
                onTimeWindowChange={(w) => setTimeWindow(w)}
                onExplainScore={() => setIsExplainModalOpen(true)}
                onRecalculate={() => loadRiskProfiles(false)}
                isRecalculating={isRecalculating}
              />

              {/* Advisory AI Proposals Badge (strictly segregated from official score) */}
              <PendingAiAdvisoryBadge
                count={currentProfile.counts.pendingAiProposalsCount}
                onNavigateToReviews={(route) => onNavigate(route)}
              />

              {/* Executive Briefing Card (Gemini AI or Deterministic) */}
              <AiNarrativeCard
                narrative={currentProfile.aiNarrative}
                onRefreshNarrative={handleRefreshNarrative}
                isLoading={isSynthesizingAi}
                canGenerateAi={!isOperator}
              />

              {/* Primary Drivers & Priority Interventions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Why is this mine at risk? */}
                <RiskDriversPanel
                  drivers={currentProfile.drivers}
                  onNavigateToSource={handleNavigateToSource}
                />

                {/* Where should an officer intervene first? */}
                <PriorityAttentionPanel
                  items={currentProfile.priorityAttention}
                  onTakeAction={(item) => {
                    if (item.linkedSourceType === 'ALERT') {
                      onNavigate('alerts', { mineId: selectedMineId });
                    } else {
                      onNavigate('inspections', { mineId: selectedMineId });
                    }
                  }}
                />
              </div>

              {/* Aging Breakdown & Domain Heatmap */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RiskAgingChart aging={currentProfile.agingSummary} />
                <CategoryRiskHeatmap categories={currentProfile.categoryRisks} />
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-slate-800 bg-slate-900/60">
              No risk profile available for the selected colliery.
            </div>
          )}
        </div>
      ) : (
        /* Cross-Basin Comparison Matrix Tab */
        <div className="space-y-6">
          <RiskMatrixTable
            profiles={allProfiles}
            selectedMineId={selectedMineId}
            onSelectMine={(mineId) => {
              setSelectedMineId(mineId);
              setActiveTab('deep-dive');
            }}
          />
        </div>
      )}

      {/* Modals */}
      {currentProfile && (
        <RiskFactorBreakdownModal
          isOpen={isExplainModalOpen}
          onClose={() => setIsExplainModalOpen(false)}
          profile={currentProfile}
        />
      )}

      {config && (
        <RiskConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          config={config}
          isAdmin={isAdmin}
          onSave={handleSaveConfig}
          onReset={handleResetConfig}
        />
      )}
    </div>
  );
};

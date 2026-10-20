import React, { useState, useEffect, useCallback } from 'react';
import {
  Pickaxe,
  ClipboardCheck,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Download,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { ComplianceOverview } from '../components/dashboard/ComplianceOverview';
import { RiskDistribution } from '../components/dashboard/RiskDistribution';
import { ComplianceTrend } from '../components/dashboard/ComplianceTrend';
import { RecentInspections } from '../components/dashboard/RecentInspections';
import { CriticalAlerts } from '../components/dashboard/CriticalAlerts';
import { MineOverview } from '../components/dashboard/MineOverview';
import { LoadingState } from '../components/common/LoadingState';
import { AppRoute, Inspection, Mine, CriticalAlert } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from '../auth/AuthContext';

interface DashboardProps {
  onNavigate: (route: AppRoute, params?: { mineId?: string; inspectionId?: string }) => void;
  onSelectMine?: (mine: Mine) => void;
  onSelectInspection?: (inspection: Inspection) => void;
}

interface DashboardMetricStats {
  totalMines: number;
  activeInspections: number;
  overallComplianceScore: number;
  criticalAlertsCount: number;
  minesUnderNotice: number;
  scheduledInspections: number;
  inProgressInspections: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onSelectMine,
  onSelectInspection,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardMetricStats>({
    totalMines: 0,
    activeInspections: 0,
    overallComplianceScore: 80,
    criticalAlertsCount: 0,
    minesUnderNotice: 0,
    scheduledInspections: 0,
    inProgressInspections: 0,
  });

  const [mines, setMines] = useState<Mine[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const roleContext = {
        role: user?.role,
        mineIds: user?.mineIds,
      };

      const [dashStats, mineList, inspectionList, alertList] = await Promise.all([
        dataService.getDashboardStats(roleContext),
        dataService.getMines(roleContext),
        dataService.getInspections(roleContext),
        dataService.getAlerts(roleContext),
      ]);

      const scheduledCount = typeof dashStats.scheduledInspections === 'number'
        ? dashStats.scheduledInspections
        : inspectionList.filter((ins) => ins.status === 'Scheduled').length;

      const inProgressCount = typeof dashStats.inProgressInspections === 'number'
        ? dashStats.inProgressInspections
        : inspectionList.filter((ins) => ins.status === 'In Progress').length;

      const noticeCount = typeof dashStats.minesUnderNotice === 'number'
        ? dashStats.minesUnderNotice
        : mineList.filter((m) => m.status === 'Notice Issued').length;

      const criticalCount = typeof dashStats.criticalAlertsCount === 'number'
        ? dashStats.criticalAlertsCount
        : alertList.filter((a) => (a.severity === 'CRITICAL' || a.severity === 'HIGH') && a.status !== 'Resolved').length;

      setStats({
        totalMines: typeof dashStats.totalMines === 'number' ? dashStats.totalMines : mineList.length,
        activeInspections: typeof dashStats.activeInspections === 'number' ? dashStats.activeInspections : (scheduledCount + inProgressCount),
        overallComplianceScore: typeof dashStats.overallComplianceScore === 'number' ? dashStats.overallComplianceScore : 80,
        criticalAlertsCount: criticalCount,
        minesUnderNotice: noticeCount,
        scheduledInspections: scheduledCount,
        inProgressInspections: inProgressCount,
      });

      setMines(mineList);
      setInspections(inspectionList);
      setAlerts(alertList);
    } catch (err) {
      console.error('Failed to load dashboard data from dataService', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleMineClick = (m: Mine) => {
    if (onSelectMine) {
      onSelectMine(m);
    } else {
      onNavigate('mines', { mineId: m.id });
    }
  };

  const handleInspectionClick = (ins: Inspection) => {
    if (onSelectInspection) {
      onSelectInspection(ins);
    } else {
      onNavigate('inspections', { inspectionId: ins.id });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Compliance Overview"
        subtitle="Monitor mine safety, inspections, compliance status and emerging risks across registered coal collieries."
        showDateContext
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadDashboardData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              title="Refresh dashboard metrics"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export DGMS Summary</span>
            </button>
          </div>
        }
      />

      {/* KPI Section: 4 Dynamic KPI Cards */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Mines"
          value={stats.totalMines.toString()}
          supportingText={user?.role === 'ADMIN' ? 'All Registered Mines' : 'Assigned Collieries'}
          icon={Pickaxe}
          trend={{
            value: `${stats.minesUnderNotice} ${stats.minesUnderNotice === 1 ? 'notice issued' : 'notices issued'}`,
            neutral: true,
          }}
          accentColor="blue"
        />
        <StatCard
          title="Active Inspections"
          value={stats.activeInspections.toString()}
          supportingText="Scheduled / In Progress"
          icon={ClipboardCheck}
          trend={{
            value: `${stats.scheduledInspections} scheduled`,
            isPositive: true,
          }}
          accentColor="amber"
        />
        <StatCard
          title="Compliance Score"
          value={`${stats.overallComplianceScore}%`}
          supportingText="Overall statutory score"
          icon={ShieldCheck}
          trend={{ value: "+3.2% vs Q2", isPositive: true }}
          accentColor="emerald"
        />
        <StatCard
          title="Critical Alerts"
          value={stats.criticalAlertsCount < 10 ? `0${stats.criticalAlertsCount}` : stats.criticalAlertsCount.toString()}
          supportingText="Require statutory action"
          icon={AlertTriangle}
          accentColor="rose"
          alertBadge
        />
      </section>

      {/* Risk & Predictive Intelligence Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phase 7: Official Risk Intelligence */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900/80 to-slate-900/90 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Official Risk Intelligence
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Official Baseline
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Deterministic multi-factor score derived from verified inspections, open non-compliances, overdue remediation, and telemetry.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('risk-intelligence')}
            className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold text-xs transition-colors shadow-sm"
          >
            <span>Open Risk Intelligence</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Phase 8: Predictive Early Warning Intelligence */}
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-slate-900/80 to-slate-900/90 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Predictive Safety Intelligence
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                  Advisory Layer
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Forward deterioration trajectories (7d / 30d / 90d), early warning bands, repeat violation momentum, and proactive field directives.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('predictive-intelligence')}
            className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 font-bold text-xs transition-colors shadow-sm"
          >
            <span>Open Early Warning Advisory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Analytics & Risk Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Compliance (1/3 width on desktop) */}
        <div className="lg:col-span-1">
          <ComplianceOverview score={stats.overallComplianceScore} />
        </div>

        {/* Trend & Risk Distribution (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <ComplianceTrend />
          <RiskDistribution />
        </div>
      </div>

      {/* Recent Inspections Table */}
      <RecentInspections
        inspections={inspections}
        onNavigateToInspections={() => onNavigate('inspections')}
        onSelectInspection={handleInspectionClick}
      />

      {/* Critical Alerts & Mine Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CriticalAlerts
          alerts={alerts}
          onNavigateToAlerts={() => onNavigate('alerts')}
          onAlertUpdated={loadDashboardData}
        />
        <MineOverview
          mines={mines}
          onNavigateToMines={() => onNavigate('mines')}
          onSelectMine={handleMineClick}
        />
      </div>
    </div>
  );
};

import React from 'react';
import { ShieldAlert, TrendingUp, TrendingDown, Minus, HelpCircle, Clock, CheckCircle2 } from 'lucide-react';
import {
  MineRiskProfile,
  RiskScoreBand,
  RiskTimeWindow,
} from '../../data/models/RiskIntelligence';
import { getRiskBandBadgeStyle, getTrendBadgeStyle } from '../../services/risk/riskConfig';

interface RiskScoreCardProps {
  profile: MineRiskProfile;
  timeWindow: RiskTimeWindow;
  onTimeWindowChange: (w: RiskTimeWindow) => void;
  onExplainScore: () => void;
  onRecalculate?: () => void;
  isRecalculating?: boolean;
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({
  profile,
  timeWindow,
  onTimeWindowChange,
  onExplainScore,
  onRecalculate,
  isRecalculating,
}) => {
  const bandStyle = getRiskBandBadgeStyle(profile.riskLevel);
  const trendStyle = getTrendBadgeStyle(profile.trend);

  // Score arc / progress calculation
  const scorePercent = Math.min(100, Math.max(0, profile.overallScore));

  const getScoreColorClass = (band: RiskScoreBand) => {
    switch (band) {
      case 'CRITICAL':
        return 'text-red-400 stroke-red-500';
      case 'HIGH':
        return 'text-orange-400 stroke-orange-500';
      case 'MODERATE':
        return 'text-amber-400 stroke-amber-500';
      case 'LOW':
        return 'text-emerald-400 stroke-emerald-500';
      default:
        return 'text-slate-400 stroke-slate-600';
    }
  };

  const getScoreBgClass = (band: RiskScoreBand) => {
    switch (band) {
      case 'CRITICAL':
        return 'bg-red-500/10 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 border-orange-500/30';
      case 'MODERATE':
        return 'bg-amber-500/10 border-amber-500/30';
      case 'LOW':
        return 'bg-emerald-500/10 border-emerald-500/30';
      default:
        return 'bg-slate-800/40 border-slate-700';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Top Header Row: Mine Identity on Left, Controls on Right */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Colliery Risk Profile
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs font-mono font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              {profile.mineCode || 'DGMS-ID'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 truncate">
            {profile.mineName}
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-300">{profile.mineType || 'Colliery'}</span>
            <span>•</span>
            <span>{profile.district}, {profile.state}</span>
          </p>
        </div>

        {/* Time Window Controls & Explain Score */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0 self-start md:self-auto">
          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
            {(['7d', '30d', '90d'] as RiskTimeWindow[]).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onTimeWindowChange(w)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  timeWindow === w
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {w} Trend
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onExplainScore}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-300 transition-colors shadow-xs"
            title="Inspect full mathematical audit trail"
          >
            <HelpCircle className="h-4 w-4 text-amber-400" />
            <span>Explain Score</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: 2 Columns on Desktop >= 1280px (xl:), responsive stack on tablet/mobile */}
      <div className="flex flex-col xl:flex-row gap-6 pt-6 items-stretch">
        {/* Left Column: Risk Gauge, Score, Band, Trajectory & Comparison Stack */}
        <div className="w-full xl:w-[360px] 2xl:w-[380px] xl:shrink-0 rounded-xl border border-slate-800/80 bg-slate-950/60 p-5 flex flex-col justify-between gap-5">
          <div className="flex flex-col sm:flex-row xl:flex-col items-center sm:items-start xl:items-center gap-5">
            {/* Circular Gauge */}
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
              <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-800"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className={`${getScoreColorClass(profile.riskLevel)} transition-all duration-700`}
                  strokeWidth="10"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * scorePercent) / 100}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-3xl font-black tracking-tight text-white leading-none">
                  {profile.hasSufficientData ? profile.overallScore : '–'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  / 100
                </span>
              </div>
            </div>

            {/* Score Information & Vertical Metrics Stack */}
            <div className="flex flex-col items-center sm:items-start xl:items-center text-center sm:text-left xl:text-center w-full space-y-3.5">
              {/* Risk Band Badge */}
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${bandStyle.bg} ${bandStyle.text} ${bandStyle.border} shadow-xs`}
                >
                  <span className={`h-2 w-2 rounded-full ${bandStyle.dot}`} />
                  {profile.riskLevel} RISK
                </span>
              </div>

              {/* Trajectory Stack */}
              <div className="w-full pt-2 border-t border-slate-800/80 flex flex-col items-center sm:items-start xl:items-center gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Trajectory:
                </span>
                <span className={`font-bold text-sm flex items-center gap-1.5 ${trendStyle.text}`}>
                  <span className="text-base leading-none">{trendStyle.arrow}</span>
                  <span>{trendStyle.label}</span>
                </span>
              </div>

              {/* Comparison Stack */}
              <div className="w-full pt-2 border-t border-slate-800/80 flex flex-col items-center sm:items-start xl:items-center gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Comparison:
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  +{profile.counts.openHigh} High severity
                </span>
                {profile.scoreDelta !== undefined && profile.scoreDelta !== 0 ? (
                  <span className={`text-xs font-semibold ${profile.scoreDelta < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ({profile.scoreDelta > 0 ? `+${profile.scoreDelta}` : profile.scoreDelta} pts vs {timeWindow})
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    (0 pts vs {timeWindow})
                  </span>
                )}
              </div>

              {/* Calculation Timestamp */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span>
                  Calculated {new Date(profile.calculatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stable 2x2 Metric Cards Grid */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
            {/* 1. Open Critical */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5 flex flex-col justify-between min-h-[130px] transition-colors hover:border-slate-700">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-300">Open Critical</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    profile.counts.openCritical > 0
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {profile.counts.openCritical}
                </span>
              </div>
              <div className="my-2 text-3xl font-black text-white tracking-tight">
                {profile.counts.openCritical}
              </div>
              <span className="text-xs text-slate-400 block mt-auto">
                + {profile.counts.openHigh} High severity
              </span>
            </div>

            {/* 2. Overdue Actions */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5 flex flex-col justify-between min-h-[130px] transition-colors hover:border-slate-700">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-300">Overdue Actions</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    profile.counts.overdueActions > 0
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {profile.counts.overdueActions}
                </span>
              </div>
              <div className="my-2 text-3xl font-black text-white tracking-tight">
                {profile.counts.overdueActions}
              </div>
              <span className="text-xs text-slate-400 block mt-auto">
                Statutory deadlines breached
              </span>
            </div>

            {/* 3. Active Alerts */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5 flex flex-col justify-between min-h-[130px] transition-colors hover:border-slate-700">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-300">Active Alerts</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    profile.counts.criticalAlerts > 0
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {profile.counts.activeAlerts}
                </span>
              </div>
              <div className="my-2 text-3xl font-black text-white tracking-tight">
                {profile.counts.activeAlerts}
              </div>
              <span className="text-xs text-slate-400 block mt-auto truncate">
                {profile.counts.criticalAlerts} Critical telemetry events
              </span>
            </div>

            {/* 4. Last Audit */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5 flex flex-col justify-between min-h-[130px] transition-colors hover:border-slate-700">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-300">Last Audit</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              </div>
              <div className="my-2 text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                {profile.counts.lastInspectionDate
                  ? new Date(profile.counts.lastInspectionDate).toLocaleDateString()
                  : 'Pending'}
              </div>
              <span className="text-xs text-slate-400 block mt-auto truncate">
                {profile.counts.inspectionsCount} Total recorded audits
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Insufficient Data Banner if applicable */}
      {!profile.hasSufficientData && (
        <div className="mt-5 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 flex items-center gap-2.5">
          <HelpCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>{profile.dataSufficiencyReason || 'Insufficient statutory data to compute definitive risk score.'}</span>
        </div>
      )}
    </div>
  );
};

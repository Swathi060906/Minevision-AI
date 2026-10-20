import { RiskEngineConfig, RiskScoreBand, RiskTrendDirection } from '../../data/models/RiskIntelligence';

export const DEFAULT_RISK_CONFIG: RiskEngineConfig = {
  version: '1.0.0',
  updatedAt: '2026-09-01T00:00:00.000Z',
  updatedBy: 'DGMS Statutory Standards',
  severityWeights: {
    critical: 12,
    high: 6,
    medium: 2,
    low: 1,
  },
  factorMaxPoints: {
    severity: 35,
    recurrence: 25,
    aging: 20,
    alerts: 10,
    exposure: 10,
  },
  recurrenceMultiplier: 4,
  agingWeights: {
    bracket31to90: 3,
    bracketOver90: 6,
    overdueExtra: 4,
  },
  alertWeights: {
    critical: 5,
    high: 3,
    medium: 1,
  },
  thresholds: {
    lowMax: 24,
    moderateMax: 49,
    highMax: 74,
  },
};

export function determineRiskBand(score: number, hasSufficientData = true): RiskScoreBand {
  if (!hasSufficientData) return 'INSUFFICIENT_DATA';
  if (score <= DEFAULT_RISK_CONFIG.thresholds.lowMax) return 'LOW';
  if (score <= DEFAULT_RISK_CONFIG.thresholds.moderateMax) return 'MODERATE';
  if (score <= DEFAULT_RISK_CONFIG.thresholds.highMax) return 'HIGH';
  return 'CRITICAL';
}

export function getRiskBandBadgeStyle(band: RiskScoreBand): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (band) {
    case 'CRITICAL':
      return {
        bg: 'bg-red-500/15',
        text: 'text-red-400',
        border: 'border-red-500/30',
        dot: 'bg-red-500',
      };
    case 'HIGH':
      return {
        bg: 'bg-orange-500/15',
        text: 'text-orange-400',
        border: 'border-orange-500/30',
        dot: 'bg-orange-500',
      };
    case 'MODERATE':
      return {
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-500',
      };
    case 'LOW':
      return {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-500',
      };
    default:
      return {
        bg: 'bg-slate-700/30',
        text: 'text-slate-400',
        border: 'border-slate-700',
        dot: 'bg-slate-500',
      };
  }
}

export function getTrendBadgeStyle(trend: RiskTrendDirection): {
  text: string;
  arrow: string;
  label: string;
} {
  switch (trend) {
    case 'WORSENING':
      return { text: 'text-red-400', arrow: '↑', label: 'Worsening' };
    case 'IMPROVING':
      return { text: 'text-emerald-400', arrow: '↓', label: 'Improving' };
    case 'STABLE':
      return { text: 'text-slate-300', arrow: '→', label: 'Stable' };
    default:
      return { text: 'text-slate-500', arrow: '–', label: 'Insufficient Data' };
  }
}

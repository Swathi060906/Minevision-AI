import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  supportingText: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    neutral?: boolean;
  };
  accentColor?: 'amber' | 'blue' | 'emerald' | 'rose';
  alertBadge?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  supportingText,
  icon: Icon,
  trend,
  accentColor = 'blue',
  alertBadge = false,
}) => {
  const formattedValue = React.useMemo(() => {
    if (value === undefined || value === null) return '0';
    if (typeof value === 'object') return '0';
    return String(value);
  }, [value]);

  const formattedTrendValue = React.useMemo(() => {
    if (!trend?.value) return '';
    return trend.value.replace(/\bundefined\b/g, '0');
  }, [trend?.value]);

  const colorStyles = {
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      valueColor: 'text-amber-400',
    },
    blue: {
      border: 'border-slate-800 hover:border-slate-700',
      iconBg: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
      valueColor: 'text-white',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      valueColor: 'text-emerald-400',
    },
    rose: {
      border: 'border-rose-500/30 hover:border-rose-500/50 bg-rose-950/10',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
      valueColor: 'text-rose-400',
    },
  }[accentColor];

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-900/90 p-5 shadow-sm border transition-all duration-200 ${colorStyles.border}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorStyles.iconBg}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-3xl font-bold tracking-tight ${colorStyles.valueColor}`}>
          {formattedValue}
        </span>
        {alertBadge && (
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-rose-900/80 text-rose-200 border border-rose-700">
            Action Req.
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <p className="text-slate-400">{supportingText}</p>
        {trend && (
          <span
            className={`font-medium ${
              trend.neutral
                ? 'text-slate-400'
                : trend.isPositive
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}
          >
            {formattedTrendValue}
          </span>
        )}
      </div>
    </div>
  );
};

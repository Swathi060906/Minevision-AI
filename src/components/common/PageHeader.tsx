import React from 'react';
import { ShieldCheck, Calendar, Info } from 'lucide-react';

export interface PageBadgeObject {
  text: string;
  variant?: 'amber' | 'emerald' | 'blue' | 'purple' | 'red' | string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string | PageBadgeObject | React.ReactNode;
  action?: React.ReactNode;
  actions?: React.ReactNode;
  showDateContext?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  action,
  actions,
  showDateContext = false,
}) => {
  const renderedAction = action || actions;

  const renderBadge = () => {
    if (!badge) return null;
    if (typeof badge === 'string' || typeof badge === 'number') {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-medium text-amber-300">
          {badge}
        </span>
      );
    }
    if (React.isValidElement(badge)) {
      return badge;
    }
    if (typeof badge === 'object' && badge !== null && 'text' in (badge as any)) {
      const badgeObj = badge as PageBadgeObject;
      const variantClass = badgeObj.variant === 'emerald'
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        : badgeObj.variant === 'blue'
        ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
        : badgeObj.variant === 'red'
        ? 'bg-red-500/10 border-red-500/30 text-red-300'
        : 'bg-amber-500/10 border-amber-500/30 text-amber-300';

      return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantClass}`}>
          {badgeObj.text}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          {renderBadge()}
          <span className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-700/60">
            <Info className="w-3 h-3 text-slate-400" />
            Prototype / Demonstration Environment
          </span>
        </div>
        {subtitle && (
          <p className="mt-1.5 text-sm text-slate-400 max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {showDateContext && (
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
            <span>Statutory Cycle: <strong className="font-semibold text-white">Q3 FY26 (Sep 2026)</strong></span>
          </div>
        )}
        {renderedAction}
      </div>
    </div>
  );
};

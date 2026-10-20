import React from 'react';
import { RiskLevel, InspectionStatus, AlertSeverity } from '../../types';

interface StatusBadgeProps {
  type: 'risk' | 'inspection' | 'severity' | 'mineStatus' | 'verification' | 'knowledgeStatus';
  value: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  value,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  // Verification badges
  if (type === 'verification') {
    const v = value.toUpperCase();
    if (v === 'VERIFIED') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 font-semibold uppercase tracking-wider ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30" />
          <span>Verified</span>
        </span>
      );
    }
    if (v === 'NEEDS_REVIEW') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-950/80 border border-amber-700/80 text-amber-300 font-semibold uppercase tracking-wider ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Needs Review</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 font-semibold uppercase tracking-wider ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span>Unverified</span>
      </span>
    );
  }

  // Knowledge status badges
  if (type === 'knowledgeStatus') {
    const s = value.toUpperCase();
    if (s === 'ACTIVE') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-950/60 border border-emerald-800/70 text-emerald-300 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Active</span>
        </span>
      );
    }
    if (s === 'DRAFT') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-950/60 border border-amber-800/70 text-amber-300 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Draft</span>
        </span>
      );
    }
    if (s === 'SUPERSEDED') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-purple-950/60 border border-purple-800/70 text-purple-300 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span>Superseded</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        <span>Archived</span>
      </span>
    );
  }

  // Risk badges
  if (type === 'risk') {
    const risk = value as RiskLevel;
    switch (risk) {
      case 'Critical':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-rose-950/70 border border-rose-800/80 text-rose-300 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
            <span>Critical</span>
          </span>
        );
      case 'High':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-orange-950/70 border border-orange-800/80 text-orange-300 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" aria-hidden="true" />
            <span>High Risk</span>
          </span>
        );
      case 'Medium':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-950/70 border border-amber-800/80 text-amber-300 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            <span>Medium</span>
          </span>
        );
      case 'Low':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>Low Risk</span>
          </span>
        );
    }
  }

  // Inspection status badges
  if (type === 'inspection') {
    const status = value as InspectionStatus;
    switch (status) {
      case 'Completed':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-950/60 border border-emerald-800/70 text-emerald-300 ${sizeClasses}`}>
            <span className="text-[10px]">✓</span>
            <span>Completed</span>
          </span>
        );
      case 'Review Required':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-950/60 border border-amber-800/70 text-amber-300 ${sizeClasses}`}>
            <span className="text-[10px]">⚠</span>
            <span>Review Required</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-sky-950/60 border border-sky-800/70 text-sky-300 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" aria-hidden="true" />
            <span>In Progress</span>
          </span>
        );
      case 'Scheduled':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 ${sizeClasses}`}>
            <span className="text-[10px]">⏱</span>
            <span>Scheduled</span>
          </span>
        );
    }
  }

  // Severity badges
  if (type === 'severity') {
    const severity = value.toUpperCase() as AlertSeverity;
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-rose-950/90 border border-rose-700 text-rose-200 uppercase tracking-wide font-semibold ${sizeClasses}`}>
            <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-400/40" />
            <span>CRITICAL</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-orange-950/90 border border-orange-700 text-orange-200 uppercase tracking-wide font-semibold ${sizeClasses}`}>
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>HIGH</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-950/90 border border-amber-700 text-amber-200 uppercase tracking-wide font-semibold ${sizeClasses}`}>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>MEDIUM</span>
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 uppercase tracking-wide font-medium ${sizeClasses}`}>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>LOW</span>
          </span>
        );
    }
  }

  // Mine status
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md bg-slate-800/90 border border-slate-700 text-slate-300 ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      <span>{value}</span>
    </span>
  );
};

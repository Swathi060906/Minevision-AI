import React from 'react';
import { ClipboardCheck, ExternalLink, ArrowRight } from 'lucide-react';
import { Inspection } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface RecentInspectionsProps {
  inspections: Inspection[];
  onNavigateToInspections?: () => void;
  onSelectInspection?: (inspection: Inspection) => void;
}

export const RecentInspections: React.FC<RecentInspectionsProps> = ({
  inspections,
  onNavigateToInspections,
  onSelectInspection,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Recent Inspections
          </h2>
        </div>
        {onNavigateToInspections && (
          <button
            type="button"
            onClick={onNavigateToInspections}
            className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>View All Records</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Responsive horizontally scrollable table */}
      <div className="mt-4 -mx-5 px-5 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <th scope="col" className="py-2.5 pr-3 font-semibold">Inspection ID</th>
              <th scope="col" className="py-2.5 px-3 font-semibold">Mine</th>
              <th scope="col" className="py-2.5 px-3 font-semibold">Inspection Type</th>
              <th scope="col" className="py-2.5 px-3 font-semibold">Inspector</th>
              <th scope="col" className="py-2.5 px-3 font-semibold">Date</th>
              <th scope="col" className="py-2.5 px-3 font-semibold text-center">Compliance</th>
              <th scope="col" className="py-2.5 px-3 font-semibold text-center">Risk</th>
              <th scope="col" className="py-2.5 pl-3 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {inspections.slice(0, 5).map((ins) => (
              <tr
                key={ins.id}
                onClick={() => onSelectInspection?.(ins)}
                className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
              >
                <td className="py-3 pr-3 font-mono font-medium text-amber-400 group-hover:text-amber-300">
                  {ins.id}
                </td>
                <td className="py-3 px-3 font-medium text-white">
                  {ins.mineName}
                </td>
                <td className="py-3 px-3 text-slate-300">
                  {ins.inspectionType}
                </td>
                <td className="py-3 px-3 text-slate-400">
                  {ins.inspector}
                </td>
                <td className="py-3 px-3 text-slate-400">
                  {ins.date}
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`font-semibold ${
                      ins.complianceScore >= 85
                        ? 'text-emerald-400'
                        : ins.complianceScore >= 75
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {ins.complianceScore}%
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <StatusBadge type="risk" value={ins.riskLevel} size="sm" />
                </td>
                <td className="py-3 pl-3 text-right">
                  <StatusBadge type="inspection" value={ins.status} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { DocumentAnalysis } from '../../data/models/DocumentAnalysis';
import { Inspection } from '../../data/models/Inspection';
import { Mine } from '../../data/models/Mine';

interface AnalysisHistoryViewProps {
  analyses: DocumentAnalysis[];
  inspections: Inspection[];
  mines: Mine[];
  onSelectAnalysis: (analysisId: string) => void;
  onNewAnalysis: () => void;
}

export const AnalysisHistoryView: React.FC<AnalysisHistoryViewProps> = ({
  analyses,
  inspections,
  mines,
  onSelectAnalysis,
  onNewAnalysis,
}) => {
  const inspectionMap = new Map<string, Inspection>(inspections.map((i) => [i.id, i]));
  const mineMap = new Map<string, Mine>(mines.map((m) => [m.id, m]));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
            Completed (Reviewed)
          </span>
        );
      case 'REVIEW_REQUIRED':
        return (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
            Review Required
          </span>
        );
      case 'EXTRACTING':
      case 'RETRIEVING':
      case 'ANALYZING':
        return (
          <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-bold text-sky-400 border border-sky-500/30">
            Processing...
          </span>
        );
      case 'FAILED':
        return (
          <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-400 border border-red-500/30">
            Failed
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Document Compliance Audit History</h3>
          <p className="text-xs text-slate-400">
            All AI-assisted document analyses, extracted evidence, and statutory review records.
          </p>
        </div>
        <button
          onClick={onNewAnalysis}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
        >
          <Sparkles className="h-3.5 w-3.5" />
          New Document Analysis
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Analysis Date</th>
                <th className="py-3 px-4">Document / File</th>
                <th className="py-3 px-4">Mine & District</th>
                <th className="py-3 px-4">Inspection ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Extracted Facts</th>
                <th className="py-3 px-4">Proposed Findings</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {analyses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-400">No document analyses yet.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Start your first AI document compliance analysis using the button above.
                    </p>
                  </td>
                </tr>
              ) : (
                analyses.map((a) => {
                  const ins = inspectionMap.get(a.inspectionId);
                  const mine = mineMap.get(a.mineId);

                  const acceptedCount = (a.proposedFindings || []).filter(
                    (p) => p.reviewStatus === 'ACCEPTED' || p.reviewStatus === 'EDITED_AND_ACCEPTED'
                  ).length;
                  const totalFindings = (a.proposedFindings || []).length;

                  return (
                    <tr
                      key={a.id}
                      onClick={() => onSelectAnalysis(a.id)}
                      className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {new Date(a.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        {new Date(a.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{a.fileName}</span>
                        </div>
                        {a.isDemoMode && (
                          <span className="text-[10px] font-bold text-amber-400">
                            Demo Mode (Synthetic)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-200">
                          {mine?.name || ins?.mineName || 'Mine'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {ins?.inspectionNumber || a.inspectionId.substring(0, 12)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(a.analysisStatus)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-sky-400">
                        {a.extractedFacts?.length || 0}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-white">{totalFindings}</span>
                          {totalFindings > 0 && (
                            <span className="text-[10px] text-slate-400">
                              ({acceptedCount} accepted)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAnalysis(a.id);
                          }}
                          className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                          View
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

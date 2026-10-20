import React from 'react';
import { X, History, Clock, FileImage, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { VisionAnalysis } from '../../data/models/VisionAnalysis';

interface VisionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  analyses: VisionAnalysis[];
  onSelectAnalysis: (analysis: VisionAnalysis) => void;
  selectedAnalysisId?: string;
}

export const VisionHistoryModal: React.FC<VisionHistoryModalProps> = ({
  isOpen,
  onClose,
  analyses,
  onSelectAnalysis,
  selectedAnalysisId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Vision Analysis History</h3>
              <p className="text-xs text-slate-400">
                Audited visual compliance monitoring runs and evidence
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {analyses.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-8 text-center">
              <p className="text-sm font-semibold text-slate-300">No Past Analyses Found</p>
              <p className="text-xs text-slate-400 mt-1">
                Visual analyses run for this mine will appear in this audit history list.
              </p>
            </div>
          ) : (
            analyses.map((item) => {
              const isSelected = selectedAnalysisId === item.id;
              const formattedDate = new Date(item.createdAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              });

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                      <FileImage className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{item.sourceFileName}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.status === 'FAILED'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.isDemoSimulation && (
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                            DEMO SIMULATION
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="h-3 w-3" />
                          {formattedDate}
                        </span>
                        <span>•</span>
                        <span>Detections: {item.detections?.length || 0}</span>
                        <span>•</span>
                        <span>Observations: {item.observations?.length || 0}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px]">{item.model}</span>
                      </div>
                      {item.summary && (
                        <p className="mt-1.5 text-xs text-slate-300 line-clamp-1">
                          {item.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectAnalysis(item);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                  >
                    <span>Load</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Settings, RotateCcw, Save, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { RiskEngineConfig } from '../../data/models/RiskIntelligence';
import { DEFAULT_RISK_CONFIG } from '../../services/risk/riskConfig';

interface RiskConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RiskEngineConfig;
  isAdmin: boolean;
  onSave: (updated: Partial<RiskEngineConfig>) => Promise<void>;
  onReset: () => Promise<void>;
}

export const RiskConfigModal: React.FC<RiskConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  isAdmin,
  onSave,
  onReset,
}) => {
  const [formData, setFormData] = useState<RiskEngineConfig>({ ...config });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      await onSave(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!isAdmin) return;
    if (window.confirm('Reset all risk engine weights and thresholds to DGMS Statutory Defaults?')) {
      setIsSaving(true);
      try {
        await onReset();
        setFormData({ ...DEFAULT_RISK_CONFIG });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Statutory Risk Engine Configuration
              </h2>
              <p className="text-xs text-slate-400">
                Centralized mathematical weights, factor ceilings, and risk band thresholds (v{config.version})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {!isAdmin && (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Read-Only: Modifying statutory risk scoring parameters requires System Administrator privileges.</span>
            </div>
          )}

          {/* Severity Weights Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              1. Unresolved Finding Severity Multipliers (Points per Finding)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Critical (Max 35 cap)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  min={1}
                  max={25}
                  value={formData.severityWeights.critical}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      severityWeights: {
                        ...formData.severityWeights,
                        critical: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">High Severity</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  min={1}
                  max={20}
                  value={formData.severityWeights.high}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      severityWeights: {
                        ...formData.severityWeights,
                        high: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Medium Severity</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  min={1}
                  max={10}
                  value={formData.severityWeights.medium}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      severityWeights: {
                        ...formData.severityWeights,
                        medium: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Low Severity</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  min={0}
                  max={5}
                  value={formData.severityWeights.low}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      severityWeights: {
                        ...formData.severityWeights,
                        low: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Factor Maximum Point Allocations (Must Sum to 100) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              2. Factor Maximum Caps (Points)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Severity Cap</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.factorMaxPoints.severity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      factorMaxPoints: {
                        ...formData.factorMaxPoints,
                        severity: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Recurrence Cap</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.factorMaxPoints.recurrence}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      factorMaxPoints: {
                        ...formData.factorMaxPoints,
                        recurrence: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Aging Cap</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.factorMaxPoints.aging}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      factorMaxPoints: {
                        ...formData.factorMaxPoints,
                        aging: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Alerts Cap</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.factorMaxPoints.alerts}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      factorMaxPoints: {
                        ...formData.factorMaxPoints,
                        alerts: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Exposure Cap</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.factorMaxPoints.exposure}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      factorMaxPoints: {
                        ...formData.factorMaxPoints,
                        exposure: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Risk Band Thresholds */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              3. Risk Score Band Thresholds
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-bold text-emerald-400 block mb-1">
                  LOW RISK Band (0 to Max)
                </span>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.thresholds.lowMax}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      thresholds: {
                        ...formData.thresholds,
                        lowMax: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-white disabled:opacity-60"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-bold text-amber-400 block mb-1">
                  MODERATE Band (to Max)
                </span>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.thresholds.moderateMax}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      thresholds: {
                        ...formData.thresholds,
                        moderateMax: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-white disabled:opacity-60"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-bold text-orange-400 block mb-1">
                  HIGH Band (to Max, &gt; = CRITICAL)
                </span>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={formData.thresholds.highMax}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      thresholds: {
                        ...formData.thresholds,
                        highMax: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-white disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Audit Trail Note */}
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span>Last modified by: {config.updatedBy}</span>
            <span>{new Date(config.updatedAt).toLocaleDateString()}</span>
          </div>

          {/* Footer Controls */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
            {isAdmin ? (
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset to DGMS Defaults</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                Cancel
              </button>

              {isAdmin && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 transition-colors shadow-sm disabled:opacity-50"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-slate-950" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

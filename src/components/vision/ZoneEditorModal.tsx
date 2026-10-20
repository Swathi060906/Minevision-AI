import React, { useState } from 'react';
import { X, ShieldAlert, Plus, Trash2, Check, AlertTriangle } from 'lucide-react';
import { ZoneDefinition, ZoneType, CreateZoneInput } from '../../data/models/ZoneDefinition';
import { Mine } from '../../data/models/Mine';

interface ZoneEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mine: Mine;
  zones: ZoneDefinition[];
  onSaveZone: (input: CreateZoneInput) => Promise<void>;
  onDeleteZone: (zoneId: string) => Promise<void>;
  currentUserEmail: string;
}

export const ZoneEditorModal: React.FC<ZoneEditorModalProps> = ({
  isOpen,
  onClose,
  mine,
  zones,
  onSaveZone,
  onDeleteZone,
  currentUserEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');

  // Form state
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState<ZoneType>('RESTRICTED');
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#ef4444');

  // Normalized coordinates (0-100%)
  const [xPct, setXPct] = useState(20);
  const [yPct, setYPct] = useState(25);
  const [widthPct, setWidthPct] = useState(40);
  const [heightPct, setHeightPct] = useState(40);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a descriptive zone name.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await onSaveZone({
        name: name.trim(),
        mineId: mine.id,
        zoneType,
        severity,
        description: description.trim(),
        color,
        enabled: true,
        createdBy: currentUserEmail,
        geometry: {
          type: 'RECTANGLE',
          boundingBox: {
            x: xPct / 100,
            y: yPct / 100,
            width: widthPct / 100,
            height: heightPct / 100,
          },
        },
      });

      // Reset form
      setName('');
      setDescription('');
      setActiveTab('LIST');
    } catch (err: any) {
      setError(err.message || 'Failed to save zone.');
    } finally {
      setIsSaving(false);
    }
  };

  const presetColors = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configured Safety Zones</h3>
              <p className="text-xs text-slate-400">Mine: {mine.name} ({mine.id})</p>
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

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('LIST')}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition-colors ${
              activeTab === 'LIST'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Zones ({zones.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CREATE')}
            className={`flex items-center gap-1.5 border-b-2 py-3 px-4 text-xs font-semibold transition-colors ${
              activeTab === 'CREATE'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Define New Zone
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'LIST' ? (
            <div className="space-y-3">
              {zones.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-8 text-center">
                  <p className="text-sm font-semibold text-slate-300">No Safety Zones Defined</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Define restricted or hazardous zones to automatically detect intrusion events during vision monitoring.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('CREATE')}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add First Zone
                  </button>
                </div>
              ) : (
                zones.map((z) => (
                  <div
                    key={z.id}
                    className="flex items-start justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-slate-700"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        style={{ backgroundColor: z.color || '#ef4444' }}
                        className="mt-1 h-3.5 w-3.5 rounded-full shrink-0 shadow"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white">{z.name}</h4>
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 uppercase">
                            {z.zoneType}
                          </span>
                          <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300 uppercase border border-red-500/40">
                            {z.severity}
                          </span>
                        </div>
                        {z.description && (
                          <p className="mt-1 text-xs text-slate-400">{z.description}</p>
                        )}
                        {z.geometry.boundingBox && (
                          <p className="mt-1.5 font-mono text-[10px] text-slate-400">
                            Bounds: X: {(z.geometry.boundingBox.x * 100).toFixed(0)}% - Y:{' '}
                            {(z.geometry.boundingBox.y * 100).toFixed(0)}% (W:{' '}
                            {(z.geometry.boundingBox.width * 100).toFixed(0)}%, H:{' '}
                            {(z.geometry.boundingBox.height * 100).toFixed(0)}%)
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteZone(z.id)}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                      title="Delete Zone"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Zone Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 6.6kV Substation Perimeter Cage"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Zone Type
                  </label>
                  <select
                    value={zoneType}
                    onChange={(e) => setZoneType(e.target.value as ZoneType)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="RESTRICTED">RESTRICTED (No Personnel)</option>
                    <option value="NO_ENTRY">NO_ENTRY (Strict Exclusion)</option>
                    <option value="VEHICLE_ONLY">VEHICLE_ONLY (Heavy Equipment Only)</option>
                    <option value="PEDESTRIAN_ONLY">PEDESTRIAN_ONLY (Walkway)</option>
                    <option value="HAZARDOUS">HAZARDOUS (Pinch / High Temp)</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Intrusion Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) =>
                      setSeverity(e.target.value as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW')
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate Alarm)</option>
                    <option value="HIGH">HIGH (Urgent Warning)</option>
                    <option value="MEDIUM">MEDIUM (Operational Caution)</option>
                    <option value="LOW">LOW (Informational)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description / Operational Rule
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. High voltage machinery. Only permit-holders permitted with lockout-tagout."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Bounding Box Coordinates Sliders */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <span className="block text-xs font-semibold text-slate-300">
                  Perimeter Geometry (Normalized Coordinates % of Frame)
                </span>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400">Left (X): {xPct}%</label>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      value={xPct}
                      onChange={(e) => setXPct(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400">Top (Y): {yPct}%</label>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      value={yPct}
                      onChange={(e) => setYPct(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400">Width: {widthPct}%</label>
                    <input
                      type="range"
                      min={10}
                      max={100 - xPct}
                      value={widthPct}
                      onChange={(e) => setWidthPct(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400">Height: {heightPct}%</label>
                    <input
                      type="range"
                      min={10}
                      max={100 - yPct}
                      value={heightPct}
                      onChange={(e) => setHeightPct(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Zone Overlay Color
                </label>
                <div className="flex items-center gap-2">
                  {presetColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-6 w-6 rounded-full transition-transform ${
                        color === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('LIST')}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {isSaving ? 'Saving...' : 'Save Safety Zone'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

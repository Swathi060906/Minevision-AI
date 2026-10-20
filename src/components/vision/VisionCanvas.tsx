import React, { useState } from 'react';
import { Eye, EyeOff, ShieldAlert, Tag, Maximize2, AlertTriangle } from 'lucide-react';
import { VisionDetection, DetectionType } from '../../data/models/VisionDetection';
import { ZoneDefinition } from '../../data/models/ZoneDefinition';

interface VisionCanvasProps {
  imageUrl: string | null;
  fileName?: string;
  detections: VisionDetection[];
  zones: ZoneDefinition[];
  selectedDetectionId?: string | null;
  selectedZoneId?: string | null;
  isDemoSimulation?: boolean;
  onSelectDetection?: (id: string | null) => void;
  onSelectZone?: (id: string | null) => void;
  onDrawZone?: (boundingBox: { x: number; y: number; width: number; height: number }) => void;
  isDrawingMode?: boolean;
}

export const VisionCanvas: React.FC<VisionCanvasProps> = ({
  imageUrl,
  fileName,
  detections,
  zones,
  selectedDetectionId,
  selectedZoneId,
  isDemoSimulation = false,
  onSelectDetection,
  onSelectZone,
}) => {
  const [showDetections, setShowDetections] = useState(true);
  const [showPpe, setShowPpe] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);

  if (!imageUrl) {
    return (
      <div className="flex h-[480px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-slate-400 mb-4">
          <Eye className="h-7 w-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">No Visual Evidence Loaded</h3>
        <p className="mt-1 max-w-sm text-xs text-slate-400">
          Upload an inspection photo, CCTV snapshot, or run a demonstration scenario to perform computer vision safety monitoring.
        </p>
      </div>
    );
  }

  // Filter detections based on toggles
  const visibleDetections = detections.filter((d) => {
    if (!showDetections) return false;
    const isPpeType = d.type === 'HARD_HAT' || d.type === 'SAFETY_VEST' || d.type === 'SAFETY_SHOE';
    if (isPpeType && !showPpe) return false;
    return true;
  });

  const getDetectionColor = (type: DetectionType, isSelected: boolean) => {
    if (isSelected) {
      return {
        border: 'border-amber-400 ring-2 ring-amber-400',
        bg: 'bg-amber-500/25',
        badge: 'bg-amber-500 text-slate-950 font-bold',
      };
    }
    switch (type) {
      case 'PERSON':
        return {
          border: 'border-cyan-400',
          bg: 'bg-cyan-500/10 hover:bg-cyan-500/20',
          badge: 'bg-cyan-500/90 text-slate-950',
        };
      case 'HARD_HAT':
        return {
          border: 'border-emerald-400',
          bg: 'bg-emerald-500/20 hover:bg-emerald-500/30',
          badge: 'bg-emerald-500 text-slate-950',
        };
      case 'SAFETY_VEST':
        return {
          border: 'border-amber-400',
          bg: 'bg-amber-500/20 hover:bg-amber-500/30',
          badge: 'bg-amber-500 text-slate-950',
        };
      case 'SAFETY_SHOE':
        return {
          border: 'border-teal-400',
          bg: 'bg-teal-500/20 hover:bg-teal-500/30',
          badge: 'bg-teal-500 text-slate-950',
        };
      case 'HEMM':
      case 'VEHICLE':
        return {
          border: 'border-purple-400',
          bg: 'bg-purple-500/15 hover:bg-purple-500/25',
          badge: 'bg-purple-500 text-white',
        };
      case 'RESTRICTED_ZONE':
        return {
          border: 'border-red-500',
          bg: 'bg-red-500/20',
          badge: 'bg-red-500 text-white',
        };
      default:
        return {
          border: 'border-slate-400',
          bg: 'bg-slate-500/10',
          badge: 'bg-slate-700 text-slate-200',
        };
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Canvas Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="font-medium text-slate-400">View Controls:</span>
          <button
            type="button"
            onClick={() => setShowDetections(!showDetections)}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
              showDetections
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {showDetections ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            Detections ({detections.length})
          </button>

          <button
            type="button"
            onClick={() => setShowPpe(!showPpe)}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
              showPpe
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Tag className="h-3 w-3" />
            PPE
          </button>

          <button
            type="button"
            onClick={() => setShowZones(!showZones)}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
              showZones
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <ShieldAlert className="h-3 w-3" />
            Safety Zones ({zones.length})
          </button>

          <button
            type="button"
            onClick={() => setShowConfidence(!showConfidence)}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
              showConfidence
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            Confidence %
          </button>
        </div>

        {fileName && (
          <span className="truncate max-w-[200px] text-slate-400 font-mono text-[11px]">
            {fileName}
          </span>
        )}
      </div>

      {/* Simulation Notice Banner */}
      {isDemoSimulation && (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="font-semibold uppercase tracking-wide">
            DEMO / SIMULATION — NOT A REAL DETECTION
          </span>
          <span className="text-amber-400/80">
            This visual scene and bounding boxes are simulated for hackathon evaluation.
          </span>
        </div>
      )}

      {/* Image Stage Container */}
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl select-none">
        <div className="relative w-full aspect-[16/10] max-h-[580px] bg-slate-950 flex items-center justify-center">
          <img
            src={imageUrl}
            alt={fileName || 'Visual Evidence'}
            className="w-full h-full object-contain"
          />

          {/* Safety Zone Overlays */}
          {showZones &&
            zones.map((zone) => {
              if (zone.geometry.type !== 'RECTANGLE' || !zone.geometry.boundingBox) return null;
              const box = zone.geometry.boundingBox;
              const isSelected = selectedZoneId === zone.id;

              return (
                <div
                  key={zone.id}
                  onClick={() => onSelectZone?.(isSelected ? null : zone.id)}
                  style={{
                    left: `${box.x * 100}%`,
                    top: `${box.y * 100}%`,
                    width: `${box.width * 100}%`,
                    height: `${box.height * 100}%`,
                    borderColor: zone.color || '#ef4444',
                  }}
                  className={`absolute border-2 border-dashed transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-500/30 ring-2 ring-red-400 z-30'
                      : 'bg-red-500/15 hover:bg-red-500/25 z-10'
                  }`}
                  title={`${zone.name} (${zone.zoneType})`}
                >
                  <div
                    style={{ backgroundColor: zone.color || '#ef4444' }}
                    className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider shadow whitespace-nowrap"
                  >
                    ZONE: {zone.name}
                  </div>
                </div>
              );
            })}

          {/* Detection Bounding Boxes */}
          {visibleDetections.map((det) => {
            const isSelected = selectedDetectionId === det.id;
            const styleProps = getDetectionColor(det.type, isSelected);
            const box = det.boundingBox;

            return (
              <div
                key={det.id}
                onClick={() => onSelectDetection?.(isSelected ? null : det.id)}
                style={{
                  left: `${box.x * 100}%`,
                  top: `${box.y * 100}%`,
                  width: `${box.width * 100}%`,
                  height: `${box.height * 100}%`,
                }}
                className={`absolute border-2 transition-all cursor-pointer ${styleProps.border} ${styleProps.bg} ${
                  isSelected ? 'z-40' : 'z-20'
                }`}
              >
                <div
                  className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap shadow ${styleProps.badge}`}
                >
                  <span>{det.label}</span>
                  {showConfidence && (
                    <span className="ml-1 opacity-90">({(det.confidence * 100).toFixed(0)}%)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

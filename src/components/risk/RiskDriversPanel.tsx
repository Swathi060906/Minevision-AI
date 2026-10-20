import React from 'react';
import { AlertCircle, ShieldAlert, ArrowUpRight, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import { RiskDriver } from '../../data/models/RiskIntelligence';

interface RiskDriversPanelProps {
  drivers: RiskDriver[];
  onNavigateToSource?: (sourceType: RiskDriver['sourceType'], sourceId: string) => void;
}

export const RiskDriversPanel: React.FC<RiskDriversPanelProps> = ({
  drivers,
  onNavigateToSource,
}) => {
  const getSeverityBadgeClass = (severity: RiskDriver['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getSourceTypeBadge = (sourceType: RiskDriver['sourceType']) => {
    switch (sourceType) {
      case 'FINDING':
        return 'Finding';
      case 'ALERT':
        return 'Telemetry Alert';
      case 'INSPECTION':
        return 'Audit Cycle';
      default:
        return 'Observation';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Why is this Mine at Risk? (Primary Drivers)
          </h3>
        </div>
        <span className="text-xs text-slate-400">Ranked by Statutory Severity</span>
      </div>

      {drivers.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No significant risk drivers identified. Colliery is compliant with current DGMS operating parameters.
        </div>
      ) : (
        <div className="space-y-3">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Rank Circle */}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-amber-400 border border-slate-700">
                    {driver.rank}
                  </span>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {driver.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getSeverityBadgeClass(
                          driver.severity
                        )}`}
                      >
                        {driver.severity}
                      </span>
                      <span className="text-[10px] font-medium bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                        {getSourceTypeBadge(driver.sourceType)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {driver.description}
                    </p>

                    {/* Evidence & Regulatory Grounding */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-400">
                      {driver.sourceReference && (
                        <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                          <BookOpen className="h-3 w-3" />
                          <span>{driver.sourceReference}</span>
                        </span>
                      )}

                      {driver.evidenceSummary && (
                        <span className="text-slate-400">
                          {driver.evidenceSummary}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Source Link Button */}
                {onNavigateToSource && (
                  <button
                    type="button"
                    onClick={() => onNavigateToSource(driver.sourceType, driver.sourceId)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                    title={`View original ${driver.sourceType.toLowerCase()} record: ${driver.sourceId}`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

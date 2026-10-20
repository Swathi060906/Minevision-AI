import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, X, ShieldAlert, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { CriticalAlert } from '../../types';
import { getAlertDisplayText, getAlertMineName, getAlertDate } from '../../data/models/Alert';
import { StatusBadge } from '../common/StatusBadge';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../auth/AuthContext';

interface CriticalAlertsProps {
  alerts: CriticalAlert[];
  onNavigateToAlerts?: () => void;
  onAlertUpdated?: () => void;
}

export const CriticalAlerts: React.FC<CriticalAlertsProps> = ({
  alerts,
  onNavigateToAlerts,
  onAlertUpdated,
}) => {
  const { logAuditEvent } = useAuth();
  const [selectedAlert, setSelectedAlert] = useState<CriticalAlert | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAcknowledge = async () => {
    if (!selectedAlert) return;
    try {
      setIsUpdating(true);
      await dataService.updateAlert(selectedAlert.id, { status: 'Acknowledged' });
      logAuditEvent('ALERT_ACKNOWLEDGED', {
        alertId: selectedAlert.id,
        mine: selectedAlert.mine,
        severity: selectedAlert.severity,
      });
      if (onAlertUpdated) {
        onAlertUpdated();
      }
      setSelectedAlert(null);
    } catch (err) {
      console.error('Failed to acknowledge alert', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Critical Alerts
          </h2>
        </div>
        {onNavigateToAlerts && (
          <button
            type="button"
            onClick={onNavigateToAlerts}
            className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
          >
            View All ({alerts.length})
          </button>
        )}
      </div>

      <p className="mt-2 text-[11px] text-slate-400">
        Statutory hazard notices and telemetry warnings under active monitoring.
      </p>

      <div className="mt-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-6 text-center text-xs text-slate-400">
            No active critical alerts under monitoring.
          </div>
        ) : (
          alerts.slice(0, 4).map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border p-4 transition-all duration-150 ${
                alert.severity === 'CRITICAL'
                  ? 'border-rose-900/70 bg-rose-950/20 hover:border-rose-800 hover:bg-rose-950/30'
                  : 'border-orange-900/70 bg-orange-950/20 hover:border-orange-800 hover:bg-orange-950/30'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge type="severity" value={alert.severity} size="sm" />
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {alert.status || 'Active'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>{getAlertDate(alert)}</span>
                </div>
              </div>

              <h3 className="mt-2 text-sm font-semibold text-white leading-snug">
                {getAlertDisplayText(alert)}
              </h3>

              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-medium">{getAlertMineName(alert)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAlert(alert)}
                  className="inline-flex items-center gap-1 rounded bg-slate-800/90 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-slate-700 hover:text-amber-200 border border-slate-700 transition-colors"
                >
                  <span>View Details</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-400" />
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Compliance Alert Details
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {selectedAlert.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Severity Classification:</span>
                <StatusBadge type="severity" value={selectedAlert.severity} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Mine:</span>
                <span className="font-semibold text-white">{getAlertMineName(selectedAlert)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Location In-Pit:</span>
                <span className="text-slate-200">{selectedAlert.locationDetail || 'Main Pit'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-semibold text-amber-400">{selectedAlert.status || 'Active'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Logged Timestamp:</span>
                <span className="text-slate-300">{getAlertDate(selectedAlert)}</span>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1.5">
                <span className="font-medium text-slate-400">Observed Non-Compliance:</span>
                <p className="text-sm font-medium text-slate-200">{getAlertDisplayText(selectedAlert)}</p>
              </div>

              <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 space-y-1.5">
                <span className="font-medium text-amber-300">Statutory / SOP Action Directive:</span>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  {selectedAlert.actionPrompt || 'Review standard operating procedure and comply with DGMS mandate.'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Close
              </button>
              {selectedAlert.status !== 'Acknowledged' && selectedAlert.status !== 'Resolved' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleAcknowledge}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Acknowledge Alert</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

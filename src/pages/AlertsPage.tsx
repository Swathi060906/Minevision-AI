import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Bell, AlertTriangle, ShieldAlert, CheckCircle2, Clock, MapPin, Eye, X, Filter, RefreshCw, Check } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { FilterButton } from '../components/common/FilterButton';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { Alert, getAlertDisplayText, getAlertMineName, getAlertDate } from '../data/models/Alert';
import { dataService } from '../services/dataService';
import { useAuth } from '../auth/AuthContext';

export const AlertsPage: React.FC = () => {
  const { user, logAuditEvent } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dataService.getAlerts({
        role: user?.role,
        mineIds: user?.mineIds,
      });
      setAlerts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statutory compliance alerts');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const displayText = getAlertDisplayText(alert);
      const mineName = getAlertMineName(alert);
      const target = `${displayText} ${mineName} ${alert.category || ''} ${alert.locationDetail || ''}`.toLowerCase();
      const matchesSearch = target.includes(search.toLowerCase());

      const matchesSeverity =
        severityFilter === 'ALL' || alert.severity === severityFilter;

      const matchesStatus =
        statusFilter === 'ALL' || alert.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [alerts, search, severityFilter, statusFilter]);

  const handleAcknowledge = async (id: string) => {
    try {
      setIsUpdating(true);
      const updated = await dataService.acknowledgeAlert(id);
      logAuditEvent('ALERT_ACKNOWLEDGED', {
        alertId: id,
        mine: updated.mine || updated.mineName,
        severity: updated.severity,
      });
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      if (selectedAlert?.id === id) {
        setSelectedAlert(updated);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to acknowledge alert');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      setIsUpdating(true);
      const updated = await dataService.resolveAlert(id);
      logAuditEvent('ALERT_ACKNOWLEDGED', {
        alertId: id,
        action: 'RESOLVED',
        mine: updated.mine || updated.mineName,
      });
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      if (selectedAlert?.id === id) {
        setSelectedAlert(updated);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to resolve alert');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts & Statutory Anomalies"
        subtitle="Real-time compliance warning notifications, sensor threshold breaches, and mandatory corrective directives."
        badge={`${alerts.length} Active Records`}
        action={
          <button
            type="button"
            onClick={loadAlerts}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Refresh alert notifications"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by issue description, mine, or category..."
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <FilterButton
            label="Severity"
            selectedValue={severityFilter}
            onSelect={setSeverityFilter}
            options={[
              { label: 'All Severities', value: 'ALL' },
              { label: 'Critical', value: 'CRITICAL' },
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Low', value: 'LOW' },
            ]}
          />

          <FilterButton
            label="Status"
            selectedValue={statusFilter}
            onSelect={setStatusFilter}
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Active', value: 'Active' },
              { label: 'Under Review', value: 'Under Review' },
              { label: 'Acknowledged', value: 'Acknowledged' },
              { label: 'Resolved', value: 'Resolved' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12">
          <LoadingState message="Fetching statutory anomaly and telemetry alerts..." />
        </div>
      ) : error ? (
        <div className="py-12">
          <ErrorState message={error} onRetry={loadAlerts} />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <EmptyState
          title="No alerts found"
          description="There are no alert notifications matching your current filters."
          onAction={() => {
            setSearch('');
            setSeverityFilter('ALL');
            setStatusFilter('ALL');
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border p-4 transition-all duration-150 ${
                alert.severity === 'CRITICAL'
                  ? 'border-rose-900/80 bg-rose-950/20 hover:border-rose-700'
                  : alert.severity === 'HIGH'
                  ? 'border-orange-900/80 bg-orange-950/20 hover:border-orange-700'
                  : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <StatusBadge type="severity" value={alert.severity} size="sm" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {getAlertDisplayText(alert)}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {getAlertMineName(alert)} ({alert.locationDetail || 'Main Pit'})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        {getAlertDate(alert)}
                      </span>
                      <span>•</span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                        {alert.category || 'General'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                      alert.status === 'Acknowledged' || alert.status === 'Resolved'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : alert.status === 'Under Review'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {alert.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedAlert(alert)}
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-slate-700 hover:text-amber-200 border border-slate-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Alert Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Alert Protocol Dossier</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedAlert.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Severity:</span>
                <StatusBadge type="severity" value={selectedAlert.severity} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Target Colliery:</span>
                <span className="font-semibold text-white">{getAlertMineName(selectedAlert)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Underground/Pit Location:</span>
                <span className="text-slate-200">{selectedAlert.locationDetail || 'Main Pit'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-semibold text-amber-400">{selectedAlert.status || 'Active'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Logged Timestamp:</span>
                <span className="text-slate-300">{getAlertDate(selectedAlert)}</span>
              </div>
              <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-1">
                <span className="font-semibold text-slate-300">Observed Non-Compliance:</span>
                <p className="text-slate-200">{getAlertDisplayText(selectedAlert)}</p>
                {selectedAlert.description && selectedAlert.description !== getAlertDisplayText(selectedAlert) && (
                  <p className="text-xs text-slate-400 mt-1">{selectedAlert.description}</p>
                )}
              </div>
              <div className="rounded-lg bg-amber-950/30 border border-amber-800/60 p-3 space-y-1">
                <span className="font-semibold text-amber-300">Mandated Statutory Response:</span>
                <p className="text-amber-200/90 leading-relaxed">{selectedAlert.actionPrompt}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Close
              </button>

              {selectedAlert.status !== 'Acknowledged' && selectedAlert.status !== 'Resolved' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleAcknowledge(selectedAlert.id)}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  Mark Acknowledged
                </button>
              )}

              {selectedAlert.status !== 'Resolved' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleResolve(selectedAlert.id)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

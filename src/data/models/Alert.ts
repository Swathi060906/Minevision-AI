import { AlertSeverity } from '../../types';

export type AlertStatus = 'Active' | 'Under Review' | 'Acknowledged' | 'Resolved';

export interface Alert {
  id: string;
  mineId: string;
  mineName?: string;
  inspectionId?: string;
  findingId?: string;
  severity: AlertSeverity;
  title?: string;
  issue: string; // Compatibility alias
  description?: string;
  category: string;
  locationDetail: string;
  actionPrompt: string;
  status: AlertStatus;
  date: string;
  timestamp: string;
  createdAt?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;

  // Compatibility alias
  mine?: string;
}

export interface CreateAlertInput {
  mineId: string;
  mineName: string;
  inspectionId?: string;
  findingId?: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  category: string;
  locationDetail: string;
  actionPrompt: string;
}

/**
 * Safely resolves the human-readable canonical display text/title for an alert.
 * 
 * Strict safety rules:
 * - Guarantees a string is always returned
 * - Never returns an object, undefined, null, or stringified "[object Object]"
 * - Prefers canonical alert title/issue/message/description
 * - Preserves existing alert information without fabricating content
 * - Falls back cleanly to "Critical compliance alert"
 */
export function getAlertDisplayText(alert?: unknown): string {
  if (!alert) {
    return 'Critical compliance alert';
  }

  if (typeof alert === 'string') {
    const trimmed = alert.trim();
    if (trimmed.length > 0 && trimmed !== '[object Object]' && trimmed !== 'undefined' && trimmed !== 'null') {
      return trimmed;
    }
    return 'Critical compliance alert';
  }

  if (typeof alert === 'object') {
    const a = alert as Record<string, unknown>;

    // Priority 1: Direct canonical text fields
    const directKeys = ['issue', 'title', 'message', 'description', 'actionPrompt'];
    for (const key of directKeys) {
      const val = a[key];
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.length > 0 && trimmed !== '[object Object]' && trimmed !== 'undefined' && trimmed !== 'null') {
          return trimmed;
        }
      } else if (val && typeof val === 'object') {
        // Handle possible nested object like { text: '...', title: '...' }
        const nested = val as Record<string, unknown>;
        const nestedKeys = ['text', 'title', 'issue', 'message', 'description'];
        for (const nKey of nestedKeys) {
          const nVal = nested[nKey];
          if (typeof nVal === 'string') {
            const trimmed = nVal.trim();
            if (trimmed.length > 0 && trimmed !== '[object Object]' && trimmed !== 'undefined' && trimmed !== 'null') {
              return trimmed;
            }
          }
        }
      }
    }
  }

  return 'Critical compliance alert';
}

/**
 * Safely resolves the colliery / mine name for an alert.
 */
export function getAlertMineName(alert?: unknown): string {
  if (!alert || typeof alert !== 'object') {
    return 'Assigned Colliery';
  }

  const a = alert as Record<string, unknown>;
  const candidateKeys = ['mine', 'mineName', 'mineId'];
  for (const key of candidateKeys) {
    const val = a[key];
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.length > 0 && trimmed !== '[object Object]' && trimmed !== 'undefined' && trimmed !== 'null') {
        return trimmed;
      }
    }
  }

  return 'Assigned Colliery';
}

/**
 * Safely resolves the formatted date/timestamp for an alert.
 */
export function getAlertDate(alert?: unknown): string {
  if (!alert || typeof alert !== 'object') {
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const a = alert as Record<string, unknown>;
  if (typeof a.date === 'string' && a.date.trim().length > 0 && a.date.trim() !== 'undefined') {
    return a.date.trim();
  }
  if (typeof a.timestamp === 'string' && a.timestamp.trim().length > 0 && a.timestamp.trim() !== 'undefined') {
    return a.timestamp.trim();
  }

  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

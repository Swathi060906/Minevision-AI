import { Alert, CreateAlertInput } from '../models/Alert';
import { getNormalizedMineAliases } from '../models/Mine';
import { UserRole } from '../../auth/authTypes';
import { IStorageAdapter } from '../storage/storageAdapter';
import { defaultStorage } from '../storage/localStorageAdapter';
import { SEED_ALERTS } from '../seed/seedData';

export const ALERTS_STORAGE_KEY = 'alerts';

export class AlertRepository {
  private storage: IStorageAdapter;

  constructor(storage: IStorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  private async ensureInitialized(): Promise<Alert[]> {
    const existing = await this.storage.getItem<Alert[]>(ALERTS_STORAGE_KEY);
    if (existing && Array.isArray(existing) && existing.length > 0) {
      return existing;
    }
    await this.storage.setItem(ALERTS_STORAGE_KEY, SEED_ALERTS);
    return SEED_ALERTS;
  }

  async getAlerts(filter?: {
    mineId?: string;
    status?: string;
    roleContext?: { role: UserRole; assignedMineIds: string[] };
  }): Promise<Alert[]> {
    const alerts = await this.ensureInitialized();

    let filtered = alerts.map((a) => ({
      ...a,
      mine: a.mine || a.mineName,
      issue: a.issue || a.title,
    }));

    if (filter?.roleContext?.role === 'OFFICER' || filter?.roleContext?.role === 'OPERATOR') {
      const allowedMineIds = filter.roleContext.assignedMineIds || [];
      if (allowedMineIds.length > 0) {
        const allowed = new Set(
          allowedMineIds.flatMap((id) => Array.from(getNormalizedMineAliases(id)))
        );
        filtered = filtered.filter((a) => allowed.has(a.mineId) || (a.mine && allowed.has(a.mine)));
      }
    }

    if (filter?.mineId) {
      const targetAliases = getNormalizedMineAliases(filter.mineId);
      filtered = filtered.filter((a) => targetAliases.has(a.mineId) || (a.mine && targetAliases.has(a.mine)));
    }

    if (filter?.status && filter.status !== 'All') {
      filtered = filtered.filter((a) => a.status === filter.status);
    }

    return filtered;
  }

  async getAlertById(id: string): Promise<Alert | null> {
    const alerts = await this.ensureInitialized();
    const found = alerts.find((a) => a.id === id);
    if (!found) return null;
    return {
      ...found,
      mine: found.mine || found.mineName,
      issue: found.issue || found.title,
    };
  }

  async acknowledgeAlert(id: string): Promise<Alert> {
    const alerts = await this.ensureInitialized();
    const index = alerts.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Alert with ID ${id} not found.`);
    }

    const now = new Date().toISOString();
    alerts[index] = {
      ...alerts[index],
      status: 'Acknowledged',
      acknowledgedAt: now,
    };

    await this.storage.setItem(ALERTS_STORAGE_KEY, alerts);
    return alerts[index];
  }

  async resolveAlert(id: string): Promise<Alert> {
    const alerts = await this.ensureInitialized();
    const index = alerts.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Alert with ID ${id} not found.`);
    }

    const now = new Date().toISOString();
    alerts[index] = {
      ...alerts[index],
      status: 'Resolved',
      resolvedAt: now,
    };

    await this.storage.setItem(ALERTS_STORAGE_KEY, alerts);
    return alerts[index];
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert> {
    const alerts = await this.ensureInitialized();
    const index = alerts.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Alert with ID ${id} not found.`);
    }

    alerts[index] = {
      ...alerts[index],
      ...updates,
    };

    await this.storage.setItem(ALERTS_STORAGE_KEY, alerts);
    return alerts[index];
  }

  async createAlert(input: CreateAlertInput): Promise<Alert> {
    const alerts = await this.ensureInitialized();

    // Prevent duplicate alert for the same finding
    if (input.findingId) {
      const existingAlert = alerts.find((a) => a.findingId === input.findingId);
      if (existingAlert) {
        return existingAlert;
      }
    }

    const now = new Date().toISOString();
    const newId = `ALT-${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newAlert: Alert = {
      id: newId,
      mineId: input.mineId,
      mineName: input.mineName,
      mine: input.mineName,
      inspectionId: input.inspectionId,
      findingId: input.findingId,
      severity: input.severity,
      title: input.title,
      issue: input.title,
      description: input.description,
      category: input.category,
      locationDetail: input.locationDetail,
      actionPrompt: input.actionPrompt,
      status: 'Active',
      date: formattedDate,
      timestamp: `${formattedDate}, ${formattedTime} IST`,
      createdAt: now,
    };

    alerts.unshift(newAlert);
    await this.storage.setItem(ALERTS_STORAGE_KEY, alerts);
    return newAlert;
  }

  async resetAlerts(): Promise<void> {
    await this.storage.setItem(ALERTS_STORAGE_KEY, SEED_ALERTS);
  }
}

export const alertRepository = new AlertRepository();

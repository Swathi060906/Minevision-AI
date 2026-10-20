import { IStorageAdapter } from '../storage/storageAdapter';
import { defaultStorage } from '../storage/localStorageAdapter';
import { RiskEngineConfig, RiskSnapshot } from '../models/RiskIntelligence';
import { DEFAULT_RISK_CONFIG } from '../../services/risk/riskConfig';
import { SEED_HISTORICAL_SNAPSHOTS } from '../seed/demoScenarioSeed';

function getNormalizedMineAliases(mineId: string): Set<string> {
  const ids = new Set<string>([mineId]);
  const numMatch = mineId.match(/(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    ids.add(`DEMO-MINE-${String(n).padStart(3, '0')}`);
    ids.add(`DEMO-MINE-${String(n).padStart(2, '0')}`);
    ids.add(`DEMO-MINE-${n}`);
    ids.add(`mine-${n}`);
    ids.add(`mine-${String(n).padStart(2, '0')}`);
    ids.add(`mine-${String(n).padStart(3, '0')}`);
  }
  return ids;
}

export const RISK_CONFIG_KEY = 'risk_engine_config';
export const RISK_SNAPSHOTS_KEY = 'risk_snapshots';

export class RiskIntelligenceRepository {
  private storage: IStorageAdapter;

  constructor(storage: IStorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  async getConfig(): Promise<RiskEngineConfig> {
    const saved = await this.storage.getItem<RiskEngineConfig>(RISK_CONFIG_KEY);
    if (saved) {
      return saved;
    }
    await this.storage.setItem(RISK_CONFIG_KEY, DEFAULT_RISK_CONFIG);
    return DEFAULT_RISK_CONFIG;
  }

  async updateConfig(
    updates: Partial<RiskEngineConfig>,
    updatedBy: string
  ): Promise<RiskEngineConfig> {
    const current = await this.getConfig();
    const updated: RiskEngineConfig = {
      ...current,
      ...updates,
      version: `${parseFloat(current.version || '1.0') + 0.1}`,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    await this.storage.setItem(RISK_CONFIG_KEY, updated);
    return updated;
  }

  async resetConfig(resetBy: string): Promise<RiskEngineConfig> {
    const reset = {
      ...DEFAULT_RISK_CONFIG,
      updatedAt: new Date().toISOString(),
      updatedBy: `Reset by ${resetBy}`,
    };
    await this.storage.setItem(RISK_CONFIG_KEY, reset);
    return reset;
  }

  async getSnapshots(mineId?: string): Promise<RiskSnapshot[]> {
    let snapshots = await this.storage.getItem<RiskSnapshot[]>(RISK_SNAPSHOTS_KEY);
    if (!snapshots || snapshots.length === 0) {
      // Seed initial historical snapshots for trend calculations
      snapshots = [...SEED_HISTORICAL_SNAPSHOTS, ...this.generateInitialSnapshots()];
      await this.storage.setItem(RISK_SNAPSHOTS_KEY, snapshots);
    }
    if (mineId) {
      const targetAliases = getNormalizedMineAliases(mineId);
      return snapshots.filter((s) => targetAliases.has(s.mineId));
    }
    return snapshots;
  }

  async saveSnapshot(snapshot: Omit<RiskSnapshot, 'id'>): Promise<RiskSnapshot> {
    const snapshots = await this.getSnapshots();
    const newSnapshot: RiskSnapshot = {
      ...snapshot,
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    snapshots.push(newSnapshot);
    await this.storage.setItem(RISK_SNAPSHOTS_KEY, snapshots);
    return newSnapshot;
  }

  private generateInitialSnapshots(): RiskSnapshot[] {
    const now = Date.now();
    const dayMs = 86400000;
    return [
      // mine-1 (Jharia) historical snapshots (trend worsening slightly over past month)
      {
        id: 'snap-m1-90d',
        mineId: 'mine-1',
        timestamp: new Date(now - 85 * dayMs).toISOString(),
        overallScore: 54,
        riskLevel: 'HIGH',
        openCritical: 1,
        openHigh: 2,
        activeAlerts: 1,
      },
      {
        id: 'snap-m1-30d',
        mineId: 'mine-1',
        timestamp: new Date(now - 28 * dayMs).toISOString(),
        overallScore: 62,
        riskLevel: 'HIGH',
        openCritical: 2,
        openHigh: 3,
        activeAlerts: 2,
      },
      {
        id: 'snap-m1-7d',
        mineId: 'mine-1',
        timestamp: new Date(now - 7 * dayMs).toISOString(),
        overallScore: 68,
        riskLevel: 'HIGH',
        openCritical: 2,
        openHigh: 4,
        activeAlerts: 2,
      },

      // mine-2 (Raniganj) historical snapshots (trend improving)
      {
        id: 'snap-m2-90d',
        mineId: 'mine-2',
        timestamp: new Date(now - 85 * dayMs).toISOString(),
        overallScore: 48,
        riskLevel: 'MODERATE',
        openCritical: 1,
        openHigh: 3,
        activeAlerts: 1,
      },
      {
        id: 'snap-m2-30d',
        mineId: 'mine-2',
        timestamp: new Date(now - 28 * dayMs).toISOString(),
        overallScore: 36,
        riskLevel: 'MODERATE',
        openCritical: 0,
        openHigh: 2,
        activeAlerts: 1,
      },
      {
        id: 'snap-m2-7d',
        mineId: 'mine-2',
        timestamp: new Date(now - 7 * dayMs).toISOString(),
        overallScore: 28,
        riskLevel: 'MODERATE',
        openCritical: 0,
        openHigh: 1,
        activeAlerts: 0,
      },

      // mine-3 (Korba) historical snapshots (stable)
      {
        id: 'snap-m3-30d',
        mineId: 'mine-3',
        timestamp: new Date(now - 28 * dayMs).toISOString(),
        overallScore: 22,
        riskLevel: 'LOW',
        openCritical: 0,
        openHigh: 1,
        activeAlerts: 0,
      },
      {
        id: 'snap-m3-7d',
        mineId: 'mine-3',
        timestamp: new Date(now - 7 * dayMs).toISOString(),
        overallScore: 21,
        riskLevel: 'LOW',
        openCritical: 0,
        openHigh: 0,
        activeAlerts: 0,
      },
    ];
  }
}

export const riskIntelligenceRepository = new RiskIntelligenceRepository();

import { IStorageAdapter } from '../storage/storageAdapter';
import { defaultStorage } from '../storage/localStorageAdapter';
import { PredictiveSnapshot } from '../models/PredictiveIntelligence';

const PREDICTIVE_SNAPSHOTS_KEY = 'predictive_snapshots';

export class PredictiveIntelligenceRepository {
  private storage: IStorageAdapter;

  constructor(storage: IStorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  async getSnapshots(mineId?: string): Promise<PredictiveSnapshot[]> {
    const snapshots = (await this.storage.getItem<PredictiveSnapshot[]>(PREDICTIVE_SNAPSHOTS_KEY)) || [];
    if (mineId) {
      return snapshots.filter((s) => s.mineId === mineId || s.mineId === mineId.replace('-0', '-'));
    }
    return snapshots;
  }

  async saveSnapshot(snapshot: Omit<PredictiveSnapshot, 'id'>): Promise<PredictiveSnapshot> {
    const snapshots = await this.getSnapshots();
    const newSnapshot: PredictiveSnapshot = {
      ...snapshot,
      id: `pred-snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    snapshots.push(newSnapshot);
    await this.storage.setItem(PREDICTIVE_SNAPSHOTS_KEY, snapshots);
    return newSnapshot;
  }
}

export const predictiveIntelligenceRepository = new PredictiveIntelligenceRepository();

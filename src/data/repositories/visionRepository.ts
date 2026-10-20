import { IStorageAdapter } from '../storage/storageAdapter';
import { defaultStorage } from '../storage/localStorageAdapter';
import { VisionAnalysis, VisionAnalysisStatus, CreateVisionAnalysisInput } from '../models/VisionAnalysis';
import { SafetyObservation, ObservationStatus } from '../models/SafetyObservation';
import { VisionEvidence, CreateVisionEvidenceInput } from '../models/VisionEvidence';
import { ZoneDefinition, CreateZoneInput, UpdateZoneInput } from '../models/ZoneDefinition';
import { UserRole } from '../../auth/authTypes';

export const VISION_ANALYSES_KEY = 'minevision_vision_analyses';
export const VISION_OBSERVATIONS_KEY = 'minevision_vision_observations';
export const VISION_EVIDENCE_KEY = 'minevision_vision_evidence';
export const VISION_ZONES_KEY = 'minevision_vision_zones';

export interface VisionAnalysisFilter {
  mineId?: string;
  inspectionId?: string;
  status?: VisionAnalysisStatus;
  roleContext?: {
    role?: UserRole;
    assignedMineIds?: string[];
  };
}

export interface SafetyObservationFilter {
  analysisId?: string;
  mineId?: string;
  inspectionId?: string;
  status?: ObservationStatus;
  roleContext?: {
    role?: UserRole;
    assignedMineIds?: string[];
  };
}

export interface ZoneFilter {
  mineId?: string;
  enabledOnly?: boolean;
}

export class VisionRepository {
  private storage: IStorageAdapter;

  constructor(storage: IStorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  // --- Analyses ---

  async getAnalyses(filter?: VisionAnalysisFilter): Promise<VisionAnalysis[]> {
    let items = await this.storage.getItem<VisionAnalysis[]>(VISION_ANALYSES_KEY);
    if (!items) {
      items = [];
      await this.storage.setItem(VISION_ANALYSES_KEY, items);
    }

    let result = [...items];

    // Role-based mine scoping
    if (filter?.roleContext && filter.roleContext.role !== 'ADMIN') {
      const allowed = new Set(filter.roleContext.assignedMineIds || []);
      result = result.filter((a) => allowed.has(a.mineId));
    }

    if (filter?.mineId) {
      result = result.filter((a) => a.mineId === filter.mineId);
    }

    if (filter?.inspectionId) {
      result = result.filter((a) => a.inspectionId === filter.inspectionId);
    }

    if (filter?.status) {
      result = result.filter((a) => a.status === filter.status);
    }

    // Newest first
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAnalysisById(id: string): Promise<VisionAnalysis | null> {
    const items = await this.getAnalyses();
    return items.find((a) => a.id === id) || null;
  }

  async createAnalysis(input: CreateVisionAnalysisInput): Promise<VisionAnalysis> {
    const items = await this.getAnalyses();
    const now = new Date().toISOString();

    const newAnalysis: VisionAnalysis = {
      id: `vis-an-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      mineId: input.mineId,
      inspectionId: input.inspectionId,
      sourceType: input.sourceType,
      sourceFileName: input.sourceFileName,
      fileSizeBytes: input.fileSizeBytes,
      status: 'PROCESSING',
      provider: input.provider,
      model: input.model,
      isDemoSimulation: input.isDemoSimulation || false,
      startedAt: now,
      detections: [],
      observations: [],
      evidence: [],
      zonesApplied: [],
      createdBy: input.createdBy,
      createdAt: now,
    };

    items.unshift(newAnalysis);
    await this.storage.setItem(VISION_ANALYSES_KEY, items);
    return newAnalysis;
  }

  async updateAnalysis(
    id: string,
    updates: Partial<Omit<VisionAnalysis, 'id' | 'createdAt'>>
  ): Promise<VisionAnalysis> {
    const items = await this.getAnalyses();
    const idx = items.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error(`VisionAnalysis not found: ${id}`);
    }

    const updated: VisionAnalysis = {
      ...items[idx],
      ...updates,
    };

    items[idx] = updated;
    await this.storage.setItem(VISION_ANALYSES_KEY, items);
    return updated;
  }

  // --- Observations ---

  async getObservations(filter?: SafetyObservationFilter): Promise<SafetyObservation[]> {
    let items = await this.storage.getItem<SafetyObservation[]>(VISION_OBSERVATIONS_KEY);
    if (!items) {
      items = [];
      await this.storage.setItem(VISION_OBSERVATIONS_KEY, items);
    }

    let result = [...items];

    if (filter?.roleContext && filter.roleContext.role !== 'ADMIN') {
      const allowed = new Set(filter.roleContext.assignedMineIds || []);
      result = result.filter((o) => allowed.has(o.mineId));
    }

    if (filter?.analysisId) {
      result = result.filter((o) => o.analysisId === filter.analysisId);
    }

    if (filter?.mineId) {
      result = result.filter((o) => o.mineId === filter.mineId);
    }

    if (filter?.status) {
      result = result.filter((o) => o.status === filter.status);
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async saveObservations(observations: SafetyObservation[]): Promise<void> {
    const existing = await this.getObservations();
    const existingMap = new Map(existing.map((o) => [o.id, o]));

    for (const obs of observations) {
      existingMap.set(obs.id, obs);
    }

    await this.storage.setItem(VISION_OBSERVATIONS_KEY, Array.from(existingMap.values()));
  }

  async updateObservation(
    id: string,
    updates: Partial<Omit<SafetyObservation, 'id' | 'createdAt'>>
  ): Promise<SafetyObservation> {
    const items = await this.getObservations();
    const idx = items.findIndex((o) => o.id === id);
    if (idx === -1) {
      throw new Error(`SafetyObservation not found: ${id}`);
    }

    const updated: SafetyObservation = {
      ...items[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    items[idx] = updated;
    await this.storage.setItem(VISION_OBSERVATIONS_KEY, items);
    return updated;
  }

  // --- Evidence ---

  async getEvidence(analysisId?: string): Promise<VisionEvidence[]> {
    let items = await this.storage.getItem<VisionEvidence[]>(VISION_EVIDENCE_KEY);
    if (!items) {
      items = [];
      await this.storage.setItem(VISION_EVIDENCE_KEY, items);
    }

    if (analysisId) {
      return items.filter((e) => e.analysisId === analysisId);
    }
    return items;
  }

  async createEvidence(input: CreateVisionEvidenceInput): Promise<VisionEvidence> {
    const items = await this.getEvidence();
    const newEvidence: VisionEvidence = {
      id: `vis-ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...input,
      createdAt: new Date().toISOString(),
    };

    items.push(newEvidence);
    await this.storage.setItem(VISION_EVIDENCE_KEY, items);
    return newEvidence;
  }

  // --- Safety Zones ---

  async getZones(filter?: ZoneFilter): Promise<ZoneDefinition[]> {
    let items = await this.storage.getItem<ZoneDefinition[]>(VISION_ZONES_KEY);
    if (!items) {
      // Seed default safety zones for demo mines
      items = this.getDefaultZones();
      await this.storage.setItem(VISION_ZONES_KEY, items);
    }

    let result = [...items];

    if (filter?.mineId) {
      result = result.filter((z) => z.mineId === filter.mineId);
    }

    if (filter?.enabledOnly) {
      result = result.filter((z) => z.enabled);
    }

    return result;
  }

  async getZoneById(id: string): Promise<ZoneDefinition | null> {
    const zones = await this.getZones();
    return zones.find((z) => z.id === id) || null;
  }

  async createZone(input: CreateZoneInput): Promise<ZoneDefinition> {
    const items = await this.getZones();
    const now = new Date().toISOString();

    const newZone: ZoneDefinition = {
      id: `zone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: input.name,
      mineId: input.mineId,
      zoneType: input.zoneType,
      geometry: input.geometry,
      severity: input.severity,
      enabled: input.enabled !== undefined ? input.enabled : true,
      description: input.description,
      color: input.color || '#ef4444',
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    items.push(newZone);
    await this.storage.setItem(VISION_ZONES_KEY, items);
    return newZone;
  }

  async updateZone(id: string, updates: UpdateZoneInput): Promise<ZoneDefinition> {
    const items = await this.getZones();
    const idx = items.findIndex((z) => z.id === id);
    if (idx === -1) {
      throw new Error(`ZoneDefinition not found: ${id}`);
    }

    const updated: ZoneDefinition = {
      ...items[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    items[idx] = updated;
    await this.storage.setItem(VISION_ZONES_KEY, items);
    return updated;
  }

  async deleteZone(id: string): Promise<boolean> {
    const items = await this.getZones();
    const filtered = items.filter((z) => z.id !== id);
    if (filtered.length === items.length) return false;

    await this.storage.setItem(VISION_ZONES_KEY, filtered);
    return true;
  }

  private getDefaultZones(): ZoneDefinition[] {
    const now = '2026-02-01T00:00:00Z';
    return [
      {
        id: 'zone-seed-01',
        name: 'High-Voltage Transformer Substation',
        mineId: 'DEMO-MINE-001',
        zoneType: 'RESTRICTED',
        geometry: {
          type: 'RECTANGLE',
          boundingBox: {
            x: 0.15,
            y: 0.2,
            width: 0.35,
            height: 0.5,
          },
        },
        severity: 'CRITICAL',
        enabled: true,
        description: '6.6kV Transformer bay. Strictly no entry without certified permit-to-work and lockout-tagout.',
        color: '#ef4444',
        createdBy: 'admin@minevision.local',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'zone-seed-02',
        name: 'Haul Road Heavy Dumper Swing Radius',
        mineId: 'DEMO-MINE-001',
        zoneType: 'VEHICLE_ONLY',
        geometry: {
          type: 'RECTANGLE',
          boundingBox: {
            x: 0.55,
            y: 0.3,
            width: 0.4,
            height: 0.6,
          },
        },
        severity: 'HIGH',
        enabled: true,
        description: 'Designated 100T dump truck maneuvering path. Pedestrian foot movement prohibited during active hauling.',
        color: '#f59e0b',
        createdBy: 'officer@minevision.local',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'zone-seed-03',
        name: 'Pit Head Conveyor Drive Enclosure',
        mineId: 'DEMO-MINE-002',
        zoneType: 'HAZARDOUS',
        geometry: {
          type: 'RECTANGLE',
          boundingBox: {
            x: 0.25,
            y: 0.25,
            width: 0.5,
            height: 0.5,
          },
        },
        severity: 'HIGH',
        enabled: true,
        description: 'Main belt tensioning drum and tail pulley zone. Rotating machinery pinch points.',
        color: '#f97316',
        createdBy: 'admin@minevision.local',
        createdAt: now,
        updatedAt: now,
      },
    ];
  }
}

export const visionRepository = new VisionRepository();

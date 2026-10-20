import { Mine, CreateMineInput, UpdateMineInput, getNormalizedMineAliases } from '../models/Mine';
import { UserRole } from '../../auth/authTypes';
import { IStorageAdapter } from '../storage/storageAdapter';
import { defaultStorage } from '../storage/localStorageAdapter';
import { SEED_MINES } from '../seed/seedData';

export const MINES_STORAGE_KEY = 'mines';

export class MineRepository {
  private storage: IStorageAdapter;

  constructor(storage: IStorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  private async ensureInitialized(): Promise<Mine[]> {
    const existing = await this.storage.getItem<Mine[]>(MINES_STORAGE_KEY);
    if (existing !== null && Array.isArray(existing) && existing.length > 0) {
      return existing;
    }
    await this.storage.setItem(MINES_STORAGE_KEY, SEED_MINES);
    return SEED_MINES;
  }

  async getMines(roleContext?: { role: UserRole; assignedMineIds: string[] }): Promise<Mine[]> {
    const mines = await this.ensureInitialized();

    // Map backwards-compatible fields
    const enriched = mines.map((m) => ({
      ...m,
      code: m.code || m.mineCode,
      type: m.type || m.mineType,
      workforceCount: m.workforceCount || m.registeredWorkforce,
    }));

    if (!roleContext || roleContext.role === 'ADMIN') {
      return enriched;
    }

    if (roleContext.role === 'OFFICER' || roleContext.role === 'OPERATOR') {
      const allowedMineIds = roleContext.assignedMineIds || [];
      if (allowedMineIds.length > 0) {
        const allowed = new Set(
          allowedMineIds.flatMap((id) => Array.from(getNormalizedMineAliases(id)))
        );
        return enriched.filter((m) => allowed.has(m.id) || (m.mineCode && allowed.has(m.mineCode)));
      }
    }

    return enriched;
  }

  async getMineById(id: string): Promise<Mine | null> {
    const mines = await this.ensureInitialized();
    const targetAliases = getNormalizedMineAliases(id);
    const mine = mines.find((m) => targetAliases.has(m.id) || (m.mineCode && targetAliases.has(m.mineCode)));
    if (!mine) return null;
    return {
      ...mine,
      code: mine.code || mine.mineCode,
      type: mine.type || mine.mineType,
      workforceCount: mine.workforceCount || mine.registeredWorkforce,
    };
  }

  async createMine(input: CreateMineInput): Promise<Mine> {
    const mines = await this.ensureInitialized();

    // Verify unique mineCode
    if (mines.some((m) => m.mineCode.toLowerCase() === input.mineCode.toLowerCase())) {
      throw new Error(`Mine code "${input.mineCode}" already exists. Please use a unique identifier.`);
    }

    const now = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newMine: Mine = {
      id: input.mineCode,
      mineCode: input.mineCode,
      code: input.mineCode,
      name: input.name,
      operator: input.operator,
      owner: input.owner || input.operator,
      state: input.state,
      district: input.district,
      basin: input.basin,
      location: input.location || `${input.basin}, ${input.district}`,
      mineType: input.mineType,
      type: input.mineType,
      status: input.status || 'Operational',
      latitude: input.latitude || 22.0,
      longitude: input.longitude || 82.0,
      registeredWorkforce: Number(input.registeredWorkforce) || 0,
      currentWorkforce: Number(input.currentWorkforce) || Number(input.registeredWorkforce) || 0,
      workforceCount: Number(input.registeredWorkforce) || 0,
      activePits: Number(input.activePits) || 1,
      contactOfficer: input.contactOfficer || 'Designated Colliery Agent',
      contactPhone: input.contactPhone || '+91-0000-000000',
      registrationDate: input.registrationDate || now.split('T')[0],
      lastInspectionDate: formattedDate,
      nextInspectionDue: input.nextInspectionDue || '30 Days from Audit',
      complianceScore: 85, // Default baseline for newly commissioned audit
      riskLevel: 'Low',
      createdAt: now,
      updatedAt: now,
    };

    mines.unshift(newMine);
    await this.storage.setItem(MINES_STORAGE_KEY, mines);
    return newMine;
  }

  async updateMine(id: string, input: UpdateMineInput): Promise<Mine> {
    const mines = await this.ensureInitialized();
    const index = mines.findIndex((m) => m.id === id || m.mineCode === id);
    if (index === -1) {
      throw new Error(`Mine with ID ${id} not found.`);
    }

    const current = mines[index];
    const now = new Date().toISOString();

    const updated: Mine = {
      ...current,
      name: input.name !== undefined ? input.name : current.name,
      operator: input.operator !== undefined ? input.operator : current.operator,
      owner: input.owner !== undefined ? input.owner : current.owner,
      state: input.state !== undefined ? input.state : current.state,
      district: input.district !== undefined ? input.district : current.district,
      basin: input.basin !== undefined ? input.basin : current.basin,
      location: input.location !== undefined ? input.location : current.location,
      mineType: input.mineType !== undefined ? input.mineType : current.mineType,
      type: input.mineType !== undefined ? input.mineType : current.mineType,
      status: input.status !== undefined ? input.status : current.status,
      latitude: input.latitude !== undefined ? input.latitude : current.latitude,
      longitude: input.longitude !== undefined ? input.longitude : current.longitude,
      registeredWorkforce: input.registeredWorkforce !== undefined ? Number(input.registeredWorkforce) : current.registeredWorkforce,
      workforceCount: input.registeredWorkforce !== undefined ? Number(input.registeredWorkforce) : current.registeredWorkforce,
      currentWorkforce: input.currentWorkforce !== undefined ? Number(input.currentWorkforce) : current.currentWorkforce,
      activePits: input.activePits !== undefined ? Number(input.activePits) : current.activePits,
      contactOfficer: input.contactOfficer !== undefined ? input.contactOfficer : current.contactOfficer,
      contactPhone: input.contactPhone !== undefined ? input.contactPhone : current.contactPhone,
      nextInspectionDue: input.nextInspectionDue !== undefined ? input.nextInspectionDue : current.nextInspectionDue,
      complianceScore: input.complianceScore !== undefined ? input.complianceScore : current.complianceScore,
      riskLevel: input.riskLevel !== undefined ? input.riskLevel : current.riskLevel,
      lastInspectionDate: input.lastInspectionDate !== undefined ? input.lastInspectionDate : current.lastInspectionDate,
      updatedAt: now,
    };

    mines[index] = updated;
    await this.storage.setItem(MINES_STORAGE_KEY, mines);
    return updated;
  }

  async resetMines(): Promise<void> {
    await this.storage.setItem(MINES_STORAGE_KEY, SEED_MINES);
  }
}

export const mineRepository = new MineRepository();

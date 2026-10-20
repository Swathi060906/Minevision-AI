import { ComplianceRecord, CategorySummary, ComplianceCategory } from '../models/ComplianceRecord';
import { IStorageAdapter } from '../storage/storageAdapter';
import { defaultStorage } from '../storage/localStorageAdapter';
import { SEED_COMPLIANCE_RECORDS } from '../seed/seedData';

const COMPLIANCE_STORAGE_KEY = 'compliance_records';

const CATEGORY_META: Record<ComplianceCategory, { label: string; benchmark: number; description: string }> = {
  SAFETY: {
    label: 'Safety Protocols',
    benchmark: 80,
    description: 'Ground stability, pitwall slope angle, and emergency haulage egress.',
  },
  ENVIRONMENT: {
    label: 'Environmental Norms',
    benchmark: 75,
    description: 'Particulate air quality, water runoff, and effluent pH control.',
  },
  EQUIPMENT: {
    label: 'Heavy Machinery & HEMM',
    benchmark: 85,
    description: 'Dumper braking, shovel hydraulic safety, and conveyor emergency trips.',
  },
  PPE: {
    label: 'Personal Protective Equipment',
    benchmark: 90,
    description: 'Smart helmets, certified respirators, and cap lamp luminescence cycles.',
  },
  DOCUMENTATION: {
    label: 'DGMS Statutory Records',
    benchmark: 85,
    description: 'Shift logbooks, explosive magazine sign-offs, and compliance returns.',
  },
};

export class ComplianceRepository {
  private storage: IStorageAdapter;

  constructor(storage: IStorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  private async ensureInitialized(): Promise<ComplianceRecord[]> {
    const existing = await this.storage.getItem<ComplianceRecord[]>(COMPLIANCE_STORAGE_KEY);
    if (existing && Array.isArray(existing) && existing.length > 0) {
      return existing;
    }
    await this.storage.setItem(COMPLIANCE_STORAGE_KEY, SEED_COMPLIANCE_RECORDS);
    return SEED_COMPLIANCE_RECORDS;
  }

  async getComplianceRecords(mineId?: string): Promise<ComplianceRecord[]> {
    const records = await this.ensureInitialized();
    if (!mineId) return records;
    return records.filter((r) => r.mineId === mineId);
  }

  async calculateOverallComplianceScore(mineId?: string): Promise<number> {
    const records = await this.getComplianceRecords(mineId);
    if (records.length === 0) return 80; // Baseline
    const sum = records.reduce((acc, r) => acc + r.score, 0);
    return Math.round(sum / records.length);
  }

  async getCategorySummaries(mineId?: string): Promise<CategorySummary[]> {
    const records = await this.getComplianceRecords(mineId);
    const categories: ComplianceCategory[] = ['SAFETY', 'ENVIRONMENT', 'EQUIPMENT', 'PPE', 'DOCUMENTATION'];

    return categories.map((cat) => {
      const catRecords = records.filter((r) => r.category === cat);
      const meta = CATEGORY_META[cat];
      if (catRecords.length === 0) {
        return {
          category: meta.label,
          score: 80,
          benchmark: meta.benchmark,
          description: meta.description,
          recordCount: 0,
        };
      }

      const avgScore = Math.round(
        catRecords.reduce((acc, r) => acc + r.score, 0) / catRecords.length
      );

      return {
        category: meta.label,
        score: avgScore,
        benchmark: meta.benchmark,
        description: meta.description,
        recordCount: catRecords.length,
      };
    });
  }

  async addComplianceRecord(
    record: Omit<ComplianceRecord, 'id' | 'evaluatedAt'>
  ): Promise<ComplianceRecord> {
    const records = await this.ensureInitialized();
    const now = new Date().toISOString();
    const newId = `CMP-${String(records.length + 1).padStart(3, '0')}`;

    const newRecord: ComplianceRecord = {
      ...record,
      id: newId,
      evaluatedAt: now,
    };

    records.unshift(newRecord);
    await this.storage.setItem(COMPLIANCE_STORAGE_KEY, records);
    return newRecord;
  }

  async resetCompliance(): Promise<void> {
    await this.storage.setItem(COMPLIANCE_STORAGE_KEY, SEED_COMPLIANCE_RECORDS);
  }
}

export const complianceRepository = new ComplianceRepository();

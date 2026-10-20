import { Inspection, CreateInspectionInput, UpdateInspectionInput } from '../models/Inspection';
import { InspectionFinding, CreateFindingInput, UpdateFindingInput } from '../models/InspectionFinding';
import { Evidence, CreateEvidenceInput } from '../models/Evidence';
import { getNormalizedMineAliases } from '../models/Mine';
import { UserRole } from '../../auth/authTypes';
import { IStorageAdapter } from '../storage/storageAdapter';
import { defaultStorage } from '../storage/localStorageAdapter';
import { SEED_INSPECTIONS, SEED_FINDINGS, SEED_EVIDENCE, SEED_MINES } from '../seed/seedData';
import { mineRepository } from './mineRepository';
import { alertRepository } from './alertRepository';

export const INSPECTIONS_STORAGE_KEY = 'inspections';
export const FINDINGS_STORAGE_KEY = 'findings';
export const EVIDENCE_STORAGE_KEY = 'evidence';

export interface InspectionFilter {
  mineId?: string;
  status?: string;
  type?: string;
  inspectorId?: string;
  search?: string;
  roleContext?: { role: UserRole; assignedMineIds: string[] };
}

export class InspectionRepository {
  private storage: IStorageAdapter;

  constructor(storage: IStorageAdapter = defaultStorage) {
    this.storage = storage;
  }

  private async ensureInspections(): Promise<Inspection[]> {
    const existing = await this.storage.getItem<Inspection[]>(INSPECTIONS_STORAGE_KEY);
    if (existing && Array.isArray(existing) && existing.length > 0) {
      return existing;
    }
    await this.storage.setItem(INSPECTIONS_STORAGE_KEY, SEED_INSPECTIONS);
    return SEED_INSPECTIONS;
  }

  private async ensureFindings(): Promise<InspectionFinding[]> {
    const existing = await this.storage.getItem<InspectionFinding[]>(FINDINGS_STORAGE_KEY);
    if (existing && Array.isArray(existing) && existing.length > 0) {
      return existing;
    }
    await this.storage.setItem(FINDINGS_STORAGE_KEY, SEED_FINDINGS);
    return SEED_FINDINGS;
  }

  private async ensureEvidence(): Promise<Evidence[]> {
    const existing = await this.storage.getItem<Evidence[]>(EVIDENCE_STORAGE_KEY);
    if (existing && Array.isArray(existing) && existing.length > 0) {
      return existing;
    }
    await this.storage.setItem(EVIDENCE_STORAGE_KEY, SEED_EVIDENCE);
    return SEED_EVIDENCE;
  }

  async getInspections(filter?: InspectionFilter): Promise<Inspection[]> {
    const inspections = await this.ensureInspections();

    let filtered = inspections.map((ins) => ({
      ...ins,
      inspector: ins.inspector || ins.inspectorName,
      complianceScore: ins.complianceScore || ins.overallComplianceScore,
      date: ins.date || ins.inspectionDate,
    }));

    if (filter?.roleContext?.role === 'OFFICER' || filter?.roleContext?.role === 'OPERATOR') {
      const allowedMineIds = filter.roleContext.assignedMineIds || [];
      if (allowedMineIds.length > 0) {
        const allowedMines = new Set(
          allowedMineIds.flatMap((id) => Array.from(getNormalizedMineAliases(id)))
        );
        filtered = filtered.filter((ins) => allowedMines.has(ins.mineId));
      }
    }

    if (filter?.mineId) {
      const targetAliases = getNormalizedMineAliases(filter.mineId);
      filtered = filtered.filter((ins) => targetAliases.has(ins.mineId));
    }

    if (filter?.status && filter.status !== 'All') {
      filtered = filtered.filter((ins) => ins.status === filter.status);
    }

    if (filter?.type && filter.type !== 'All') {
      filtered = filtered.filter((ins) => ins.inspectionType === filter.type);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      filtered = filtered.filter(
        (ins) =>
          ins.inspectionNumber.toLowerCase().includes(q) ||
          ins.mineName.toLowerCase().includes(q) ||
          ins.inspectorName.toLowerCase().includes(q) ||
          ins.summary.toLowerCase().includes(q)
      );
    }

    return filtered;
  }

  async getInspectionById(id: string): Promise<Inspection | null> {
    const inspections = await this.ensureInspections();
    const found = inspections.find((ins) => ins.id === id || ins.inspectionNumber === id);
    if (!found) return null;
    return {
      ...found,
      inspector: found.inspector || found.inspectorName,
      complianceScore: found.complianceScore || found.overallComplianceScore,
      date: found.date || found.inspectionDate,
    };
  }

  async createInspection(input: CreateInspectionInput): Promise<Inspection> {
    const inspections = await this.ensureInspections();

    // Validate mine exists
    const mine = await mineRepository.getMineById(input.mineId);
    if (!mine) {
      throw new Error(`Invalid Mine: Mine with ID "${input.mineId}" does not exist.`);
    }

    const nextIndex = inspections.length + 1045;
    const inspectionNumber = `INS-2026-${nextIndex}`;
    const now = new Date().toISOString();
    const formattedDate = new Date(input.scheduledDate || Date.now()).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const inspectorDisplay = input.inspectorName || input.inspector || 'Compliance Officer';
    const newInspection: Inspection = {
      id: inspectionNumber,
      inspectionNumber,
      mineId: mine.id,
      mineName: mine.name,
      inspectionType: input.inspectionType,
      inspectionDate: formattedDate,
      scheduledDate: input.scheduledDate,
      date: formattedDate,
      inspectorId: input.inspectorId || 'usr_dev_officer_002',
      inspectorName: inspectorDisplay,
      inspector: inspectorDisplay,
      status: input.status || 'Scheduled',
      overallComplianceScore: input.overallComplianceScore ?? input.complianceScore ?? 85,
      complianceScore: input.complianceScore ?? input.overallComplianceScore ?? 85,
      riskLevel: input.riskLevel || 'Low',
      summary: input.summary || `Statutory ${input.inspectionType} scheduled for ${mine.name}.`,
      notes: input.notes || 'Routine audit scheduled under DGMS safe colliery standard operations.',
      findingCount: 0,
      criticalFindingCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    inspections.unshift(newInspection);
    await this.storage.setItem(INSPECTIONS_STORAGE_KEY, inspections);
    return newInspection;
  }

  async updateInspection(id: string, input: UpdateInspectionInput): Promise<Inspection> {
    const inspections = await this.ensureInspections();
    const index = inspections.findIndex((ins) => ins.id === id || ins.inspectionNumber === id);
    if (index === -1) {
      throw new Error(`Inspection with ID ${id} not found.`);
    }

    const current = inspections[index];
    const now = new Date().toISOString();

    const updated: Inspection = {
      ...current,
      status: input.status !== undefined ? input.status : current.status,
      overallComplianceScore: input.overallComplianceScore !== undefined ? input.overallComplianceScore : current.overallComplianceScore,
      complianceScore: input.overallComplianceScore !== undefined ? input.overallComplianceScore : current.overallComplianceScore,
      riskLevel: input.riskLevel !== undefined ? input.riskLevel : current.riskLevel,
      summary: input.summary !== undefined ? input.summary : current.summary,
      notes: input.notes !== undefined ? input.notes : current.notes,
      inspectionDate: input.inspectionDate !== undefined ? input.inspectionDate : current.inspectionDate,
      date: input.inspectionDate !== undefined ? input.inspectionDate : current.inspectionDate,
      scheduledDate: input.scheduledDate !== undefined ? input.scheduledDate : current.scheduledDate,
      inspectorName: input.inspectorName !== undefined ? input.inspectorName : current.inspectorName,
      inspector: input.inspectorName !== undefined ? input.inspectorName : current.inspectorName,
      updatedAt: now,
    };

    inspections[index] = updated;
    await this.storage.setItem(INSPECTIONS_STORAGE_KEY, inspections);
    return updated;
  }

  // Findings
  async getFindingsByInspection(inspectionId: string): Promise<InspectionFinding[]> {
    const findings = await this.ensureFindings();
    return findings.filter((f) => f.inspectionId === inspectionId);
  }

  async getFindingsByMine(mineId: string): Promise<InspectionFinding[]> {
    const findings = await this.ensureFindings();
    return findings.filter((f) => f.mineId === mineId);
  }

  async createFinding(input: CreateFindingInput): Promise<InspectionFinding> {
    const findings = await this.ensureFindings();
    const now = new Date().toISOString();
    const newId = `FND-${String(findings.length + 1).padStart(3, '0')}`;

    const newFinding: InspectionFinding = {
      id: newId,
      inspectionId: input.inspectionId,
      mineId: input.mineId,
      category: input.category,
      title: input.title,
      description: input.description,
      severity: input.severity,
      status: 'OPEN',
      ruleReference: input.ruleReference || 'Demonstration CMR 2017 Reference (Unverified)',
      correctiveAction: input.correctiveAction,
      dueDate: input.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      createdAt: now,
      updatedAt: now,
    };

    findings.unshift(newFinding);
    await this.storage.setItem(FINDINGS_STORAGE_KEY, findings);

    // Update finding counts in the inspection
    await this.recalculateInspectionFindingCounts(input.inspectionId);

    // If CRITICAL or HIGH, automatically generate a persistent alert
    if (input.severity === 'CRITICAL' || input.severity === 'HIGH') {
      const mine = await mineRepository.getMineById(input.mineId);
      await alertRepository.createAlert({
        mineId: input.mineId,
        mineName: mine ? mine.name : input.mineId,
        inspectionId: input.inspectionId,
        findingId: newId,
        severity: input.severity,
        title: input.title,
        description: input.description,
        category: input.category,
        locationDetail: mine ? `${mine.basin} - Pit Inspection` : 'Pithead Location',
        actionPrompt: input.correctiveAction || 'Immediate compliance intervention required under CMR 2017 statutory guidelines.',
      });
    }

    return newFinding;
  }

  async updateFinding(id: string, input: UpdateFindingInput): Promise<InspectionFinding> {
    const findings = await this.ensureFindings();
    const index = findings.findIndex((f) => f.id === id);
    if (index === -1) {
      throw new Error(`Finding with ID ${id} not found.`);
    }

    const current = findings[index];
    const now = new Date().toISOString();

    const updated: InspectionFinding = {
      ...current,
      title: input.title !== undefined ? input.title : current.title,
      description: input.description !== undefined ? input.description : current.description,
      category: input.category !== undefined ? input.category : current.category,
      severity: input.severity !== undefined ? input.severity : current.severity,
      status: input.status !== undefined ? input.status : current.status,
      ruleReference: input.ruleReference !== undefined ? input.ruleReference : current.ruleReference,
      correctiveAction: input.correctiveAction !== undefined ? input.correctiveAction : current.correctiveAction,
      dueDate: input.dueDate !== undefined ? input.dueDate : current.dueDate,
      resolvedAt: input.resolvedAt !== undefined ? input.resolvedAt : (input.status === 'RESOLVED' || input.status === 'CLOSED' ? now : current.resolvedAt),
      updatedAt: now,
    };

    findings[index] = updated;
    await this.storage.setItem(FINDINGS_STORAGE_KEY, findings);

    // Recalculate inspection finding counts
    await this.recalculateInspectionFindingCounts(current.inspectionId);

    return updated;
  }

  private async recalculateInspectionFindingCounts(inspectionId: string): Promise<void> {
    const inspections = await this.ensureInspections();
    const findings = await this.ensureFindings();

    const index = inspections.findIndex((ins) => ins.id === inspectionId || ins.inspectionNumber === inspectionId);
    if (index === -1) return;

    const related = findings.filter((f) => f.inspectionId === inspectionId);
    const totalCount = related.length;
    const criticalCount = related.filter((f) => f.severity === 'CRITICAL' && f.status !== 'RESOLVED' && f.status !== 'CLOSED').length;

    inspections[index].findingCount = totalCount;
    inspections[index].criticalFindingCount = criticalCount;
    if (criticalCount > 0) {
      inspections[index].riskLevel = 'Critical';
      inspections[index].status = 'Review Required';
    }

    await this.storage.setItem(INSPECTIONS_STORAGE_KEY, inspections);
  }

  // Evidence
  async getAllEvidence(): Promise<Evidence[]> {
    return this.ensureEvidence();
  }

  async getAllFindings(): Promise<InspectionFinding[]> {
    return this.ensureFindings();
  }

  async getEvidenceByInspection(inspectionId: string): Promise<Evidence[]> {
    const evidence = await this.ensureEvidence();
    return evidence.filter((e) => e.inspectionId === inspectionId);
  }

  async addEvidence(input: CreateEvidenceInput): Promise<Evidence> {
    const evidence = await this.ensureEvidence();
    const now = new Date().toISOString();
    const newId = `EVD-${String(evidence.length + 1).padStart(3, '0')}`;

    const newEvidence: Evidence = {
      id: newId,
      inspectionId: input.inspectionId,
      findingId: input.findingId,
      fileName: input.fileName,
      fileType: input.fileType,
      fileSize: input.fileSize,
      description: input.description,
      capturedAt: input.capturedAt || now,
      uploadedBy: input.uploadedBy,
      storageReference: input.storageReference || `local-meta://evidence/${input.inspectionId.toLowerCase()}/${input.fileName}`,
      createdAt: now,
    };

    evidence.unshift(newEvidence);
    await this.storage.setItem(EVIDENCE_STORAGE_KEY, evidence);
    return newEvidence;
  }

  async resetInspections(): Promise<void> {
    await this.storage.setItem(INSPECTIONS_STORAGE_KEY, SEED_INSPECTIONS);
    await this.storage.setItem(FINDINGS_STORAGE_KEY, SEED_FINDINGS);
    await this.storage.setItem(EVIDENCE_STORAGE_KEY, SEED_EVIDENCE);
  }
}

export const inspectionRepository = new InspectionRepository();

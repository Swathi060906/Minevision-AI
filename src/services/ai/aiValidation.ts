import { ExtractedFact, FactCategory, FactConfidence } from '../../data/models/ExtractedFact';
import {
  ProposedFinding,
  ComplianceAnalysisOutcome,
  ProposedFindingReviewStatus,
} from '../../data/models/ProposedFinding';
import { FindingCategory, FindingSeverity } from '../../data/models/InspectionFinding';

export interface RawExtractedFact {
  category?: string;
  label?: string;
  value?: string;
  unit?: string;
  normalizedValue?: string | number;
  sourcePage?: number | string;
  sourceSection?: string;
  evidenceText?: string;
  confidence?: string;
  notes?: string;
}

export interface RawExtractionResponse {
  facts?: RawExtractedFact[];
  documentSummary?: string;
  detectedIssuesCount?: number;
}

export interface RawProposedFinding {
  category?: string;
  title?: string;
  description?: string;
  severitySuggestion?: string;
  analysisOutcome?: string;
  evidenceFactIds?: string[];
  evidenceText?: string;
  sourcePage?: number | string;
  sourceSection?: string;
  knowledgeId?: string;
  knowledgeChunkIds?: string[];
  sourceReference?: string;
  sourceTitle?: string;
  authority?: string;
  sectionOrClause?: string;
  reasoningSummary?: string;
  recommendedCorrectiveAction?: string;
  confidence?: string;
}

export interface RawComplianceAnalysisResponse {
  proposedFindings?: RawProposedFinding[];
  summary?: string;
  unaddressedFactsCount?: number;
}

const VALID_CATEGORIES: Set<string> = new Set([
  'SAFETY',
  'ENVIRONMENT',
  'EQUIPMENT',
  'PPE',
  'VENTILATION',
  'ELECTRICAL',
  'EMERGENCY',
  'DOCUMENTATION',
  'WORKFORCE',
  'OTHER',
]);

const VALID_SEVERITIES: Set<string> = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

const VALID_OUTCOMES: Set<string> = new Set([
  'SUPPORTED_COMPLIANT',
  'POTENTIAL_NON_COMPLIANCE',
  'INSUFFICIENT_EVIDENCE',
  'MANUAL_REVIEW_REQUIRED',
]);

export function validateAndNormalizeFacts(
  rawJson: unknown
): { facts: ExtractedFact[]; summary?: string } {
  if (!rawJson || typeof rawJson !== 'object') {
    throw new Error('Invalid AI response: Expected a JSON object');
  }

  const payload = rawJson as RawExtractionResponse;
  const rawList = Array.isArray(payload.facts) ? payload.facts : [];

  const facts: ExtractedFact[] = rawList.map((item, idx) => {
    let cat: FactCategory = 'OTHER';
    if (item.category && VALID_CATEGORIES.has(item.category.toUpperCase())) {
      cat = item.category.toUpperCase() as FactCategory;
    }

    let conf: FactConfidence = 'MEDIUM';
    if (item.confidence) {
      const c = item.confidence.toUpperCase();
      if (c === 'HIGH' || c === 'LOW' || c === 'MEDIUM') {
        conf = c as FactConfidence;
      }
    }

    return {
      id: `fact-${Date.now()}-${idx + 1}`,
      category: cat,
      label: String(item.label || 'Observation').trim(),
      value: String(item.value || '').trim(),
      unit: item.unit ? String(item.unit).trim() : undefined,
      normalizedValue: item.normalizedValue,
      sourcePage: item.sourcePage,
      sourceSection: item.sourceSection,
      evidenceText: String(item.evidenceText || item.value || '').trim(),
      confidence: conf,
      notes: item.notes,
    };
  });

  return {
    facts,
    summary: payload.documentSummary,
  };
}

export function validateAndNormalizeProposedFindings(
  rawJson: unknown,
  params: {
    analysisId: string;
    inspectionId: string;
    mineId: string;
    isDemoMode: boolean;
  }
): ProposedFinding[] {
  if (!rawJson || typeof rawJson !== 'object') {
    throw new Error('Invalid AI response: Expected a JSON object for compliance analysis');
  }

  const payload = rawJson as RawComplianceAnalysisResponse;
  const rawList = Array.isArray(payload.proposedFindings) ? payload.proposedFindings : [];
  const now = new Date().toISOString();

  return rawList.map((item, idx) => {
    let cat: FindingCategory = 'SAFETY';
    if (item.category && ['SAFETY', 'ENVIRONMENT', 'EQUIPMENT', 'PPE', 'DOCUMENTATION', 'VENTILATION'].includes(item.category.toUpperCase())) {
      cat = item.category.toUpperCase() as FindingCategory;
    }

    let sev: FindingSeverity = 'MEDIUM';
    if (item.severitySuggestion && VALID_SEVERITIES.has(item.severitySuggestion.toUpperCase())) {
      sev = item.severitySuggestion.toUpperCase() as FindingSeverity;
    }

    let outcome: ComplianceAnalysisOutcome = 'MANUAL_REVIEW_REQUIRED';
    if (item.analysisOutcome && VALID_OUTCOMES.has(item.analysisOutcome.toUpperCase())) {
      outcome = item.analysisOutcome.toUpperCase() as ComplianceAnalysisOutcome;
    }

    let conf: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (item.confidence) {
      const c = item.confidence.toUpperCase();
      if (c === 'HIGH' || c === 'LOW' || c === 'MEDIUM') {
        conf = c as 'HIGH' | 'MEDIUM' | 'LOW';
      }
    }

    const reviewStatus: ProposedFindingReviewStatus = 'PENDING_REVIEW';

    return {
      id: `prop-finding-${Date.now()}-${idx + 1}`,
      analysisId: params.analysisId,
      inspectionId: params.inspectionId,
      mineId: params.mineId,
      category: cat,
      title: String(item.title || `Compliance Item ${idx + 1}`).trim(),
      description: String(item.description || item.reasoningSummary || '').trim(),
      severitySuggestion: sev,
      analysisOutcome: outcome,
      evidenceFactIds: Array.isArray(item.evidenceFactIds) ? item.evidenceFactIds : [],
      evidenceText: String(item.evidenceText || '').trim(),
      sourcePage: item.sourcePage,
      sourceSection: item.sourceSection,
      knowledgeId: item.knowledgeId,
      knowledgeChunkIds: Array.isArray(item.knowledgeChunkIds) ? item.knowledgeChunkIds : [],
      sourceReference: item.sourceReference,
      sourceTitle: item.sourceTitle,
      authority: item.authority,
      sectionOrClause: item.sectionOrClause,
      verificationStatus: params.isDemoMode ? 'NEEDS_REVIEW' : 'VERIFIED',
      isSyntheticDemo: params.isDemoMode,
      reasoningSummary: String(item.reasoningSummary || '').trim(),
      recommendedCorrectiveAction: item.recommendedCorrectiveAction,
      confidence: conf,
      reviewStatus,
      createdAt: now,
      updatedAt: now,
    };
  });
}

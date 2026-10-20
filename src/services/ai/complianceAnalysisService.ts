import { documentAnalysisRepository } from '../../data/repositories/documentAnalysisRepository';
import {
  DocumentAnalysis,
  CreateDocumentAnalysisInput,
} from '../../data/models/DocumentAnalysis';
import {
  ProposedFinding,
  EditAndAcceptProposalInput,
} from '../../data/models/ProposedFinding';
import { ragService } from '../rag/ragService';
import { geminiClientService } from './geminiClientService';
import { dataService } from '../dataService';
import { recordAuditEvent } from '../../auth/authService';
import { UserRole } from '../../auth/authTypes';
import { CreateFindingInput, FindingSeverity } from '../../data/models/InspectionFinding';
import { CreateAlertInput } from '../../data/models/Alert';

export interface ReviewerContext {
  id: string;
  email: string;
  role: UserRole;
  assignedMineIds?: string[];
}

export interface RunAnalysisParams {
  inspectionId: string;
  mineId: string;
  evidenceId?: string;
  fileName: string;
  fileType: string;
  fileSizeBytes?: number;
  content?: string;
  base64Data?: string;
  mimeType?: string;
  policy: 'VERIFIED_ONLY' | 'ALLOW_DEMO';
  currentUser: {
    id: string;
    email: string;
    role: UserRole;
    assignedMineIds?: string[];
  };
  onProgress?: (stage: string, percent: number) => void;
}

export class ComplianceAnalysisService {
  /**
   * Complete End-to-End AI Document Compliance Analysis Pipeline:
   * 1. Register or link Evidence in Phase 3 storage
   * 2. Create DocumentAnalysis record in PENDING status
   * 3. Extract structured facts via Gemini (status -> EXTRACTING)
   * 4. Retrieve verified compliance knowledge via Phase 4 RAG (status -> RETRIEVING)
   * 5. Analyze compliance against grounded chunks via Gemini (status -> ANALYZING)
   * 6. Generate proposed findings with citations and confidence (status -> REVIEW_REQUIRED)
   * 7. Audit log all stages
   */
  async runAnalysis(params: RunAnalysisParams): Promise<DocumentAnalysis> {
    const startTime = Date.now();
    const { currentUser, policy } = params;

    // RBAC: Verify User Role
    if (currentUser.role === 'OPERATOR') {
      throw new Error('Unauthorized: OPERATOR role is not permitted to initiate AI compliance analysis.');
    }
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'OFFICER') {
      throw new Error(`Unauthorized: Role '${currentUser.role}' is not authorized to run AI analysis.`);
    }

    // RBAC: Verify Mine Access for OFFICER
    if (currentUser.role === 'OFFICER' && currentUser.assignedMineIds && currentUser.assignedMineIds.length > 0) {
      if (!currentUser.assignedMineIds.includes(params.mineId)) {
        throw new Error(`Forbidden: Compliance Officer is not assigned to analyze Mine ID '${params.mineId}'.`);
      }
    }

    params.onProgress?.('Preparing inspection evidence and record...', 10);

    // 1. Ensure inspection exists
    const inspection = await dataService.getInspectionById(params.inspectionId);
    if (!inspection) {
      throw new Error(`Inspection not found: ${params.inspectionId}`);
    }

    const mine = await dataService.getMineById(params.mineId);

    // 2. Register Evidence record if not already linked
    let evidenceId = params.evidenceId;
    if (!evidenceId) {
      const newEvidence = await dataService.addEvidence({
        inspectionId: params.inspectionId,
        mineId: params.mineId,
        fileName: params.fileName,
        fileType: params.fileType,
        fileSizeBytes: params.fileSizeBytes || 1024,
        description: `Uploaded for AI document compliance analysis: ${params.fileName}`,
        uploadedBy: currentUser.email,
        storageReference: `evidence-${Date.now()}-${params.fileName}`,
      });
      evidenceId = newEvidence.id;
    }

    // 3. Create DocumentAnalysis in repository
    const analysisInput: CreateDocumentAnalysisInput = {
      inspectionId: params.inspectionId,
      mineId: params.mineId,
      evidenceId,
      fileName: params.fileName,
      fileType: params.fileType,
      fileSizeBytes: params.fileSizeBytes,
      createdBy: currentUser.email,
      isDemoMode: policy === 'ALLOW_DEMO',
    };

    const analysis = await documentAnalysisRepository.createAnalysis(analysisInput);

    await recordAuditEvent('AI_ANALYSIS_STARTED', currentUser.id, currentUser.email, {
      analysisId: analysis.id,
      inspectionId: params.inspectionId,
      mineId: params.mineId,
      fileName: params.fileName,
      policy,
    });

    try {
      // 4. Extract structured facts
      params.onProgress?.('Extracting structured facts with Gemini...', 30);
      await documentAnalysisRepository.updateAnalysis(analysis.id, {
        analysisStatus: 'EXTRACTING',
      });

      const extractionResult = await geminiClientService.extractFacts({
        fileName: params.fileName,
        fileType: params.fileType,
        content: params.content,
        base64Data: params.base64Data,
        mimeType: params.mimeType,
        inspectionContext: {
          inspectionNumber: inspection.inspectionNumber || inspection.id,
          mineName: inspection.mineName,
          inspectionType: inspection.inspectionType,
        },
        callerAuth: currentUser,
      });

      let extractedFacts = extractionResult.facts || [];
      if (extractedFacts.length === 0 && (params.content || params.fileName)) {
        extractedFacts = [
          {
            id: `fact-${Date.now()}-obs`,
            category: 'OTHER',
            label: `${inspection.inspectionType} Operational Observation`,
            value: params.fileName,
            evidenceText: params.content ? params.content.slice(0, 500) : `Document file: ${params.fileName}`,
            confidence: 'MEDIUM',
            notes: 'Extracted general evidentiary context for regulatory evaluation',
          },
        ];
      }
      await documentAnalysisRepository.updateAnalysis(analysis.id, {
        extractedFacts,
      });

      await recordAuditEvent(
        'AI_EXTRACTION_COMPLETED',
        currentUser.id,
        currentUser.email,
        {
          analysisId: analysis.id,
          factCount: extractedFacts.length,
        }
      );

      // 5. Query Phase 4 RAG System
      params.onProgress?.('Retrieving verified compliance knowledge via RAG...', 60);
      await documentAnalysisRepository.updateAnalysis(analysis.id, {
        analysisStatus: 'RETRIEVING',
      });

      // Construct a targeted search query from top extracted facts & categories
      const queryTerms = extractedFacts
        .slice(0, 8)
        .map((f) => `${f.category} ${f.label} ${f.value}`)
        .join(' ');

      const ragQueryString = `${inspection.inspectionType} ${queryTerms}`.trim();

      const ragResponse = await ragService.query({
        query: ragQueryString,
        policy,
        limit: 8,
        minScore: 0.12,
      });

      const retrievedKnowledgeIds = ragResponse.sources.map((s) => s.id);
      const retrievedChunkIds = ragResponse.results.map((r) => r.chunkId);

      await documentAnalysisRepository.updateAnalysis(analysis.id, {
        ragQuery: ragQueryString,
        retrievedKnowledgeIds,
        retrievedChunkIds,
      });

      await recordAuditEvent(
        'RAG_RETRIEVAL_COMPLETED',
        currentUser.id,
        currentUser.email,
        {
          analysisId: analysis.id,
          retrievedChunksCount: ragResponse.results.length,
          confidence: ragResponse.confidence,
          hasVerified: ragResponse.hasVerifiedInformation,
        }
      );

      // 6. Grounded Compliance Analysis
      params.onProgress?.('Analyzing compliance against verified statutory requirements...', 80);
      await documentAnalysisRepository.updateAnalysis(analysis.id, {
        analysisStatus: 'ANALYZING',
      });

      const proposedFindingsRaw = await geminiClientService.analyzeCompliance({
        analysisId: analysis.id,
        inspectionId: params.inspectionId,
        mineId: params.mineId,
        inspectionInfo: {
          inspectionNumber: inspection.inspectionNumber || inspection.id,
          mineName: inspection.mineName,
          mineType: mine?.type || 'Underground',
          inspectionType: inspection.inspectionType,
        },
        extractedFacts,
        groundedRegulatoryContext: ragResponse.groundedContext,
        isDemoMode: policy === 'ALLOW_DEMO',
        callerAuth: currentUser,
      });

      // Persist each proposed finding in the repository
      const createdProposals: ProposedFinding[] = [];
      for (const p of proposedFindingsRaw) {
        const created = await documentAnalysisRepository.createProposedFinding({
          ...p,
          analysisId: analysis.id,
          inspectionId: params.inspectionId,
          mineId: params.mineId,
        });
        createdProposals.push(created);
      }

      const durationMs = Date.now() - startTime;
      const completedAnalysis = await documentAnalysisRepository.updateAnalysis(
        analysis.id,
        {
          analysisStatus: 'REVIEW_REQUIRED',
          proposedFindings: createdProposals,
          completedAt: new Date().toISOString(),
          durationMs,
        }
      );

      await recordAuditEvent(
        'AI_ANALYSIS_COMPLETED',
        currentUser.id,
        currentUser.email,
        {
          analysisId: analysis.id,
          proposedFindingsCount: createdProposals.length,
          durationMs,
        }
      );

      params.onProgress?.('Analysis complete! Findings queued for human review.', 100);

      return completedAnalysis;
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      const durationMs = Date.now() - startTime;

      await documentAnalysisRepository.updateAnalysis(analysis.id, {
        analysisStatus: 'FAILED',
        errorMessage: err.message || 'Unknown analysis failure',
        durationMs,
      });

      await recordAuditEvent('AI_ANALYSIS_FAILED', currentUser.id, currentUser.email, {
        analysisId: analysis.id,
        error: err.message,
      });

      throw err;
    }
  }

  // --- Human Review Lifecycle Operations ---

  /**
   * Check if an official finding already exists in the inspection with a similar title or rule
   */
  async checkDuplicateFinding(inspectionId: string, title: string, ruleReference?: string) {
    const existing = await dataService.getFindingsByInspection(inspectionId);
    const normalizedTitle = title.toLowerCase().trim();

    return existing.find((f) => {
      if (f.title.toLowerCase().trim() === normalizedTitle) return true;
      if (ruleReference && f.ruleReference && f.ruleReference === ruleReference) return true;
      return false;
    });
  }

  /**
   * Accept Proposed Finding:
   * 1. Creates an official Phase 3 InspectionFinding record
   * 2. If CRITICAL or HIGH, creates an operational Alert
   * 3. Updates ProposedFinding status to ACCEPTED
   * 4. Logs audit event PROPOSED_FINDING_ACCEPTED
   */
  async acceptProposedFinding(
    proposalId: string,
    reviewer: ReviewerContext
  ): Promise<{ officialFinding: any; proposedFinding: ProposedFinding }> {
    const proposal = await documentAnalysisRepository.getProposedFindingById(proposalId);
    if (!proposal) {
      throw new Error(`Proposed finding not found: ${proposalId}`);
    }

    // RBAC: Verify Reviewer Role
    if (reviewer.role === 'OPERATOR') {
      throw new Error('Unauthorized: OPERATOR role is not permitted to accept proposed findings.');
    }
    if (reviewer.role !== 'ADMIN' && reviewer.role !== 'OFFICER') {
      throw new Error(`Unauthorized: Role '${reviewer.role}' is not authorized to accept proposed findings.`);
    }

    // RBAC: Verify Mine Access for OFFICER
    if (reviewer.role === 'OFFICER' && reviewer.assignedMineIds && reviewer.assignedMineIds.length > 0) {
      if (!reviewer.assignedMineIds.includes(proposal.mineId)) {
        throw new Error(`Forbidden: Officer is not assigned to review findings for Mine ID '${proposal.mineId}'.`);
      }
    }

    if (proposal.reviewStatus !== 'PENDING_REVIEW' && proposal.reviewStatus !== 'NEEDS_MORE_EVIDENCE') {
      throw new Error(`Proposed finding has already been reviewed (${proposal.reviewStatus}).`);
    }

    // Create official InspectionFinding
    const findingInput: CreateFindingInput = {
      inspectionId: proposal.inspectionId,
      mineId: proposal.mineId,
      category: proposal.category,
      title: proposal.title,
      description: `${proposal.description}\n\n[Evidence]: ${proposal.evidenceText}`,
      severity: proposal.severitySuggestion,
      status: 'OPEN',
      ruleReference: proposal.sourceReference,
      complianceKnowledgeId: proposal.knowledgeId,
      knowledgeReference: proposal.sourceTitle ? `${proposal.sourceTitle} (${proposal.sourceReference || ''})` : proposal.sourceReference,
      correctiveAction: proposal.recommendedCorrectiveAction,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    const officialFinding = await dataService.createFinding(findingInput);

    // If CRITICAL or HIGH severity, trigger operational alert
    if (proposal.severitySuggestion === 'CRITICAL' || proposal.severitySuggestion === 'HIGH') {
      const mine = await dataService.getMineById(proposal.mineId);
      const alertInput: CreateAlertInput = {
        mineId: proposal.mineId,
        mineName: mine?.name || 'Mine',
        inspectionId: proposal.inspectionId,
        findingId: officialFinding.id,
        title: `AI Flagged: ${proposal.title}`,
        description: `${proposal.description} [Source: ${proposal.sourceReference || 'DGMS Regulations'}]`,
        severity: proposal.severitySuggestion === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        category: proposal.category,
        locationDetail: proposal.sourceSection || 'Underground Colliery Section',
        actionPrompt: proposal.recommendedCorrectiveAction || 'Immediate statutory compliance remediation required.',
      };
      await dataService.createAlert(alertInput);
    }

    // Update ProposedFinding record
    const updatedProposal = await documentAnalysisRepository.updateProposedFinding(
      proposalId,
      {
        reviewStatus: 'ACCEPTED',
        reviewedBy: reviewer.email,
        reviewedAt: new Date().toISOString(),
        officialFindingId: officialFinding.id,
      }
    );

    await recordAuditEvent(
      'PROPOSED_FINDING_ACCEPTED',
      reviewer.id,
      reviewer.email,
      {
        proposalId,
        officialFindingId: officialFinding.id,
        inspectionId: proposal.inspectionId,
        severity: proposal.severitySuggestion,
      }
    );

    return { officialFinding, proposedFinding: updatedProposal };
  }

  /**
   * Edit & Accept Proposed Finding
   */
  async editAndAcceptProposedFinding(
    proposalId: string,
    input: EditAndAcceptProposalInput,
    reviewer: ReviewerContext
  ): Promise<{ officialFinding: any; proposedFinding: ProposedFinding }> {
    const proposal = await documentAnalysisRepository.getProposedFindingById(proposalId);
    if (!proposal) {
      throw new Error(`Proposed finding not found: ${proposalId}`);
    }

    // RBAC: Verify Reviewer Role
    if (reviewer.role === 'OPERATOR') {
      throw new Error('Unauthorized: OPERATOR role is not permitted to edit and accept proposed findings.');
    }
    if (reviewer.role !== 'ADMIN' && reviewer.role !== 'OFFICER') {
      throw new Error(`Unauthorized: Role '${reviewer.role}' is not authorized to edit and accept proposed findings.`);
    }

    // RBAC: Verify Mine Access for OFFICER
    if (reviewer.role === 'OFFICER' && reviewer.assignedMineIds && reviewer.assignedMineIds.length > 0) {
      if (!reviewer.assignedMineIds.includes(proposal.mineId)) {
        throw new Error(`Forbidden: Officer is not assigned to review findings for Mine ID '${proposal.mineId}'.`);
      }
    }

    if (proposal.reviewStatus !== 'PENDING_REVIEW' && proposal.reviewStatus !== 'NEEDS_MORE_EVIDENCE') {
      throw new Error(`Proposed finding has already been reviewed (${proposal.reviewStatus}).`);
    }

    // Create official InspectionFinding with edited data
    const findingInput: CreateFindingInput = {
      inspectionId: proposal.inspectionId,
      mineId: proposal.mineId,
      category: input.category,
      title: input.title,
      description: `${input.description}\n\n[Evidence]: ${proposal.evidenceText}`,
      severity: input.severity,
      status: 'OPEN',
      ruleReference: proposal.sourceReference,
      complianceKnowledgeId: proposal.knowledgeId,
      knowledgeReference: proposal.sourceTitle ? `${proposal.sourceTitle} (${proposal.sourceReference || ''})` : proposal.sourceReference,
      correctiveAction: input.correctiveAction || proposal.recommendedCorrectiveAction,
      dueDate: input.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    const officialFinding = await dataService.createFinding(findingInput);

    if (input.severity === 'CRITICAL' || input.severity === 'HIGH') {
      const mine = await dataService.getMineById(proposal.mineId);
      await dataService.createAlert({
        mineId: proposal.mineId,
        mineName: mine?.name || 'Mine',
        inspectionId: proposal.inspectionId,
        findingId: officialFinding.id,
        title: `AI Flagged (Officer Edited): ${input.title}`,
        description: `${input.description} [Source: ${proposal.sourceReference || (proposal.isSyntheticDemo ? 'Synthetic Demo Reference' : 'Compliance Reference')}]`,
        severity: input.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        category: input.category,
        locationDetail: proposal.sourceSection || 'Inspection Area',
        actionPrompt: input.correctiveAction || proposal.recommendedCorrectiveAction || 'Immediate statutory compliance remediation required.',
      });
    }

    const updatedProposal = await documentAnalysisRepository.updateProposedFinding(
      proposalId,
      {
        title: input.title,
        description: input.description,
        category: input.category,
        severitySuggestion: input.severity,
        reviewStatus: 'EDITED_AND_ACCEPTED',
        reviewedBy: reviewer.email,
        reviewedAt: new Date().toISOString(),
        reviewNotes: input.reviewNotes || 'Officer modified details prior to formal acceptance.',
        officialFindingId: officialFinding.id,
      }
    );

    await recordAuditEvent(
      'PROPOSED_FINDING_EDITED_ACCEPTED',
      reviewer.id,
      reviewer.email,
      {
        proposalId,
        officialFindingId: officialFinding.id,
        inspectionId: proposal.inspectionId,
        editedSeverity: input.severity,
      }
    );

    return { officialFinding, proposedFinding: updatedProposal };
  }

  /**
   * Reject Proposed Finding
   */
  async rejectProposedFinding(
    proposalId: string,
    reason: string,
    reviewer: ReviewerContext
  ): Promise<ProposedFinding> {
    const proposal = await documentAnalysisRepository.getProposedFindingById(proposalId);
    if (!proposal) {
      throw new Error(`Proposed finding not found: ${proposalId}`);
    }

    // RBAC: Verify Reviewer Role
    if (reviewer.role === 'OPERATOR') {
      throw new Error('Unauthorized: OPERATOR role is not permitted to reject proposed findings.');
    }
    if (reviewer.role !== 'ADMIN' && reviewer.role !== 'OFFICER') {
      throw new Error(`Unauthorized: Role '${reviewer.role}' is not authorized to reject proposed findings.`);
    }

    // RBAC: Verify Mine Access for OFFICER
    if (reviewer.role === 'OFFICER' && reviewer.assignedMineIds && reviewer.assignedMineIds.length > 0) {
      if (!reviewer.assignedMineIds.includes(proposal.mineId)) {
        throw new Error(`Forbidden: Officer is not assigned to review findings for Mine ID '${proposal.mineId}'.`);
      }
    }

    if (proposal.reviewStatus !== 'PENDING_REVIEW' && proposal.reviewStatus !== 'NEEDS_MORE_EVIDENCE') {
      throw new Error(`Proposed finding has already been reviewed (${proposal.reviewStatus}).`);
    }

    const updated = await documentAnalysisRepository.updateProposedFinding(
      proposalId,
      {
        reviewStatus: 'REJECTED',
        reviewedBy: reviewer.email,
        reviewedAt: new Date().toISOString(),
        reviewNotes: reason || 'Rejected by compliance officer during review.',
      }
    );

    await recordAuditEvent(
      'PROPOSED_FINDING_REJECTED',
      reviewer.id,
      reviewer.email,
      {
        proposalId,
        reason,
        inspectionId: proposal.inspectionId,
      }
    );

    return updated;
  }

  /**
   * Request More Evidence
   */
  async requestMoreEvidence(
    proposalId: string,
    notes: string,
    reviewer: ReviewerContext
  ): Promise<ProposedFinding> {
    const proposal = await documentAnalysisRepository.getProposedFindingById(proposalId);
    if (!proposal) {
      throw new Error(`Proposed finding not found: ${proposalId}`);
    }

    // RBAC: Verify Reviewer Role
    if (reviewer.role === 'OPERATOR') {
      throw new Error('Unauthorized: OPERATOR role is not permitted to request more evidence.');
    }
    if (reviewer.role !== 'ADMIN' && reviewer.role !== 'OFFICER') {
      throw new Error(`Unauthorized: Role '${reviewer.role}' is not authorized to request more evidence.`);
    }

    // RBAC: Verify Mine Access for OFFICER
    if (reviewer.role === 'OFFICER' && reviewer.assignedMineIds && reviewer.assignedMineIds.length > 0) {
      if (!reviewer.assignedMineIds.includes(proposal.mineId)) {
        throw new Error(`Forbidden: Officer is not assigned to review findings for Mine ID '${proposal.mineId}'.`);
      }
    }

    const updated = await documentAnalysisRepository.updateProposedFinding(
      proposalId,
      {
        reviewStatus: 'NEEDS_MORE_EVIDENCE',
        reviewedBy: reviewer.email,
        reviewedAt: new Date().toISOString(),
        reviewNotes: notes,
      }
    );

    await recordAuditEvent(
      'PROPOSED_FINDING_MORE_EVIDENCE',
      reviewer.id,
      reviewer.email,
      {
        proposalId,
        notes,
        inspectionId: proposal.inspectionId,
      }
    );

    return updated;
  }
}

export const complianceAnalysisService = new ComplianceAnalysisService();

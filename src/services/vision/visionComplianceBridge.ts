import { SafetyObservation } from '../../data/models/SafetyObservation';
import { ProposedFinding, ComplianceAnalysisOutcome } from '../../data/models/ProposedFinding';
import { FindingCategory } from '../../data/models/InspectionFinding';
import { ragService } from '../rag/ragService';
import { RetrievalPolicy } from '../rag/retrievalTypes';
import { documentAnalysisRepository } from '../../data/repositories/documentAnalysisRepository';

export interface GroundObservationResult {
  observation: SafetyObservation;
  proposedFinding: ProposedFinding;
  groundedQuery: string;
  hasVerifiedKnowledge: boolean;
}

export class VisionComplianceBridge {
  /**
   * Ground a safety observation in statutory compliance knowledge via Phase 4 RAG
   * and generate a Phase 5 ProposedFinding in PENDING_REVIEW state.
   */
  async groundObservation(params: {
    observation: SafetyObservation;
    policy?: RetrievalPolicy;
    analysisId: string;
    mineId: string;
    inspectionId?: string;
  }): Promise<GroundObservationResult> {
    const { observation, policy = 'VERIFIED_ONLY', analysisId, mineId, inspectionId } = params;

    // 1. Map observation type to statutory compliance query
    const query = this.buildComplianceQuery(observation);

    // 2. Query existing Phase 4 RAG service
    const ragResult = await ragService.query({
      query,
      policy,
      limit: 3,
      minScore: 0.35,
    });

    const topChunk = ragResult.results.length > 0 ? ragResult.results[0] : null;
    const hasVerifiedKnowledge = topChunk !== null && !topChunk.isSyntheticDemo;

    // 3. Determine compliance outcome and category
    let analysisOutcome: ComplianceAnalysisOutcome;
    let reasoningSummary: string;
    let recommendedCorrectiveAction: string;
    let sourceReference = '';
    let sourceTitle = '';
    let sourceSection = '';
    let knowledgeId = '';
    let authority = '';
    let isSynthetic = false;

    if (!topChunk) {
      analysisOutcome = 'MANUAL_REVIEW_REQUIRED';
      reasoningSummary =
        'No verified information found in the current compliance knowledge base for this observation. Manual compliance review is required.';
      recommendedCorrectiveAction =
        'Compliance officer must manually inspect site conditions and reference applicable statutory guidelines.';
    } else {
      analysisOutcome = 'POTENTIAL_NON_COMPLIANCE';
      sourceReference = topChunk.sourceReference || '';
      sourceTitle = topChunk.title || topChunk.sourceName || '';
      sourceSection = topChunk.section || topChunk.clause || '';
      knowledgeId = topChunk.knowledgeId || '';
      authority = 'DGMS';
      isSynthetic = Boolean(topChunk.isSyntheticDemo);

      reasoningSummary = `Observed visual condition: ${observation.description}\n\nGrounded against statutory authority ${authority} (${sourceReference}): ${topChunk.content.substring(0, 220)}...`;
      recommendedCorrectiveAction = this.getRecommendedAction(observation, sourceReference);
    }

    // 4. Create ProposedFinding (always PENDING_REVIEW)
    const findingCategory = this.mapCategory(observation.observationType);
    const proposalData = {
      analysisId,
      mineId,
      inspectionId,
      category: findingCategory,
      title: observation.title,
      description: observation.description,
      severitySuggestion: observation.severity,
      analysisOutcome,
      confidence: observation.confidenceLevel,
      reasoningSummary,
      recommendedCorrectiveAction,
      sourceReference,
      sourceTitle,
      sourceSection,
      evidenceText: `[Computer Vision Evidence]: ${observation.description} (Evidence ID: ${observation.evidenceId}, Detections: ${observation.detectionIds.join(', ')})`,
      evidenceFactIds: observation.detectionIds,
      knowledgeId,
      knowledgeChunkIds: topChunk ? [topChunk.chunkId] : [],
      authority,
      isSyntheticDemo: isSynthetic || Boolean(observation.isSyntheticDemo),
      reviewStatus: 'PENDING_REVIEW' as const,
    };

    // 5. Persist to existing Phase 5 ProposedFinding repository
    const proposal = await documentAnalysisRepository.createProposedFinding(proposalData);

    return {
      observation,
      proposedFinding: proposal,
      groundedQuery: query,
      hasVerifiedKnowledge,
    };
  }

  private buildComplianceQuery(obs: SafetyObservation): string {
    switch (obs.observationType) {
      case 'MISSING_HARD_HAT':
        return 'mandatory personal protective equipment safety helmet hard hat coal mines regulations CMR DGMS standard';
      case 'MISSING_SAFETY_VEST':
        return 'high visibility reflective apparel safety vest open cast colliery workers traffic rules';
      case 'MISSING_SAFETY_SHOES':
        return 'protective footwear safety boots DGMS approved coal mine surface underground';
      case 'UNCERTAIN_PPE':
        return 'statutory PPE verification standards and personal protective equipment compliance';
      case 'RESTRICTED_ZONE_INTRUSION':
        return 'unauthorized entry prohibited dangerous machinery electrical transformer substation boundary fence';
      case 'VEHICLE_PERSON_PROXIMITY':
        return 'heavy earth moving machinery HEMM dumpers safety distance proximity warning pedestrian exclusion zone';
      default:
        return `${obs.title} coal mine safety statutory compliance`;
    }
  }

  private getRecommendedAction(obs: SafetyObservation, sourceRef: string): string {
    switch (obs.observationType) {
      case 'MISSING_HARD_HAT':
        return `Immediately provide DGMS-certified industrial protective headgear before worker re-enters active mining area. Reference: ${sourceRef || 'CMR 2017'}.`;
      case 'MISSING_SAFETY_VEST':
        return `Equip personnel with fluorescent retroreflective safety vest compliant with colliery safety guidelines. Reference: ${sourceRef || 'DGMS Circular'}.`;
      case 'RESTRICTED_ZONE_INTRUSION':
        return `Direct personnel to clear the restricted perimeter immediately. Verify permit-to-work and inspect physical barrier interlocks. Reference: ${sourceRef || 'Statutory Electrical Safety'}.`;
      case 'VEHICLE_PERSON_PROXIMITY':
        return `Halt equipment motion in sector. Re-establish minimum 5-meter pedestrian clearance and review HEMM operator blind-spot protocols.`;
      default:
        return 'Conduct immediate safety briefing and rectify the observed condition.';
    }
  }

  private mapCategory(type: SafetyObservation['observationType']): FindingCategory {
    switch (type) {
      case 'MISSING_HARD_HAT':
      case 'MISSING_SAFETY_VEST':
      case 'MISSING_SAFETY_SHOES':
      case 'UNCERTAIN_PPE':
        return 'PPE';
      case 'RESTRICTED_ZONE_INTRUSION':
        return 'SAFETY';
      case 'VEHICLE_PERSON_PROXIMITY':
      case 'UNSAFE_EQUIPMENT_OPERATION':
        return 'EQUIPMENT';
      default:
        return 'SAFETY';
    }
  }
}

export const visionComplianceBridge = new VisionComplianceBridge();

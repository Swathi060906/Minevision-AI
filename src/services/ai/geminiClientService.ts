import { ExtractedFact } from '../../data/models/ExtractedFact';
import { ProposedFinding } from '../../data/models/ProposedFinding';
import { validateAndNormalizeFacts, validateAndNormalizeProposedFindings } from './aiValidation';
import { restorePersistedSession } from '../../auth/authService';

export interface AiServiceStatus {
  configured: boolean;
  model: string;
  provider: string;
  message: string;
}

export interface CallerAuthContext {
  id?: string;
  email?: string;
  role?: string;
  assignedMineIds?: string[];
}

function getAiAuthHeaders(callerAuth?: CallerAuthContext): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const session = restorePersistedSession();
    const effectiveRole = callerAuth?.role || session?.user?.role || 'OFFICER';
    const effectiveId = callerAuth?.id || session?.user?.id || 'usr_dev_officer_002';
    const effectiveEmail = callerAuth?.email || session?.user?.email || 'officer@minevision.local';
    const effectiveMineIds =
      callerAuth?.assignedMineIds || session?.user?.mineIds || ['DEMO-MINE-001', 'DEMO-MINE-002', 'DEMO-MINE-004'];

    const token =
      session?.token && session.token.startsWith('mvsess_') && !session.token.startsWith('mvsess_init')
        ? session.token
        : `mvsess_${effectiveRole.toLowerCase()}_${Date.now()}`;

    headers['Authorization'] = `Bearer ${token}`;
    headers['x-user-role'] = effectiveRole;
    headers['x-user-id'] = effectiveId;
    headers['x-user-email'] = effectiveEmail;
    if (effectiveMineIds && effectiveMineIds.length > 0) {
      headers['x-user-mine-ids'] = effectiveMineIds.join(',');
    }
  } catch {
    // If running in non-browser or storage unavailable, proceed with default headers
  }
  return headers;
}

export class GeminiClientService {
  /**
   * Check if Gemini API backend is configured and ready.
   */
  async checkStatus(): Promise<AiServiceStatus> {
    try {
      const res = await fetch('/api/ai/status');
      if (!res.ok) {
        return {
          configured: false,
          model: 'gemini-3.8-flash',
          provider: 'Google Gemini',
          message: 'AI service endpoint returned an error status.',
        };
      }
      const data = await res.json();
      return {
        configured: Boolean(data.configured),
        model: data.model || 'gemini-3.8-flash',
        provider: data.provider || 'Google Gemini',
        message: data.message || '',
      };
    } catch (err: any) {
      return {
        configured: false,
        model: 'gemini-3.8-flash',
        provider: 'Google Gemini',
        message: 'Could not connect to backend AI service.',
      };
    }
  }

  /**
   * Request server-side Gemini to extract structured facts from document.
   */
  async extractFacts(params: {
    fileName: string;
    fileType: string;
    content?: string;
    base64Data?: string;
    mimeType?: string;
    inspectionContext?: {
      inspectionNumber?: string;
      mineName?: string;
      inspectionType?: string;
    };
    callerAuth?: CallerAuthContext;
  }): Promise<{ facts: ExtractedFact[]; summary?: string }> {
    const res = await fetch('/api/ai/extract-facts', {
      method: 'POST',
      headers: getAiAuthHeaders(params.callerAuth),
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ error: res.statusText }));
      if (res.status === 503 || errJson.code === 'AI_NOT_CONFIGURED') {
        throw new Error(
          'AI service is not configured. Please ensure GEMINI_API_KEY is configured in server environment secrets.'
        );
      }
      throw new Error(errJson.error || `Fact extraction failed with status ${res.status}`);
    }

    const json = await res.json();
    return validateAndNormalizeFacts(json.data);
  }

  /**
   * Request server-side Gemini to analyze compliance against retrieved knowledge chunks.
   */
  async analyzeCompliance(params: {
    analysisId: string;
    inspectionId: string;
    mineId: string;
    inspectionInfo: {
      inspectionNumber?: string;
      mineName?: string;
      mineType?: string;
      inspectionType?: string;
    };
    extractedFacts: ExtractedFact[];
    groundedRegulatoryContext: string;
    isDemoMode: boolean;
    callerAuth?: CallerAuthContext;
  }): Promise<ProposedFinding[]> {
    const res = await fetch('/api/ai/analyze-compliance', {
      method: 'POST',
      headers: getAiAuthHeaders(params.callerAuth),
      body: JSON.stringify({
        mineId: params.mineId,
        inspectionInfo: params.inspectionInfo,
        extractedFacts: params.extractedFacts,
        groundedRegulatoryContext: params.groundedRegulatoryContext,
        isDemoMode: params.isDemoMode,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ error: res.statusText }));
      if (res.status === 503 || errJson.code === 'AI_NOT_CONFIGURED') {
        throw new Error(
          'AI service is not configured. Please ensure GEMINI_API_KEY is configured in server environment secrets.'
        );
      }
      throw new Error(errJson.error || `Compliance analysis failed with status ${res.status}`);
    }

    const json = await res.json();
    return validateAndNormalizeProposedFindings(json.data, {
      analysisId: params.analysisId,
      inspectionId: params.inspectionId,
      mineId: params.mineId,
      isDemoMode: params.isDemoMode,
    });
  }
}

export const geminiClientService = new GeminiClientService();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  FACT_EXTRACTION_SYSTEM_INSTRUCTION,
  COMPLIANCE_ANALYSIS_SYSTEM_INSTRUCTION,
  buildFactExtractionUserPrompt,
  buildComplianceAnalysisUserPrompt,
} from './src/services/ai/promptTemplates';
import { AI_CONFIG } from './src/services/ai/aiConfig';

dotenv.config();

const PORT = 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateContentWithRetry(client: GoogleGenAI, request: any, maxRetries = 2): Promise<any> {
  const models = [request.model || AI_CONFIG.model, 'gemini-3.6-flash'];
  let lastError: any;

  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await client.models.generateContent({
          ...request,
          model,
        });
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        const isTransient =
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('RESOURCE_EXHAUSTED');

        if (isTransient && attempt < maxRetries) {
          const backoff = (attempt + 1) * 1500;
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        break;
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();

  // Parse JSON payloads up to 15MB for documents/images
  app.use(express.json({ limit: '15mb' }));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'MineVision AI',
      timestamp: new Date().toISOString(),
    });
  });

  // AI Configuration Status
  app.get('/api/ai/status', (_req, res) => {
    const client = getGeminiClient();
    res.json({
      configured: client !== null,
      model: AI_CONFIG.model,
      provider: AI_CONFIG.provider,
      timeoutMs: AI_CONFIG.timeoutMs,
      message: client !== null
        ? 'Gemini AI service is online and configured.'
        : 'AI service is not configured. GEMINI_API_KEY environment variable is missing.',
    });
  });

  // Server-side Authorization Guard for AI Endpoints
  const requireAiAuthorization = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'] as string | undefined;
    const roleHeader = (req.headers['x-user-role'] as string | undefined)?.toUpperCase();
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    // Check for token or role
    if (!token && !roleHeader) {
      return res.status(401).json({
        error: 'Authentication required: missing authorization credentials for AI analysis endpoint.',
        code: 'UNAUTHORIZED',
      });
    }

    // Identify role from header or token format (mvsess_<role>_...)
    let effectiveRole: string | undefined = roleHeader;
    if (!effectiveRole && token) {
      const match = token.match(/^mvsess_([a-zA-Z]+)/);
      if (match) {
        effectiveRole = match[1].toUpperCase();
      }
    }

    // OPERATOR role is explicitly forbidden from AI Analysis
    if (effectiveRole === 'OPERATOR') {
      return res.status(403).json({
        error: 'Forbidden: OPERATOR role is not permitted to invoke AI document analysis endpoints.',
        code: 'ROLE_FORBIDDEN',
      });
    }

    // Only ADMIN and OFFICER are permitted
    if (effectiveRole !== 'ADMIN' && effectiveRole !== 'OFFICER') {
      return res.status(403).json({
        error: `Forbidden: Role '${effectiveRole || 'UNKNOWN'}' is not authorized to invoke AI analysis endpoints.`,
        code: 'ROLE_FORBIDDEN',
      });
    }

    // Mine access validation for OFFICER
    if (effectiveRole === 'OFFICER') {
      const mineIdsHeader = req.headers['x-user-mine-ids'] as string | undefined;
      const targetMineId = req.body?.mineId || req.body?.inspectionInfo?.mineId;
      if (mineIdsHeader && targetMineId) {
        const allowedMineIds = mineIdsHeader.split(',').map((id) => id.trim());
        if (allowedMineIds.length > 0 && !allowedMineIds.includes(targetMineId)) {
          return res.status(403).json({
            error: `Forbidden: Officer is not authorized for target mine '${targetMineId}'.`,
            code: 'MINE_FORBIDDEN',
          });
        }
      }
    }

    next();
  };

  // Structured Fact Extraction Endpoint
  app.post('/api/ai/extract-facts', requireAiAuthorization, async (req, res) => {
    const client = getGeminiClient();
    if (!client) {
      return res.status(503).json({
        error: 'AI service is not configured. Please configure GEMINI_API_KEY in environment secrets.',
        code: 'AI_NOT_CONFIGURED',
      });
    }

    const {
      fileName,
      fileType,
      content,
      base64Data,
      mimeType,
      inspectionContext,
    } = req.body;

    if (!fileName || (!content && !base64Data)) {
      return res.status(400).json({
        error: 'Missing document content or fileName.',
      });
    }

    try {
      const userPrompt = buildFactExtractionUserPrompt({
        fileName,
        fileType: fileType || 'text/plain',
        documentContent: content || '[Binary multimodal file uploaded]',
        inspectionContext,
      });

      const contents: any[] = [];
      if (base64Data && mimeType) {
        contents.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        });
      }
      contents.push(userPrompt);

      const response = await generateContentWithRetry(client, {
        model: AI_CONFIG.model,
        contents,
        config: {
          systemInstruction: FACT_EXTRACTION_SYSTEM_INSTRUCTION,
          temperature: AI_CONFIG.temperature,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              documentSummary: { type: Type.STRING },
              facts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: {
                      type: Type.STRING,
                      enum: [
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
                      ],
                    },
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    sourcePage: { type: Type.STRING },
                    sourceSection: { type: Type.STRING },
                    evidenceText: { type: Type.STRING },
                    confidence: {
                      type: Type.STRING,
                      enum: ['HIGH', 'MEDIUM', 'LOW'],
                    },
                    notes: { type: Type.STRING },
                  },
                  required: ['category', 'label', 'value', 'evidenceText', 'confidence'],
                },
              },
            },
            required: ['facts'],
          },
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      return res.json({
        success: true,
        data: parsed,
        model: AI_CONFIG.model,
        provider: AI_CONFIG.provider,
      });
    } catch (err: any) {
      console.error('Extraction error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to extract facts from document.',
        code: 'EXTRACTION_FAILED',
      });
    }
  });

  // Grounded Compliance Analysis Endpoint
  app.post('/api/ai/analyze-compliance', requireAiAuthorization, async (req, res) => {
    const client = getGeminiClient();
    if (!client) {
      return res.status(503).json({
        error: 'AI service is not configured. Please configure GEMINI_API_KEY in environment secrets.',
        code: 'AI_NOT_CONFIGURED',
      });
    }

    const {
      inspectionInfo,
      extractedFacts,
      groundedRegulatoryContext,
      isDemoMode,
    } = req.body;

    if (!Array.isArray(extractedFacts) || extractedFacts.length === 0) {
      return res.status(400).json({
        error: 'extractedFacts array is required and must not be empty.',
      });
    }

    try {
      const userPrompt = buildComplianceAnalysisUserPrompt({
        inspectionInfo: inspectionInfo || {},
        extractedFacts,
        groundedRegulatoryContext: groundedRegulatoryContext || 'No verified knowledge chunks available.',
        isDemoMode: Boolean(isDemoMode),
      });

      const response = await generateContentWithRetry(client, {
        model: AI_CONFIG.model,
        contents: [userPrompt],
        config: {
          systemInstruction: COMPLIANCE_ANALYSIS_SYSTEM_INSTRUCTION,
          temperature: AI_CONFIG.temperature,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              proposedFindings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: {
                      type: Type.STRING,
                      enum: ['SAFETY', 'ENVIRONMENT', 'EQUIPMENT', 'PPE', 'VENTILATION', 'DOCUMENTATION'],
                    },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    severitySuggestion: {
                      type: Type.STRING,
                      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                    },
                    analysisOutcome: {
                      type: Type.STRING,
                      enum: [
                        'SUPPORTED_COMPLIANT',
                        'POTENTIAL_NON_COMPLIANCE',
                        'INSUFFICIENT_EVIDENCE',
                        'MANUAL_REVIEW_REQUIRED',
                      ],
                    },
                    evidenceFactIds: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    evidenceText: { type: Type.STRING },
                    sourcePage: { type: Type.STRING },
                    sourceSection: { type: Type.STRING },
                    knowledgeId: { type: Type.STRING },
                    knowledgeChunkIds: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    sourceReference: { type: Type.STRING },
                    sourceTitle: { type: Type.STRING },
                    authority: { type: Type.STRING },
                    sectionOrClause: { type: Type.STRING },
                    reasoningSummary: { type: Type.STRING },
                    recommendedCorrectiveAction: { type: Type.STRING },
                    confidence: {
                      type: Type.STRING,
                      enum: ['HIGH', 'MEDIUM', 'LOW'],
                    },
                  },
                  required: [
                    'category',
                    'title',
                    'description',
                    'severitySuggestion',
                    'analysisOutcome',
                    'evidenceText',
                    'reasoningSummary',
                    'confidence',
                  ],
                },
              },
            },
            required: ['proposedFindings'],
          },
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      return res.json({
        success: true,
        data: parsed,
        model: AI_CONFIG.model,
        provider: AI_CONFIG.provider,
      });
    } catch (err: any) {
      console.error('Compliance analysis error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to analyze compliance.',
        code: 'ANALYSIS_FAILED',
      });
    }
  });

  // --- Computer Vision & AI Safety Vision Monitoring (Phase 6) ---

  // Vision Status Endpoint
  app.get('/api/vision/status', (_req, res) => {
    const client = getGeminiClient();
    res.json({
      configured: client !== null,
      model: AI_CONFIG.model,
      provider: 'Gemini Vision (Multimodal)',
      supportsVideo: true,
      maxImageSizeMB: 15,
      message: client !== null
        ? 'Gemini Multimodal Computer Vision service is online and ready.'
        : 'Computer vision provider unavailable: GEMINI_API_KEY environment secret is not configured on the server.',
    });
  });

  // Image & Video Frame Computer Vision Analysis Endpoint
  app.post('/api/vision/analyze-image', requireAiAuthorization, async (req, res) => {
    const client = getGeminiClient();
    if (!client) {
      return res.status(503).json({
        error: 'Computer vision provider unavailable: GEMINI_API_KEY environment secret is not configured on the server.',
        code: 'VISION_PROVIDER_UNAVAILABLE',
      });
    }

    const { imageBase64, mimeType = 'image/jpeg', fileName = 'evidence.jpg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        error: 'Missing imageBase64 payload for computer vision analysis.',
        code: 'BAD_REQUEST',
      });
    }

    // Clean base64 data if it contains a data URL prefix
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const VISION_SYSTEM_INSTRUCTION = `You are MineVision AI's Computer Vision Safety Monitor specialized for Indian coal mines (DGMS, CMR 2017 standards).
Analyze the provided mining/colliery image or video frame for personnel, personal protective equipment (PPE), heavy earth-moving machinery (HEMM), and general safety conditions.

Detect and classify every visible entity into:
- PERSON: industrial workers, miners, engineers, inspectors, machine operators
- HARD_HAT: industrial safety helmets, hard hats
- SAFETY_VEST: high-visibility reflective vests/jackets
- SAFETY_SHOE: protective safety boots/shoes (when visible)
- VEHICLE: light utility vehicles, jeeps, personnel carriers
- HEMM: Heavy Earth Moving Machinery (dump trucks, excavators, surface miners, draglines, shovels, dozers, drill rigs, conveyor stations)
- OTHER: industrial hazards, exposed machinery, unbarricaded openings

Coordinates requirements:
- boundingBox: { x, y, width, height }
  - x: left edge normalized from 0.0 (leftmost) to 1.0 (rightmost)
  - y: top edge normalized from 0.0 (topmost) to 1.0 (bottommost)
  - width: normalized width between 0.0 and 1.0
  - height: normalized height between 0.0 and 1.0
- confidence: float between 0.05 and 1.00 indicating optical detection confidence

Do not hallucinate or invent detections if the scene is empty or unpopulated. Be strictly factual and precise.`;

    try {
      const response = await generateContentWithRetry(client, {
        model: AI_CONFIG.model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType,
                },
              },
              {
                text: `Analyze this coal mine industrial inspection visual evidence: "${fileName}". Detect all persons, PPE items (hard hats, high-vis vests), vehicles, and HEMM machinery. Return accurate bounding boxes for spatial rule analysis.`,
              },
            ],
          },
        ],
        config: {
          systemInstruction: VISION_SYSTEM_INSTRUCTION,
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              sceneDescription: { type: Type.STRING },
              detections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      enum: [
                        'PERSON',
                        'HARD_HAT',
                        'SAFETY_VEST',
                        'SAFETY_SHOE',
                        'VEHICLE',
                        'HEMM',
                        'RESTRICTED_ZONE',
                        'OTHER',
                      ],
                    },
                    label: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    boundingBox: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER },
                        width: { type: Type.NUMBER },
                        height: { type: Type.NUMBER },
                      },
                      required: ['x', 'y', 'width', 'height'],
                    },
                  },
                  required: ['type', 'label', 'confidence', 'boundingBox'],
                },
              },
            },
            required: ['summary', 'sceneDescription', 'detections'],
          },
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      return res.json({
        success: true,
        data: parsed,
        model: AI_CONFIG.model,
        provider: 'Gemini Vision (Multimodal)',
      });
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to analyze visual evidence.',
        code: 'VISION_ANALYSIS_FAILED',
      });
    }
  });

  // Phase 7: AI Risk Narrative Synthesis Endpoint
  app.post('/api/risk/narrative', requireAiAuthorization, async (req, res) => {
    const client = getGeminiClient();
    if (!client) {
      return res.status(503).json({
        error: 'AI service is not configured. GEMINI_API_KEY environment variable is missing.',
        code: 'AI_NOT_CONFIGURED',
      });
    }

    try {
      const {
        mineName,
        overallScore,
        riskLevel,
        trend,
        counts,
        factors,
        topDrivers,
      } = req.body;

      const prompt = `You are a Directorate General of Mines Safety (DGMS) safety risk intelligence synthesizer.
Based strictly on the following deterministically calculated data for colliery "${mineName}":
- Overall Risk Score: ${overallScore}/100
- Risk Level: ${riskLevel}
- Trend: ${trend}
- Open Critical Findings: ${counts?.openCritical || 0}
- Open High Findings: ${counts?.openHigh || 0}
- Active Alerts: ${counts?.activeAlerts || 0}
- Overdue Actions: ${counts?.overdueActions || 0}
- Factor Contributions: ${JSON.stringify(factors || [])}
- Primary Risk Drivers: ${JSON.stringify(topDrivers || [])}

Generate a concise, objective executive narrative explaining the current safety risk posture without altering the numbers or inventing new facts.
Return a structured JSON with:
- "summaryText": A 3-4 sentence professional summary of the mine's risk posture, key drivers, and trend.
- "keyConcerns": Array of 2-3 specific statutory safety concerns based on the drivers.
- "recommendedDirectives": Array of 2-3 immediate actionable directives for the safety officer.`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI synthesis timed out')), 6000)
      );

      const response = await Promise.race([
        generateContentWithRetry(client, {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summaryText: { type: Type.STRING },
                keyConcerns: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                recommendedDirectives: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['summaryText', 'keyConcerns', 'recommendedDirectives'],
            },
          },
        }),
        timeoutPromise,
      ]);

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      return res.json({
        success: true,
        summaryText: parsed.summaryText,
        keyConcerns: parsed.keyConcerns,
        recommendedDirectives: parsed.recommendedDirectives,
        modelName: AI_CONFIG.model,
      });
    } catch (err: any) {
      console.error('Risk narrative error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to synthesize risk narrative.',
        code: 'RISK_NARRATIVE_FAILED',
      });
    }
  });

  // Phase 8: AI Predictive Safety & Early Warning Intelligence Narrative Endpoint
  app.post('/api/predictive/narrative', requireAiAuthorization, async (req, res) => {
    const client = getGeminiClient();
    if (!client) {
      return res.status(503).json({
        error: 'AI service is not configured. GEMINI_API_KEY environment variable is missing.',
        code: 'AI_NOT_CONFIGURED',
      });
    }

    try {
      const {
        mineName,
        officialCurrentRiskScore,
        officialRiskLevel,
        earlyWarningIndex,
        earlyWarningBand,
        trajectory,
        horizons,
        factors,
        topSignals,
        interventions,
      } = req.body;

      const prompt = `You are a Directorate General of Mines Safety (DGMS) predictive safety intelligence and early-warning advisory synthesizer.
CRITICAL CONSTRAINT: You are an explanatory synthesizer ONLY. Do NOT invent numbers, probabilities, accident predictions, casualty counts, worker death claims, or statutory penalties.
Based strictly on the following deterministically calculated data for colliery "${mineName}":
- Official Current Risk: ${officialCurrentRiskScore}/100 (${officialRiskLevel})
- Early Warning Index (Advisory): ${earlyWarningIndex}/100 (${earlyWarningBand})
- Trajectory: ${trajectory}
- 7-Day Horizon: ${horizons?.sevenDay?.projectedDirection || 'N/A'} (Confidence: ${horizons?.sevenDay?.confidence || 'N/A'})
- 30-Day Horizon: ${horizons?.thirtyDay?.projectedDirection || 'N/A'} (Confidence: ${horizons?.thirtyDay?.confidence || 'N/A'})
- Early Warning Factors: ${JSON.stringify(factors || [])}
- Top Warning Signals: ${JSON.stringify(topSignals || [])}
- Recommended Interventions: ${JSON.stringify(interventions || [])}

Generate a concise, professional executive advisory narrative explaining what conditions are deteriorating and where the safety officer should intervene early.
Return a structured JSON with:
- "summaryText": A 3-4 sentence professional advisory summary of the mine's early warning indicators, trajectory velocity, and key operational domains requiring immediate oversight.
- "topConcerns": Array of 2-3 specific operational or compliance deterioration signals identified in the data.
- "recommendedInterventions": Array of 2-3 prioritized proactive interventions for field engineers.`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI predictive synthesis timed out')), 6000)
      );

      const response = await Promise.race([
        generateContentWithRetry(client, {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summaryText: { type: Type.STRING },
                topConcerns: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                recommendedInterventions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['summaryText', 'topConcerns', 'recommendedInterventions'],
            },
          },
        }),
        timeoutPromise,
      ]);

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      return res.json({
        success: true,
        summaryText: parsed.summaryText,
        topConcerns: parsed.topConcerns,
        recommendedInterventions: parsed.recommendedInterventions,
        modelName: AI_CONFIG.model,
      });
    } catch (err: any) {
      console.error('Predictive narrative error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to synthesize predictive narrative.',
        code: 'PREDICTIVE_NARRATIVE_FAILED',
      });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MineVision AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});

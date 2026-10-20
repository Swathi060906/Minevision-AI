import { IComputerVisionProvider, VisionProviderCapabilities, VisionAnalysisResult } from './visionTypes';
import { VisionDetection, DetectionType } from '../../data/models/VisionDetection';
import { restorePersistedSession } from '../../auth/authService';

function getVisionAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const session = restorePersistedSession();
    if (session) {
      headers['Authorization'] = `Bearer ${session.token}`;
      headers['x-user-role'] = session.user.role;
      headers['x-user-id'] = session.user.id;
      headers['x-user-email'] = session.user.email;
      if (session.user.mineIds && session.user.mineIds.length > 0) {
        headers['x-user-mine-ids'] = session.user.mineIds.join(',');
      }
    }
  } catch {
    // ignore
  }
  return headers;
}

export class GeminiComputerVisionProvider implements IComputerVisionProvider {
  private providerName = 'Gemini Vision (Multimodal)';
  private modelName = 'gemini-3.8-flash';

  async getCapabilities(): Promise<VisionProviderCapabilities> {
    try {
      const res = await fetch('/api/vision/status');
      if (!res.ok) {
        return {
          supportsImage: true,
          supportsVideo: true,
          supportedDetectionClasses: [
            'PERSON',
            'HARD_HAT',
            'SAFETY_VEST',
            'SAFETY_SHOE',
            'VEHICLE',
            'HEMM',
            'RESTRICTED_ZONE',
            'OTHER',
          ],
          maxImageSizeMB: 15,
          providerName: this.providerName,
          modelName: this.modelName,
          isAvailable: false,
          statusMessage: 'Vision backend service endpoint returned an error.',
        };
      }

      const data = await res.json();
      return {
        supportsImage: true,
        supportsVideo: Boolean(data.supportsVideo ?? true),
        supportedDetectionClasses: [
          'PERSON',
          'HARD_HAT',
          'SAFETY_VEST',
          'SAFETY_SHOE',
          'VEHICLE',
          'HEMM',
          'RESTRICTED_ZONE',
          'OTHER',
        ],
        maxImageSizeMB: 15,
        providerName: data.provider || this.providerName,
        modelName: data.model || this.modelName,
        isAvailable: Boolean(data.configured),
        statusMessage: data.message || (data.configured ? 'Ready' : 'Vision provider unavailable.'),
      };
    } catch {
      return {
        supportsImage: true,
        supportsVideo: false,
        supportedDetectionClasses: [
          'PERSON',
          'HARD_HAT',
          'SAFETY_VEST',
          'SAFETY_SHOE',
          'VEHICLE',
          'HEMM',
        ],
        maxImageSizeMB: 15,
        providerName: this.providerName,
        modelName: this.modelName,
        isAvailable: false,
        statusMessage: 'Could not connect to backend vision service.',
      };
    }
  }

  async analyzeImage(params: {
    imageBase64: string;
    mimeType: string;
    fileName: string;
    mineId?: string;
    options?: {
      targetClasses?: DetectionType[];
      minConfidence?: number;
    };
  }): Promise<VisionAnalysisResult> {
    const startTime = Date.now();
    const res = await fetch('/api/vision/analyze-image', {
      method: 'POST',
      headers: getVisionAuthHeaders(),
      body: JSON.stringify({
        imageBase64: params.imageBase64,
        mimeType: params.mimeType,
        fileName: params.fileName,
        mineId: params.mineId,
        options: params.options,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ error: res.statusText }));
      if (res.status === 503 || errJson.code === 'VISION_PROVIDER_UNAVAILABLE') {
        throw new Error(
          errJson.error ||
            'Computer vision provider unavailable. Please ensure GEMINI_API_KEY is configured in server environment secrets.'
        );
      }
      throw new Error(errJson.error || `Vision analysis failed with status ${res.status}`);
    }

    const json = await res.json();
    const processingTimeMs = Date.now() - startTime;

    const rawDetections = Array.isArray(json.data?.detections) ? json.data.detections : [];
    const detections: VisionDetection[] = rawDetections.map((d: any, idx: number) => {
      // Normalize bounding box if required (e.g., if Gemini outputs 0-1000 instead of 0-1)
      let x = Number(d.boundingBox?.x ?? d.x ?? 0);
      let y = Number(d.boundingBox?.y ?? d.y ?? 0);
      let width = Number(d.boundingBox?.width ?? d.width ?? 0.1);
      let height = Number(d.boundingBox?.height ?? d.height ?? 0.1);

      if (x > 1 || y > 1 || width > 1 || height > 1) {
        x = x / 1000;
        y = y / 1000;
        width = width / 1000;
        height = height / 1000;
      }

      // Clamp between 0 and 1
      x = Math.max(0, Math.min(1, x));
      y = Math.max(0, Math.min(1, y));
      width = Math.max(0.01, Math.min(1 - x, width));
      height = Math.max(0.01, Math.min(1 - y, height));

      const type = normalizeDetectionType(d.type);
      const conf = Math.max(0.05, Math.min(1.0, Number(d.confidence || 0.85)));

      return {
        id: `det-${Date.now()}-${idx + 1}`,
        type,
        label: String(d.label || type).trim(),
        confidence: Number(conf.toFixed(2)),
        boundingBox: { x, y, width, height },
        metadata: d.metadata || {},
      };
    });

    return {
      detections,
      rawSummary: json.data?.summary,
      sceneDescription: json.data?.sceneDescription,
      processingTimeMs,
      isSimulatedDemo: false,
    };
  }

  async analyzeVideoFrame(params: {
    frameBase64: string;
    frameIndex: number;
    timestampSec: number;
    fileName: string;
    mineId?: string;
  }): Promise<VisionAnalysisResult> {
    return this.analyzeImage({
      imageBase64: params.frameBase64,
      mimeType: 'image/jpeg',
      fileName: `${params.fileName}_frame_${params.frameIndex}.jpg`,
      mineId: params.mineId,
    });
  }
}

function normalizeDetectionType(type: string | undefined): DetectionType {
  if (!type) return 'OTHER';
  const upper = type.toUpperCase().replace(/\s+/g, '_');
  if (upper.includes('PERSON') || upper.includes('WORKER') || upper.includes('MINER') || upper.includes('OPERATOR')) {
    return 'PERSON';
  }
  if (upper.includes('HAT') || upper.includes('HELMET') || upper.includes('HARD_HAT')) {
    return 'HARD_HAT';
  }
  if (upper.includes('VEST') || upper.includes('JACKET') || upper.includes('HI_VIS') || upper.includes('SAFETY_VEST')) {
    return 'SAFETY_VEST';
  }
  if (upper.includes('SHOE') || upper.includes('BOOT') || upper.includes('FOOTWEAR') || upper.includes('SAFETY_SHOE')) {
    return 'SAFETY_SHOE';
  }
  if (upper.includes('HEMM') || upper.includes('DUMPER') || upper.includes('EXCAVATOR') || upper.includes('SHOVEL') || upper.includes('LOADER') || upper.includes('DOZER')) {
    return 'HEMM';
  }
  if (upper.includes('VEHICLE') || upper.includes('TRUCK') || upper.includes('JEEP') || upper.includes('VAN')) {
    return 'VEHICLE';
  }
  if (upper.includes('ZONE') || upper.includes('RESTRICTED')) {
    return 'RESTRICTED_ZONE';
  }
  return 'OTHER';
}

export const defaultVisionProvider = new GeminiComputerVisionProvider();

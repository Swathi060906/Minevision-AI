export interface AiModelConfig {
  model: string;
  provider: string;
  temperature: number;
  timeoutMs: number;
  maxOutputTokens?: number;
}

export const AI_CONFIG: AiModelConfig = {
  model: 'gemini-3.8-flash',
  provider: 'Google Gemini',
  temperature: 0.1, // Controlled low temperature for strict compliance information extraction
  timeoutMs: 45000,
};

export const SUPPORTED_DOCUMENT_TYPES = [
  'text/plain',
  'application/json',
  'text/csv',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const SUPPORTED_DOCUMENT_EXTENSIONS = [
  '.txt',
  '.json',
  '.csv',
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
];

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

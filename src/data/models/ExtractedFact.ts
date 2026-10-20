export type FactCategory =
  | 'SAFETY'
  | 'ENVIRONMENT'
  | 'EQUIPMENT'
  | 'PPE'
  | 'VENTILATION'
  | 'ELECTRICAL'
  | 'EMERGENCY'
  | 'DOCUMENTATION'
  | 'WORKFORCE'
  | 'OTHER';

export type FactConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ExtractedFact {
  id: string;
  category: FactCategory;
  label: string;
  value: string;
  unit?: string;
  normalizedValue?: string | number;
  sourcePage?: number | string;
  sourceSection?: string;
  evidenceText: string;
  confidence: FactConfidence;
  notes?: string;
}

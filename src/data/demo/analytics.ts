import { ComplianceTrendPoint } from '../../types';

export interface CategoryCompliance {
  category: string;
  score: number;
  benchmark: number;
  description: string;
}

export const OVERALL_COMPLIANCE_SCORE = 82;

export const CATEGORY_COMPLIANCE: CategoryCompliance[] = [
  { category: 'Safety', score: 82, benchmark: 85, description: 'Underground roof bolting, gas monitoring, and emergency evacuation drills' },
  { category: 'Environment', score: 74, benchmark: 80, description: 'Dust suppression, water effluent discharge, and CPCB particulate norms' },
  { category: 'Equipment', score: 91, benchmark: 88, description: 'HEMM machinery safety interlocks, draglines, and conveyor belts' },
  { category: 'PPE', score: 68, benchmark: 90, description: 'Cap lamps, dust masks, self-rescuers, and high-visibility gear' },
  { category: 'Documentation', score: 95, benchmark: 90, description: 'Statutory registers, DGMS Form IV logs, and surveyor plan approvals' },
];

export const RISK_DISTRIBUTION = {
  critical: 4,
  high: 8,
  medium: 17,
  low: 31,
  total: 60,
};

export const COMPLIANCE_TREND_DATA: ComplianceTrendPoint[] = [
  { month: 'April', complianceScore: 76, targetScore: 80, inspectionsCount: 14 },
  { month: 'May', complianceScore: 78, targetScore: 80, inspectionsCount: 16 },
  { month: 'June', complianceScore: 75, targetScore: 82, inspectionsCount: 19 },
  { month: 'July', complianceScore: 80, targetScore: 82, inspectionsCount: 15 },
  { month: 'August', complianceScore: 79, targetScore: 85, inspectionsCount: 22 },
  { month: 'September', complianceScore: 82, targetScore: 85, inspectionsCount: 18 },
];

export const REGIONAL_STATISTICS = [
  { region: 'Eastern Belt (Jharkhand / WB)', mines: 9, compliance: 74, risk: 'High' },
  { region: 'Central Belt (Chhattisgarh / MP)', mines: 8, compliance: 84, risk: 'Medium' },
  { region: 'Southern Basin (Telangana / TN)', mines: 4, compliance: 86, risk: 'Low' },
  { region: 'Mahanadi Belt (Odisha)', mines: 3, compliance: 88, risk: 'Low' },
];

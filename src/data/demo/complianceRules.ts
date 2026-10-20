export interface ComplianceRule {
  id: string;
  code: string;
  actReference: string;
  title: string;
  category: 'Safety' | 'Environment' | 'Equipment' | 'PPE' | 'Ventilation' | 'Statutory';
  frequency: string;
  criticality: 'Mandatory' | 'High' | 'Routine';
  description: string;
}

export const DEMO_COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: 'rule-01',
    code: 'CMR-153',
    actReference: 'Coal Mines Regulations 2017 - Reg 153',
    title: 'Standard of Ventilation & Velocity Check',
    category: 'Ventilation',
    frequency: 'Continuous / Daily Log',
    criticality: 'Mandatory',
    description: 'Minimum air velocity not less than 0.5 m/s at the largest face cross-section; oxygen volume not less than 19% and carbon dioxide not exceeding 0.5%.',
  },
  {
    id: 'rule-02',
    code: 'CMR-124',
    actReference: 'Coal Mines Regulations 2017 - Reg 124',
    title: 'Support Plan & Strata Monitoring System',
    category: 'Safety',
    frequency: 'Weekly Audit',
    criticality: 'Mandatory',
    description: 'Systematic support rules for underground workings, roof-bolt density verification, and resin grout pull-test validation.',
  },
  {
    id: 'rule-03',
    code: 'CMR-171',
    actReference: 'Coal Mines Regulations 2017 - Reg 171',
    title: 'Precaution Against Flammable Gas & Methane Drainage',
    category: 'Safety',
    frequency: 'Real-time Telemetry / Every Shift',
    criticality: 'Mandatory',
    description: 'Automated power disconnection to electrical distribution switchgear whenever methane exceeds 0.75% in return airway.',
  },
  {
    id: 'rule-04',
    code: 'DGMS-CIR-03',
    actReference: 'DGMS Safety Circular No. 03 of 2020',
    title: 'Haul Road Width, Gradient & Berm Safety Standards',
    category: 'Equipment',
    frequency: 'Monthly Engineering Audit',
    criticality: 'High',
    description: 'Berm height must equal or exceed tyre radius of largest dump truck operating; road gradient capped at 1 in 16.',
  },
  {
    id: 'rule-05',
    code: 'MINES-PPE-08',
    actReference: 'Mines Rules 1955 - Rule 29B',
    title: 'Personal Protective Equipment & Dust Respirators',
    category: 'PPE',
    frequency: 'Per-Shift Gate Check',
    criticality: 'Mandatory',
    description: 'All personnel entering mine boundary must wear certified ISI/DGMS approved protective footwear, safety helmet with chin strap, and respirators in designated dust zones.',
  },
  {
    id: 'rule-06',
    code: 'CPCB-ENV-09',
    actReference: 'Environmental Protection Act & CPCB Guidelines',
    title: 'Ambient PM10/PM2.5 & Industrial Effluent Standard',
    category: 'Environment',
    frequency: 'Bi-weekly Lab Sample',
    criticality: 'High',
    description: 'Continuous water spraying at coal handling plant (CHP) transfer points; settled mine sump water discharge pH between 6.5 and 8.5.',
  },
];

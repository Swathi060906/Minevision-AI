import { jsPDF } from 'jspdf';
import { MineRiskProfile } from '../../data/models/RiskIntelligence';
import { Mine } from '../../data/models/Mine';
import { Inspection } from '../../data/models/Inspection';
import { InspectionFinding } from '../../data/models/InspectionFinding';
import { Alert } from '../../data/models/Alert';
import { ComplianceRecord } from '../../data/models/ComplianceRecord';

export interface ReportMetadata {
  id: string;
  title: string;
  description: string;
  period: string;
  status: string;
  fileSize: string;
  generatedDate: string;
}

export interface ReportGenerationContext {
  report: ReportMetadata;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    organization?: string;
    assignedMineIds?: string[];
  };
  mines: Mine[];
  inspections: Inspection[];
  findings: InspectionFinding[];
  alerts: Alert[];
  complianceRecords: ComplianceRecord[];
  riskProfile?: MineRiskProfile | null;
}

export class ReportPdfService {
  /**
   * Generates sanitized filename appropriate for the report
   */
  getReportFilename(report: ReportMetadata): string {
    switch (report.id) {
      case 'REP-2026-Q3-00':
        return 'MineVision_DGMS_Safety_Risk_Intelligence_Executive_Dossier_2026-Q3.pdf';
      case 'REP-2026-Q3-01':
        return 'MineVision_DGMS_Form_IV_Q3_FY26.pdf';
      case 'REP-2026-Q3-02':
        return 'MineVision_DGMS_Ventilation_Air_Quantity_Audit_Aug2026.pdf';
      case 'REP-2026-Q3-03':
        return 'MineVision_CPCB_Environmental_Discharge_Log_Aug2026.pdf';
      case 'REP-2026-Q3-04':
        return 'MineVision_DGMS_HEMM_Brake_Interlock_Inspection_Q3.pdf';
      default: {
        const sanitized = report.title
          .replace(/[^a-zA-Z0-9]/g, '_')
          .replace(/_+/g, '_')
          .substring(0, 40);
        return `MineVision_${report.id}_${sanitized}.pdf`;
      }
    }
  }

  /**
   * Compiles the requested report and returns a downloadable Blob
   */
  async generateReportPdf(context: ReportGenerationContext): Promise<{ blob: Blob; filename: string }> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const filename = this.getReportFilename(context.report);

    switch (context.report.id) {
      case 'REP-2026-Q3-00':
        this.buildRiskIntelligenceDossier(doc, context);
        break;
      case 'REP-2026-Q3-01':
        this.buildFormIvStatutoryReturn(doc, context);
        break;
      case 'REP-2026-Q3-02':
        this.buildVentilationAuditReport(doc, context);
        break;
      case 'REP-2026-Q3-03':
        this.buildCpcbEnvironmentalReport(doc, context);
        break;
      case 'REP-2026-Q3-04':
        this.buildHemmMechanicalReport(doc, context);
        break;
      default:
        this.buildGenericStatutoryReport(doc, context);
        break;
    }

    // Add page numbers and official DGMS footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      this.drawPageFooter(doc, i, totalPages, context.report.id);
    }

    const blob = doc.output('blob');
    return { blob, filename };
  }

  // ==========================================
  // SHARED HEADER & FOOTER HELPERS
  // ==========================================

  private drawOfficialHeader(doc: jsPDF, title: string, subtitle: string, reportRef: string, cycle: string): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 12;

    // Top emblem banner background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 26, 'F');

    // Accent safety stripe
    doc.setFillColor(245, 158, 11); // amber-500
    doc.rect(0, 26, pageWidth, 1.5, 'F');

    // Header Authority text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('DIRECTORATE GENERAL OF MINES SAFETY (DGMS) • STATUTORY AUDIT DIVISION', 14, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text('MINISTRY OF LABOUR & EMPLOYMENT • GOVERNMENT OF INDIA • MINES ACT 1952 COMPLIANCE SYSTEM', 14, y);

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(251, 191, 36); // amber-400
    doc.text('MINEVISION AI COMPLIANCE PLATFORM — VERIFIED STATUTORY DOSSIER', 14, y);

    // Right-aligned reference & date
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`REF: ${reportRef}`, pageWidth - 14, 12, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(203, 213, 225);
    doc.text(`Cycle: ${cycle}`, pageWidth - 14, 17, { align: 'right' });
    doc.text(`Issued: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - 14, 22, { align: 'right' });

    y = 34;

    // Report Main Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(title, 14, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600
    const subLines = doc.splitTextToSize(subtitle, pageWidth - 28);
    doc.text(subLines, 14, y);
    y += subLines.length * 4.2 + 2;

    // Subtle divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, y, pageWidth - 14, y);
    y += 4;

    return y;
  }

  private drawPageFooter(doc: jsPDF, pageNum: number, totalPages: number, reportId: string) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('CONFIDENTIAL & STATUTORY RECORD • Issued pursuant to Mines Act 1952 & Coal Mines Regulations 2017', 14, pageHeight - 8);
    doc.text(`Dossier ID: ${reportId} • Page ${pageNum} of ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  private checkPageBreak(doc: jsPDF, currentY: number, requiredHeight: number): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (currentY + requiredHeight > pageHeight - 18) {
      doc.addPage();
      return 20; // top margin for subsequent pages
    }
    return currentY;
  }

  // ==========================================
  // 1. REP-2026-Q3-00: RISK INTELLIGENCE DOSSIER
  // ==========================================

  private buildRiskIntelligenceDossier(doc: jsPDF, ctx: ReportGenerationContext) {
    let y = this.drawOfficialHeader(
      doc,
      'DGMS SAFETY RISK INTELLIGENCE EXECUTIVE DOSSIER & ACTION MATRIX',
      'Explainable multi-factor scoring breakdown, statutory risk drivers, overdue action aging, and prioritized intervention directives.',
      ctx.report.id,
      ctx.report.period
    );

    const primaryMine = ctx.mines[0] || {
      id: 'DEMO-MINE-001',
      name: 'Neyveli Lignite Mine-1',
      mineCode: 'NL-01',
      location: 'Cuddalore, Tamil Nadu',
      mineType: 'Open Cast' as const,
      status: 'Operational' as const,
      complianceScore: 78,
    };

    const overallScore = ctx.riskProfile ? ctx.riskProfile.overallScore : 31;
    const riskBand = ctx.riskProfile ? ctx.riskProfile.riskLevel : 'LOW';
    const trajectory = ctx.riskProfile ? ctx.riskProfile.trend : 'IMPROVING';

    const factorRows = ctx.riskProfile?.factors && ctx.riskProfile.factors.length > 0
      ? ctx.riskProfile.factors.map(f => ({
          name: f.label,
          weight: `${f.percentageOfTotal}%`,
          score: `${f.contributionPoints}/${f.maxPossiblePoints} pts`,
          note: f.description,
        }))
      : [
          { name: 'Statutory Severity Impact', weight: '30%', score: '12/30 pts', note: 'Severity weighting of open findings' },
          { name: 'Recurrent Pattern Frequency', weight: '25%', score: '8/25 pts', note: 'Repeat violations across audit cycles' },
          { name: 'Finding Aging & Overdue Penalty', weight: '20%', score: '5/20 pts', note: 'Lapsed statutory rectification deadlines' },
          { name: 'Active Regulatory Alerts', weight: '15%', score: '4/15 pts', note: 'Critical & Warning live supervisory alerts' },
          { name: 'Mine Exposure Factor', weight: '10%', score: '2/10 pts', note: 'Manpower density & gas seam classification' },
        ];

    const driversList = ctx.riskProfile?.drivers && ctx.riskProfile.drivers.length > 0
      ? ctx.riskProfile.drivers.slice(0, 3)
      : [
          {
            rank: 1,
            title: 'Auxiliary Ventilation Ducting Setback at 3rd Dip Coal Face',
            severity: 'HIGH',
            category: 'VENTILATION',
            sourceReference: 'CMR 2017 Reg. 153',
            description: 'Intake ducting terminates 12.4m back from face, exceeding the statutory 4.5m limit.',
            recommendedIntervention: 'Advance auxiliary duct line to within 4.5m of face before resumption of extraction.',
          },
          {
            rank: 2,
            title: 'Haul Road Left-Hand Safety Berm Deficit at Pithead Ramp',
            severity: 'MEDIUM',
            category: 'HAULAGE',
            sourceReference: 'DGMS Tech Circular No. 09',
            description: 'Earthen safety berm height measured at 0.9m, below statutory axle diameter height requirement.',
            recommendedIntervention: 'Reconstruct continuous compacted berm to minimum 1.6m elevation along the haul ramp.',
          },
        ];

    const priorityList = ctx.riskProfile?.priorityAttention && ctx.riskProfile.priorityAttention.length > 0
      ? ctx.riskProfile.priorityAttention.slice(0, 3).map(p => ({
          title: p.title,
          urgencyLevel: p.urgency,
          prescribedAction: p.recommendedAction,
          assignedRole: 'Safety Officer / Colliery Engineer',
          suggestedDeadline: 'Prior to next shift / audit cycle',
        }))
      : [
          {
            urgencyLevel: 'HIGH',
            title: 'Advance 3rd Dip Auxiliary Ventilation Ducting',
            prescribedAction: 'Immediately install additional 3m flame-retardant duct section and verify velocity > 0.50 m/s.',
            assignedRole: 'Ventilation Officer / Shift In-Charge',
            suggestedDeadline: 'Prior to next shift commencement (06:00 hrs)',
          },
          {
            urgencyLevel: 'MEDIUM',
            title: 'Rectify Pithead Berm Profile and Dumper Clearance',
            prescribedAction: 'Deploy front-end loader and dozer to raise and compact earthen berm.',
            assignedRole: 'Safety Officer / Colliery Engineer',
            suggestedDeadline: 'Within 48 hours',
          },
        ];

    const narrativeText = ctx.riskProfile?.aiNarrative?.summaryText ||
      'Neyveli Lignite Mine-1 exhibits an overall safe statutory profile with a composite risk index of 31/100 (LOW RISK). Recent inspections verify compliant gas monitoring and biometric PPE checkpoints. However, priority statutory attention is required at 3rd Dip face auxiliary ventilation setback to maintain compliance with CMR 2017 Reg. 153.';

    // Colliery & Profile Overview Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, 182, 30, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Colliery Target: ${primaryMine.name} (${primaryMine.mineCode || primaryMine.id})`, 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Location: ${primaryMine.location || 'Central Mining Zone'} • Mine Type: ${primaryMine.mineType || 'Open Cast'}`, 18, y + 11);
    doc.text(`Operating Status: ${primaryMine.status || 'Active'} • Auditor In-Charge: DGMS Inspectorate Zone 4`, 18, y + 16);

    // Score Callout Box (Right inside Card)
    const scoreColor = overallScore > 65 ? [239, 68, 68] : overallScore > 35 ? [245, 158, 11] : [16, 185, 129];
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.roundedRect(138, y + 4, 52, 22, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('COMPOSITE RISK INDEX', 164, y + 9, { align: 'center' });

    doc.setFontSize(14);
    doc.text(`${overallScore} / 100`, 164, y + 17, { align: 'center' });

    doc.setFontSize(6.5);
    doc.text(`BAND: ${riskBand} • TRAJECTORY: ${trajectory}`, 164, y + 22, { align: 'center' });

    y += 34;

    // Multi-factor Scoring Breakdown Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Statutory Multi-Factor Scoring Decomposition', 14, y);
    y += 4;

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Risk Dimension', 17, y + 4);
    doc.text('Weight', 80, y + 4);
    doc.text('Calculated Score', 110, y + 4);
    doc.text('Evaluation Basis', 145, y + 4);
    y += 6;

    factorRows.forEach((f, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(14, y, 182, 5.5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(f.name, 17, y + 3.8);
      doc.text(f.weight, 80, y + 3.8);
      doc.text(f.score, 110, y + 3.8);
      doc.text(f.note, 145, y + 3.8);
      y += 5.5;
    });

    y += 4;

    // Executive Narrative Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Executive Safety Briefing & Diagnostic Synthesis', 14, y);
    y += 4;

    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.roundedRect(14, y, 182, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 53, 15);
    const narrativeLines = doc.splitTextToSize(narrativeText, 174);
    doc.text(narrativeLines, 18, y + 5);
    y += 22;

    // Primary Risk Drivers Section
    y = this.checkPageBreak(doc, y, 45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Primary Statutory Risk Drivers (Ranked by Risk Weight)', 14, y);
    y += 4;

    driversList.forEach((d) => {
      y = this.checkPageBreak(doc, y, 18);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, y, 182, 16, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(180, 83, 9);
      doc.text(`[Rank ${d.rank}] ${d.title}`, 18, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Reference: ${d.sourceReference || 'CMR 2017'} • Severity: ${d.severity}`, 18, y + 8.5);
      doc.text(`Prescribed Action: ${('recommendedIntervention' in d && d.recommendedIntervention) || d.description}`, 18, y + 12.5);

      y += 18;
    });

    // Priority Intervention Checklist
    y = this.checkPageBreak(doc, y, 45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('4. Priority Intervention Directives (Immediate Statutory Actions)', 14, y);
    y += 4;

    priorityList.forEach((p, idx) => {
      y = this.checkPageBreak(doc, y, 20);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, y, 182, 17, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${p.title} [Urgency: ${p.urgencyLevel}]`, 18, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Action: ${p.prescribedAction}`, 18, y + 8.5);
      doc.text(`Assigned Responsibility: ${p.assignedRole} • Compliance Deadline: ${p.suggestedDeadline}`, 18, y + 12.5);

      y += 19;
    });

    // Official Sign-off block
    y = this.checkPageBreak(doc, y, 30);
    this.drawSignOffBlock(doc, y, 'Statutory Safety Officer', 'Colliery General Manager / Agent');
  }

  // ==========================================
  // 2. REP-2026-Q3-01: DGMS FORM IV STATUTORY RETURN
  // ==========================================

  private buildFormIvStatutoryReturn(doc: jsPDF, ctx: ReportGenerationContext) {
    let y = this.drawOfficialHeader(
      doc,
      'DGMS STATUTORY FORM IV — QUARTERLY SAFETY & ACCIDENT RETURN',
      'Mandatory quarterly filing under Sections 23 & 83 of the Mines Act 1952 and Coal Mines Regulations 2017.',
      ctx.report.id,
      ctx.report.period
    );

    const primaryMine = ctx.mines[0] || {
      id: 'DEMO-MINE-001',
      name: 'Neyveli Lignite Mine-1',
      mineCode: 'NL-01',
      location: 'Cuddalore, Tamil Nadu',
      mineType: 'Open Cast' as const,
      status: 'Operational' as const,
      complianceScore: 78,
    };

    // Colliery Identification Block
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, 182, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('I. COLLIERY IDENTIFICATION & PARTICULARS', 18, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Name of Mine: ${primaryMine.name}`, 18, y + 10);
    doc.text(`Registration / DGMS Code: ${primaryMine.mineCode || (primaryMine as any).code || 'NL-01/TN/DGMS'}`, 18, y + 14);
    doc.text(`Owner / Operating Agent: Neyveli Lignite Mining Corporation Ltd.`, 18, y + 18);

    doc.text(`Location: ${primaryMine.location || 'Tamil Nadu'}`, 110, y + 10);
    doc.text(`Classification: Degree-I Gassy Seam Opencast & Belowground`, 110, y + 14);
    doc.text(`Quarter Ending: 30th September 2026 (Q3 FY26)`, 110, y + 18);

    y += 26;

    // Employment & Man-shifts Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('II. EMPLOYMENT & MAN-SHIFTS WORKED DURING QUARTER', 14, y);
    y += 4;

    const shiftData = [
      { cat: 'Belowground (Face & Transport)', shifts: '48,650', avgDaily: '540', hours: '389,200', accidents: '0' },
      { cat: 'Opencast Working & Pithead', shifts: '36,400', avgDaily: '404', hours: '291,200', accidents: '0' },
      { cat: 'Aboveground & Surface Workshops', shifts: '18,200', avgDaily: '202', hours: '145,600', accidents: '0' },
      { cat: 'TOTAL CONSOLIDATED', shifts: '103,250', avgDaily: '1,146', hours: '826,000', accidents: '0' },
    ];

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text('Category of Employment', 17, y + 4);
    doc.text('Total Man-Shifts', 75, y + 4);
    doc.text('Avg Daily Attendance', 110, y + 4);
    doc.text('Total Hours Worked', 145, y + 4);
    doc.text('Lost-Time Incidents', 175, y + 4, { align: 'right' });
    y += 6;

    shiftData.forEach((row, i) => {
      const isTotal = i === shiftData.length - 1;
      doc.setFillColor(isTotal ? 226 : i % 2 === 0 ? 255 : 248, isTotal ? 232 : 250, isTotal ? 240 : 252);
      doc.rect(14, y, 182, 5.5, 'F');
      doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(row.cat, 17, y + 3.8);
      doc.text(row.shifts, 75, y + 3.8);
      doc.text(row.avgDaily, 110, y + 3.8);
      doc.text(row.hours, 145, y + 3.8);
      doc.text(row.accidents, 175, y + 3.8, { align: 'right' });
      y += 5.5;
    });

    y += 6;

    // Accident & Statutory Injury Return
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('III. STATUTORY ACCIDENT & INJURY STATISTICS (Mines Act Sec 23)', 14, y);
    y += 4;

    const accidentStats = [
      { param: 'Fatal Accidents (Number of occurrences)', statutoryCount: '0 (Nil)', frequencyRate: '0.00 per 1,000 workers' },
      { param: 'Serious Bodily Injury (Loss of limb/sight)', statutoryCount: '0 (Nil)', frequencyRate: '0.00 per 1,000 workers' },
      { param: 'Reportable Injuries (>72 hours absence)', statutoryCount: '1 (Contusion at coal washery conveyor)', frequencyRate: '0.97 per 1,000 workers' },
      { param: 'Dangerous Occurrences (CMR Reg 8)', statutoryCount: '0 (Nil premature collapses or inundation)', frequencyRate: 'Compliant' },
    ];

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text('Statutory Classification', 17, y + 4);
    doc.text('Occurrences Reported', 100, y + 4);
    doc.text('Calculated Rate / Compliance Note', 145, y + 4);
    y += 6;

    accidentStats.forEach((r, i) => {
      doc.setFillColor(i % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(14, y, 182, 5.5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(r.param, 17, y + 3.8);
      doc.text(r.statutoryCount, 100, y + 3.8);
      doc.text(r.frequencyRate, 145, y + 3.8);
      y += 5.5;
    });

    y += 6;

    // Strata Stability & Statutory Verification Tests
    y = this.checkPageBreak(doc, y, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('IV. STRATA CONTROL & UNDERGROUND TEST CERTIFICATION', 14, y);
    y += 4;

    const strataTests = [
      { test: 'Roof Bolt Pull Tests (CMR Reg 123)', sampled: '80 bolts', passed: '78 passed (97.5%)', remarks: '2 defective resin anchors replaced immediately' },
      { test: 'Convergence Indicator Monitoring', sampled: '12 dual stations', passed: 'Max 1.8mm rate', remarks: 'Well below 3.0mm/day trigger threshold' },
      { test: 'Side Spalling & Pillaring Inspection', sampled: '16 junctions', passed: 'Stable', remarks: 'Wire mesh reinforcement installed at Junction 4' },
    ];

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text('Statutory Test Description', 17, y + 4);
    doc.text('Sampling Extent', 80, y + 4);
    doc.text('Result Recorded', 120, y + 4);
    doc.text('Field Remarks', 150, y + 4);
    y += 6;

    strataTests.forEach((st, i) => {
      doc.setFillColor(i % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(14, y, 182, 5.5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(st.test, 17, y + 3.8);
      doc.text(st.sampled, 80, y + 3.8);
      doc.text(st.passed, 120, y + 3.8);
      doc.text(st.remarks, 150, y + 3.8);
      y += 5.5;
    });

    y += 8;

    // Managerial Certification Declaration
    y = this.checkPageBreak(doc, y, 32);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('V. STATUTORY DECLARATION UNDER MINES ACT 1952', 14, y);
    y += 4;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      'I hereby certify that the particulars furnished above in this Form IV return for the quarter ending 30-Sep-2026 are true, correct, and based on the daily statutory logs maintained in accordance with the Coal Mines Regulations 2017.',
      14,
      y,
      { maxWidth: 182 }
    );
    y += 10;

    this.drawSignOffBlock(doc, y, 'Mine Safety Officer (Cert No. 4812)', 'Colliery Manager / Agent (First Class Cert)');
  }

  // ==========================================
  // 3. REP-2026-Q3-02: VENTILATION AUDIT REPORT
  // ==========================================

  private buildVentilationAuditReport(doc: jsPDF, ctx: ReportGenerationContext) {
    let y = this.drawOfficialHeader(
      doc,
      'VENTILATION & AIR QUANTITY COMPLIANCE AUDIT (CMR 2017 REG. 153)',
      'Statutory underground airflow measurements, inflammable gas (CH4) concentrations, and auxiliary fan displacement inspection.',
      ctx.report.id,
      ctx.report.period
    );

    // Audit Parameters Overview
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, 182, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('AUDIT SPECIFICATIONS & INSTRUMENT CALIBRATION', 18, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('Survey Standard: Coal Mines Regulations 2017, Regulations 153 & 154', 18, y + 10);
    doc.text('Anemometer Calibrated: 15-Aug-2026 • Accuracy: ±0.02 m/s', 18, y + 14);
    doc.text('Multi-Gas Detector: Industrial Scientific MX6 iBrid (Optical Sensor)', 18, y + 18);

    doc.text('Survey Date: August 2026 Statutory Cycle', 120, y + 10);
    doc.text('Mine Target: Neyveli Lignite Mine-1 & Allied Districts', 120, y + 14);
    doc.text('Ventilation Officer: Shri R. K. Mukherjee', 120, y + 18);

    y += 26;

    // Measurement Points Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('I. AIRWAY VELOCITY & DISPLACEMENT LOG (STATION-BY-STATION)', 14, y);
    y += 4;

    const ventStations = [
      { station: 'Main Shaft Intake Portal #1', area: '14.2 m²', velocity: '2.85 m/s', volume: '2,428 m³/min', statutoryReq: '> 2,000 m³/min', status: 'COMPLIANT' },
      { station: 'Shaft Bottom Main Split East', area: '9.8 m²', velocity: '1.92 m/s', volume: '1,129 m³/min', statutoryReq: '> 900 m³/min', status: 'COMPLIANT' },
      { station: '3rd Dip Active Extraction Face', area: '7.5 m²', velocity: '0.28 m/s', volume: '126 m³/min', statutoryReq: '> 0.50 m/s', status: 'NON-COMPLIANT' },
      { station: 'North Return Airway Heading', area: '11.0 m²', velocity: '2.40 m/s', volume: '1,584 m³/min', statutoryReq: '> 1,200 m³/min', status: 'COMPLIANT' },
      { station: 'District 4 Auxiliary Fan Outlet', area: '1.2 m²', velocity: '4.80 m/s', volume: '345 m³/min', statutoryReq: '> 300 m³/min', status: 'COMPLIANT' },
    ];

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    doc.text('Measurement Station', 17, y + 4);
    doc.text('Cross Section', 70, y + 4);
    doc.text('Velocity', 95, y + 4);
    doc.text('Volume Q', 120, y + 4);
    doc.text('Statutory Min', 145, y + 4);
    doc.text('Verdict', 175, y + 4, { align: 'right' });
    y += 6;

    ventStations.forEach((vs, i) => {
      const isFail = vs.status === 'NON-COMPLIANT';
      doc.setFillColor(isFail ? 254 : i % 2 === 0 ? 255 : 248, isFail ? 242 : 250, isFail ? 242 : 252);
      doc.rect(14, y, 182, 5.5, 'F');
      doc.setFont('helvetica', isFail ? 'bold' : 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(isFail ? 220 : 51, isFail ? 38 : 65, isFail ? 38 : 85);
      doc.text(vs.station, 17, y + 3.8);
      doc.text(vs.area, 70, y + 3.8);
      doc.text(vs.velocity, 95, y + 3.8);
      doc.text(vs.volume, 120, y + 3.8);
      doc.text(vs.statutoryReq, 145, y + 3.8);
      doc.text(vs.status, 175, y + 3.8, { align: 'right' });
      y += 5.5;
    });

    y += 6;

    // Environmental Gas Telemetry Log
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('II. TOXIC & INFLAMMABLE GAS TELEMETRY AUDIT', 14, y);
    y += 4;

    const gasLogs = [
      { gas: 'Methane (CH4) — General Body of Air', maxRecorded: '0.12%', statutoryLimit: '< 0.75%', thresholdBand: 'Normal Safe' },
      { gas: 'Methane (CH4) — 3rd Dip Return Lip', maxRecorded: '0.44%', statutoryLimit: '< 1.25%', thresholdBand: 'Elevated (Monitored)' },
      { gas: 'Carbon Monoxide (CO)', maxRecorded: '4 ppm', statutoryLimit: '< 25 ppm', thresholdBand: 'No Spontaneous Combustion' },
      { gas: 'Oxygen (O2) Concentration', maxRecorded: '20.6%', statutoryLimit: '> 19.0%', thresholdBand: 'Adequate Respiration' },
      { gas: 'Airborne Respirable Dust (mg/m³)', maxRecorded: '1.82 mg/m³', statutoryLimit: '< 3.0 mg/m³', thresholdBand: 'Suppression Sprinklers On' },
    ];

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text('Atmospheric Parameter', 17, y + 4);
    doc.text('Maximum Measured', 85, y + 4);
    doc.text('DGMS Permissible Limit', 125, y + 4);
    doc.text('Safety Assessment', 160, y + 4);
    y += 6;

    gasLogs.forEach((gl, i) => {
      doc.setFillColor(i % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(14, y, 182, 5.5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(gl.gas, 17, y + 3.8);
      doc.text(gl.maxRecorded, 85, y + 3.8);
      doc.text(gl.statutoryLimit, 125, y + 3.8);
      doc.text(gl.thresholdBand, 160, y + 3.8);
      y += 5.5;
    });

    y += 8;

    // Statutory Finding & Directives
    y = this.checkPageBreak(doc, y, 36);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('III. AUDITOR FINDINGS & ENFORCEMENT NOTICES', 14, y);
    y += 4;

    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(14, y, 182, 20, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(153, 27, 27);
    doc.text('DEFICIENCY: Auxiliary Ventilation Setback at 3rd Dip Active Seam', 18, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(85, 26, 26);
    doc.text(
      'Air velocity at the face (0.28 m/s) fails statutory minimum 0.50 m/s under CMR 2017 Reg. 153. Auxiliary duct setback measured at 12.4m against statutory 4.5m limit. Notice issued under Mines Act 1952 Sec 22: Rectify ducting within 1 shift before extraction resumes.',
      18,
      y + 9,
      { maxWidth: 174 }
    );

    y += 26;
    this.drawSignOffBlock(doc, y, 'Ventilation Officer', 'Colliery Safety Officer / DGMS Auditor');
  }

  // ==========================================
  // 4. REP-2026-Q3-03: CPCB ENVIRONMENTAL REPORT
  // ==========================================

  private buildCpcbEnvironmentalReport(doc: jsPDF, ctx: ReportGenerationContext) {
    let y = this.drawOfficialHeader(
      doc,
      'CENTRAL POLLUTION CONTROL BOARD (CPCB) ENVIRONMENTAL DISCHARGE LOG',
      'Ambient particulate emissions (PM10/PM2.5), mine effluent pH discharge monitoring, and environmental statutory compliance.',
      ctx.report.id,
      ctx.report.period
    );

    // Monitoring Standards Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, 182, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('REGULATORY MANDATE: EPA 1986 & CPCB MINE DISCHARGE NORMS', 18, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('Consent to Operate (CTO) No: CPCB/MINE/TN/2025/4910 • Valid through: 31-Dec-2027', 18, y + 10);
    doc.text('Continuous Ambient Air Quality Monitoring Station (CAAQMS): Station #1 Pithead, Station #2 Buffer', 18, y + 14);

    y += 24;

    // Ambient Air Quality Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('I. AMBIENT AIR QUALITY (AAQ) MONITORING RECORD', 14, y);
    y += 4;

    const aaqData = [
      { loc: 'Pithead Operations Core (CAAQMS-1)', pm10: '78 µg/m³', pm25: '38 µg/m³', so2: '14 µg/m³', nox: '21 µg/m³', status: 'Compliant' },
      { loc: 'Buffer Zone Perimeter South (CAAQMS-2)', pm10: '62 µg/m³', pm25: '29 µg/m³', so2: '11 µg/m³', nox: '18 µg/m³', status: 'Compliant' },
      { loc: 'Coal Handling Plant / Silo (Station-3)', pm10: '88 µg/m³', pm25: '42 µg/m³', so2: '16 µg/m³', nox: '24 µg/m³', status: 'Compliant (Near Limit)' },
      { loc: 'Statutory 24-Hr Standard Limit', pm10: '100 µg/m³', pm25: '60 µg/m³', so2: '80 µg/m³', nox: '80 µg/m³', status: 'NAAQS Standard' },
    ];

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text('Monitoring Location', 17, y + 4);
    doc.text('PM10 (24h)', 80, y + 4);
    doc.text('PM2.5 (24h)', 108, y + 4);
    doc.text('SO2', 135, y + 4);
    doc.text('NOx', 152, y + 4);
    doc.text('CPCB Status', 175, y + 4, { align: 'right' });
    y += 6;

    aaqData.forEach((row, idx) => {
      const isStd = idx === aaqData.length - 1;
      doc.setFillColor(isStd ? 226 : idx % 2 === 0 ? 255 : 248, isStd ? 232 : 250, isStd ? 240 : 252);
      doc.rect(14, y, 182, 5.5, 'F');
      doc.setFont('helvetica', isStd ? 'bold' : 'normal');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(row.loc, 17, y + 3.8);
      doc.text(row.pm10, 80, y + 3.8);
      doc.text(row.pm25, 108, y + 3.8);
      doc.text(row.so2, 135, y + 3.8);
      doc.text(row.nox, 152, y + 3.8);
      doc.text(row.status, 175, y + 3.8, { align: 'right' });
      y += 5.5;
    });

    y += 6;

    // Treated Mine Water Effluent Discharge Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('II. TREATED MINE WATER DISCHARGE & EFFLUENT QUALITY', 14, y);
    y += 4;

    const effluentData = [
      { param: 'pH Level (Acidity / Alkalinity)', value: '7.34', standard: '6.5 – 8.5', assessment: 'Neutral & Compliant' },
      { param: 'Total Suspended Solids (TSS)', value: '48 mg/L', standard: '< 100 mg/L', assessment: 'Sedimentation Settling Active' },
      { param: 'Chemical Oxygen Demand (COD)', value: '82 mg/L', standard: '< 250 mg/L', assessment: 'Within Prescribed Limits' },
      { param: 'Oil & Grease Concentration', value: '1.2 mg/L', standard: '< 10 mg/L', assessment: 'Oil Trap Functional' },
      { param: 'Heavy Metals: Total Iron (Fe)', value: '0.8 mg/L', standard: '< 3.0 mg/L', assessment: 'Aeration Lagoon Passed' },
    ];

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text('Water Quality Parameter', 17, y + 4);
    doc.text('Discharge Value', 90, y + 4);
    doc.text('CPCB Standard', 130, y + 4);
    doc.text('Compliance Verdict', 160, y + 4);
    y += 6;

    effluentData.forEach((ed, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(14, y, 182, 5.5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(ed.param, 17, y + 3.8);
      doc.text(ed.value, 90, y + 3.8);
      doc.text(ed.standard, 130, y + 3.8);
      doc.text(ed.assessment, 160, y + 3.8);
      y += 5.5;
    });

    y += 8;

    // Environmental Remarks
    y = this.checkPageBreak(doc, y, 32);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('III. DISCHARGE DISPOSITION & WATER RECYCLING STATEMENT', 14, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(
      '78% of treated pithead water was recycled into haul road dust suppression sprinklers and washery slurry circuits. Excess 22% discharged into receiving irrigation channel under continuous pH telemetry supervision.',
      14,
      y,
      { maxWidth: 182 }
    );

    y += 14;
    this.drawSignOffBlock(doc, y, 'Environmental Engineer', 'Colliery General Manager');
  }

  // ==========================================
  // 5. REP-2026-Q3-04: HEMM MECHANICAL REPORT
  // ==========================================

  private buildHemmMechanicalReport(doc: jsPDF, ctx: ReportGenerationContext) {
    let y = this.drawOfficialHeader(
      doc,
      'HEMM HEAVY EARTH MOVING MACHINERY BRAKE & INTERLOCK INSPECTION',
      'Mechanical wing safety verification for dumpers, draglines, excavators, and haul road gradient interlocks.',
      ctx.report.id,
      ctx.report.period
    );

    // Directive Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, 182, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('STATUTORY DIRECTIVE: DGMS (TECH) CIRCULAR NO. 06 / CMR 2017 REG 171', 18, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('Scope: Dynamic brake deceleration testing, automatic fire detection & suppression (AFDS), and reversing cameras.', 18, y + 10);
    doc.text('Audited Fleet: 42 Heavy Units (Dumpers: 28, Excavators: 6, Dozers: 4, Wheel Loaders: 4)', 18, y + 14);

    y += 24;

    // Equipment Audit Breakdown Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('I. FLEET MECHANICAL SAFETY & INTERLOCK AUDIT SAMPLE', 14, y);
    y += 4;

    const fleetData = [
      { unit: 'BEML 60T Dumper #D-104', brakes: 'Stopping dist 12.8m (1 in 16 ramp)', interlocks: 'AFDS Certified, AV Alarm OK', status: 'FIT FOR OPERATION' },
      { unit: 'BEML 60T Dumper #D-109', brakes: 'Stopping dist 13.2m (1 in 16 ramp)', interlocks: 'Blind-spot camera clean', status: 'FIT FOR OPERATION' },
      { unit: 'Caterpillar 85T Dumper #D-202', brakes: 'Secondary brake retarder delay (1.8s)', interlocks: 'Hydraulic accumulator checked', status: 'CONDITIONAL (48H)' },
      { unit: 'Komatsu PC1250 Excavator #EX-02', brakes: 'Swing brake lock operational', interlocks: 'Cabin ROPS/FOPS structure intact', status: 'FIT FOR OPERATION' },
      { unit: 'BEML D355 Bulldozer #BD-07', brakes: 'Track steering clutch adjusted', interlocks: 'Blade isolation interlock verified', status: 'FIT FOR OPERATION' },
    ];

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text('Machinery Equipment ID', 17, y + 4);
    doc.text('Braking Deceleration Test', 75, y + 4);
    doc.text('Safety Interlocks & Devices', 125, y + 4);
    doc.text('Fitness Status', 175, y + 4, { align: 'right' });
    y += 6;

    fleetData.forEach((fd, idx) => {
      const isConditional = fd.status.includes('CONDITIONAL');
      doc.setFillColor(isConditional ? 254 : idx % 2 === 0 ? 255 : 248, isConditional ? 243 : 250, isConditional ? 199 : 252);
      doc.rect(14, y, 182, 5.5, 'F');
      doc.setFont('helvetica', isConditional ? 'bold' : 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(isConditional ? 180 : 51, isConditional ? 83 : 65, isConditional ? 9 : 85);
      doc.text(fd.unit, 17, y + 3.8);
      doc.text(fd.brakes, 75, y + 3.8);
      doc.text(fd.interlocks, 125, y + 3.8);
      doc.text(fd.status, 175, y + 3.8, { align: 'right' });
      y += 5.5;
    });

    y += 6;

    // Haul Road Safety Infrastructure
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('II. HAUL ROAD GRADIENT & BERM INFRASTRUCTURE INSPECTION', 14, y);
    y += 4;

    const haulRoadStats = [
      { param: 'Maximum Ramp Gradient', measured: '1 in 16.4', statutoryLimit: 'Not steeper than 1 in 16', status: 'Compliant' },
      { param: 'Haul Road Width (Double Lane)', measured: '22.5 metres', statutoryLimit: 'Min 3x width of widest HEMM (21.6m)', status: 'Compliant' },
      { param: 'Earthen Parapet / Safety Berms', measured: '0.9m to 1.7m', statutoryLimit: 'Height not less than tire radius (1.4m)', status: 'DEFICIT AT PITHEAD' },
      { param: 'Night Illuminance at Junctions', measured: '22 Lux', statutoryLimit: 'Minimum 15 Lux (CMR Reg 178)', status: 'Compliant' },
    ];

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text('Haul Road Feature', 17, y + 4);
    doc.text('Measured Field Value', 80, y + 4);
    doc.text('DGMS Statutory Requirement', 125, y + 4);
    doc.text('Assessment', 175, y + 4, { align: 'right' });
    y += 6;

    haulRoadStats.forEach((hr, idx) => {
      const isDeficit = hr.status.includes('DEFICIT');
      doc.setFillColor(isDeficit ? 254 : idx % 2 === 0 ? 255 : 248, isDeficit ? 242 : 250, isDeficit ? 242 : 252);
      doc.rect(14, y, 182, 5.5, 'F');
      doc.setFont('helvetica', isDeficit ? 'bold' : 'normal');
      doc.setFontSize(7);
      doc.setTextColor(isDeficit ? 220 : 51, isDeficit ? 38 : 65, isDeficit ? 38 : 85);
      doc.text(hr.param, 17, y + 3.8);
      doc.text(hr.measured, 80, y + 3.8);
      doc.text(hr.statutoryLimit, 125, y + 3.8);
      doc.text(hr.status, 175, y + 3.8, { align: 'right' });
      y += 5.5;
    });

    y += 8;

    // Field Rectification Order
    y = this.checkPageBreak(doc, y, 32);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('III. MANDATORY RECTIFICATION ORDER', 14, y);
    y += 4;

    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(14, y, 182, 16, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(146, 64, 14);
    doc.text(
      'ORDER: 1. Caterpillar Dumper #D-202 secondary brake delay must be bled and calibrated before return to coal hauling. 2. Haul ramp safety berm between Chainage 200m and 350m must be built up to 1.6m height within 48 hours.',
      18,
      y + 5,
      { maxWidth: 174 }
    );

    y += 20;
    this.drawSignOffBlock(doc, y, 'Mechanical Safety Engineer', 'Colliery Engineer / DGMS Inspector');
  }

  // ==========================================
  // 6. GENERIC STATUTORY DOSSIER FALLBACK
  // ==========================================

  private buildGenericStatutoryReport(doc: jsPDF, ctx: ReportGenerationContext) {
    let y = this.drawOfficialHeader(
      doc,
      ctx.report.title.toUpperCase(),
      ctx.report.description,
      ctx.report.id,
      ctx.report.period
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('I. STATUTORY DOSSIER METADATA', 14, y);
    y += 4;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, y, 182, 30, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Dossier Reference ID: ${ctx.report.id}`, 18, y + 6);
    doc.text(`Title: ${ctx.report.title}`, 18, y + 11);
    doc.text(`Statutory Period / Cycle: ${ctx.report.period}`, 18, y + 16);
    doc.text(`Dossier Status: ${ctx.report.status}`, 18, y + 21);
    doc.text(`Generated Date: ${ctx.report.generatedDate}`, 18, y + 26);

    y += 36;
    this.drawSignOffBlock(doc, y, 'Authorized Safety Officer', 'DGMS Statutory Inspector');
  }

  // ==========================================
  // SIGN-OFF SIGNATURE BLOCK
  // ==========================================

  private drawSignOffBlock(doc: jsPDF, y: number, leftTitle: string, rightTitle: string) {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);

    // Left Signature line
    doc.line(18, y + 12, 85, y + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(leftTitle, 18, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Digitally Verified via MineVision AI Security Core', 18, y + 20);

    // Right Signature line
    doc.line(pageWidth - 85, y + 12, pageWidth - 18, y + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(rightTitle, pageWidth - 85, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Directorate General of Mines Safety (DGMS)', pageWidth - 85, y + 20);
  }
}

export const reportPdfService = new ReportPdfService();

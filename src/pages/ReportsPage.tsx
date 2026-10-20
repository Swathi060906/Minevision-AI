import React, { useState } from 'react';
import { FileText, Download, CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { useAuth } from '../auth/AuthContext';
import { dataService } from '../services/dataService';
import { riskIntelligenceService } from '../services/risk/riskIntelligenceService';
import { reportPdfService, ReportMetadata } from '../services/reports/reportPdfService';

export const ReportsPage: React.FC = () => {
  const { user, logAuditEvent } = useAuth();
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reports: ReportMetadata[] = [
    {
      id: 'REP-2026-Q3-00',
      title: 'DGMS Safety Risk Intelligence Executive Dossier & Action Matrix',
      description: 'Explainable multi-factor scoring breakdown (severity, recurrence, aging, alerts, exposure), recurrent violation tracking, and prioritized intervention directives.',
      period: 'Active Statutory Cycle',
      status: 'Live Intelligence',
      fileSize: 'Dynamic Analytics PDF',
      generatedDate: 'Active Real-Time',
    },
    {
      id: 'REP-2026-Q3-01',
      title: 'DGMS Statutory Form IV — Quarterly Safety & Accident Return',
      description: 'Mandatory quarterly filing under Mines Act 1952 covering man-shifts worked, fatal/serious accidents, and strata stability tests.',
      period: 'Q3 FY26 (Jul - Sep 2026)',
      status: 'Ready for Dispatch',
      fileSize: '2.4 MB PDF',
      generatedDate: '08 Sep 2026',
    },
    {
      id: 'REP-2026-Q3-02',
      title: 'Ventilation & Air Quantity Compliance Audit (CMR 2017 Reg 153)',
      description: 'Comprehensive velocity, methane (CH4) ppm logs, and auxiliary fan displacement tests across 24 collieries.',
      period: 'August 2026 Cycle',
      status: 'Audit Certified',
      fileSize: '4.8 MB PDF',
      generatedDate: '05 Sep 2026',
    },
    {
      id: 'REP-2026-Q3-03',
      title: 'Central Pollution Control Board (CPCB) Environmental Discharge Log',
      description: 'Ambient particulate matters (PM10/PM2.5) and treated mine water effluent pH balance records.',
      period: 'August 2026 Cycle',
      status: 'Under Review',
      fileSize: '1.9 MB PDF',
      generatedDate: '01 Sep 2026',
    },
    {
      id: 'REP-2026-Q3-04',
      title: 'HEMM Heavy Earth Moving Machinery Brake & Interlock Inspection',
      description: 'Mechanical wing safety verification for dumpers, draglines, and haul road gradients.',
      period: 'Bi-Monthly Q3 Audit',
      status: 'Ready for Dispatch',
      fileSize: '3.1 MB PDF',
      generatedDate: '28 Aug 2026',
    },
  ];

  const handleDownloadPdf = async (rep: ReportMetadata) => {
    if (generatingReportId) return; // Prevent concurrent or duplicate clicks

    setGeneratingReportId(rep.id);
    setErrorMessage(null);
    console.log('[PDF] download started:', rep.id);

    try {
      // 1. Fetch live contextual application data with safe timeout
      const dataFetchPromise = Promise.all([
        dataService.getMines(user ? { role: user.role, assignedMineIds: user.mineIds } : undefined),
        dataService.getInspections(user ? { role: user.role, mineIds: user.mineIds } : undefined),
        dataService.getFindings(),
        dataService.getAlerts(user ? { role: user.role, mineIds: user.mineIds } : undefined),
        dataService.getComplianceRecords(),
      ]);

      const [mines, inspections, findings, alerts, complianceRecords] = await Promise.race([
        dataFetchPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Data preparation timed out')), 8000)
        ),
      ]);

      console.log('[PDF] report data prepared');

      // 2. Fetch risk profile if available for the primary mine (deterministic mode for instant reliable statutory generation)
      let riskProfile = null;
      if (rep.id === 'REP-2026-Q3-00' && mines.length > 0 && user) {
        try {
          const primaryMineId = mines[0].id;
          riskProfile = await riskIntelligenceService.getMineRiskProfile({
            mineId: primaryMineId,
            timeWindow: '30d',
            userContext: {
              id: user.id,
              email: user.email,
              role: user.role,
              mineIds: user.mineIds,
            },
            includeAiNarrative: false, // Strict deterministic calculation to prevent external API stall during PDF generation
          });
        } catch (rpErr) {
          console.warn('[PDF] Risk profile fetch warning, fallback active:', rpErr);
        }
      }

      // 3. Generate authentic statutory PDF using jsPDF engine
      console.log('[PDF] PDF generation started');
      const { blob, filename } = await reportPdfService.generateReportPdf({
        report: rep,
        user: user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              organization: user.organization,
              assignedMineIds: user.mineIds,
            }
          : undefined,
        mines,
        inspections,
        findings,
        alerts,
        complianceRecords,
        riskProfile,
      });
      console.log('[PDF] PDF generation completed');

      // 4. Verify Blob and MIME type
      if (!blob || !(blob instanceof Blob)) {
        throw new Error('PDF generation produced an invalid file structure.');
      }
      if (blob.size === 0) {
        throw new Error('PDF generation produced an empty file.');
      }

      const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
      console.log('[PDF] blob created, size:', pdfBlob.size);

      // 5. Create object URL & temporary anchor for browser download
      const objectUrl = URL.createObjectURL(pdfBlob);
      const anchor = document.createElement('a');
      anchor.style.display = 'none';
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.rel = 'noopener noreferrer';
      anchor.setAttribute('data-report-id', rep.id);

      // 6. Trigger download
      document.body.appendChild(anchor);
      anchor.click();
      console.log('[PDF] download triggered');

      // 7. Cleanup DOM and revoke object URL
      document.body.removeChild(anchor);
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        console.log('[PDF] cleanup completed');
      }, 1000);

      // 8. Integrate into existing audit logging system
      logAuditEvent('REPORT_PDF_DOWNLOADED', {
        reportId: rep.id,
        reportTitle: rep.title,
        filename,
        generatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[PDF] generation failed', err);
      setErrorMessage('Unable to generate PDF. Please try again.');
    } finally {
      setGeneratingReportId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statutory Compliance Reports"
        subtitle="Download, verify, and dispatch Directorate General of Mines Safety (DGMS) regulatory audit dossiers."
        badge="Export Engine"
      />

      {errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {reports.map((rep) => {
          const isGenerating = generatingReportId === rep.id;
          const isAnyGenerating = generatingReportId !== null;

          return (
            <div
              key={rep.id}
              className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-400 font-semibold">{rep.id}</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-medium border border-slate-700">
                      {rep.period}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {rep.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-300 max-w-3xl leading-relaxed">
                    {rep.description}
                  </p>
                  <div className="mt-2.5 flex items-center gap-4 text-xs text-slate-400">
                    <span>Generated: {rep.generatedDate}</span>
                    <span>•</span>
                    <span>Format: {rep.fileSize}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {rep.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  id={`btn-download-${rep.id}`}
                  onClick={() => handleDownloadPdf(rep)}
                  disabled={isAnyGenerating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
        Note: In Reports + Analytics, automated regulatory cron jobs will compile and transmit encrypted Form IV returns directly to the DGMS national portal.
      </div>
    </div>
  );
};

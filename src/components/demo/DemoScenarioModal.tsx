import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  FileCheck2,
  Eye,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  ExternalLink,
  Users,
  Compass,
  FileText,
  Radio,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../auth/AuthContext';
import { DEV_USERS } from '../../auth/devAuthProvider';
import {
  FLAGSHIP_DEMO_MINE_ID,
  FLAGSHIP_DEMO_MINE_NAME,
} from '../../data/seed/demoScenarioSeed';

interface DemoScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  onResetComplete?: () => void;
}

export const DemoScenarioModal: React.FC<DemoScenarioModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onResetComplete,
}) => {
  const { user, login } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'WALKTHROUGH' | 'ROLES' | 'ARCHITECTURE'>('WALKTHROUGH');

  if (!isOpen) return null;

  const handleResetFlagship = async () => {
    try {
      setResetting(true);
      setResetSuccess(null);
      const res = await dataService.resetFlagshipDemo(
        user ? { id: user.id, email: user.email, role: user.role } : undefined
      );
      setResetSuccess(res.message);
      if (onResetComplete) {
        onResetComplete();
      }
      setTimeout(() => {
        setResetSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Failed to reset demo scenario:', err);
    } finally {
      setResetting(false);
    }
  };

  const handleQuickRoleSwitch = async (email: string) => {
    const devRecord = DEV_USERS[email];
    if (devRecord) {
      await login({ email, password: devRecord.allowedPasswords[0] });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Smart India Hackathon 2026 Demonstration Suite
                </h2>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/30">
                  PS: 26024
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AI-Driven Mining Safety, Vision Audits & DGMS Statutory Compliance Platform
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs & Reset Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-950/40 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('WALKTHROUGH')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'WALKTHROUGH'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>5 Guided Walkthroughs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ROLES')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'ROLES'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Role Scoping (RBAC)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ARCHITECTURE')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'ARCHITECTURE'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>DGMS Statutory Grounding</span>
            </button>
          </div>

          {/* Quick Demo Baseline Reset */}
          <button
            type="button"
            onClick={handleResetFlagship}
            disabled={resetting}
            className="flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/80 px-3 py-1.5 text-xs font-medium transition-all shadow-xs disabled:opacity-50"
            title="Restores Jharia Underground mine with 1 pending AI compliance finding ready to review"
          >
            <RotateCcw className={`h-3.5 w-3.5 text-amber-400 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting Baseline...' : 'Reset Pristine Demo State'}</span>
          </button>
        </div>

        {/* Success Banner */}
        {resetSuccess && (
          <div className="flex items-center gap-2.5 bg-emerald-950/80 border-b border-emerald-800/80 px-6 py-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{resetSuccess}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'WALKTHROUGH' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400 border border-amber-500/30 shrink-0">
                    <Radio className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Flagship Scenario: {FLAGSHIP_DEMO_MINE_NAME} ({FLAGSHIP_DEMO_MINE_ID})
                    </h3>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      Jharia is an underground gassy seam colliery with an elevated risk rating (68/100, High).
                      An automated statutory ventilation audit analysis has detected sub-standard airflow
                      (0.28 m/s vs 0.50 m/s CMR 2017 Reg. 153 requirement) and generated a verifiable proposed finding
                      awaiting human review.
                    </p>
                  </div>
                </div>
              </div>

              {/* 5 Step Guided Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Step 1 */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-400 mb-1">
                      <span>FLOW 1 — HUMAN-IN-THE-LOOP AI REVIEW</span>
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px]">Ready</span>
                    </div>
                    <h4 className="text-sm font-medium text-white mb-1">
                      AI Compliance Review Queue
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Inspect the pending finding: view exact regulatory citations (CMR 2017 Reg 153), evidence citations, and exercise Accept / Edit & Accept / Reject with audit trail.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('ai-analysis');
                      onClose();
                    }}
                    className="mt-3.5 flex items-center justify-between rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    <span>Open AI Compliance Queue</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Step 2 */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-blue-400 mb-1">
                      <span>FLOW 2 — MULTI-FACTOR RISK INTELLIGENCE</span>
                      <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px]">Live</span>
                    </div>
                    <h4 className="text-sm font-medium text-white mb-1">
                      Colliery Risk Profile & Radar Breakdown
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Explore dynamic risk scoring calculated across 5 weighted pillars: Ventilation, Strata Control, Machinery Safety, Historical Compliance, and Environmental Telemetry.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('risk-intelligence');
                      onClose();
                    }}
                    className="mt-3.5 flex items-center justify-between rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    <span>Open Risk Intelligence Dashboard</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Step 3 */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 mb-1">
                      <span>FLOW 3 — COMPUTER VISION SAFETY AUDIT</span>
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px]">Interactive</span>
                    </div>
                    <h4 className="text-sm font-medium text-white mb-1">
                      AI Vision Hazard Detection Lab
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Analyze camera feeds with real Gemini 2.5 Flash multimodal vision or execute realistic synthetic simulations for PPE compliance, Haul Road vehicle standoff, and conveyor pinch-points.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('vision-safety');
                      onClose();
                    }}
                    className="mt-3.5 flex items-center justify-between rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    <span>Open AI Vision Safety Hub</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Step 4 */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-purple-400 mb-1">
                      <span>FLOW 4 — PREDICTIVE SAFETY & EARLY WARNINGS</span>
                      <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px]">AI-Powered</span>
                    </div>
                    <h4 className="text-sm font-medium text-white mb-1">
                      Incident Forecasting & AI Narratives
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Forecast 30-day incident probabilities and trigger Gemini 2.5 Flash to synthesize executive safety narratives with actionable DGMS regulatory interventions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('predictive-safety');
                      onClose();
                    }}
                    className="mt-3.5 flex items-center justify-between rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    <span>Open Predictive Safety Portal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Flow 5 Full Width */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-rose-400">FLOW 5 — DGMS STATUTORY REPOSITORY</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                      RAG Verified Chunks
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-white">
                    Official Regulatory Knowledge Engine (CMR 2017 & MMR 1961)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Audit verified legal clauses, search circulars by regulation number, and inspect the RAG knowledge chunks used to ground every AI finding.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('knowledge');
                    onClose();
                  }}
                  className="shrink-0 flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 text-xs font-medium transition-colors"
                >
                  <FileText className="h-4 w-4 text-amber-400" />
                  <span>Browse Regulatory Knowledge</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ROLES' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="text-sm font-semibold text-white mb-1">
                  Role-Based Access Control (RBAC) Demonstration Matrix
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Switch personas to verify strict data segregation. Colliery Operators can only see their designated mines, while Compliance Officers and DGMS Administrators possess zonal or national oversight.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Admin Persona */}
                <div
                  className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                    user?.role === 'ADMIN'
                      ? 'border-purple-500/50 bg-purple-950/20'
                      : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/30">
                        ADMIN
                      </span>
                      {user?.role === 'ADMIN' && (
                        <span className="text-[11px] font-semibold text-purple-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white">System Administrator</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">admin@minevision.local</p>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>All 8 National Basins</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>Weight Tuning & System Config</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>Full Audit Log Access</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickRoleSwitch('admin@minevision.local')}
                    className="mt-4 w-full rounded-lg bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    Switch to Administrator
                  </button>
                </div>

                {/* Officer Persona */}
                <div
                  className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                    user?.role === 'OFFICER'
                      ? 'border-amber-500/50 bg-amber-950/20'
                      : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                        OFFICER
                      </span>
                      {user?.role === 'OFFICER' && (
                        <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white">Compliance Officer</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">officer@minevision.local</p>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>3 Assigned Regional Mines</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>Review & Accept AI Findings</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>Statutory Issue Orders</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickRoleSwitch('officer@minevision.local')}
                    className="mt-4 w-full rounded-lg bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    Switch to Safety Officer
                  </button>
                </div>

                {/* Operator Persona */}
                <div
                  className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                    user?.role === 'OPERATOR'
                      ? 'border-blue-500/50 bg-blue-950/20'
                      : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300 border border-blue-500/30">
                        OPERATOR
                      </span>
                      {user?.role === 'OPERATOR' && (
                        <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white">Mine Operator</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">operator@minevision.local</p>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>Single Pit (Neyveli DEMO-001)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>Upload Field Observations</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <X className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                        <span>Cannot modify statutory findings</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickRoleSwitch('operator@minevision.local')}
                    className="mt-4 w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    Switch to Mine Operator
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ARCHITECTURE' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h3 className="text-sm font-semibold text-white mb-2">
                  DGMS Statutory Grounding & Anti-Hallucination Pipeline
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Every compliance finding produced by MineVision AI is deterministically bound to verified clauses
                  from the Coal Mines Regulations (CMR) 2017 or Metalliferous Mines Regulations (MMR) 1961. The system
                  enforces a strict RAG retrieval policy: ungrounded claims are automatically filtered out.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-semibold text-amber-400 block mb-1">CMR 2017 Reg. 153</span>
                    <p className="text-slate-400 text-[11px]">
                      Mandates minimum face airflow velocity of 0.50 m/s and limits auxiliary duct discharge setback to 4.5 meters.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-semibold text-blue-400 block mb-1">CMR 2017 Reg. 104</span>
                    <p className="text-slate-400 text-[11px]">
                      Enforces Systematic Support Rules (SSR) with maximum 1.2m resin bolt spacing on vulnerable roof strata.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-semibold text-emerald-400 block mb-1">DGMS Circ. 02/2019</span>
                    <p className="text-slate-400 text-[11px]">
                      Haul road minimum safety width (3x largest dumper width + 2m passing clearance) and 2m berm heights.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  System Telemetry & Architecture Specifications
                </h4>
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <dt className="text-slate-400 text-[11px]">AI Model Architecture</dt>
                    <dd className="font-medium text-white mt-0.5">Gemini 2.5 Flash Multimodal</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-[11px]">Knowledge Engine</dt>
                    <dd className="font-medium text-white mt-0.5">RAG Vector Chunks + Semantic</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-[11px]">Persistence Model</dt>
                    <dd className="font-medium text-white mt-0.5">Encapsulated Storage Adapter</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-[11px]">Compliance Baseline</dt>
                    <dd className="font-medium text-white mt-0.5">DGMS CMR 2017 / MMR 1961</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>MineVision AI • Smart India Hackathon Enterprise Edition</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 font-medium transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

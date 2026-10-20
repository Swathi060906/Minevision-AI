import React, { useState } from 'react';
import { Pickaxe, Shield, AlertCircle, ArrowRight, Lock, Mail, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { DEV_USERS } from '../auth/devAuthProvider';
import { UserRole } from '../auth/authTypes';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('officer@minevision.local');
  const [password, setPassword] = useState('officer123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleDevRoleSelect = (roleKey: UserRole) => {
    setGeneralError(null);
    setEmailError(null);
    setPasswordError(null);

    if (roleKey === 'ADMIN') {
      setEmail('admin@minevision.local');
      setPassword('admin123');
    } else if (roleKey === 'OFFICER') {
      setEmail('officer@minevision.local');
      setPassword('officer123');
    } else if (roleKey === 'OPERATOR') {
      setEmail('operator@minevision.local');
      setPassword('operator123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Reset errors
    setGeneralError(null);
    setEmailError(null);
    setPasswordError(null);

    // Client-side quick check
    let hasFieldErrors = false;
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setEmailError('Email is required.');
      hasFieldErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Enter a valid email address.');
      hasFieldErrors = true;
    }

    if (!trimmedPassword) {
      setPasswordError('Password is required.');
      hasFieldErrors = true;
    }

    if (hasFieldErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login({
        email: trimmedEmail,
        password: trimmedPassword,
        rememberMe,
      });

      if (result.success) {
        onLoginSuccess();
      } else {
        if (result.fieldErrors?.email) setEmailError(result.fieldErrors.email);
        if (result.fieldErrors?.password) setPasswordError(result.fieldErrors.password);
        setGeneralError(result.error || 'Unable to sign in. Please verify your credentials and try again.');
        setIsSubmitting(false);
      }
    } catch {
      setGeneralError('Unable to sign in. Please verify your credentials and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-slate-100">
      {/* Left/Visual Section: Enterprise & Industrial Mining Safety Identity */}
      <div className="relative hidden w-1/2 flex-col justify-between border-r border-slate-800 bg-slate-900/60 p-12 lg:flex overflow-hidden">
        {/* Subtle CSS Industrial geometric patterns */}
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #f59e0b 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Pickaxe className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">MineVision</span>
                <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-slate-950">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                Smart Compliance Monitoring Platform
              </p>
            </div>
          </div>
        </div>

        {/* Central Mining Identity Card */}
        <div className="relative z-10 space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <Shield className="h-3.5 w-3.5" />
            <span>Smart India Hackathon • Problem ID 26024</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white leading-snug">
            AI-Powered Smart Compliance Monitoring for Coal Mines
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            A centralized statutory safety compliance, ventilation oversight, and regulatory audit architecture engineered for the Directorate General of Mines Safety (DGMS) and Indian Coal Collieries.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-xs text-slate-400">Statutory Framework</span>
              <p className="text-sm font-semibold text-slate-200 mt-1">CMR 2017 & Mines Act</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-xs text-slate-400">Access Security</span>
              <p className="text-sm font-semibold text-slate-200 mt-1">Role-Based Access Control</p>
            </div>
          </div>
        </div>

        {/* Left Bottom Accreditation */}
        <div className="relative z-10 border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs text-slate-400">
          <span>Enterprise Safety Edition</span>
          <span>RBAC & Session Layer</span>
        </div>
      </div>

      {/* Right/Form Section: Clean Enterprise Sign In */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-12 lg:w-1/2 lg:p-16">
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-slate-400 border border-slate-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Auth & Session Active
          </span>
        </div>

        <div className="mx-auto w-full max-w-sm">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Sign in to MineVision AI to access the compliance monitoring console.
            </p>
          </div>

          {/* Development Role Selector Chips (Quick Testing) */}
          <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Development Test Accounts (1-Click)
              </span>
              <span className="text-[10px] text-amber-400">RBAC</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleDevRoleSelect('ADMIN')}
                className={`rounded-lg py-1 px-2 text-[11px] font-semibold transition-all border ${
                  email === 'admin@minevision.local'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleDevRoleSelect('OFFICER')}
                className={`rounded-lg py-1 px-2 text-[11px] font-semibold transition-all border ${
                  email === 'officer@minevision.local'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Officer
              </button>
              <button
                type="button"
                onClick={() => handleDevRoleSelect('OPERATOR')}
                className={`rounded-lg py-1 px-2 text-[11px] font-semibold transition-all border ${
                  email === 'operator@minevision.local'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Operator
              </button>
            </div>
          </div>

          {/* General Form Error Banner */}
          {generalError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300 animate-in fade-in duration-150"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Unable to sign in</p>
                <p className="mt-0.5 text-rose-300/90">{generalError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                    if (generalError) setGeneralError(null);
                  }}
                  placeholder="name@minevision.local"
                  className={`block w-full rounded-lg border bg-slate-900/90 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:bg-slate-900 focus:outline-none transition-colors ${
                    emailError
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  }`}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
              </div>
              {emailError && (
                <p id="email-error" className="mt-1 text-xs text-rose-400 font-medium">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <span className="text-xs text-slate-500">
                  Dev: <code className="text-amber-400">password123</code>
                </span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                    if (generalError) setGeneralError(null);
                  }}
                  placeholder="••••••••••••"
                  className={`block w-full rounded-lg border bg-slate-900/90 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:bg-slate-900 focus:outline-none transition-colors ${
                    passwordError
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  }`}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="mt-1 text-xs text-rose-400 font-medium">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950"
                />
                <span className="text-xs text-slate-300">Remember session</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 px-4 text-sm font-bold text-slate-950 shadow-sm hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Notice */}
          <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-300 block mb-1">Role-Based Access Control:</span>
            Sign in as <strong>Administrator</strong> (Full 10 sections), <strong>Officer</strong> (Audit & Inspections), or <strong>Operator</strong> (Mine Operations & Reports).
          </div>
        </div>

        {/* Small Professional Footer */}
        <div className="mt-8 border-t border-slate-900 pt-4 text-center text-xs text-slate-400">
          <p className="font-semibold text-slate-300">MineVision AI</p>
          <p className="mt-0.5">Smart Compliance Monitoring Platform • Government & Industry Edition</p>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  KeyRound,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginViewProps {
  onSuccess?: () => void;
}

export default function LoginView({ onSuccess }: LoginViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect') || '/dashboard';
  const isSessionExpired = searchParams?.get('session_expired') === 'true';

  const { login, verifyOtp, resendOtp } = useAuth();

  // Active Persona Tab: 'admin' | 'vendor'
  const [activePersona, setActivePersona] = useState<'admin' | 'vendor'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2-Step Email Verification State
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [otp, setOtp] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Resend Countdown Timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password, activePersona);
      if (res.requiresOtp && res.challengeToken) {
        setChallengeToken(res.challengeToken);
        setOtpEmail(res.email || email);
        setStep('otp');
        setOtpCountdown(45);
        setError(null);
        return;
      }

      if (res.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(redirectTarget);
        }
      } else {
        setError(res.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch {
      setError('An unexpected connection error occurred. Please verify backend status and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the full 6-digit verification code sent to your email.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await verifyOtp(challengeToken || '', cleanOtp, otpEmail);
      if (res.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(redirectTarget);
        }
      } else {
        setError(res.error || 'Invalid verification code. Please check your email and retry.');
      }
    } catch {
      setError('Verification failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0 || !challengeToken || isResending) return;
    setIsResending(true);
    setError(null);
    setResendSuccess(null);

    try {
      const res = await resendOtp(challengeToken);
      if (res.success) {
        if (res.challengeToken) setChallengeToken(res.challengeToken);
        setOtpCountdown(45);
        setResendSuccess(`A fresh 6-digit verification code was sent to ${otpEmail || 'your email'}.`);
        setTimeout(() => setResendSuccess(null), 5000);
      } else {
        setError(res.error || 'Failed to resend code');
      }
    } catch {
      setError('Could not resend code. Please retry.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#ea110d] selection:text-white relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-6 space-y-2 max-w-md relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold tracking-wider uppercase shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#ea110d] animate-pulse" />
          <span>MahaStays Hospitality OS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Executive Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Sign in to access platform controls, bookings, and hospitality operations
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[430px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-6 sm:p-7 space-y-5 relative z-10 transition-all">
        {step === 'otp' ? (
          /* ── Step 2: 2-Factor Email OTP Verification ── */
          <form onSubmit={handleOtpSubmit} className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-13 h-13 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-[#ea110d]">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Two-Factor Security Verification
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {activePersona === 'vendor'
                  ? 'For host & partner security, a 6-digit verification code was sent to:'
                  : 'For administrator protection, a 6-digit authorization code was sent to:'}
                <br />
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {otpEmail || email}
                </span>
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs flex items-start gap-2 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>
            )}

            {resendSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resendSuccess}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                Enter 6-Digit Security Code
              </label>
              <div className="flex justify-center">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="••••••"
                  autoFocus
                  className="w-56 py-3 text-center text-2xl tracking-[0.45em] font-mono font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition shadow-inner"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Check your primary inbox and spam folder if not received in 30 seconds.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-[#ea110d] hover:bg-[#d00f0c] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block animate-spin mr-1">⌛</span>
              ) : (
                <>
                  <span>Verify Code &amp; Complete Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setError(null);
                  setOtp('');
                }}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium cursor-pointer"
              >
                ← Back to Login
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpCountdown > 0 || isResending}
                className="text-[#ea110d] hover:underline font-bold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                {isResending
                  ? 'Sending...'
                  : otpCountdown > 0
                  ? `Resend in ${otpCountdown}s`
                  : 'Resend Code'}
              </button>
            </div>
          </form>
        ) : (
          /* ── Step 1: Real Credentials Form ── */
          <>
            {/* Persona Switcher Tabs */}
            <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setActivePersona('admin');
                  setError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activePersona === 'admin'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${activePersona === 'admin' ? 'text-[#ea110d]' : ''}`} />
                <span>Platform Admin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePersona('vendor');
                  setError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activePersona === 'vendor'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${activePersona === 'vendor' ? 'text-emerald-600' : ''}`} />
                <span>Partner Host</span>
              </button>
            </div>

            {isSessionExpired && !error && (
              <div className="p-3.5 rounded-xl bg-amber-50 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                <RotateCcw className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-bold">Session Expired:</span> Your previous session has timed out. Please sign in again with your credentials.
                </div>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs flex items-start gap-2 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Registered Email</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {activePersona === 'admin' ? 'SuperAdmin & Staff' : 'Verified Vendor Partner'}
                  </span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    id="login-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      activePersona === 'admin'
                        ? 'e.g. mail@domain.com'
                        : 'e.g. host@yourdomain.com'
                    }
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#ea110d] transition"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Account Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-[11px] text-slate-500 hover:text-[#ea110d] flex items-center gap-1 cursor-pointer transition"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Need Assistance?</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#ea110d] transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#ea110d] focus:ring-[#ea110d]"
                  />
                  <span>Remember session on this device</span>
                </label>

                <span className="text-[11px] text-slate-400">
                  {activePersona === 'admin' ? '2-Step Protected' : 'Encrypted Token'}
                </span>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                id="login-submit-button"
                disabled={loading}
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-[#ea110d] dark:hover:bg-[#d00f0c] transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-block animate-spin mr-1">⌛</span>
                ) : (
                  <>
                    <span>Sign In to {activePersona === 'admin' ? 'Admin Portal' : 'Vendor Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* Security & Regulatory Compliance Seals */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center space-y-1">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-Bit SSL Encrypted Session • MTDC Compliant</span>
          </p>
          <p className="text-[9px] text-slate-400">
            Authorized hospitality personnel and registered vendors only.
          </p>
        </div>
      </div>

      {/* Assistance Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-[#ea110d]" />
              <span>Executive Access Assistance</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              If you have lost access to your account or need your credentials reset, please contact the MahaStays Platform Security Desk:
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 space-y-1">
              <div>Email: <strong>bookingmahastays@gmail.com</strong></div>
              <div>Support: <strong>support@mahastays.com</strong></div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

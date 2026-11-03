'use client';

import React, { useState } from 'react';
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
  Sparkles,
  Copy,
  Check,
  KeyRound,
  ShieldAlert,
  UserCheck,
  BedDouble,
  Compass,
} from 'lucide-react';
import {
  useAuth,
  ADMIN_DEMO_CREDENTIALS,
  VENDOR_DEMO_CREDENTIALS,
} from '../../context/AuthContext';

interface LoginViewProps {
  onSuccess?: () => void;
}

export default function LoginView({ onSuccess }: LoginViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect') || '/dashboard';

  const { login, verifyOtp, resendOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 2-Step Email Verification State
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [otp, setOtp] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // Resend Countdown Timer
  React.useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
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
        setError(res.error || 'Invalid email or password');
      }
    } catch {
      setError('An unexpected error occurred during sign in. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
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
        setResendSuccess(`A fresh 6-digit code has been dispatched to ${otpEmail || 'your email'}.`);
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

  const handleQuickFill = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError(null);
  };

  const handleDirectDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);

    try {
      const res = await login(demoEmail, demoPass);
      if (res.requiresOtp && res.challengeToken) {
        setChallengeToken(res.challengeToken);
        setOtpEmail(res.email || demoEmail);
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
        setError(res.error || 'Sign in failed');
      }
    } catch {
      setError('An unexpected error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-rose-500 selection:text-white">
      {/* Brand Header */}
      <div className="text-center mb-6 space-y-2 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold tracking-wider uppercase shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
          MahaStays Hospitality OS
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          Portal Sign In
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Enter your registered credentials to access your administrative operations dashboard or partner folio.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
        {step === 'otp' ? (
          /* ── Step 2: 2-Step Email Verification Form ── */
          <form onSubmit={handleOtpSubmit} className="space-y-5 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Two-Step Verification
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Enter the 6-digit one-time passcode sent to{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">{otpEmail}</strong>
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs flex items-start gap-2 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>
            )}

            {resendSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <div className="flex-1 font-medium">{resendSuccess}</div>
              </div>
            )}

            <div className="space-y-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block text-center">
                6-Digit Security Code
              </label>
              <div className="flex justify-center">
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-56 py-3 text-center text-2xl tracking-[0.45em] font-mono font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition shadow-inner"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Check your inbox and spam folder if you do not see it immediately.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block animate-spin mr-1">⌛</span>
              ) : (
                <>
                  <span>Verify Code & Complete Sign In</span>
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
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium"
              >
                ← Back to Login
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpCountdown > 0 || isResending}
                className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition"
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
          /* ── Step 1: Unified Credentials Form ── */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs flex items-start gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="email"
                id="login-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bookingmahastays@gmail.com or vendor@mahastays.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Password</label>
              <button
                type="button"
                onClick={() =>
                  alert(
                    `Test Passwords:\nAdmin: ${ADMIN_DEMO_CREDENTIALS.password}\nVendor: ${VENDOR_DEMO_CREDENTIALS.password}`
                  )
                }
                className="text-[11px] text-rose-600 hover:underline"
              >
                Need Help?
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
                className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span>Remember session</span>
            </label>

            <span className="text-[11px] text-slate-400">
              Auto-detects Admin or Vendor
            </span>
          </div>

          <button
            type="submit"
            id="login-submit-button"
            disabled={loading}
            className="w-full py-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-700 transition shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block animate-spin mr-1">⌛</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        )}

        {/* Demo Credentials Box with 1-Click Access for Both Personas */}
        <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <KeyRound className="w-3.5 h-3.5 text-rose-600" />
              Quick Test Credentials
            </span>
            <span className="text-[10px] text-slate-400">1-Click Sign In</span>
          </div>

          {/* Admin Test Row */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Admin Platform Ops
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                Staff
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <code className="font-mono text-slate-700 dark:text-slate-300">
                {ADMIN_DEMO_CREDENTIALS.email}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(ADMIN_DEMO_CREDENTIALS.email, 'admin-email')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="Copy"
              >
                {copiedKey === 'admin-email' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  handleQuickFill(ADMIN_DEMO_CREDENTIALS.email, ADMIN_DEMO_CREDENTIALS.password)
                }
                className="flex-1 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition text-center"
              >
                Fill Form
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDirectDemoLogin(
                    ADMIN_DEMO_CREDENTIALS.email,
                    ADMIN_DEMO_CREDENTIALS.password
                  )
                }
                className="flex-1 py-1 rounded-lg text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 transition text-center"
              >
                1-Click Admin ⚡
              </button>
            </div>
          </div>

          {/* Vendor Partner Test Row */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Vendor Partner Host
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Resort Partner
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <code className="font-mono text-slate-700 dark:text-slate-300">
                {VENDOR_DEMO_CREDENTIALS.email}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(VENDOR_DEMO_CREDENTIALS.email, 'vendor-email')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="Copy"
              >
                {copiedKey === 'vendor-email' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  handleQuickFill(VENDOR_DEMO_CREDENTIALS.email, VENDOR_DEMO_CREDENTIALS.password)
                }
                className="flex-1 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition text-center"
              >
                Fill Form
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDirectDemoLogin(
                    VENDOR_DEMO_CREDENTIALS.email,
                    VENDOR_DEMO_CREDENTIALS.password
                  )
                }
                className="flex-1 py-1 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition text-center"
              >
                1-Click Vendor ⚡
              </button>
            </div>
          </div>
        </div>

        {/* Other Accounts Quick Access */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Other Staff & Partner Accounts
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() =>
                handleDirectDemoLogin('compliance.lead@mahastays.local', 'Demo@12345')
              }
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-rose-300 text-left transition"
            >
              <div className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-rose-500" />
                Compliance Lead
              </div>
              <div className="text-[10px] text-slate-400 truncate">compliance.lead@...</div>
            </button>
            <button
              type="button"
              onClick={() => handleDirectDemoLogin('host@hillview.local', 'Demo@12345')}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 text-left transition"
            >
              <div className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                <BedDouble className="w-3 h-3 text-emerald-600" />
                HillView Resort
              </div>
              <div className="text-[10px] text-slate-400 truncate">host@hillview.local</div>
            </button>
          </div>
        </div>

        {/* Security badge at bottom */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            256-Bit SSL Encrypted Session • MTDC Compliant
          </p>
        </div>
      </div>
    </div>
  );
}

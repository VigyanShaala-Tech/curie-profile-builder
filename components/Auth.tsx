import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ArrowRight, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { getCountryCallingCode } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import { normalizePhone } from '../phone';

interface AuthProps {
  onLogin: (payload: {
    user: any;
    isReturningUser?: boolean;
    existingRow?: unknown;
  }) => void;
}

type LoginStep = 0 | 1;
type ForgotStep = 0 | 1 | 2 | 3;
type AuthPhase = 'welcome' | 'form';

const RIGHT_IMAGE_SRC = '/images/Curie_2.png';

async function readJsonBody(res: Response): Promise<Record<string, unknown>> {
  let data: Record<string, unknown> = {};
  try {
    const text = await res.text();
    if (text) data = JSON.parse(text) as Record<string, unknown>;
  } catch (err) {
    console.error('Invalid JSON response', err);
  }
  return data;
}

function apiErrorMessage(data: Record<string, unknown>, fallback: string): string {
  const e = data.error ?? data.message;
  return typeof e === 'string' && e.trim() ? e : fallback;
}

/** Sign-up / password reset: letter + digit + special, min 8 chars */
const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/;

function buildE164(country: CountryCode, nationalRaw: string): string {
  const dial = getCountryCallingCode(country);
  const digits = nationalRaw.replace(/\D/g, '');
  return `+${dial}${digits}`;
}

/** National digits only (no country code): 6–15 digits */
function isNationalPhoneOk(nationalRaw: string): boolean {
  const digits = nationalRaw.replace(/\D/g, '');
  return /^\d{6,15}$/.test(digits);
}

function passwordStrengthOk(pw: string): boolean {
  return PASSWORD_STRENGTH_REGEX.test(pw);
}

const FEW_COUNTRIES: { iso: CountryCode; code: string; flag: string }[] = [
  { iso: 'IN', code: '+91', flag: 'https://flagcdn.com/w20/in.png' },
  { iso: 'US', code: '+1', flag: 'https://flagcdn.com/w20/us.png' },
  { iso: 'GB', code: '+44', flag: 'https://flagcdn.com/w20/gb.png' },
];

type PhoneFieldProps = {
  nationalNumber: string;
  setNationalNumber: (v: string) => void;
  countryIso: CountryCode;
  setCountryIso: (c: CountryCode) => void;
  hasError: boolean;
  phoneRef: React.RefObject<HTMLInputElement | null>;
  onClearError: () => void;
  onEnter?: () => void;
};

function PhoneField({
  nationalNumber,
  setNationalNumber,
  countryIso,
  setCountryIso,
  hasError,
  phoneRef,
  onClearError,
  onEnter,
}: PhoneFieldProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = FEW_COUNTRIES.find((c) => c.iso === countryIso) ?? FEW_COUNTRIES[0];

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`phone-wrapper flex items-center rounded-lg px-2.5 py-2 bg-transparent border ${
        hasError ? 'border-red-500' : 'border-[#D1D5DB]'
      }`}
    >
      <div className="relative shrink-0">
        <button
          type="button"
          className="country-selector flex items-center gap-1.5 pr-2 border-r border-[#E5E7EB] cursor-pointer bg-transparent"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <img src={selected.flag} alt="" className="w-5 h-3.5 object-cover rounded-sm" width={20} height={14} />
          <span className="text-sm font-bold text-[#2c4869] whitespace-nowrap">{selected.code}</span>
          <span className="text-[10px] text-[#2c4869]/70" aria-hidden>
            ▼
          </span>
        </button>
        {open ? (
          <ul
            className="absolute z-40 mt-1 left-0 bg-white border border-[#E5E7EB] rounded-md shadow py-1 min-w-[140px]"
            role="listbox"
          >
            {FEW_COUNTRIES.map((c) => (
              <li key={c.iso}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-[#2c4869]"
                  onClick={() => {
                    setCountryIso(c.iso);
                    setOpen(false);
                  }}
                >
                  <img src={c.flag} alt="" className="w-5 h-3.5 object-cover rounded-sm" width={20} height={14} />
                  {c.code}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <input
        ref={phoneRef}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={nationalNumber}
        onChange={(e) => {
          setNationalNumber(e.target.value.replace(/\D/g, ''));
          onClearError();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onEnter?.();
          }
        }}
        className="flex-1 min-w-0 border-0 outline-none pl-2 text-[#2c4869] text-lg font-semibold bg-transparent"
        placeholder="Registered Whatsapp Number"
      />
    </div>
  );
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [authPhase, setAuthPhase] = useState<AuthPhase>('welcome');
  const [isLogin, setIsLogin] = useState(true);
  const [countryIso, setCountryIso] = useState<CountryCode>('IN');
  const [nationalNumber, setNationalNumber] = useState('');
  const [password, setPassword] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>(0);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState('');
  const [imgLoaded, setImgLoaded] = useState(true);
  const [otpCells, setOtpCells] = useState<string[]>(() => ['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const newPassRef = useRef<HTMLInputElement>(null);

  const fullPhoneE164 = useMemo(() => buildE164(countryIso, nationalNumber), [countryIso, nationalNumber]);
  const normalizedPhone = useMemo(() => normalizePhone(fullPhoneE164), [fullPhoneE164]);

  const headerTitle =
    authPhase === 'welcome'
      ? "Let's Get Started"
      : isLogin
        ? 'Welcome Back'
        : 'Create Account :)';

  const headerSubtitle =
    authPhase === 'welcome'
      ? 'Choose how you want to continue.'
      : isLogin
        ? 'Sign in to continue your STEM journey.'
        : 'Create your account to start building your profile.';

  useEffect(() => {
    if (forgotOpen) {
      if (forgotStep === 0) requestAnimationFrame(() => phoneRef.current?.focus());
      if (forgotStep === 1) requestAnimationFrame(() => otpInputRefs.current[0]?.focus());
      if (forgotStep === 2) requestAnimationFrame(() => newPassRef.current?.focus());
      return;
    }
    if (loginStep === 0) requestAnimationFrame(() => phoneRef.current?.focus());
    if (loginStep === 1) requestAnimationFrame(() => passwordRef.current?.focus());
  }, [forgotOpen, forgotStep, loginStep]);

  const clearFieldErrors = () => {
    setPhoneError('');
    setPasswordError('');
    setNewPasswordError('');
    setResetEmailError('');
  };

  const closeForgotToSignIn = () => {
    setForgotOpen(false);
    setForgotStep(0);
    setOtpCells(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setResetEmail('');
    setError('');
    clearFieldErrors();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearFieldErrors();
    if (!isNationalPhoneOk(nationalNumber)) {
      setPhoneError('Enter a valid phone number');
      return;
    }
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }
    if (!isLogin && !passwordStrengthOk(password)) {
      setPasswordError('Password must include letters, numbers, and a special character (@$!%*?&#), min 8 characters');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, password }),
      });
      const data = await readJsonBody(res);
      if (!res.ok) throw new Error(apiErrorMessage(data, 'Authentication failed'));
      const user = data.user;
      if (!user) throw new Error('Authentication failed');
      onLogin({
        user,
        isReturningUser: Boolean(data.isReturningUser),
        existingRow: data.existingRow,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goToPasswordStep = () => {
    setError('');
    clearFieldErrors();
    if (!isNationalPhoneOk(nationalNumber)) {
      setPhoneError('Enter a valid phone number');
      return;
    }
    setLoginStep(1);
  };

  const requestPasswordReset = async () => {
    clearFieldErrors();
    if (!isNationalPhoneOk(nationalNumber)) {
      setPhoneError('Enter a valid phone number');
      return;
    }
    if (!resetEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
      setResetEmailError('Enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, email: resetEmail.trim() }),
      });
      const data = await readJsonBody(res);
      if (!res.ok) throw new Error(apiErrorMessage(data, 'Could not send OTP'));
      setOtpCells(['', '', '', '', '', '']);
      setForgotStep(1);
    } catch (err: any) {
      setError(err.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmPasswordReset = async () => {
    setNewPasswordError('');
    if (!passwordStrengthOk(newPassword)) {
      setNewPasswordError('Password must include letters, numbers, and a special character (@$!%*?&#), min 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          otp: otpCells.join(''),
          newPassword,
        }),
      });
      const data = await readJsonBody(res);
      if (!res.ok) throw new Error(apiErrorMessage(data, 'Reset failed'));
      setForgotStep(3);
    } catch (err: any) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const passwordInputBorder = passwordError ? 'border-red-500 focus:border-red-500' : 'border-[#2c4869]/25 focus:border-[#f58434]';
  const newPassBorder = newPasswordError ? 'border-red-500 focus:border-red-500' : 'border-[#2c4869]/25 focus:border-[#f58434]';

  const canContinuePhone = isNationalPhoneOk(nationalNumber);
  const verifyOtpAndContinue = () => {
    const joined = otpCells.join('');
    if (joined.length !== 6) return;
    setError('');
    setForgotStep(2);
  };

  const setOtpDigit = (index: number, value: string) => {
    const d = value.replace(/\D/g, '').slice(-1);
    setOtpCells((prev) => {
      const next = [...prev];
      next[index] = d;
      return next;
    });
    if (d && index < 5) {
      requestAnimationFrame(() => otpInputRefs.current[index + 1]?.focus());
    }
  };

  const onOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCells[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };
  const loginSubmitDisabled =
    loading ||
    !password.trim() ||
    (!isLogin && !passwordStrengthOk(password));

  return (
    <div className="min-h-screen bg-[#9DD3AF] flex flex-col lg:flex-row overflow-x-hidden">
      <section className="w-full lg:w-[52%] px-5 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 lg:py-10 flex items-start lg:items-center justify-center order-1 lg:order-2">
        <div className="w-full max-w-xl">
          <div className="mb-8 sm:mb-10">
            <img src="/images/log.png" alt="VigyanShaala" className="h-8 sm:h-10 w-auto object-contain" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl border border-[#2c4869]/15 bg-white/95 shadow-[0_14px_40px_rgba(44,72,105,0.12)] p-6 sm:p-8"
          >
            <h1 className="text-2xl sm:text-3xl font-black text-[#2c4869] leading-tight">{headerTitle}</h1>
            <p className="mt-2 text-sm sm:text-base text-[#2c4869]/70 font-medium">{headerSubtitle}</p>

            <div className="mt-7">
              {authPhase === 'welcome' ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setAuthPhase('form');
                      setLoginStep(0);
                      clearFieldErrors();
                      setError('');
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#f58434] text-white font-black tracking-wide hover:bg-[#eb7723] active:scale-[0.99] transition-all"
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setAuthPhase('form');
                      setLoginStep(0);
                      clearFieldErrors();
                      setError('');
                    }}
                    className="w-full py-3.5 rounded-2xl border-2 border-[#2c4869]/25 text-[#2c4869] font-black tracking-wide hover:bg-[#2c4869]/5 transition-all"
                  >
                    Sign Up
                  </button>
                </div>
              ) : !forgotOpen ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`login-step-${loginStep}-${isLogin ? 'in' : 'up'}`}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.24 }}
                    className="space-y-5"
                  >
                    {loginStep === 0 && (
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-[#2c4869]/60 mb-2">
                          Phone Number
                        </label>
                        <PhoneField
                          nationalNumber={nationalNumber}
                          setNationalNumber={setNationalNumber}
                          countryIso={countryIso}
                          setCountryIso={setCountryIso}
                          hasError={!!phoneError}
                          phoneRef={phoneRef}
                          onClearError={() => setPhoneError('')}
                          onEnter={() => canContinuePhone && goToPasswordStep()}
                        />
                        <p className="text-[10px] text-[#2c4869]/50 mt-1 font-medium">
                          {countryIso} +{getCountryCallingCode(countryIso)} · {fullPhoneE164}
                        </p>
                        {phoneError ? <p className="text-xs text-red-600 font-bold mt-2">{phoneError}</p> : null}
                      </div>
                    )}

                    {loginStep === 1 && (
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-[#2c4869]/60 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2c4869]/35" />
                          <input
                            ref={passwordRef}
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              setPasswordError('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && password.trim() && !loginSubmitDisabled) {
                                e.preventDefault();
                                handleSubmit(e as any);
                              }
                            }}
                            className={`w-full pl-8 pr-10 py-3.5 bg-transparent border-0 border-b-2 text-[#2c4869] text-lg font-semibold outline-none transition-colors ${passwordInputBorder}`}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[#2c4869]/40 hover:text-[#2c4869]/70 transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {!isLogin && (
                          <p className="text-[10px] text-[#2c4869]/55 mt-1.5 font-medium">
                            Min 8 characters, with letters, numbers, and a special character (@$!%*?&#)
                          </p>
                        )}
                        {passwordError ? <p className="text-xs text-red-600 font-bold mt-2">{passwordError}</p> : null}
                        {isLogin && (
                          <button
                            type="button"
                            onClick={() => {
                              setForgotOpen(true);
                              setForgotStep(0);
                              setError('');
                            }}
                            className="mt-3 text-sm font-bold text-[#2c4869]/70 hover:text-[#f58434]"
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                    )}

                    {error ? (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 font-bold">{error}</p>
                    ) : null}

                    <div className="flex flex-col gap-3">
                      {loginStep === 0 && (
                        <button
                          type="button"
                          disabled={!canContinuePhone}
                          onClick={goToPasswordStep}
                          className="w-full py-3.5 rounded-2xl bg-[#f58434] text-white font-black tracking-wide hover:bg-[#eb7723] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          Continue
                        </button>
                      )}
                      {loginStep === 1 && (
                        <button
                          type="button"
                          disabled={loginSubmitDisabled}
                          onClick={(e) => handleSubmit(e as any)}
                          className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#f58434] text-white font-black tracking-wide hover:bg-[#eb7723] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      )}
                      {loginStep > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setLoginStep((prev) => (prev > 0 ? ((prev - 1) as LoginStep) : 0));
                            setError('');
                            clearFieldErrors();
                          }}
                          className="text-sm font-bold text-[#2c4869]/65 hover:text-[#2c4869]"
                        >
                          Back
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthPhase('welcome');
                          setLoginStep(0);
                          setError('');
                          clearFieldErrors();
                        }}
                        className="text-xs font-bold text-[#2c4869]/50 hover:text-[#2c4869]"
                      >
                        ← Back to start
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`forgot-${forgotStep}`}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.24 }}
                    className="space-y-4"
                  >
                    {forgotStep === 0 && (
                      <>
                        <label className="block text-xs font-black uppercase tracking-wider text-[#2c4869]/60">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => { setResetEmail(e.target.value); setResetEmailError(''); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && canContinuePhone && resetEmail.trim()) {
                              e.preventDefault();
                              requestPasswordReset();
                            }
                          }}
                          placeholder="Enter your email to receive OTP"
                          className={`w-full px-3 py-2.5 rounded-lg bg-transparent border ${
                            resetEmailError ? 'border-red-500' : 'border-[#D1D5DB]'
                          } text-[#2c4869] text-base font-semibold outline-none focus:border-[#f58434]`}
                        />
                        {resetEmailError ? <p className="text-xs text-red-600 font-bold">{resetEmailError}</p> : null}
                        <button
                          type="button"
                          disabled={loading || !canContinuePhone || !resetEmail.trim()}
                          onClick={requestPasswordReset}
                          className="w-full py-3.5 rounded-2xl bg-[#f58434] text-white font-black tracking-wide hover:bg-[#eb7723] disabled:opacity-50"
                        >
                          {loading ? 'Sending OTP...' : 'Send OTP to Email'}
                        </button>
                        <p
                          role="button"
                          tabIndex={0}
                          onClick={closeForgotToSignIn}
                          onKeyDown={(e) => e.key === 'Enter' && closeForgotToSignIn()}
                          className="back-to-signin mt-3 text-center cursor-pointer text-[#1f2937] underline text-sm font-bold"
                        >
                          Back to sign in
                        </p>
                      </>
                    )}

                    {forgotStep === 1 && (
                      <>
                        <p className="text-xs text-[#2c4869]/70 bg-[#9DD3AF]/30 border border-[#2c4869]/10 rounded-lg px-3 py-2">
                          An OTP has been sent to your email. Please check your inbox.
                        </p>
                        <label className="block text-xs font-black uppercase tracking-wider text-[#2c4869]/60">OTP</label>
                        <div className="otp-box flex gap-2 justify-between sm:justify-start sm:gap-3 mt-1">
                          {otpCells.map((cell, i) => (
                            <input
                              key={i}
                              ref={(el) => {
                                otpInputRefs.current[i] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              maxLength={1}
                              value={cell}
                              onChange={(e) => setOtpDigit(i, e.target.value)}
                              onKeyDown={(e) => onOtpKeyDown(i, e)}
                              className="w-10 h-11 sm:w-11 text-center text-lg font-bold text-[#2c4869] border border-[#D1D5DB] rounded-lg bg-transparent outline-none focus:border-[#f58434]"
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          disabled={otpCells.join('').length !== 6}
                          onClick={verifyOtpAndContinue}
                          className="w-full py-3.5 rounded-2xl bg-[#f58434] text-white font-black tracking-wide hover:bg-[#eb7723] disabled:opacity-50"
                        >
                          Continue
                        </button>
                      </>
                    )}

                    {forgotStep === 2 && (
                      <>
                        <label className="block text-xs font-black uppercase tracking-wider text-[#2c4869]/60">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2c4869]/35" />
                          <input
                            ref={newPassRef}
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => {
                              setNewPassword(e.target.value);
                              setNewPasswordError('');
                            }}
                            className={`w-full pl-8 pr-10 py-3.5 bg-transparent border-0 border-b-2 text-[#2c4869] text-lg font-semibold outline-none ${newPassBorder}`}
                            placeholder="Min 8 characters + complexity"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((v) => !v)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[#2c4869]/40 hover:text-[#2c4869]/70 transition-colors"
                            tabIndex={-1}
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {newPasswordError ? <p className="text-xs text-red-600 font-bold">{newPasswordError}</p> : null}
                        <label className="block text-xs font-black uppercase tracking-wider text-[#2c4869]/60 mt-2">Confirm Password</label>
                        <div className="relative">
                          <KeyRound className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2c4869]/35" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-8 pr-10 py-3.5 bg-transparent border-0 border-b-2 border-[#2c4869]/25 text-[#2c4869] text-lg font-semibold outline-none focus:border-[#f58434]"
                            placeholder="Repeat password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[#2c4869]/40 hover:text-[#2c4869]/70 transition-colors"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={
                            loading ||
                            !passwordStrengthOk(newPassword) ||
                            newPassword !== confirmPassword
                          }
                          onClick={confirmPasswordReset}
                          className="w-full py-3.5 rounded-2xl bg-[#f58434] text-white font-black tracking-wide hover:bg-[#eb7723] disabled:opacity-50"
                        >
                          {loading ? 'Updating...' : 'Reset Password'}
                        </button>
                        <p
                          role="button"
                          tabIndex={0}
                          onClick={closeForgotToSignIn}
                          onKeyDown={(e) => e.key === 'Enter' && closeForgotToSignIn()}
                          className="back-to-signin mt-3 text-center cursor-pointer text-[#1f2937] underline text-sm font-bold"
                        >
                          Back to sign in
                        </p>
                      </>
                    )}

                    {forgotStep === 3 && (
                      <div className="flex flex-col gap-4">
                        <div className="rounded-2xl border border-[#2c4869]/15 bg-[#9DD3AF]/40 px-4 py-5 text-center">
                          <p className="text-[#2c4869] font-black">Password updated successfully</p>
                        </div>
                        <button
                          type="button"
                          onClick={closeForgotToSignIn}
                          className="w-full rounded-full bg-[#f58434] py-3 text-base font-extrabold text-white shadow-md hover:brightness-105 transition"
                        >
                          Log In
                        </button>
                      </div>
                    )}

                    {error ? (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 font-bold">{error}</p>
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {authPhase === 'form' && !forgotOpen && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setLoginStep(0);
                    clearFieldErrors();
                  }}
                  className="text-sm font-semibold text-[#2c4869]/80 hover:text-[#f58434]"
                >
                  {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="w-full lg:w-[48%] order-2 lg:order-1 min-h-[300px] lg:min-h-screen bg-[#9DD3AF] relative overflow-hidden">
        {imgLoaded ? (
          <motion.img
            src={RIGHT_IMAGE_SRC}
            alt="Student success"
            onError={() => setImgLoaded(false)}
            className="w-full h-full object-contain lg:object-cover object-center"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center px-8 text-center">
            <p className="text-[#2c4869]/70 font-semibold">
              Visual section unavailable. Add the image at
              <br />
              <span className="text-[#f58434] font-black">{RIGHT_IMAGE_SRC}</span>
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

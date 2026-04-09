import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Lock, ArrowRight, Loader2, KeyRound } from 'lucide-react';

interface AuthProps {
  onLogin: (user: any) => void;
}

type LoginStep = 0 | 1;
type ForgotStep = 0 | 1 | 2 | 3;

const RIGHT_IMAGE_SRC = '/images/Curie_2.png';

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>(0);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>(0);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(true);

  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const newPassRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (forgotOpen) {
      if (forgotStep === 0) requestAnimationFrame(() => phoneRef.current?.focus());
      if (forgotStep === 1) requestAnimationFrame(() => otpRef.current?.focus());
      if (forgotStep === 2) requestAnimationFrame(() => newPassRef.current?.focus());
      return;
    }
    if (loginStep === 0) requestAnimationFrame(() => phoneRef.current?.focus());
    if (loginStep === 1) requestAnimationFrame(() => passwordRef.current?.focus());
  }, [forgotOpen, forgotStep, loginStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async () => {
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send OTP');
      if (data.debugOtp) setDebugOtp(data.debugOtp);
      setForgotStep(1);
    } catch (err: any) {
      setError(err.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const confirmPasswordReset = async () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
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
          phone: phone.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setForgotStep(3);
    } catch (err: any) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#9DD3AF] flex flex-col lg:flex-row overflow-x-hidden">
      {/* Right on desktop: Login form (first on mobile) */}
      <section className="w-full lg:w-[52%] px-5 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 lg:py-10 flex items-start lg:items-center justify-center order-1 lg:order-2">
        <div className="w-full max-w-xl">
          <div className="mb-8 sm:mb-10">
            <img
              src="/images/log.png"
              alt="VigyanShaala"
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl border border-[#2c4869]/15 bg-white/95 shadow-[0_14px_40px_rgba(44,72,105,0.12)] p-6 sm:p-8"
          >
            <h1 className="text-2xl sm:text-3xl font-black text-[#2c4869] leading-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#2c4869]/70 font-medium">
              Sign in to continue your STEM journey.
            </p>

            <div className="mt-7">
              {!forgotOpen ? (
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
                        <div className="relative">
                          <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2c4869]/35" />
                          <input
                            ref={phoneRef}
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && phone.trim()) {
                                e.preventDefault();
                                setLoginStep(1);
                              }
                            }}
                            className="w-full pl-8 py-3.5 bg-transparent border-0 border-b-2 border-[#2c4869]/25 text-[#2c4869] text-lg font-semibold outline-none focus:border-[#f58434] transition-colors"
                            placeholder="+91 98765 43210"
                          />
                        </div>
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
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && password.trim()) {
                                e.preventDefault();
                                handleSubmit(e as any);
                              }
                            }}
                            className="w-full pl-8 py-3.5 bg-transparent border-0 border-b-2 border-[#2c4869]/25 text-[#2c4869] text-lg font-semibold outline-none focus:border-[#f58434] transition-colors"
                            placeholder="••••••••"
                          />
                        </div>
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
                      </div>
                    )}

                    {error ? (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 font-bold">{error}</p>
                    ) : null}

                    <div className="flex flex-col gap-3">
                      {loginStep === 0 && (
                        <button
                          type="button"
                          disabled={!phone.trim()}
                          onClick={() => setLoginStep(1)}
                          className="w-full py-3.5 rounded-2xl bg-[#f58434] text-white font-black tracking-wide hover:bg-[#eb7723] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          Continue
                        </button>
                      )}
                      {loginStep === 1 && (
                        <button
                          type="button"
                          disabled={loading || !password.trim()}
                          onClick={(e) => handleSubmit(e as any)}
                          className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#f58434] text-white font-black tracking-wide hover:bg-[#eb7723] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                        </button>
                      )}
                      {loginStep > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setLoginStep((prev) => (prev > 0 ? ((prev - 1) as LoginStep) : 0));
                            setError('');
                          }}
                          className="text-sm font-bold text-[#2c4869]/65 hover:text-[#2c4869]"
                        >
                          Back
                        </button>
                      )}
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
                    <button
                      type="button"
                      onClick={() => {
                        setForgotOpen(false);
                        setForgotStep(0);
                        setOtp('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setDebugOtp(null);
                        setError('');
                      }}
                      className="text-sm font-bold text-[#2c4869]/65 hover:text-[#2c4869]"
                    >
                      Back to sign in
                    </button>

                    {forgotStep === 0 && (
                      <>
                        <label className="block text-xs font-black uppercase tracking-wider text-[#2c4869]/60">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2c4869]/35" />
                          <input
                            ref={phoneRef}
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pl-8 py-3.5 bg-transparent border-0 border-b-2 border-[#2c4869]/25 text-[#2c4869] text-lg font-semibold outline-none focus:border-[#f58434]"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={requestPasswordReset}
                          className="w-full py-3.5 rounded-2xl bg-[#f58434] text-white font-black tracking-wide hover:bg-[#eb7723] disabled:opacity-50"
                        >
                          {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                      </>
                    )}

                    {forgotStep === 1 && (
                      <>
                        {debugOtp && (
                          <p className="text-xs text-[#2c4869] bg-white/80 border border-[#2c4869]/15 rounded-lg px-3 py-2">
                            Dev OTP: <span className="font-black">{debugOtp}</span>
                          </p>
                        )}
                        <label className="block text-xs font-black uppercase tracking-wider text-[#2c4869]/60">OTP</label>
                        <input
                          ref={otpRef}
                          type="text"
                          inputMode="numeric"
                          value={otp}
                          maxLength={6}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full py-3.5 text-center tracking-[0.35em] bg-transparent border-0 border-b-2 border-[#2c4869]/25 text-[#2c4869] text-2xl font-semibold outline-none focus:border-[#f58434]"
                          placeholder="000000"
                        />
                        <button
                          type="button"
                          disabled={otp.length !== 6}
                          onClick={() => setForgotStep(2)}
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
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-8 py-3.5 bg-transparent border-0 border-b-2 border-[#2c4869]/25 text-[#2c4869] text-lg font-semibold outline-none focus:border-[#f58434]"
                            placeholder="Minimum 6 characters"
                          />
                        </div>
                        <label className="block text-xs font-black uppercase tracking-wider text-[#2c4869]/60 mt-2">Confirm Password</label>
                        <div className="relative">
                          <KeyRound className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2c4869]/35" />
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-8 py-3.5 bg-transparent border-0 border-b-2 border-[#2c4869]/25 text-[#2c4869] text-lg font-semibold outline-none focus:border-[#f58434]"
                            placeholder="Repeat password"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={confirmPasswordReset}
                          className="w-full py-3.5 rounded-2xl bg-[#f58434] text-white font-black tracking-wide hover:bg-[#eb7723] disabled:opacity-50"
                        >
                          {loading ? 'Updating...' : 'Reset Password'}
                        </button>
                      </>
                    )}

                    {forgotStep === 3 && (
                      <div className="rounded-2xl border border-[#2c4869]/15 bg-[#9DD3AF]/40 px-4 py-5 text-center">
                        <p className="text-[#2c4869] font-black">Password updated successfully</p>
                      </div>
                    )}

                    {error ? (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 font-bold">{error}</p>
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setLoginStep(0);
                }}
                className="text-sm font-semibold text-[#2c4869]/80 hover:text-[#f58434]"
              >
                {isLogin ? "Don’t have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Left on desktop: Image (second on mobile) */}
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

import React, { useState, useEffect, useRef } from 'react';
import { MdArrowForward } from 'react-icons/md';
import emailjs from '@emailjs/browser';
import { useAuth } from '../../Service/AuthContext';
import ResetConfirm from '../../ResetConfirm/page/ResetConfirm';

// ─── EmailJS config from .env ────────────────────────────────
const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// ─── Generate a random 6-digit OTP ──────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


// ─────────────────────────────────────────────────────────────
// Step 1 — Email input + send OTP
// ─────────────────────────────────────────────────────────────
function EmailStep({ onNext }) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const otp = generateOTP();
    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        { to_email: email, otp_code: otp },
        PUBLIC_KEY,
      );
      onNext(email, otp);
    } catch (err) {
      console.error('EmailJS error:', err);
      setError('Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black mb-2 tracking-tight">Reset Password</h1>
        <p className="text-sm text-[#47464a]">Enter your email to receive a 6-digit code.</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-bold mb-2 ml-1 text-[#47464a]">Email Address</label>
          <input
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-4 text-base focus:ring-4 focus:ring-[#1b6b51]/5 focus:border-[#1b6b51] outline-none transition-all text-zinc-900 placeholder:text-zinc-400"
            placeholder="name@example.com"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
            {error}
          </p>
        )}

        <button
          className="w-full bg-black text-white rounded-xl px-5 py-4 font-semibold tracking-wide hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Send Verification Code <MdArrowForward className="text-[20px]" /></>
          )}
        </button>
      </form>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// Step 2 — OTP verification
// ─────────────────────────────────────────────────────────────
function OtpVerificationStep({ email, expectedOtp, onNext, onResend }) {
  const [timer,     setTimer]     = useState(59);
  const [error,     setError]     = useState('');
  const [resending, setResending] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleKeyUp = (e, index) => {
    if (e.key >= '0' && e.key <= '9') {
      if (index < inputRefs.length - 1) inputRefs[index + 1].current.focus();
    } else if (e.key === 'Backspace') {
      if (index > 0) inputRefs[index - 1].current.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const entered = inputRefs.map((r) => r.current.value).join('');
    if (entered !== expectedOtp) {
      setError('Incorrect code. Please check and try again.');
      inputRefs.forEach((r) => { r.current.value = ''; });
      inputRefs[0].current.focus();
      return;
    }
    onNext();
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    await onResend();
    setTimer(59);
    inputRefs.forEach((r) => { r.current.value = ''; });
    inputRefs[0].current.focus();
    setResending(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black mb-2 tracking-tight">Enter Code</h1>
        <p className="text-sm text-[#47464a]">
          We sent a 6-digit code to <span className="font-semibold text-black">{email}</span>.
        </p>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="grid grid-cols-6 gap-1.5">
          {inputRefs.map((ref, idx) => (
            <input
              key={idx}
              ref={ref}
              maxLength={1}
              onKeyUp={(e) => handleKeyUp(e, idx)}
              className="w-full h-14 sm:h-16 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-2xl font-bold focus:ring-4 focus:ring-[#1b6b51]/5 focus:border-[#1b6b51] outline-none transition-all text-zinc-900"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-xl text-center">
            {error}
          </p>
        )}

        <div className="text-center">
          <p className="text-xs text-[#47464a] mb-1">Didn't receive the code?</p>
          <button
            disabled={timer > 0 || resending}
            onClick={handleResend}
            className={`text-sm font-semibold ${
              timer > 0 || resending
                ? 'text-[#47464a] cursor-not-allowed'
                : 'text-[#1b6b51] hover:underline'
            }`}
            type="button"
          >
            {resending
              ? 'Sending…'
              : timer > 0
                ? `Resend code in 0:${timer < 10 ? '0' : ''}${timer}`
                : 'Resend code now'
            }
          </button>
        </div>

        <button
          className="w-full bg-black text-white rounded-xl px-5 py-4 font-semibold tracking-wide hover:opacity-90 active:scale-[0.99] transition-all shadow-sm"
          type="submit"
        >
          Verify &amp; Proceed
        </button>
      </form>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// Step 3 — Fetch oobCode then render ResetConfirm inline
// ─────────────────────────────────────────────────────────────
function ResetPasswordStep({ email }) {
  const { sendPasswordReset } = useAuth();

  const [oobCode, setOobCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetchOobCode();
  }, []);

  const fetchOobCode = async () => {
    setLoading(true);
    setError('');
    try {
      // Send the Firebase reset email with actionCodeSettings
      // The oobCode will arrive via the reset link — we open it in a new tab
      // and intercept it, OR we just render the form and wait for the user
      // to click the link and come back. Since we can't intercept it here,
      // we instead open the reset link flow differently:
      await sendPasswordReset(email);
      // After sending, tell user to click the link in their email
      // which will open /auth/reset-confirm with the oobCode in the URL
      setOobCode('pending');
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <span className="w-10 h-10 border-4 border-[#1b6b51]/20 border-t-[#1b6b51] rounded-full animate-spin" />
        <p className="text-sm text-[#47464a]">Preparing password reset…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 flex flex-col items-center text-center gap-4 py-6">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-black tracking-tight">Something went wrong</h2>
        <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-xl w-full">
          {error}
        </p>
        <button
          onClick={fetchOobCode}
          className="w-full bg-black text-white rounded-xl px-5 py-4 font-semibold tracking-wide hover:opacity-90 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // oobCode is 'pending' — Firebase email sent, user needs to click the link
  // The link opens /auth/reset-confirm which has the full password form
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 flex flex-col items-center text-center gap-4 py-6">
      <div className="w-16 h-16 rounded-full bg-[#a6f2d1] flex items-center justify-center">
        <span className="text-3xl">📧</span>
      </div>
      <h2 className="text-xl font-bold text-black tracking-tight">One Last Step</h2>
      <p className="text-sm text-[#47464a] leading-relaxed">
        We sent a secure link to{' '}
        <span className="font-semibold text-black">{email}</span>.
        Click it and you'll be taken directly to set your new password — no extra steps.
      </p>
      <p className="text-xs text-zinc-400">Didn't get it? Check your spam folder.</p>
      <button
        onClick={fetchOobCode}
        className="w-full border border-zinc-200 text-zinc-600 rounded-xl px-5 py-3 text-sm font-medium hover:bg-zinc-50 transition-all"
      >
        Resend Link
      </button>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// Main — ForgotPasswordFlow
// ─────────────────────────────────────────────────────────────
export default function ForgotPasswordFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [email,       setEmail]       = useState('');
  const [otp,         setOtp]         = useState('');

  const handleEmailNext = (sentEmail, sentOtp) => {
    setEmail(sentEmail);
    setOtp(sentOtp);
    setCurrentStep(2);
  };

  const handleResend = async () => {
    const newOtp = generateOTP();
    setOtp(newOtp);
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      { to_email: email, otp_code: newOtp },
      PUBLIC_KEY,
    );
  };

  return (
    <div className="bg-[#fbf8ff] min-h-screen text-[#1a1b22] flex items-center justify-center p-4 antialiased">
      <main className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl border border-zinc-200/50 dark:border-zinc-700 shadow-sm p-6 sm:p-8 md:p-10 relative overflow-hidden">

        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="text-3xl font-extrabold tracking-tighter text-black">PlantAid</span>
          <div className="h-1 w-12 bg-[#1b6b51] rounded-full" />
        </div>

        {/* Progress bar */}
        <div className="flex justify-between items-center mb-10 px-4">
          {[1, 2, 3].map((step, i) => (
            <React.Fragment key={step}>
              <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${currentStep >= step ? 'bg-[#1b6b51]' : 'bg-zinc-200'}`} />
              {i < 2 && <div className="w-3" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[340px]">
          {currentStep === 1 && (
            <EmailStep onNext={handleEmailNext} />
          )}
          {currentStep === 2 && (
            <OtpVerificationStep
              email={email}
              expectedOtp={otp}
              onNext={() => setCurrentStep(3)}
              onResend={handleResend}
            />
          )}
          {currentStep === 3 && (
            <ResetPasswordStep email={email} />
          )}
        </div>

        {/* Back to login */}
        <div className="mt-10 pt-6 border-t border-zinc-100 text-center">
          
           <a className="inline-flex items-center gap-2 text-[#47464a] text-sm font-medium hover:text-black transition-colors"
            href="/auth/login"
          >
            ← Back to Login
          </a>
        </div>

        {/* Ambient blobs */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#1b6b51]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#1b6b51]/10 rounded-full blur-3xl pointer-events-none" />
      </main>
    </div>
  );
}
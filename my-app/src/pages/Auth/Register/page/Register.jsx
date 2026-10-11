import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../Service/AuthContext';

import { MdEco, MdError, MdPerson, MdMail, MdLock, MdArrowForward, MdLocalFlorist, MdCheckCircle } from 'react-icons/md';
import { IoLeaf } from 'react-icons/io5';

// ─────────────────────────────────────────────────────────────
// Success Modal — shown after successful registration
// ─────────────────────────────────────────────────────────────
function SuccessModal({ onRedirect }) {
  useEffect(() => {
    // Auto-redirect to login after 3 seconds
    const timer = setTimeout(() => onRedirect(), 3000);
    return () => clearTimeout(timer);
  }, [onRedirect]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center"
        style={{ animation: 'fadeUp 0.3s ease-out' }}
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-[#e6f9f1] flex items-center justify-center mb-5">
          <MdCheckCircle className="text-[#1b6b51] text-4xl" />
        </div>

        {/* Text */}
        <h2
          className="text-2xl font-bold text-black dark:text-white tracking-tight mb-2"
         
        >
          Account Created!
        </h2>
        <p className="text-sm text-[#47464a] leading-relaxed mb-1">
          Welcome to PlantAid. Your botanical journey begins now.
        </p>
        <p className="text-xs text-[#47464a]/60 mb-6">
          Redirecting you to login in a moment...
        </p>

        {/* Spinner bar */}
        <div className="w-full h-1 bg-[#f0eff9] rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-[#1b6b51] rounded-full"
            style={{ animation: 'progress 3s linear forwards' }}
          />
        </div>

        {/* Manual redirect button */}
        <button
          onClick={onRedirect}
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all"
         
        >
          Go to Login <MdArrowForward />
        </button>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// Register Page
// ─────────────────────────────────────────────────────────────
export default function Register() {
  const { register, loginWithGoogle, loginWithGithub, authError, clearError, currentUser } = useAuth();

  const [formData, setFormData] = useState({
    fullName:        '',
    email:           '',
    password:        '',
    confirmPassword: '',
    terms:           false,
  });

  const [localError,    setLocalError]    = useState('');
  const [isProcessing,  setIsProcessing]  = useState(false);
  const [activeFields,  setActiveFields]  = useState({});
  const [mouseOffset,   setMouseOffset]   = useState({ x: 0, y: 0 });
  // ✅ New — controls the success modal
  const [showSuccess,   setShowSuccess]   = useState(false);

  const navigate = useNavigate();

  // Parallax effect
  useEffect(() => {
    const handler = (e) => {
      setMouseOffset({
        x: (e.clientX / window.innerWidth)  * 20,
        y: (e.clientY / window.innerHeight) * 20,
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  // Redirect if already logged in (won't fire after register since we sign out immediately)


  // Clear errors when user edits form
  useEffect(() => {
    if (authError) clearError();
    if (localError) setLocalError('');
  }, [formData]);

  const handleChange = (e) => {
    const { id, type, value, checked } = e.target;
    setFormData((prev) => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    const { fullName, email, password, confirmPassword, terms } = formData;

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setLocalError('All fields are required. Please complete the form.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please check again.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (!terms) {
      setLocalError('You must agree to the Terms and Conditions to continue.');
      return;
    }

    setIsProcessing(true);
    try {
      await register(fullName.trim(), email.trim(), password);
      // ✅ Show success modal instead of redirecting to dashboard
      setShowSuccess(true);
    } catch {
      // authError is set in context
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOAuth = async (provider) => {
    setIsProcessing(true);
    try {
      const fn = provider === 'google' ? loginWithGoogle : loginWithGithub;
      await fn();
      navigate('/dashboard', { replace: true });
    } catch {
      // authError is set in context
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Called by modal — redirect to login
  const handleRedirectToLogin = () => {
    navigate('/auth/login', { replace: true });
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen text-[#1a1b22] bg-[#fbf8ff] flex flex-col relative overflow-x-hidden selection:bg-[#1b6b51]/10">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none -z-20 bg-[radial-gradient(circle_at_top_right,rgba(27,107,81,0.05),transparent_400px)] md:bg-[radial-gradient(circle_at_top_right,rgba(27,107,81,0.05),transparent_600px)]" />
      <div className="absolute inset-0 pointer-events-none -z-20 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.03),transparent_400px)]" />

      {/* Nav */}
      <nav className="w-full px-6 py-6 flex items-center justify-between max-w-7xl mx-auto absolute top-0 left-0 right-0 z-10">
        <div className="text-2xl font-bold text-black dark:text-white flex items-center gap-2 tracking-tight">
          <MdEco className="text-[#1b6b51] w-8 h-8" />
          <span>PlantAid</span>
        </div>
      </nav>

      {/* Card */}
      <main className="flex-grow flex items-center justify-center px-4 py-20 mt-10">
        <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl border border-[#c8c5ca]/50 dark:border-zinc-700 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-zinc-900/20 p-8 md:p-10 transition-all duration-300">

          <header className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white tracking-tighter mb-2">Create Account</h1>
            <p className="text-sm text-[#47464a]">Join the botanical laboratory and start your journey.</p>
          </header>

          {/* Error Banner */}
          {displayError && (
            <div className="mb-6 p-4 bg-[#ffdad6]/40 border border-[#ba1a1a]/10 rounded-xl flex items-center gap-3">
              <MdError className="text-[#ba1a1a] w-5 h-5 flex-shrink-0" />
              <span className="text-sm text-[#93000a] font-medium">{displayError}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>

            {/* Full Name */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ml-1 transition-colors duration-200 ${activeFields.fullName ? 'text-[#1b6b51]' : 'text-[#1a1b22]'}`} htmlFor="fullName">
                Full Name
              </label>
              <div className="relative flex items-center">
                <MdPerson className={`absolute left-4 w-5 h-5 transition-colors duration-200 ${activeFields.fullName ? 'text-[#1b6b51]' : 'text-[#78767b]'}`} />
                <input
                  className="w-full bg-[#f4f2fd] border border-[#c8c5ca] rounded-xl pl-12 pr-5 py-4 text-base text-[#1a1b22] placeholder:text-[#78767b] focus:outline-none focus:border-[#1b6b51] transition-all focus:ring-4 focus:ring-[#1b6b51]/5 disabled:opacity-60"
                  id="fullName" type="text" placeholder="Dr. Julian Thorne"
                  value={formData.fullName} onChange={handleChange}
                  onFocus={() => setActiveFields((p) => ({ ...p, fullName: true }))}
                  onBlur={()  => setActiveFields((p) => ({ ...p, fullName: false }))}
                  disabled={isProcessing}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className={`text-sm font-semibold ml-1 transition-colors duration-200 ${activeFields.email ? 'text-[#1b6b51]' : 'text-[#1a1b22]'}`} htmlFor="email">
                Email Address
              </label>
              <div className="relative flex items-center">
                <MdMail className={`absolute left-4 w-5 h-5 transition-colors duration-200 ${activeFields.email ? 'text-[#1b6b51]' : 'text-[#78767b]'}`} />
                <input
                  className="w-full bg-[#f4f2fd] border border-[#c8c5ca] rounded-xl pl-12 pr-5 py-4 text-base text-[#1a1b22] placeholder:text-[#78767b] focus:outline-none focus:border-[#1b6b51] transition-all focus:ring-4 focus:ring-[#1b6b51]/5 disabled:opacity-60"
                  id="email" type="email" placeholder="julian@botanical.lab"
                  value={formData.email} onChange={handleChange}
                  onFocus={() => setActiveFields((p) => ({ ...p, email: true }))}
                  onBlur={()  => setActiveFields((p) => ({ ...p, email: false }))}
                  disabled={isProcessing}
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={`text-sm font-semibold ml-1 transition-colors duration-200 ${activeFields.password ? 'text-[#1b6b51]' : 'text-[#1a1b22]'}`} htmlFor="password">
                  Password
                </label>
                <div className="relative flex items-center">
                  <MdLock className={`absolute left-4 w-5 h-5 transition-colors duration-200 ${activeFields.password ? 'text-[#1b6b51]' : 'text-[#78767b]'}`} />
                  <input
                    className="w-full bg-[#f4f2fd] border border-[#c8c5ca] rounded-xl pl-12 pr-5 py-4 text-base text-[#1a1b22] placeholder:text-[#78767b] focus:outline-none focus:border-[#1b6b51] transition-all focus:ring-4 focus:ring-[#1b6b51]/5 disabled:opacity-60"
                    id="password" type="password" placeholder="••••••••"
                    value={formData.password} onChange={handleChange}
                    onFocus={() => setActiveFields((p) => ({ ...p, password: true }))}
                    onBlur={()  => setActiveFields((p) => ({ ...p, password: false }))}
                    disabled={isProcessing}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-sm font-semibold ml-1 transition-colors duration-200 ${activeFields.confirmPassword ? 'text-[#1b6b51]' : 'text-[#1a1b22]'}`} htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <MdLock className={`absolute left-4 w-5 h-5 transition-colors duration-200 ${activeFields.confirmPassword ? 'text-[#1b6b51]' : 'text-[#78767b]'}`} />
                  <input
                    className="w-full bg-[#f4f2fd] border border-[#c8c5ca] rounded-xl pl-12 pr-5 py-4 text-base text-[#1a1b22] placeholder:text-[#78767b] focus:outline-none focus:border-[#1b6b51] transition-all focus:ring-4 focus:ring-[#1b6b51]/5 disabled:opacity-60"
                    id="confirmPassword" type="password" placeholder="••••••••"
                    value={formData.confirmPassword} onChange={handleChange}
                    onFocus={() => setActiveFields((p) => ({ ...p, confirmPassword: true }))}
                    onBlur={()  => setActiveFields((p) => ({ ...p, confirmPassword: false }))}
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-center gap-3 py-2">
              <input
                className="w-5 h-5 border-2 border-[#c8c5ca] rounded text-[#1b6b51] focus:ring-[#1b6b51]/20 cursor-pointer transition-colors"
                id="terms" type="checkbox"
                checked={formData.terms} onChange={handleChange}
                disabled={isProcessing}
              />
              <label className="text-sm text-[#47464a] cursor-pointer select-none" htmlFor="terms">
                I agree to the{' '}
                <a className="text-[#1b6b51] font-semibold hover:underline" href="#terms">Terms and Conditions</a>
              </label>
            </div>

            {/* Submit */}
            <button
              className="w-full bg-black text-white rounded-xl px-5 py-4 text-base font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-black/5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              type="submit" disabled={isProcessing}
            >
              {isProcessing ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /><span>Processing…</span></>
              ) : (
                <><span>Get Started</span><MdArrowForward className="w-5 h-5" /></>
              )}
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-zinc-400">Or sign up with</span>
              </div>
            </div>

            {/* OAuth */}
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => handleOAuth('google')} disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-zinc-200 rounded-xl hover:bg-zinc-50 active:scale-[0.98] transition-all font-medium text-zinc-600 text-sm disabled:opacity-60">
                <img alt="Google" className="w-5 h-5" src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" />
                <span>Google</span>
              </button>
              <button type="button" onClick={() => handleOAuth('github')} disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-zinc-200 rounded-xl hover:bg-zinc-50 active:scale-[0.98] transition-all font-medium text-zinc-600 text-sm disabled:opacity-60">
                <img alt="GitHub" className="w-5 h-5" src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='%2324292e' d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'/></svg>" />
                <span>GitHub</span>
              </button>
            </div>
          </form>

          <footer className="mt-8 text-center">
            <p className="text-sm text-[#47464a]">
              Already have an account?{' '}
              <Link className="text-[#1b6b51] font-bold hover:underline transition-all" to="/auth/login">Sign in</Link>
            </p>
          </footer>
        </div>
      </main>

      {/* Site Footer */}
      <footer className="w-full py-6 flex flex-col items-center gap-2 px-6 border-t border-[#c8c5ca]/30 dark:border-zinc-700 mt-auto bg-white/50 dark:bg-zinc-900/30 backdrop-blur-sm">
        <p className="text-sm text-[#1b6b51]">© 2024 PlantAid. Botanical Precision.</p>
        <div className="flex gap-6">
          <a className="text-[#47464a] text-sm hover:text-[#00513b] transition-colors" href="#privacy">Privacy Policy</a>
          <a className="text-[#47464a] text-sm hover:text-[#00513b] transition-colors" href="#help">Help Center</a>
        </div>
      </footer>

      {/* Floating Atmosphere */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden transition-transform duration-300 ease-out"
        style={{ transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)` }}
      >
        <div className="absolute top-[20%] left-[5%] opacity-10 rotate-12 animate-pulse">
          <MdEco className="text-[#1b6b51] w-24 h-24" />
        </div>
        <div className="absolute bottom-[10%] right-[5%] opacity-10 -rotate-12 animate-pulse">
          <MdLocalFlorist className="text-[#1b6b51] w-28 h-28" />
        </div>
      </div>

      {/* ✅ Success Modal — renders after successful registration */}
      {showSuccess && <SuccessModal onRedirect={handleRedirectToLogin} />}
    </div>
  );
}
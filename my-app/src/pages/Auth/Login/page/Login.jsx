import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MdEmail,
  MdVisibility,
  MdVisibilityOff,
  MdArrowForward,
  MdErrorOutline,
  MdEco,
} from 'react-icons/md';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { PiSpinnerGap } from 'react-icons/pi';
import { useAuth } from '../../Service/AuthContext';
import { logLoginActivity } from '../../Service/LoginHistory';

export default function Login() {
  const { login, loginWithGoogle, loginWithGithub, authError, clearError, currentUser } = useAuth();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember,     setRemember]     = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [animateIn,    setAnimateIn]    = useState(false);

  const navigate = useNavigate();

  useEffect(() => { setAnimateIn(true); }, []);

  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true });
  }, [currentUser, navigate]);

  useEffect(() => { if (authError) clearError(); }, [email, password]);

  // ── Handlers ──────────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(email, password);
      // ── Log login activity ─────────────────────────────────
      await logLoginActivity({
        userId: user.uid,
        email:  user.email,
        method: 'email',
      });
      navigate('/dashboard', { replace: true });
    } catch {
      // authError already set in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setIsLoading(true);
    try {
      const fn   = provider === 'google' ? loginWithGoogle : loginWithGithub;
      const user = await fn();
      // ── Log login activity ─────────────────────────────────
      await logLoginActivity({
        userId: user.uid,
        email:  user.email,
        method: provider, // 'google' or 'github'
      });
      navigate('/dashboard', { replace: true });
    } catch {
      // authError already set in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#fbf8ff] text-zinc-800 min-h-screen flex items-center justify-center p-4 relative overflow-hidden antialiased selection:bg-emerald-100 selection:text-emerald-900">

      {/* Atmospheric Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#0f766e_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <main
        className={`w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl border border-zinc-200/60 dark:border-zinc-700 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-zinc-900/20 p-8 md:p-10 relative z-10 transition-all duration-700 ease-out ${
          animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* Header */}
        <header className="mb-8 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
            <MdEco className="text-emerald-700 text-3xl" />
            <h1 className="text-zinc-950 tracking-tighter text-3xl font-extrabold">PlantAid</h1>
          </div>
          <p className="text-sm text-zinc-500">Sign in to your botanical assistant</p>
        </header>

        {/* Error Banner */}
        {authError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
            <MdErrorOutline className="text-red-500 text-xl flex-shrink-0" />
            <span className="text-sm text-red-700 font-medium">{authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-6">

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-700 ml-1" htmlFor="email">
              Email address
            </label>
            <div className="relative group">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="e.g., curator@botanical.garden"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-5 py-3.5 pr-12 text-base focus:ring-4 focus:ring-emerald-700/5 focus:border-emerald-700 outline-none transition-all text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60"
              />
              <MdEmail className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-700 transition-colors text-xl pointer-events-none" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="block text-xs font-bold text-zinc-700" htmlFor="password">
                Password
              </label>
              <a className="text-xs text-emerald-700 hover:text-emerald-800 transition-colors font-semibold" href="/auth/forgot-password">
                Forgot Password?
              </a>
            </div>
            <div className="relative group">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-5 py-3.5 pr-12 text-base focus:ring-4 focus:ring-emerald-700/5 focus:border-emerald-700 outline-none transition-all text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword
                  ? <MdVisibilityOff className="text-xl" />
                  : <MdVisibility    className="text-xl" />
                }
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-3 ml-1">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-5 h-5 rounded border-zinc-300 text-emerald-700 focus:ring-emerald-600 accent-emerald-700 cursor-pointer"
            />
            <label className="text-xs text-zinc-500 select-none cursor-pointer font-medium" htmlFor="remember">
              Remember me for 30 days
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-zinc-950 text-white rounded-xl px-5 py-4 font-semibold tracking-wide hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-xl shadow-zinc-900/10 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <PiSpinnerGap className="text-xl animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <MdArrowForward className="text-xl group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative py-2">
            <div aria-hidden="true" className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-zinc-400">Or continue with</span>
            </div>
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2.5 px-4 py-3 border border-zinc-200 rounded-xl hover:bg-zinc-50 active:scale-[0.98] transition-all font-medium text-zinc-600 text-sm disabled:opacity-60"
            >
              <img alt="Google" className="w-5 h-5" src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" />
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('github')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2.5 px-4 py-3 border border-zinc-200 rounded-xl hover:bg-zinc-50 active:scale-[0.98] transition-all font-medium text-zinc-600 text-sm disabled:opacity-60"
            >
              <FaGithub className="text-zinc-800 text-base" />
              <span>GitHub</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-zinc-100 text-center">
          <p className="text-sm text-zinc-500">
            Don't have an account?{' '}
            <Link
              to="/auth/register"
              className="text-emerald-700 font-extrabold hover:underline transition-all underline-offset-4"
            >
              Sign up
            </Link>
          </p>
        </footer>
      </main>

      {/* Visual Accent */}
      <div className="fixed bottom-12 right-12 hidden lg:block max-w-[220px] opacity-40">
        <div className="flex flex-col items-end gap-2">
          <span className="text-sm font-bold text-emerald-800 text-right">Botanical Precision.</span>
          <div className="h-px w-24 bg-emerald-700" />
          <span className="text-xs text-zinc-400 text-right leading-relaxed">
            Empowering healthcare through organic data intelligence.
          </span>
        </div>
      </div>
    </div>
  );
}
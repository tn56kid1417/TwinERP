import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../api';

import { getErrorMessage } from '../utils/error';

const Login = () => {
  const loginPageRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Pre-warm the serverless function in the background as soon as login page loads.
  // This way, by the time the user fills in credentials and clicks Sign In,
  // the cold start has already happened and the API responds instantly.
  useEffect(() => {
    loginPageRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    fetch('/api/health').catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await apiLogin(email, password);
      login(response.user, response.token);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={loginPageRef} className="h-dvh min-h-screen bg-[#f8fafc] dark:bg-[#0A0C10] bg-live-mesh flex flex-col items-center justify-start px-4 py-10 relative overflow-x-hidden overflow-y-auto overscroll-contain">
      <div className="mb-8 text-center flex flex-col items-center">
        <img src="/logo.png" alt="TwinERP Logo" className="h-16 object-contain mb-4" loading="eager" />
        <p className="text-slate-500 mt-2 text-sm">Human Resource Management System</p>
      </div>

      <div className="shrink-0 bg-white/85 dark:bg-[#0C1017]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/60 rounded-2xl w-full max-w-md p-8 shadow-2xl shadow-slate-900/10 dark:shadow-black/80 ring-1 ring-black/5 dark:ring-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 tracking-tight">Sign In to Your Account</h2>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-500 dark:text-rose-400 p-3.5 rounded-xl text-sm mb-6 flex items-center gap-2">
            {typeof error === 'string' ? error : (error as any)?.message || 'Failed to login'}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner [color-scheme:light] dark:[color-scheme:dark]"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              required
              className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner [color-scheme:light] dark:[color-scheme:dark]"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all mt-2 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Signing in...</>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

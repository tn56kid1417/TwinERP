import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../api';
import { UserCircle } from 'lucide-react';

// Hardcoded demo accounts — shown instantly, no API wait
const DEMO_ACCOUNTS = [
  { email: 'admin@example.com',   firstName: 'System',   lastName: 'Admin',          role: 'Admin',           department: 'Administration' },
  { email: 'ceo@example.com',     firstName: 'John',     lastName: 'CEO',            role: 'CEO',             department: 'Executive' },
  { email: 'cto@example.com',     firstName: 'Jane',     lastName: 'CTO',            role: 'CTO',             department: 'Executive' },
  { email: 'alice@example.com',   firstName: 'Alice',    lastName: 'Smith',          role: 'Developer',       department: 'Engineering' },
  { email: 'bob@example.com',     firstName: 'Bob',      lastName: 'Johnson',        role: 'Manager',         department: 'HR' },
  { email: 'leader@example.com',  firstName: 'Charlie',  lastName: 'Leader',         role: 'Team Leader',     department: 'Engineering' },
  { email: 'sarah@example.com',   firstName: 'Sarah',    lastName: 'CRM Lead',       role: 'Team Leader',     department: 'Sales' },
  { email: 'mike@example.com',    firstName: 'Mike',     lastName: 'Sales Rep',      role: 'Sales Rep',       department: 'Sales' },
  { email: 'mark@example.com',    firstName: 'Mark',     lastName: 'Digital Marketer', role: 'Marketing Member', department: 'Marketing' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Pre-warm the serverless function in the background as soon as login page loads.
  // This way, by the time the user fills in credentials and clicks Sign In,
  // the cold start has already happened and the API responds instantly.
  useEffect(() => {
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
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('1234');
    setError('');
    setLoading(true);
    try {
      const response = await apiLogin(demoEmail, '1234');
      login(response.user, response.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0A0C10] bg-live-mesh flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="mb-8 text-center flex flex-col items-center">
        <img src="/logo.png" alt="TwinERP Logo" className="h-16 object-contain mb-4" loading="eager" />
        <p className="text-slate-500 mt-2 text-sm">Human Resource Management System</p>
      </div>

      <div className="bg-white/85 dark:bg-[#0C1017]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/60 rounded-2xl w-full max-w-md p-8 shadow-2xl shadow-slate-900/10 dark:shadow-black/80 ring-1 ring-black/5 dark:ring-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 tracking-tight">Sign In to Your Account</h2>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-500 dark:text-rose-400 p-3.5 rounded-xl text-sm mb-6 flex items-center gap-2">
            {error}
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

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 text-center">Quick Demo Login</p>
          <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
            {DEMO_ACCOUNTS.map(emp => (
              <button
                key={emp.email}
                onClick={() => handleQuickLogin(emp.email)}
                disabled={loading}
                className="flex items-center justify-start gap-2.5 bg-slate-50/80 dark:bg-[#07090E]/80 hover:bg-slate-100 dark:hover:bg-[#121722] disabled:opacity-50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 py-2.5 px-3 rounded-xl text-xs font-medium transition-all text-left shadow-sm cursor-pointer"
              >
                <UserCircle size={15} className={`flex-shrink-0 ${emp.role === 'Admin' ? 'text-rose-500 dark:text-rose-400' : emp.role === 'CEO' || emp.role === 'CTO' ? 'text-amber-500 dark:text-amber-400' : emp.department === 'HR' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-500 dark:text-emerald-400'}`} />
                <div className="truncate flex-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{emp.firstName} {emp.lastName}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{emp.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

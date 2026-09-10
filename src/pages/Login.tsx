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
    <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center flex flex-col items-center">
        <img src="/logo.png" alt="TwinERP Logo" className="h-16 object-contain mb-4" loading="eager" />
        <p className="text-slate-500 mt-2 text-sm">Human Resource Management System</p>
      </div>

      <div className="bg-white dark:bg-[#1A1D23] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-8 shadow-2xl">
        <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-6">Sign In to Your Account</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Signing in...</>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 mb-4 text-center">Quick Demo Login</p>
          <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
            {DEMO_ACCOUNTS.map(emp => (
              <button
                key={emp.email}
                onClick={() => handleQuickLogin(emp.email)}
                disabled={loading}
                className="flex items-center justify-start gap-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg text-xs font-medium transition-colors text-left"
              >
                <UserCircle size={14} className={`flex-shrink-0 ${emp.role === 'Admin' ? 'text-rose-400' : emp.role === 'CEO' || emp.role === 'CTO' ? 'text-amber-400' : emp.department === 'HR' ? 'text-indigo-400' : 'text-emerald-400'}`} />
                <div className="truncate flex-1">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">{emp.firstName} {emp.lastName}</div>
                  <div className="text-[10px] text-slate-500 truncate">{emp.role}</div>
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

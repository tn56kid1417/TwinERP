import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, getEmployees } from '../api';
import { ShieldCheck, UserCircle, Key, Users } from 'lucide-react';
import { Employee } from '../types';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { login } = useAuth();

  useEffect(() => {
    getEmployees().then(setEmployees).catch(console.error);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await apiLogin(email, password);
      login(response.user, response.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
    }
  };

  const handleQuickLogin = (email: string) => {
    setEmail(email);
    setPassword('1234');
  };

  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center flex flex-col items-center">
        <img src="/logo.png" alt="TwinERP Logo" className="h-16 object-contain mb-4" />
        <p className="text-slate-500 dark:text-slate-500 mt-2 text-sm">Human Resource Management System</p>
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
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Email Address</label>
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
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Password</label>
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
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors mt-2"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-4 text-center">Quick Demo Login (Password: 1234)</p>
          <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
            {employees.length === 0 ? (
               <div className="col-span-2 text-center text-sm text-slate-500 py-4">Loading demo accounts...</div>
            ) : (
              employees.map(emp => (
                <button 
                  key={emp.id}
                  onClick={() => handleQuickLogin(emp.email)}
                  className="flex items-center justify-start gap-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg text-xs font-medium transition-colors text-left"
                >
                  <UserCircle size={14} className={`flex-shrink-0 ${emp.role === 'Admin' ? 'text-rose-400' : emp.role === 'CEO' ? 'text-amber-400' : emp.department === 'HR' ? 'text-indigo-400' : 'text-emerald-400'}`} />
                  <div className="truncate flex-1">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">{emp.firstName} {emp.lastName}</div>
                    <div className="text-[10px] text-slate-500 truncate">{emp.role}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

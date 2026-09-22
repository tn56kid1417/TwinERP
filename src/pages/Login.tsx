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

 useEffect(() => {
 loginPageRef.current?.scrollTo({ top: 0, behavior: 'auto' });
 // Pre-warm serverless function to eliminate cold-start on first login attempt
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
 <div
 ref={loginPageRef}
 className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
 style={{ background: 'var(--erp-bg)' }}
 >
 {/* Logo + product name */}
 <div className="mb-8 flex flex-col items-center gap-3">
 <img src="/logo.png"alt="TwinERP"className="h-10 object-contain"loading="eager"/>
 <p className="text-sm"style={{ color: 'var(--erp-text-3)' }}>
 Human Resource Management System
 </p>
 </div>

 {/* Login card — border only, no shadow + ring + blur simultaneously */}
 <div
 className="w-full max-w-sm rounded-lg p-8"
 style={{
 background: 'var(--erp-surface)',
 border: '1px solid var(--erp-border)',
 boxShadow: 'var(--shadow-panel)',
 }}
 >
 <h1
 className="text-xl font-semibold mb-6 tracking-tight"
 style={{ color: 'var(--erp-text-1)', letterSpacing: '-0.02em' }}
 >
 Sign in
 </h1>

 {error && (
 <div
 className="mb-5 px-4 py-3 rounded-md text-sm"
 style={{
 background: 'rgba(220,38,38,0.06)',
 border: '1px solid rgba(220,38,38,0.25)',
 color: 'var(--erp-danger)',
 }}
 >
 {typeof error === 'string' ? error : (error as any)?.message || 'Failed to login'}
 </div>
 )}

 <form onSubmit={handleLogin} className="space-y-4">
 <div>
 {/* Sentence-case label — never ALL-CAPS */}
 <label
 className="block text-sm font-medium mb-1.5"
 style={{ color: 'var(--erp-text-2)' }}
 >
 Email address
 </label>
 <input
 type="email"
 required
 className="erp-input"
 value={email}
 onChange={e => setEmail(e.target.value)}
 placeholder="name@company.com"
 autoComplete="email"
 />
 </div>

 <div>
 <label
 className="block text-sm font-medium mb-1.5"
 style={{ color: 'var(--erp-text-2)' }}
 >
 Password
 </label>
 <input
 type="password"
 required
 className="erp-input"
 value={password}
 onChange={e => setPassword(e.target.value)}
 placeholder="••••••••"
 autoComplete="current-password"
 />
 </div>

 {/* Primary button — solid blue, no gradient */}
 <button
 type="submit"
 disabled={loading}
 className="erp-btn-primary w-full justify-center mt-2"
 >
 {loading ? (
 <>
 <span
 className="w-4 h-4 border-2 rounded-full animate-spin inline-block"
 style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
 />
 Signing in…
 </>
 ) : 'Sign in'}
 </button>
 </form>
 </div>
 </div>
 );
};

export default Login;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Upload, Settings as SettingsIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
 const { user, login } = useAuth();
 const [firstName, setFirstName] = useState(user?.firstName || '');
 const [lastName, setLastName] = useState(user?.lastName || '');
 const [email, setEmail] = useState(user?.email || '');
 const [phone, setPhone] = useState(user?.phone || '');
 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [loading, setLoading] = useState(false);

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (password && password !== confirmPassword) {
 toast.error('Passwords do not match');
 return;
 }

 setLoading(true);
 
 // Simulate API call
 setTimeout(() => {
 if (user) {
 const updatedUser = {
 ...user,
 firstName,
 lastName,
 email,
 phone
 };
 login(updatedUser, localStorage.getItem('token') || '');
 toast.success('Profile updated successfully');
 setPassword('');
 setConfirmPassword('');
 }
 setLoading(false);
 }, 800);
 };

 return (
 <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
 <div className="mb-6 sm:mb-8 text-left">
 <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Workspace Settings</h1>
 <p className="text-sm text-slate-500 mt-1">
 Manage your personal login credentials and profile settings.
 </p>
 </div>

 <div className="relative bg-white border border-slate-200 rounded-lg overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-black/40 text-left">
 <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50 ">
 <User className="text-blue-600 dark:text-blue-600"size={22} />
 <h2 className="text-base font-bold text-slate-900">Personal Profile Settings</h2>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-6">
 {/* Mock photo upload */}
 <div className="flex items-center gap-6 p-5 border border-slate-200 rounded-xl bg-slate-50">
 <div className="w-16 h-16 bg-blue-600 text-white flex items-center justify-center rounded-lg font-bold text-2xl shadow-sm">
 {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
 </div>
 <div className="space-y-2">
 <span className="text-sm font-semibold text-slate-800 block">Profile Avatar Image</span>
 <button
 type="button"
 onClick={() => toast('Demo: Choose a local image to update profile avatar.')}
 className="px-4 py-2 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
 >
 <Upload size={14} /> Upload Photo
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-slate-600">First Name</label>
 <input
 type="text"
 value={firstName}
 onChange={(e) => setFirstName(e.target.value)}
 className="w-full text-sm py-2.5 px-4 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
 required
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-slate-600">Last Name</label>
 <input
 type="text"
 value={lastName}
 onChange={(e) => setLastName(e.target.value)}
 className="w-full text-sm py-2.5 px-4 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
 required
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-slate-600">Official Email Address</label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full text-sm py-2.5 px-4 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
 required
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-slate-600">Mobile Number</label>
 <input
 type="text"
 value={phone}
 onChange={(e) => setPhone(e.target.value)}
 placeholder="+1 (555) 000-0000"
 className="w-full text-sm py-2.5 px-4 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
 />
 </div>
 </div>

 <div className="border-t border-slate-100 pt-6 mt-8 space-y-6">
 <h3 className="text-xs font-bold text-slate-600">
 Change Password
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-slate-600">New Password</label>
 <input
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="••••••••"
 className="w-full text-sm py-2.5 px-4 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-slate-600">Confirm Password</label>
 <input
 type="password"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 placeholder="••••••••"
 className="w-full text-sm py-2.5 px-4 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
 />
 </div>
 </div>
 </div>

 <div className="flex justify-end pt-4 border-t border-slate-100">
 <button
 type="submit"
 disabled={loading}
 className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-all shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
 >
 {loading ? 'Saving...' : 'Save Profile Settings'}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
};

export default Settings;
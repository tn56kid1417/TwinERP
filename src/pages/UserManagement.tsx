import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
 Shield, Users, Search, Plus, Pencil, Trash2, KeyRound,
 X, Check, Building2, UserCheck, ShieldAlert, Filter, Phone, Mail
} from 'lucide-react';
import {
 getUsers, createUser, updateUser, deleteUser, resetUserPassword,
 getDepartments, getShifts
} from '../api';
import { UserAccount } from '../types';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/error';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = ['HR', 'TL', 'Member', 'CEO', 'COO', 'CTO', 'Admin', 'Developer', 'Sales Rep', 'Marketing'];

export default function UserManagement() {
 const { user: currentUser, canViewAll } = useAuth();

 const [users, setUsers] = useState<UserAccount[]>([]);
 const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
 const [shifts, setShifts] = useState<{ id: string; name: string }[]>([]);
 const [loading, setLoading] = useState(true);

 const [search, setSearch] = useState('');
 const [roleFilter, setRoleFilter] = useState('');
 const [statusFilter, setStatusFilter] = useState('');
 const [departmentFilter, setDepartmentFilter] = useState('');

 // Modals
 const [showAddModal, setShowAddModal] = useState(false);
 const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
 const [passwordModalUser, setPasswordModalUser] = useState<UserAccount | null>(null);
 const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null);

 const [submitting, setSubmitting] = useState(false);
 const [newPassword, setNewPassword] = useState('');

 // Form data
 const [form, setForm] = useState({
 name: '',
 email: '',
 password: '',
 phone: '',
 role: 'Member',
 department: 'Engineering',
 designation: '',
 shift: 'Morning',
 status: 'Active' as 'Active' | 'Resigned' | 'Terminated',
 });

 const loadData = useCallback(async () => {
 try {
 setLoading(true);
 const [userRes, deptRes, shiftRes] = await Promise.all([
 getUsers({
 search: search || undefined,
 role: roleFilter || undefined,
 status: statusFilter || undefined,
 department: departmentFilter || undefined,
 }).catch(() => ({ data: [], total: 0 })),
 getDepartments().catch(() => []),
 getShifts().catch(() => []),
 ]);

 setUsers(userRes.data || (Array.isArray(userRes) ? userRes : []));
 setDepartments(Array.isArray(deptRes) ? deptRes : []);
 setShifts(Array.isArray(shiftRes) ? shiftRes : []);
 } catch {
 toast.error('Failed to load user list');
 } finally {
 setLoading(false);
 }
 }, [search, roleFilter, statusFilter, departmentFilter]);

 useEffect(() => {
 loadData();
 }, [loadData]);

 const openAdd = () => {
 setEditingUser(null);
 setForm({
 name: '',
 email: '',
 password: '',
 phone: '',
 role: 'Member',
 department: departments[0]?.name || 'Engineering',
 designation: 'Team Member',
 shift: 'Morning',
 status: 'Active',
 });
 setShowAddModal(true);
 };

 const openEdit = (u: UserAccount) => {
 setEditingUser(u);
 setForm({
 name: u.name,
 email: u.email,
 password: '',
 phone: u.phone || '',
 role: u.role,
 department: u.department,
 designation: u.designation || '',
 shift: u.shift || 'Morning',
 status: u.status,
 });
 setShowAddModal(true);
 };

 const handleSaveUser = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!form.name || !form.email) {
 toast.error('Name and email are required');
 return;
 }
 if (!editingUser && (!form.password || form.password.length < 6)) {
 toast.error('Password must be at least 6 characters');
 return;
 }

 try {
 setSubmitting(true);
 if (editingUser) {
 await updateUser(editingUser.id, form);
 toast.success(`User "${form.name}"updated`);
 } else {
 await createUser(form);
 toast.success(`User "${form.name}"created successfully`);
 }
 setShowAddModal(false);
 loadData();
 } catch (err: any) {
 toast.error(getErrorMessage(err, 'Failed to save user'));
 } finally {
 setSubmitting(false);
 }
 };

 const handleResetPassword = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!passwordModalUser || newPassword.length < 6) {
 toast.error('Password must be at least 6 characters');
 return;
 }
 try {
 setSubmitting(true);
 await resetUserPassword(passwordModalUser.id, newPassword);
 toast.success(`Password for ${passwordModalUser.name} has been reset`);
 setPasswordModalUser(null);
 setNewPassword('');
 } catch {
 toast.error('Failed to reset password');
 } finally {
 setSubmitting(false);
 }
 };

 const handleDelete = async () => {
 if (!deleteTarget) return;
 try {
 await deleteUser(deleteTarget.id);
 toast.success(`User "${deleteTarget.name}"deactivated`);
 setDeleteTarget(null);
 loadData();
 } catch {
 toast.error('Failed to deactivate user');
 }
 };

 const getRoleBadge = (role?: string) => {
 const r = role?.toLowerCase() || '';
 if (r === 'admin' || r === 'ceo') {
 return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">{role}</span>;
 }
 if (r === 'hr') {
 return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">HR</span>;
 }
 if (r.includes('lead') || r === 'tl') {
 return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">{role}</span>;
 }
 return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600/10 text-blue-600 border border-blue-600/20">{role}</span>;
 };

 const getStatusBadge = (status: string) => {
 if (status === 'Active') {
 return <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] uppercase font-bold tracking-widest">Active</span>;
 }
 return <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] uppercase font-bold tracking-widest">{status}</span>;
 };

 return (
 <motion.div
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4 }}
 className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col min-h-full space-y-4 sm:space-y-6"
 >
 {/* Top Header */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3">
 <Shield className="text-blue-600 dark:text-blue-600 h-7 w-7 sm:h-8 sm:w-8"/>
 User Management & Access Control
 </h1>
 <p className="text-slate-500 text-xs sm:text-sm mt-1">
 Manage employee logins, assign organizational roles, and configure system permissions.
 </p>
 </div>

 {canViewAll && (
 <button
 onClick={openAdd}
 className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md transition-all shadow-md shadow-blue-600/30 active:scale-95"
 >
 <Plus size={16} /> Add User
 </button>
 )}
 </div>

 {/* Metrics Row */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="relative bg-white rounded-lg border border-slate-200 p-5 shadow-sm overflow-hidden">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-xs font-bold text-slate-500">Total User Accounts</p>
 <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{users.length}</h3>
 </div>
 <div className="p-3 bg-blue-600/10 text-blue-600 dark:text-blue-600 rounded-xl">
 <Users size={22} />
 </div>
 </div>
 </div>

 <div className="relative bg-white rounded-lg border border-slate-200 p-5 shadow-sm overflow-hidden">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-xs font-bold text-slate-500">Active Accounts</p>
 <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
 {users.filter(u => u.status === 'Active').length}
 </h3>
 </div>
 <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
 <UserCheck size={22} />
 </div>
 </div>
 </div>

 <div className="relative bg-white rounded-lg border border-slate-200 p-5 shadow-sm overflow-hidden">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-xs font-bold text-slate-500">Privileged Roles (Admin/HR/TL)</p>
 <h3 className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
 {users.filter(u => ['admin', 'hr', 'tl', 'ceo', 'sales team leader'].includes(u.role?.toLowerCase())).length}
 </h3>
 </div>
 <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
 <Shield size={22} />
 </div>
 </div>
 </div>
 </div>

 {/* Filter and Search Bar */}
 <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white/80/80 p-3 rounded-lg border border-slate-200">
 <div className="relative flex-1 w-full sm:w-auto">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
 <input
 type="text"
 placeholder="Search by name or email..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-9 pr-4 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 transition-colors"
 />
 </div>

 <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
 <select
 value={roleFilter}
 onChange={(e) => setRoleFilter(e.target.value)}
 className="px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-md text-xs text-slate-800 outline-none"
 >
 <option value="">All Roles</option>
 {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
 </select>

 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-md text-xs text-slate-800 outline-none"
 >
 <option value="">All Statuses</option>
 <option value="Active">Active</option>
 <option value="Terminated">Terminated</option>
 </select>

 {(search || roleFilter || statusFilter) && (
 <button
 onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}
 className="px-3 py-2 text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1"
 >
 <X size={14} /> Clear
 </button>
 )}
 </div>
 </div>

 {/* Users Table */}
 <div className="relative bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">

 {loading ? (
 <div className="p-12 text-center">
 <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"/>
 </div>
 ) : users.length === 0 ? (
 <div className="p-12 text-center text-slate-500 text-xs">No users matching filter criteria.</div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full min-w-[700px] text-left text-sm">
 <thead className="bg-slate-50/75 text-slate-500 uppercase text-xs font-medium tracking-wider border-b border-slate-200">
 <tr>
 <th className="py-4 px-6">User / Account</th>
 <th className="py-4 px-6">Role & Designation</th>
 <th className="py-4 px-6">Department & Shift</th>
 <th className="py-4 px-6">Status</th>
 <th className="py-4 px-6 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
 {users.map((u) => {
 const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
 return (
 <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
 <td className="py-4 px-6">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
 {initials}
 </div>
 <div>
 <div className="font-bold text-slate-900">{u.name}</div>
 <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
 <Mail size={12} /> {u.email}
 </div>
 </div>
 </div>
 </td>

 <td className="py-4 px-6">
 <div>{getRoleBadge(u.role)}</div>
 <div className="text-xs text-slate-400 mt-1">{u.designation || u.role}</div>
 </td>

 <td className="py-4 px-6 text-slate-600">
 <div className="flex items-center gap-1.5">
 <Building2 size={14} className="text-slate-400"/>
 <span>{u.department}</span>
 </div>
 <div className="text-xs text-slate-400 mt-0.5">{u.shift || 'Morning'} Shift</div>
 </td>

 <td className="py-4 px-6">
 {getStatusBadge(u.status)}
 </td>

 <td className="py-4 px-6 text-right">
 <div className="flex items-center justify-end gap-1.5">
 <button
 onClick={() => openEdit(u)}
 className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
 title="Edit User"
 >
 <Pencil size={16} />
 </button>

 <button
 onClick={() => { setPasswordModalUser(u); setNewPassword(''); }}
 className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
 title="Reset Password"
 >
 <KeyRound size={16} />
 </button>

 <button
 onClick={() => setDeleteTarget(u)}
 className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
 title="Deactivate User"
 >
 <Trash2 size={16} />
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* Add / Edit User Modal */}
 <AnimatePresence>
 {showAddModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
 <motion.div
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="w-full max-w-lg bg-white border border-slate-200/80 rounded-lg shadow-lg p-6"
 >
 <div className="flex justify-between items-center pb-3 border-b border-slate-100">
 <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
 <Users className="text-blue-600"size={18} />
 {editingUser ? `Edit User — ${editingUser.name}` : 'Create User Account'}
 </h3>
 <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
 <X size={16} />
 </button>
 </div>

 <form onSubmit={handleSaveUser} className="space-y-4 pt-4">
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Full Name *
 </label>
 <input
 type="text"
 required
 value={form.name}
 onChange={(e) => setForm({ ...form, name: e.target.value })}
 placeholder="e.g. John Doe"
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Email Address *
 </label>
 <input
 type="email"
 required
 value={form.email}
 onChange={(e) => setForm({ ...form, email: e.target.value })}
 placeholder="john@example.com"
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>
 </div>

 {!editingUser && (
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Initial Password *
 </label>
 <input
 type="password"
 required
 value={form.password}
 onChange={(e) => setForm({ ...form, password: e.target.value })}
 placeholder="Min 6 characters"
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>
 )}

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Role *
 </label>
 <select
 value={form.role}
 onChange={(e) => setForm({ ...form, role: e.target.value })}
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 >
 {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
 </select>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Department
 </label>
 <select
 value={form.department}
 onChange={(e) => setForm({ ...form, department: e.target.value })}
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 >
 {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
 {departments.length === 0 && ['Engineering', 'Sales', 'HR', 'Marketing'].map(d => (
 <option key={d} value={d}>{d}</option>
 ))}
 </select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Designation
 </label>
 <input
 type="text"
 value={form.designation}
 onChange={(e) => setForm({ ...form, designation: e.target.value })}
 placeholder="e.g. Senior Architect"
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Shift
 </label>
 <select
 value={form.shift}
 onChange={(e) => setForm({ ...form, shift: e.target.value })}
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 >
 <option value="Morning">Morning Shift</option>
 <option value="Evening">Evening Shift</option>
 <option value="Night">Night Shift</option>
 </select>
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-3">
 <button
 type="button"
 onClick={() => setShowAddModal(false)}
 className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-md"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-md shadow-blue-600/30"
 >
 {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Reset Password Modal */}
 <AnimatePresence>
 {passwordModalUser && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
 <motion.div
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="w-full max-w-sm bg-white border border-slate-200/80 rounded-lg shadow-lg p-6"
 >
 <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
 <KeyRound className="text-blue-600"size={18} /> Reset Password
 </h3>
 <p className="text-xs text-slate-500 mt-1">Set a new login password for {passwordModalUser.name}.</p>

 <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 New Password (min 6 chars)
 </label>
 <input
 type="password"
 required
 value={newPassword}
 onChange={(e) => setNewPassword(e.target.value)}
 placeholder="Enter new password"
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>

 <div className="flex justify-end gap-2 pt-2">
 <button
 type="button"
 onClick={() => setPasswordModalUser(null)}
 className="px-3 py-1.5 text-xs text-slate-500"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md"
 >
 Reset
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Delete / Deactivate Confirm */}
 <AnimatePresence>
 {deleteTarget && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
 <motion.div
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="w-full max-w-sm bg-white border border-slate-200/80 rounded-lg shadow-lg p-6"
 >
 <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
 <Trash2 className="text-rose-500"size={18} /> Deactivate User
 </h3>
 <p className="text-xs text-slate-500 mt-2">
 Are you sure you want to deactivate <b>{deleteTarget.name}</b> ({deleteTarget.email})? Login access will be revoked immediately.
 </p>
 <div className="flex justify-end gap-3 mt-6">
 <button
 onClick={() => setDeleteTarget(null)}
 className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-md"
 >
 Cancel
 </button>
 <button
 onClick={handleDelete}
 className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-md"
 >
 Deactivate
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </motion.div>
 );
}
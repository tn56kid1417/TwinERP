import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { UserMinus, Check, X, Tag } from 'lucide-react';
import { getEmployees, getResignations, addResignation, updateResignationStatus } from '../api';
import { Employee, Resignation } from '../types';
import { getErrorMessage } from '../utils/error';
import { useAuth } from '../context/AuthContext';

const Resignations = () => {
 const { user, canViewAll, canEdit, userRoleCategory, canApprove } = useAuth();
 const showForm = canEdit || !canViewAll;

 const [employees, setEmployees] = useState<Employee[]>([]);
 const [resignations, setResignations] = useState<Resignation[]>([]);
 
 const [formData, setFormData] = useState({
 employeeId: user?.id || '',
 lastWorkingDate: '',
 reason: ''
 });
 
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(true);

 const loadData = async () => {
 try {
 const [emps, resigs] = await Promise.all([getEmployees(), getResignations()]);
 setEmployees(emps);
 setResignations(canViewAll ? resigs : resigs.filter(r => r.employeeId === user?.id));
 if (canViewAll && emps.length > 0 && !formData.employeeId) {
 setFormData(prev => ({ ...prev, employeeId: emps[0].id }));
 }
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 loadData();
 }, []);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');
 
 if (!formData.lastWorkingDate || !formData.reason) {
 setError('Please fill in all required fields');
 return;
 }

 try {
 await addResignation({ ...formData, submittedByRole: userRoleCategory });
 await loadData();
 setFormData({ ...formData, reason: '', lastWorkingDate: '' });
 } catch (err: any) {
 setError(getErrorMessage(err, 'Failed to submit resignation'));
 }
 };

 const handleUpdateStatus = async (id: string, status: string) => {
 try {
 await updateResignationStatus(id, status, user?.firstName + ' ' + user?.lastName);
 await loadData();
 } catch (err) {
 console.error(err);
 }
 };

 const getEmpName = (id: string) => {
 const emp = employees.find(e => e.id === id);
 return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
 };

 const getStatusBadge = (status: string) => {
 switch (status) {
 case 'Approved':
 return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] uppercase font-bold tracking-widest">{status}</span>;
 case 'Rejected':
 return <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px] uppercase font-bold tracking-widest">{status}</span>;
 default:
 return <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] uppercase font-bold tracking-widest">{status}</span>;
 }
 };

 return (
 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col">
 <div className="mb-6 sm:mb-8">
 <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight">Manage Resignations</h1>
 <p className="text-slate-500 mt-1 text-sm">Submit and track employee resignations.</p>
 </div>

 <div className={`grid grid-cols-1 gap-8 flex-1 min-h-0 ${showForm ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
 {showForm && (<div className="lg:col-span-1">
 <div className="relative bg-white rounded-lg border border-slate-200 p-6 shadow-lg shadow-slate-200/50 dark:shadow-black/40 overflow-hidden">
 <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
 <UserMinus size={18} className="text-blue-600 dark:text-blue-600"/>
 New Resignation
 </h2>
 
 {error && (
 <div className="bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 p-3 rounded-xl text-xs mb-4">
 {typeof error === 'string' ? error : (error as any)?.message || 'Failed to submit resignation'}
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-4">
 {canEdit && (
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Employee</label>
 <select 
 className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm cursor-pointer"
 value={formData.employeeId}
 onChange={e => setFormData({...formData, employeeId: e.target.value})}
 required
 >
 <option value=""className="bg-white text-slate-400">Select Employee</option>
 {employees.map(emp => (
 <option key={emp.id} value={emp.id} className="bg-white text-slate-800">{emp.firstName} {emp.lastName}</option>
 ))}
 </select>
 </div>
 )}

 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Last Working Date</label>
 <input type="date"required className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm [color-scheme:light] dark:[color-scheme:dark]"
 value={formData.lastWorkingDate} onChange={e => setFormData({...formData, lastWorkingDate: e.target.value})} />
 </div>

 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Reason</label>
 <textarea 
 required 
 className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all h-24 resize-none shadow-sm"
 value={formData.reason} 
 onChange={e => setFormData({...formData, reason: e.target.value})}
 placeholder="State the reason for resignation..."
 ></textarea>
 </div>

 <button type="submit"className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer mt-6">
 Submit Resignation
 </button>
 </form>
 </div>
 </div>

 )}<div className={`flex flex-col min-h-0 ${showForm ? 'lg:col-span-2' : 'max-w-5xl mx-auto w-full'}`}>
 <div className="bg-white /70 rounded-lg border border-slate-200 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden flex-1 flex flex-col">
 <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
 <h2 className="text-sm font-semibold text-slate-900">Resignations List</h2>
 </div>
 
 <div className="flex-1 overflow-x-auto">
 <table className="w-full min-w-[550px] text-left border-collapse">
 <thead>
 <tr className="bg-slate-50 text-[10px] text-slate-500 border-b border-slate-200/50">
 <th className="px-6 py-3 font-semibold">Employee</th>
 <th className="px-6 py-3 font-semibold">Last Working Date</th>
 <th className="px-6 py-3 font-semibold">Reason</th>
 <th className="px-6 py-3 font-semibold">Status</th>
 {canEdit && <th className="px-6 py-3 font-semibold text-right">Actions</th>}
 </tr>
 </thead>
 <tbody className="text-xs">
 {loading ? (
 <tr>
 <td colSpan={canEdit ? 5 : 4} className="px-6 py-8 text-center text-slate-500">Loading...</td>
 </tr>
 ) : resignations.length === 0 ? (
 <tr>
 <td colSpan={canEdit ? 5 : 4} className="px-6 py-16 text-center text-slate-500">
 <div className="flex flex-col items-center justify-center space-y-3">
 <Tag size={32} className="text-slate-700"/>
 <div>
 <p className="text-sm text-slate-700 font-medium">No Resignations found</p>
 <p className="text-xs text-slate-500 mt-1">Get started by creating your first Resignation.</p>
 </div>
 </div>
 </td>
 </tr>
 ) : (
 resignations.map((res, idx) => (
 <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }} key={res.id} className="border-b border-slate-200/50 hover:bg-blue-50/40 transition-colors">
 <td className="px-6 py-4 font-medium text-slate-800">{getEmpName(res.employeeId)}</td>
 <td className="px-6 py-4 text-slate-600">{res.lastWorkingDate}</td>
 <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{res.reason}</td>
 <td className="px-6 py-4">
 {getStatusBadge(res.status)}
 </td>
 {canEdit && (
 <td className="px-6 py-4 text-right">
 {res.status === 'Pending' && canApprove(res.submittedByRole) ? (
 <div className="flex items-center justify-end gap-2">
 <button 
 onClick={() => handleUpdateStatus(res.id, 'Approved')}
 className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
 title="Approve"
 >
 <Check size={14} />
 </button>
 <button 
 onClick={() => handleUpdateStatus(res.id, 'Rejected')}
 className="w-6 h-6 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors"
 title="Reject"
 >
 <X size={14} />
 </button>
 </div>
 ) : res.status === 'Pending' ? (
 <span className="text-[10px] text-slate-500 font-medium ">
 Pending
 </span>
 ) : null}
 {res.status !== 'Pending' && (
 <span className="text-[10px] text-slate-500 font-medium ">
 {res.approvedBy ? `By ${res.approvedBy}` : 'Processed'}
 </span>
 )}
 </td>
 )}
 </motion.tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 );
};

export default Resignations;
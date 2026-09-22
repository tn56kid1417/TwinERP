import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle, XCircle, Clock, Check, X } from 'lucide-react';
import { getLeaves, requestLeave, getEmployees, updateLeaveStatus } from '../api';
import { LeaveRequest, Employee } from '../types';
import { format } from 'date-fns';
import { getErrorMessage } from '../utils/error';
import { useAuth } from '../context/AuthContext';

const LeaveRequests = () => {
 const { user, canViewAll, canEdit, userRoleCategory, canApprove } = useAuth();
 const showForm = canEdit || !canViewAll;

 const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
 const [employees, setEmployees] = useState<Employee[]>([]);
 const [formData, setFormData] = useState<{employeeId: string, leaveType: any, startDate: string, endDate: string}>({
 employeeId: user?.id || '', leaveType: 'Casual', startDate: '', endDate: ''
 });
 const [error, setError] = useState('');

 const loadData = async () => {
 try {
 const [lvs, emps] = await Promise.all([getLeaves(), getEmployees()]);
 setLeaves(canViewAll ? lvs : lvs.filter(l => l.employeeId === user?.id));
 setEmployees(emps);
 if (canViewAll && emps.length > 0 && !formData.employeeId) {
 setFormData(prev => ({...prev, employeeId: emps[0].id}));
 }
 } catch (err) {
 console.error(err);
 }
 };

 useEffect(() => {
 loadData();
 }, []);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');
 try {
 await requestLeave({ ...formData, submittedByRole: userRoleCategory });
 setFormData({...formData, startDate: '', endDate: ''});
 loadData();
 } catch (err: any) {
 setError(getErrorMessage(err, 'Failed to submit leave request'));
 }
 };

 const handleUpdateStatus = async (id: string, status: string) => {
 try {
 await updateLeaveStatus(id, status, user?.firstName + ' ' + user?.lastName);
 await loadData();
 } catch (err) {
 console.error(err);
 }
 };

 const getStatusIcon = (status: string) => {
 switch (status) {
 case 'Approved': return <CheckCircle size={16} className="text-green-500"/>;
 case 'Rejected': return <XCircle size={16} className="text-red-500"/>;
 default: return <Clock size={16} className="text-orange-500"/>;
 }
 };

 const getEmpName = (id: string) => {
 const emp = employees.find(e => e.id === id);
 return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
 };

 return (
 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col">
 <div className="mb-6 sm:mb-8">
 <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight">Leave Management</h1>
 <p className="text-slate-500 mt-1 text-sm">Request and manage employee time off.</p>
 </div>

 <div className={`grid grid-cols-1 gap-8 flex-1 min-h-0 ${showForm ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
 {showForm && (<div className="lg:col-span-1">
 <div className="relative bg-white rounded-lg border border-slate-200 p-6 shadow-lg shadow-slate-200/50 dark:shadow-black/40 overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/5">
 <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
 <CalendarIcon size={18} className="text-blue-600"/>
 New Request
 </h2>
 
 {error && (
 <div className="bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 p-3 rounded-xl text-xs mb-4">
 {typeof error === 'string' ? error : (error as any)?.message || 'Failed to submit leave request'}
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-4">
 {canViewAll && (
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
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Leave Type</label>
 <select 
 className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm cursor-pointer"
 value={formData.leaveType}
 onChange={e => setFormData({...formData, leaveType: e.target.value})}
 >
 <option value="Sick"className="bg-white text-slate-800">Sick Leave</option>
 <option value="Casual"className="bg-white text-slate-800">Casual Leave</option>
 <option value="Earned"className="bg-white text-slate-800">Earned Leave</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Start Date</label>
 <input required type="date"className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
 value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
 </div>

 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">End Date</label>
 <input required type="date"className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
 value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
 </div>

 <button type="submit"className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer mt-6">
 Submit Request
 </button>
 </form>
 </div>
 </div>

 )}<div className={`flex flex-col min-h-0 ${showForm ? 'lg:col-span-2' : 'max-w-5xl mx-auto w-full'}`}>
 <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
 <div className="flex-1 overflow-x-auto">
 <table className="w-full min-w-[550px] text-left border-collapse">
 <thead>
 <tr className="bg-white/50 text-[10px] text-slate-500 border-b border-slate-200/50">
 <th className="px-6 py-3 font-semibold">Employee</th>
 <th className="px-6 py-3 font-semibold">Type</th>
 <th className="px-6 py-3 font-semibold">Duration</th>
 <th className="px-6 py-3 font-semibold text-right">Status</th>
 </tr>
 </thead>
 <tbody className="text-xs">
 {leaves.map((leave, idx) => (
 <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }} key={leave.id} className="border-b border-slate-200/50 hover:bg-slate-800/30 transition-colors">
 <td className="px-6 py-4 font-medium text-slate-800">{getEmpName(leave.employeeId)}</td>
 <td className="px-6 py-4 text-slate-500">{leave.leaveType}</td>
 <td className="px-6 py-4 text-slate-500">
 {leave.startDate} <span className="text-slate-600">to</span> {leave.endDate}
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-2">
 {leave.status === 'Pending' && canApprove(leave.submittedByRole) ? (
 <>
 <button 
 onClick={() => handleUpdateStatus(leave.id, 'Approved')}
 className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
 title="Approve"
 >
 <Check size={14} />
 </button>
 <button 
 onClick={() => handleUpdateStatus(leave.id, 'Rejected')}
 className="w-6 h-6 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors"
 title="Reject"
 >
 <X size={14} />
 </button>
 </>
 ) : (
 <div className="flex items-center gap-1.5 justify-end">
 {getStatusIcon(leave.status)}
 <span className="font-medium text-slate-700">{leave.status}</span>
 </div>
 )}
 </div>
 </td>
 </motion.tr>
 ))}
 {leaves.length === 0 && (
 <tr>
 <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No leave requests found.</td>
 </tr>
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

export default LeaveRequests;
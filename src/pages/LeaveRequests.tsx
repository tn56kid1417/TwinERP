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
      case 'Approved': return <CheckCircle size={16} className="text-green-500" />;
      case 'Rejected': return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-orange-500" />;
    }
  };

  const getEmpName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Leave Management</h1>
        <p className="text-slate-500 dark:text-slate-500 mt-1 text-sm">Request and manage employee time off.</p>
      </div>

      <div className={`grid grid-cols-1 gap-8 flex-1 min-h-0 ${showForm ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        {showForm && (<div className="lg:col-span-1">
          <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-lg shadow-slate-200/50 dark:shadow-black/40 overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/5">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent pointer-events-none" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <CalendarIcon size={18} className="text-indigo-500" />
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
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Employee</label>
                  <select 
                    className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner cursor-pointer"
                    value={formData.employeeId}
                    onChange={e => setFormData({...formData, employeeId: e.target.value})}
                    required
                  >
                    <option value="" className="bg-white dark:bg-[#0C1017] text-slate-400">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id} className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Leave Type</label>
                <select 
                  className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner cursor-pointer"
                  value={formData.leaveType}
                  onChange={e => setFormData({...formData, leaveType: e.target.value})}
                >
                  <option value="Sick" className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">Sick Leave</option>
                  <option value="Casual" className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">Casual Leave</option>
                  <option value="Earned" className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">Earned Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Start Date</label>
                <input required type="date" className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner"
                  value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">End Date</label>
                <input required type="date" className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner"
                  value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] cursor-pointer mt-6">
                Submit Request
              </button>
            </form>
          </div>
        </div>

        )}<div className={`flex flex-col min-h-0 ${showForm ? 'lg:col-span-2' : 'max-w-5xl mx-auto w-full'}`}>
          <div className="bg-white dark:bg-[#1A1D23] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex-1 flex flex-col">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full min-w-[550px] text-left border-collapse">
                <thead>
                  <tr className="bg-white/50 dark:bg-slate-900/50 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800/50">
                    <th className="px-6 py-3 font-semibold">Employee</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Duration</th>
                    <th className="px-6 py-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {leaves.map((leave, idx) => (
                    <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }} key={leave.id} className="border-b border-slate-200/80 dark:border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{getEmpName(leave.employeeId)}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-500 dark:text-slate-400">{leave.leaveType}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-500 dark:text-slate-400">
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
                              <span className="font-medium text-slate-700 dark:text-slate-300">{leave.status}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {leaves.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-500">No leave requests found.</td>
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

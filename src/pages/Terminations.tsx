import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { UserX, Check, X, ShieldAlert, Tag } from 'lucide-react';
import { getEmployees, getTerminations, addTermination, updateTerminationStatus } from '../api';
import { Employee, Termination } from '../types';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';

const Terminations = () => {
  const { user, canViewAll, canEdit, userRoleCategory, canApprove } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [terminations, setTerminations] = useState<Termination[]>([]);
  
  const [formData, setFormData] = useState({
    employeeId: '',
    terminationType: 'Involuntary',
    noticeDate: '',
    terminationDate: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [terminateModalOpen, setTerminateModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [emps, terms] = await Promise.all([getEmployees(), getTerminations()]);
      setEmployees(emps);
      setTerminations(terms);
      if (emps.length > 0 && !formData.employeeId) {
        setFormData(prev => ({ ...prev, employeeId: emps[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewAll) {
      loadData();
    }
  }, [canViewAll]);

  if (!canViewAll) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.noticeDate || !formData.terminationDate) {
      setError('Please fill in all required fields');
      return;
    }
    
    setTerminateModalOpen(true);
  };

  const handleConfirmTerminate = async () => {
    try {
      await addTermination({ ...formData, submittedByRole: userRoleCategory });
      await loadData();
      setFormData({ ...formData, noticeDate: '', terminationDate: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit termination');
    } finally {
      setTerminateModalOpen(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateTerminationStatus(id, status, user?.firstName + ' ' + user?.lastName);
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
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Manage Terminations</h1>
          <p className="text-slate-500 dark:text-slate-500 mt-1">Process and track employee terminations.</p>
        </div>
        <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
          <ShieldAlert size={14} /> HR Admin Only
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-8 flex-1 min-h-0 ${canEdit ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        {canEdit && (
          <div className="lg:col-span-1">
            <div className="relative bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-rose-500/30 p-6 shadow-2xl shadow-black/40 overflow-hidden ring-1 ring-white/5">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/80 to-transparent pointer-events-none" />
              <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                <UserX size={18} className="text-rose-400" />
                New Termination
              </h2>
              
              {error && (
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 rounded-xl text-xs mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Employee</label>
                <select 
                  className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/25 transition-all shadow-inner cursor-pointer"
                  value={formData.employeeId}
                  onChange={e => setFormData({...formData, employeeId: e.target.value})}
                  required
                >
                  <option value="" className="bg-[#0C1017] text-slate-400">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id} className="bg-[#0C1017] text-slate-100">{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Termination Type</label>
                <select 
                  className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/25 transition-all shadow-inner cursor-pointer"
                  value={formData.terminationType}
                  onChange={e => setFormData({...formData, terminationType: e.target.value})}
                  required
                >
                  <option value="Voluntary" className="bg-[#0C1017] text-slate-100">Voluntary</option>
                  <option value="Involuntary" className="bg-[#0C1017] text-slate-100">Involuntary</option>
                  <option value="Mutual Agreement" className="bg-[#0C1017] text-slate-100">Mutual Agreement</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Notice Date</label>
                <input type="date" required className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/25 transition-all shadow-inner [color-scheme:dark]"
                  value={formData.noticeDate} onChange={e => setFormData({...formData, noticeDate: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Termination Date</label>
                <input type="date" required className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/25 transition-all shadow-inner [color-scheme:dark]"
                  value={formData.terminationDate} onChange={e => setFormData({...formData, terminationDate: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 text-white font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-500/25 active:scale-[0.98] cursor-pointer mt-6">
                Process Termination
              </button>
            </form>
          </div>
        </div>
        )}

        <div className={`${canEdit ? 'lg:col-span-2' : 'max-w-5xl'} flex flex-col min-h-0`}>
          <div className="bg-white dark:bg-[#1A1D23] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Terminations List</h2>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-white/50 dark:bg-slate-900/50 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800/50">
                    <th className="px-6 py-3 font-semibold">Employee</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Notice Date</th>
                    <th className="px-6 py-3 font-semibold">Termination Date</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    {canEdit && <th className="px-6 py-3 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-500">Loading...</td>
                    </tr>
                  ) : terminations.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="px-6 py-16 text-center text-slate-500 dark:text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <Tag size={32} className="text-slate-700" />
                          <div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">No Terminations found</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Get started by creating your first Termination.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    terminations.map((res, idx) => (
                      <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }} key={res.id} className="border-b border-slate-200/80 dark:border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{getEmpName(res.employeeId)}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-500 dark:text-slate-400">{res.terminationType}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-500 dark:text-slate-400">{res.noticeDate}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-500 dark:text-slate-400">{res.terminationDate}</td>
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
                              <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium uppercase tracking-widest">
                                Pending
                              </span>
                            ) : null}
                            {res.status !== 'Pending' && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium uppercase tracking-widest">
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

      <ConfirmationModal
        isOpen={terminateModalOpen}
        title="Confirm Termination"
        message={`Are you sure you want to proceed with this termination? This action will change the employee's status and cannot be undone easily.`}
        confirmText="Terminate Employee"
        onConfirm={handleConfirmTerminate}
        onCancel={() => setTerminateModalOpen(false)}
      />
    </motion.div>
  );
};

export default Terminations;

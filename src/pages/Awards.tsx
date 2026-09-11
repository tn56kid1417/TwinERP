import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { Award as AwardIcon, Plus, Trash2, Gift, ShieldAlert } from 'lucide-react';
import { getEmployees, getAwards, addAward, deleteAward } from '../api';
import { Employee, Award } from '../types';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';

const Awards = () => {
  const { user, canViewAll, canEdit } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  
  const [formData, setFormData] = useState({
    employeeId: '',
    awardType: '',
    date: '',
    gift: '',
    description: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [awardToDelete, setAwardToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (canViewAll) {
      loadData();
    }
  }, [canViewAll]);

  if (!canViewAll) {
    return <Navigate to="/" replace />;
  }

  const loadData = async () => {
    try {
      const [emps, awds] = await Promise.all([getEmployees(), getAwards()]);
      setEmployees(emps);
      setAwards(awds);
      if (emps.length > 0 && !formData.employeeId) {
        setFormData(prev => ({ ...prev, employeeId: emps[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.awardType || !formData.date || !formData.gift) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await addAward(formData);
      await loadData();
      setFormData({ ...formData, awardType: '', date: '', gift: '', description: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign award');
    }
  };

  const confirmDelete = (id: string) => {
    setAwardToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!awardToDelete) return;
    try {
      await deleteAward(awardToDelete);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteModalOpen(false);
      setAwardToDelete(null);
    }
  };

  const getEmpName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Manage Awards</h1>
        <p className="text-slate-500 dark:text-slate-500 mt-1">Recognize and reward employee achievements.</p>
      </div>

      <div className={`grid grid-cols-1 gap-8 flex-1 min-h-0 ${canEdit ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        {canEdit && (
          <div className="lg:col-span-1">
            <div className="relative bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-700/60 dark:border-slate-700/50 p-6 shadow-2xl shadow-black/40 overflow-hidden ring-1 ring-white/5">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent pointer-events-none" />
              <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                <Plus size={18} className="text-indigo-400" />
                Give an Award
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
                    className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner cursor-pointer"
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
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Award Type / Title</label>
                  <input type="text" required className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner"
                    value={formData.awardType} onChange={e => setFormData({...formData, awardType: e.target.value})} placeholder="e.g. Employee of the Month" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Date</label>
                  <input type="date" required className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner [color-scheme:dark]"
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Gift / Reward</label>
                  <input type="text" required className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner"
                    value={formData.gift} onChange={e => setFormData({...formData, gift: e.target.value})} placeholder="e.g. $100 Bonus, Trophy, Certificate" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
                  <textarea 
                    className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all h-24 resize-none shadow-inner"
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Optional details..."
                  ></textarea>
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] cursor-pointer mt-6">
                  Assign Award
                </button>
              </form>
            </div>
          </div>
        )}

        <div className={`${canEdit ? 'lg:col-span-2' : 'max-w-5xl'} flex flex-col min-h-0`}>
          <div className="bg-white dark:bg-[#1A1D23] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Awards List</h2>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-white/50 dark:bg-slate-900/50 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800/50">
                    <th className="px-6 py-3 font-semibold">Employee</th>
                    <th className="px-6 py-3 font-semibold">Award</th>
                    <th className="px-6 py-3 font-semibold">Gift</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    {canEdit && <th className="px-6 py-3 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={canEdit ? 5 : 4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-500">Loading...</td>
                    </tr>
                  ) : awards.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 5 : 4} className="px-6 py-16 text-center text-slate-500 dark:text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <Gift size={32} className="text-slate-700" />
                          <div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">No Awards assigned</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Recognize an employee to see it here.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    awards.map((award, idx) => (
                      <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }} key={award.id} className="border-b border-slate-200/80 dark:border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{getEmpName(award.employeeId)}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{award.awardType}</span>
                            {award.description && <span className="text-slate-500 dark:text-slate-500 text-[10px] truncate max-w-[200px] mt-0.5">{award.description}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] uppercase font-bold tracking-widest">{award.gift}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-500 dark:text-slate-400">{award.date}</td>
                        {canEdit && (
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => confirmDelete(award.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                              <Trash2 size={16} />
                            </button>
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
        isOpen={deleteModalOpen}
        title="Delete Award"
        message="Are you sure you want to delete this award? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setAwardToDelete(null);
        }}
      />
    </motion.div>
  );
};

export default Awards;

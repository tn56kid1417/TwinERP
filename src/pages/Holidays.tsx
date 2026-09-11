import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { Calendar, Tag, Trash2, Plus } from 'lucide-react';
import { getHolidays, addHoliday, deleteHoliday } from '../api';
import { Holiday } from '../types';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';

const Holidays = () => {
  const { user, canViewAll, canEdit } = useAuth();

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: 'Public Holiday',
    isPaid: true
  });
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<string | null>(null);

  const loadHolidays = async () => {
    try {
      const data = await getHolidays();
      setHolidays(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewAll) {
      loadHolidays();
    }
  }, [canViewAll]);

  if (!canViewAll) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await addHoliday(formData);
      await loadHolidays();
      setFormData({
        name: '',
        startDate: '',
        endDate: '',
        type: 'Public Holiday',
        isPaid: true
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add holiday');
    }
  };

  const confirmDelete = (id: string) => {
    setHolidayToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!holidayToDelete) return;
    try {
      await deleteHoliday(holidayToDelete);
      await loadHolidays();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteModalOpen(false);
      setHolidayToDelete(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Manage Holidays</h1>
        <p className="text-slate-500 dark:text-slate-500 mt-1">Configure company holidays and non-working days.</p>
      </div>

      <div className={`grid grid-cols-1 gap-8 flex-1 min-h-0 ${canEdit ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        {canEdit && (
          <div className="lg:col-span-1">
            <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 p-6 shadow-lg shadow-slate-200/50 dark:shadow-black/40 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent pointer-events-none" />
              <h2 className="text-base font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Plus size={18} className="text-indigo-600 dark:text-indigo-400" />
                New Holiday
              </h2>
              
              {error && (
                <div className="bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 p-3 rounded-xl text-xs mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Holiday Name</label>
                  <input type="text" required className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. New Year's Day" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Start Date</label>
                  <input type="date" required className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner [color-scheme:light] dark:[color-scheme:dark]"
                    value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">End Date</label>
                  <input type="date" required className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner [color-scheme:light] dark:[color-scheme:dark]"
                    value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">Holiday Type</label>
                  <select 
                    className="w-full bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm dark:shadow-inner cursor-pointer"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Public Holiday" className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">Public Holiday</option>
                    <option value="Company Holiday" className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">Company Holiday</option>
                    <option value="Optional Holiday" className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">Optional Holiday</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" id="isPaid" className="accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                    checked={formData.isPaid} onChange={e => setFormData({...formData, isPaid: e.target.checked})} />
                  <label htmlFor="isPaid" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">Paid Holiday</label>
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] cursor-pointer mt-6">
                  Create Holiday
                </button>
              </form>
            </div>
          </div>
        )}

        <div className={`${canEdit ? 'lg:col-span-2' : 'max-w-5xl'} flex flex-col min-h-0`}>
          <div className="bg-white/90 dark:bg-[#1A1D23]/70 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Holidays List</h2>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/50 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/50">
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Start Date</th>
                    <th className="px-6 py-3 font-semibold">End Date</th>
                    <th className="px-6 py-3 font-semibold">Holiday Type</th>
                    <th className="px-6 py-3 font-semibold">Paid</th>
                    {canEdit && <th className="px-6 py-3 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-500">Loading...</td>
                    </tr>
                  ) : holidays.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="px-6 py-16 text-center text-slate-500 dark:text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <Calendar size={32} className="text-slate-700" />
                          <div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">No Holidays found</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Get started by creating your first Holiday.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    holidays.map((hol, idx) => (
                      <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }} key={hol.id} className="border-b border-slate-200/80 dark:border-slate-800/50 hover:bg-indigo-50/40 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{hol.name}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{hol.startDate}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{hol.endDate}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded text-[10px] uppercase font-bold tracking-widest">{hol.type}</span>
                        </td>
                        <td className="px-6 py-4">
                          {hol.isPaid ? (
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] uppercase font-bold tracking-widest">Yes</span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 rounded text-[10px] uppercase font-bold tracking-widest">No</span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => confirmDelete(hol.id)} className="text-slate-600 hover:text-red-400 transition-colors">
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
        title="Delete Holiday"
        message="Are you sure you want to delete this holiday? This will remove it from the company calendar."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setHolidayToDelete(null);
        }}
      />
    </motion.div>
  );
};

export default Holidays;

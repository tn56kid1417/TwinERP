import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, AlertTriangle, UserMinus, UserX, Plus,
  CheckCircle, Clock, X, ChevronRight, MessageSquare, Shield, Building
} from 'lucide-react';
import {
  getPromotions, createPromotion,
  getComplaints, createComplaint, updateComplaintStatus, deleteComplaint,
  getEmployees, getResignations, getTerminations
} from '../api';
import { Promotion, Complaint, Employee, Resignation, Termination } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

type TabId = 'promotions' | 'complaints' | 'resignations' | 'terminations';

export default function Lifecycle() {
  const { user: currentUser, canViewAll } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('promotions');

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [terminations, setTerminations] = useState<Termination[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);

  // Promotion modal
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({
    employee: '',
    oldDepartment: '',
    oldRole: '',
    newDepartment: 'Engineering',
    newRole: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  // Complaint modal
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [compForm, setCompForm] = useState({
    category: 'Workplace' as const,
    targetEmployee: '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [promos, comps, resigs, terms, emps] = await Promise.all([
        getPromotions().catch(() => []),
        getComplaints().catch(() => []),
        getResignations().catch(() => []),
        getTerminations().catch(() => []),
        getEmployees().catch(() => []),
      ]);
      setPromotions(Array.isArray(promos) ? promos : []);
      setComplaints(Array.isArray(comps) ? comps : []);
      setResignations(Array.isArray(resigs) ? resigs : []);
      setTerminations(Array.isArray(terms) ? terms : []);
      setEmployees(Array.isArray(emps) ? emps : []);
    } catch {
      toast.error('Failed to load lifecycle data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.employee || !promoForm.newRole) {
      toast.error('Please select an employee and specify the new role');
      return;
    }
    try {
      setSubmitting(true);
      await createPromotion({
        ...promoForm,
        approvedBy: `${currentUser?.firstName} ${currentUser?.lastName}`,
      });
      toast.success('Promotion recorded successfully');
      setShowPromoModal(false);
      setPromoForm({
        employee: '',
        oldDepartment: '',
        oldRole: '',
        newDepartment: 'Engineering',
        newRole: '',
        effectiveDate: new Date().toISOString().split('T')[0],
      });
      loadData();
    } catch {
      toast.error('Failed to record promotion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compForm.description.trim()) {
      toast.error('Please provide details for the complaint/grievance');
      return;
    }
    try {
      setSubmitting(true);
      await createComplaint({
        ...compForm,
        employee: `${currentUser?.firstName} ${currentUser?.lastName}`,
      });
      toast.success('Grievance filed with HR');
      setShowComplaintModal(false);
      setCompForm({ category: 'Workplace', targetEmployee: '', description: '' });
      loadData();
    } catch {
      toast.error('Failed to submit grievance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComplaintStatus = async (id: string, status: string) => {
    try {
      await updateComplaintStatus(id, status);
      toast.success(`Complaint status updated to ${status}`);
      loadData();
    } catch {
      toast.error('Failed to update complaint status');
    }
  };

  const onEmployeeSelect = (empName: string) => {
    const emp = employees.find(e => `${e.firstName} ${e.lastName}` === empName);
    setPromoForm(prev => ({
      ...prev,
      employee: empName,
      oldDepartment: emp?.department || '',
      oldRole: emp?.role || '',
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col min-h-full space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 sm:gap-3">
            <TrendingUp className="text-indigo-600 dark:text-indigo-400 h-7 w-7 sm:h-8 sm:w-8" />
            Employee Lifecycle
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Track career progressions, handle promotions, review offboarding, and mediate workplace grievances.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'promotions' && canViewAll && (
            <button
              onClick={() => setShowPromoModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30"
            >
              <Plus size={16} /> New Promotion
            </button>
          )}

          {activeTab === 'complaints' && (
            <button
              onClick={() => setShowComplaintModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30"
            >
              <Plus size={16} /> Submit Grievance
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('promotions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'promotions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp size={16} /> Career Promotions ({promotions.length})
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'complaints'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle size={16} /> Grievances & Complaints ({complaints.length})
        </button>

        <button
          onClick={() => setActiveTab('resignations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'resignations'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <UserMinus size={16} /> Resignations ({resignations.length})
        </button>

        <button
          onClick={() => setActiveTab('terminations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'terminations'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <UserX size={16} /> Terminations ({terminations.length})
        </button>
      </div>

      {/* Tab 1: Promotions */}
      {activeTab === 'promotions' && (
        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/80 to-transparent pointer-events-none" />

          {promotions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No promotions recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50/75 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Employee</th>
                    <th className="py-4 px-6">Previous Department / Role</th>
                    <th className="py-4 px-6">Promoted Department & Title</th>
                    <th className="py-4 px-6">Effective Date</th>
                    <th className="py-4 px-6">Approved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {promotions.map((p) => (
                    <tr key={p.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {p.employee}
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-xs">
                        {p.oldDepartment} / {p.oldRole || 'Member'}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {p.newRole}
                        </span>
                        <div className="text-[11px] text-slate-400">{p.newDepartment}</div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {p.effectiveDate}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300">
                        {p.approvedBy || 'Leadership'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Grievances & Complaints */}
      {activeTab === 'complaints' && (
        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/80 to-transparent pointer-events-none" />

          {complaints.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No complaints or grievances reported.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50/75 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Reported By</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Description</th>
                    <th className="py-4 px-6">Submitted Date</th>
                    <th className="py-4 px-6">Status</th>
                    {canViewAll && <th className="py-4 px-6 text-right">HR Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {c.employee}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          {c.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-700 dark:text-slate-300 max-w-xs">
                        {c.description}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {c.submittedDate}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest ${
                          c.status === 'Resolved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : c.status === 'Investigating'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      {canViewAll && (
                        <td className="py-4 px-6 text-right">
                          <select
                            value={c.status}
                            onChange={(e) => handleUpdateComplaintStatus(c.id, e.target.value)}
                            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Investigating">Investigating</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Dismissed">Dismissed</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Resignations Overview */}
      {activeTab === 'resignations' && (
        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/80 to-transparent pointer-events-none" />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-4 px-6">Employee ID</th>
                  <th className="py-4 px-6">Last Working Date</th>
                  <th className="py-4 px-6">Reason</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {resignations.map((r) => (
                  <tr key={r.id}>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      {r.employeeId}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {r.lastWorkingDate}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700 dark:text-slate-300">
                      {r.reason}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Terminations Overview */}
      {activeTab === 'terminations' && (
        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/80 to-transparent pointer-events-none" />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-4 px-6">Employee ID</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Notice Date</th>
                  <th className="py-4 px-6">Termination Date</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {terminations.map((t) => (
                  <tr key={t.id}>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{t.employeeId}</td>
                    <td className="py-4 px-6 text-xs text-slate-500">{t.terminationType}</td>
                    <td className="py-4 px-6 text-xs text-slate-500">{t.noticeDate}</td>
                    <td className="py-4 px-6 text-xs text-slate-500">{t.terminationDate}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promotion Modal */}
      <AnimatePresence>
        {showPromoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#0C1017] border border-slate-200/90 dark:border-slate-700/80 rounded-2xl shadow-2xl p-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={18} /> Record Promotion
                </h3>
                <button onClick={() => setShowPromoModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreatePromo} className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Employee *
                  </label>
                  <select
                    required
                    value={promoForm.employee}
                    onChange={(e) => onEmployeeSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(e => (
                      <option key={e.id} value={`${e.firstName} ${e.lastName}`}>
                        {e.firstName} {e.lastName} ({e.department} - {e.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      New Department
                    </label>
                    <select
                      value={promoForm.newDepartment}
                      onChange={(e) => setPromoForm({ ...promoForm, newDepartment: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    >
                      {['Engineering', 'Sales', 'Marketing', 'HR', 'Design', 'Finance', 'Executive'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      New Role / Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={promoForm.newRole}
                      onChange={(e) => setPromoForm({ ...promoForm, newRole: e.target.value })}
                      placeholder="e.g. Senior Tech Lead"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={promoForm.effectiveDate}
                    onChange={(e) => setPromoForm({ ...promoForm, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPromoModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-indigo-600/30"
                  >
                    {submitting ? 'Saving...' : 'Record Promotion'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Complaint Modal */}
      <AnimatePresence>
        {showComplaintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#0C1017] border border-slate-200/90 dark:border-slate-700/80 rounded-2xl shadow-2xl p-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={18} /> Submit Grievance
                </h3>
                <button onClick={() => setShowComplaintModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateComplaint} className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Grievance Category
                  </label>
                  <select
                    value={compForm.category}
                    onChange={(e) => setCompForm({ ...compForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Workplace">Workplace Environment</option>
                    <option value="Management">Management & Process</option>
                    <option value="Salary">Compensation & Overtime</option>
                    <option value="AgainstMember">Interpersonal / Against Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Explanation & Details *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={compForm.description}
                    onChange={(e) => setCompForm({ ...compForm, description: e.target.value })}
                    placeholder="Describe your issue or dispute confidentially..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowComplaintModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-indigo-600/30"
                  >
                    {submitting ? 'Submitting...' : 'Submit to HR'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

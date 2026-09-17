import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit2, X, Check } from 'lucide-react';
import { getEmployees, addEmployee, deleteEmployee, updateEmployee } from '../api';
import { Employee } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';

import { useAuth } from '../context/AuthContext';

const EmployeeList = () => {
  const { canViewAll, canEdit } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', department: '', role: '', hireDate: '', shift: 'Morning'
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editShiftValue, setEditShiftValue] = useState('');
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

  const loadEmployees = () => getEmployees().then(setEmployees).catch(console.error);

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addEmployee(formData);
      setIsAdding(false);
      setFormData({ firstName: '', lastName: '', email: '', department: '', role: '', hireDate: '', shift: 'Morning' });
      loadEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = (id: string) => {
    setEmployeeToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await deleteEmployee(employeeToDelete);
      loadEmployees();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const startEditing = (emp: Employee) => {
    setEditingId(emp.id);
    setEditShiftValue(emp.shift || 'Morning');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditShiftValue('');
  };

  const saveEdit = async (id: string) => {
    try {
      await updateEmployee(id, { shift: editShiftValue });
      setEditingId(null);
      loadEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Employees</h1>
          <p className="text-slate-500 dark:text-slate-500 mt-1 text-sm">Manage your team members and their details.</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white px-5 py-2.5 rounded text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            {isAdding ? 'Cancel' : 'Add Employee'}
          </button>
        )}
      </div>

      {canEdit && isAdding && (
        <div className="bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 mb-8 shadow-lg shadow-slate-200/50 dark:shadow-black/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 tracking-tight">Add New Employee</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input required type="text" placeholder="First Name" className="bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm dark:shadow-inner transition-all"
              value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            <input required type="text" placeholder="Last Name" className="bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm dark:shadow-inner transition-all"
              value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            <input required type="email" placeholder="Email Address" className="bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm dark:shadow-inner transition-all"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <input required type="text" placeholder="Department" className="bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm dark:shadow-inner transition-all"
              value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
            <input required type="text" placeholder="Role" className="bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm dark:shadow-inner transition-all"
              value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
            <input required type="date" className="bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm dark:shadow-inner transition-all [color-scheme:light] dark:[color-scheme:dark]"
              value={formData.hireDate} onChange={e => setFormData({...formData, hireDate: e.target.value})} />
            <select required className="bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm dark:shadow-inner transition-all cursor-pointer"
              value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value})}>
                <option value="Morning" className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">Morning Shift</option>
                <option value="Evening" className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">Evening Shift</option>
                <option value="Night" className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">Night Shift</option>
            </select>
            <div className="lg:col-span-2 flex justify-end items-center">
              <button type="submit" className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-6 py-2.5 rounded-xl text-xs uppercase font-bold tracking-widest transition-all shadow-lg shadow-indigo-500/25 cursor-pointer">Save Employee</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white/90 dark:bg-[#1A1D23]/70 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden flex-1 flex flex-col">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full min-w-[650px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/50 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/50">
                <th className="px-6 py-3 font-semibold">Employee</th>
                <th className="px-6 py-3 font-semibold">Contact</th>
                <th className="px-6 py-3 font-semibold">Department</th>
                <th className="px-6 py-3 font-semibold">Shift</th>
                <th className="px-6 py-3 font-semibold">Hire Date</th>
                {canEdit && <th className="px-6 py-3 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="text-xs">
              {employees.map((emp, idx) => (
                <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }} key={emp.id} className="border-b border-slate-200/80 dark:border-slate-800/50 hover:bg-indigo-50/40 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-300 text-[10px]">
                        {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{emp.firstName} {emp.lastName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-500">{emp.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-500 dark:text-slate-400">{emp.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold rounded-full">{emp.department}</span>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === emp.id && canEdit ? (
                      <div className="flex items-center gap-2">
                        <select 
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500/50"
                          value={editShiftValue}
                          onChange={(e) => setEditShiftValue(e.target.value)}
                        >
                          <option value="Morning">Morning</option>
                          <option value="Evening">Evening</option>
                          <option value="Night">Night</option>
                        </select>
                        <button onClick={() => saveEdit(emp.id)} className="text-emerald-400 hover:text-emerald-300 transition-colors">
                          <Check size={14} />
                        </button>
                        <button onClick={cancelEditing} className="text-red-400 hover:text-red-300 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className="text-slate-700 dark:text-slate-300">{emp.shift || 'Not Assigned'}</span>
                        {canEdit && (
                          <button onClick={() => startEditing(emp)} className="opacity-0 group-hover:opacity-100 text-slate-500 dark:text-slate-500 hover:text-indigo-400 transition-all">
                            <Edit2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-500 dark:text-slate-400 tracking-tighter">{emp.hireDate}</td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => confirmDelete(emp.id)} className="text-slate-600 hover:text-red-400 font-bold text-lg leading-none transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </motion.tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-500">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone and will permanently remove all related records."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setEmployeeToDelete(null);
        }}
      />
    </motion.div>
  );
};

export default EmployeeList;

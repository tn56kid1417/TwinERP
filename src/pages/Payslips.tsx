import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { FileText, Download, DollarSign, Settings, Lock } from 'lucide-react';
import { getAllPayslips, generatePayslip, getEmployees, getSalaryStructures, setSalaryStructure } from '../api';
import { Payslip, Employee, SalaryStructure } from '../types';
import { useAuth } from '../context/AuthContext';

const Payslips = () => {
  const { user, canViewAll, canEdit } = useAuth();

  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  
  const [formData, setFormData] = useState({
    employeeId: user?.id || '', month: new Date().getMonth() + 1, year: new Date().getFullYear()
  });
  const [structureData, setStructureData] = useState({
    employeeId: user?.id || '', baseSalary: 0, allowances: 0, deductions: 0
  });

  const [error, setError] = useState('');
  const [structureError, setStructureError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingStructure, setIsSavingStructure] = useState(false);

  const loadData = async () => {
    try {
      const [ps, emps, structs] = await Promise.all([getAllPayslips(), getEmployees(), getSalaryStructures()]);
      setPayslips(canViewAll ? ps : ps.filter(p => p.employeeId === user?.id));
      setEmployees(emps);
      setSalaryStructures(structs);
      
      if (canViewAll && emps.length > 0) {
        if (!formData.employeeId) setFormData(prev => ({...prev, employeeId: emps[0].id}));
        if (!structureData.employeeId) {
          const defaultEmpId = emps[0].id;
          const existingStruct = structs.find(s => s.employeeId === defaultEmpId);
          setStructureData({
            employeeId: defaultEmpId,
            baseSalary: existingStruct?.baseSalary || 0,
            allowances: existingStruct?.allowances || 0,
            deductions: existingStruct?.deductions || 0,
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEmployeeStructureChange = (empId: string) => {
    const existingStruct = salaryStructures.find(s => s.employeeId === empId);
    setStructureData({
      employeeId: empId,
      baseSalary: existingStruct?.baseSalary || 0,
      allowances: existingStruct?.allowances || 0,
      deductions: existingStruct?.deductions || 0,
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsGenerating(true);
    try {
      await generatePayslip(formData.employeeId, formData.month, formData.year);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate payslip');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setStructureError('');
    setIsSavingStructure(true);
    try {
      await setSalaryStructure(structureData);
      await loadData();
    } catch (err: any) {
      setStructureError(err.response?.data?.error || 'Failed to save salary structure');
    } finally {
      setIsSavingStructure(false);
    }
  };

  const getEmpName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Payroll & Payslips</h1>
        <p className="text-slate-500 dark:text-slate-500 mt-1">Generate and view employee payslips.</p>
      </div>

      <div className={`grid grid-cols-1 gap-8 flex-1 min-h-0 ${canEdit ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        {canEdit && (
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="relative bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-700/60 dark:border-slate-700/50 p-6 shadow-2xl shadow-black/40 overflow-hidden ring-1 ring-white/5">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent pointer-events-none" />
              <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                <DollarSign size={18} className="text-indigo-400" />
                Generate Payslip
              </h2>
              
              {error && (
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 rounded-xl text-xs mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleGenerate} className="space-y-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Month</label>
                    <select 
                      className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner cursor-pointer"
                      value={formData.month}
                      onChange={e => setFormData({...formData, month: parseInt(e.target.value)})}
                    >
                      {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                        <option key={m} value={m} className="bg-[#0C1017] text-slate-100">{getMonthName(m)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Year</label>
                    <input type="number" required className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner"
                      value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] cursor-pointer mt-4 disabled:opacity-50"
                >
                  {isGenerating ? 'Processing...' : 'Process Run'}
                </button>
              </form>
            </div>

            <div className="relative bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-indigo-500/40 p-6 shadow-2xl shadow-black/40 overflow-hidden ring-1 ring-white/5">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 bg-indigo-500/15 border-b border-l border-indigo-500/30 px-3 py-1 rounded-bl-xl">
                <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1">
                  <Lock size={10} /> HR Admin Only
                </span>
              </div>
              <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                <Settings size={18} className="text-indigo-400" />
                Set Salary Structure
              </h2>

              {structureError && (
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 rounded-xl text-xs mb-4">
                  {structureError}
                </div>
              )}

              <form onSubmit={handleSaveStructure} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Employee</label>
                  <select 
                    className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner cursor-pointer"
                    value={structureData.employeeId}
                    onChange={e => handleEmployeeStructureChange(e.target.value)}
                    required
                  >
                    <option value="" className="bg-[#0C1017] text-slate-400">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id} className="bg-[#0C1017] text-slate-100">{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Base Salary</label>
                  <input type="number" required className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner"
                    value={structureData.baseSalary} onChange={e => setStructureData({...structureData, baseSalary: Number(e.target.value)})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Allowances</label>
                    <input type="number" required className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner"
                      value={structureData.allowances} onChange={e => setStructureData({...structureData, allowances: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Deductions</label>
                    <input type="number" required className="w-full bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-inner"
                      value={structureData.deductions} onChange={e => setStructureData({...structureData, deductions: Number(e.target.value)})} />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isSavingStructure}
                  className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98] cursor-pointer mt-4 disabled:opacity-50"
                >
                  {isSavingStructure ? 'Saving...' : 'Save Structure'}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className={`${canEdit ? 'lg:col-span-2' : 'max-w-5xl'} flex flex-col min-h-0`}>
          <div className="bg-white dark:bg-[#1A1D23] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{canViewAll ? 'Recent Payslips' : 'My Payslips'}</h2>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/50 dark:bg-slate-900/50 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800/50">
                    <th className="px-6 py-3 font-semibold">Employee</th>
                    <th className="px-6 py-3 font-semibold">Period</th>
                    <th className="px-6 py-3 font-semibold">Gross Pay</th>
                    <th className="px-6 py-3 font-semibold">Net Pay</th>
                    <th className="px-6 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {payslips.map((slip, idx) => (
                    <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }} key={slip.id} className="border-b border-slate-200/80 dark:border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                        {getEmpName(slip.employeeId)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-500 dark:text-slate-400">
                        {getMonthName(slip.month)} {slip.year}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-500 dark:text-slate-400">
                        ${slip.grossPay.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        ${slip.netPay.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-indigo-400 hover:text-indigo-300 font-bold uppercase text-[9px] tracking-widest transition-colors">
                          <Download size={14} className="inline mr-1" /> View
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                  {payslips.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-500">No payslips generated yet.</td>
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

export default Payslips;

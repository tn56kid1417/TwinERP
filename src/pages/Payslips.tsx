import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { FileText, Download, DollarSign, Settings, Lock } from 'lucide-react';
import { getEmployees, getPayslips, getAllPayslips, generatePayslip, getSalaryStructures, setSalaryStructure } from '../api';
import { Employee, Payslip, SalaryStructure } from '../types';
import { getErrorMessage } from '../utils/error';
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
 setError(getErrorMessage(err, 'Failed to generate payslip'));
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
 setStructureError(getErrorMessage(err, 'Failed to save salary structure'));
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
 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col">
 <div className="mb-6 sm:mb-8">
 <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight">Payroll & Payslips</h1>
 <p className="text-slate-500 mt-1 text-sm">Generate and view employee payslips.</p>
 </div>

 <div className={`grid grid-cols-1 gap-8 flex-1 min-h-0 ${canEdit ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
 {canEdit && (
 <div className="lg:col-span-1 flex flex-col gap-6">
 <div className="relative bg-white rounded-lg border border-slate-200 p-6 shadow-lg shadow-slate-200/50 dark:shadow-black/40 overflow-hidden">
 <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
 <DollarSign size={18} className="text-blue-600 dark:text-blue-600"/>
 Generate Payslip
 </h2>
 
 {error && (
 <div className="bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 p-3 rounded-xl text-xs mb-4">
 {typeof error === 'string' ? error : (error as any)?.message || 'Failed to generate payslip'}
 </div>
 )}

 <form onSubmit={handleGenerate} className="space-y-4">
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

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Month</label>
 <select 
 className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm cursor-pointer"
 value={formData.month}
 onChange={e => setFormData({...formData, month: parseInt(e.target.value)})}
 >
 {Array.from({length: 12}, (_, i) => i + 1).map(m => (
 <option key={m} value={m} className="bg-white text-slate-800">{getMonthName(m)}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Year</label>
 <input type="number"required className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
 value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
 </div>
 </div>

 <button 
 type="submit"
 disabled={isGenerating}
 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer mt-4 disabled:opacity-50"
 >
 {isGenerating ? 'Processing...' : 'Process Run'}
 </button>
 </form>
 </div>

 <div className="relative bg-white rounded-lg border border-blue-200 dark:border-blue-600/40 p-6 shadow-lg shadow-slate-200/50 dark:shadow-black/40 overflow-hidden">
 <div className="absolute top-0 right-0 bg-blue-600/10 dark:bg-blue-600/15 border-b border-l border-blue-600/20 dark:border-blue-200 px-3 py-1 rounded-bl-xl">
 <span className="text-[9px] font-bold text-blue-600 text-blue-600 flex items-center gap-1">
 <Lock size={10} /> HR Admin Only
 </span>
 </div>
 <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
 <Settings size={18} className="text-blue-600 dark:text-blue-600"/>
 Set Salary Structure
 </h2>

 {structureError && (
 <div className="bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 p-3 rounded-xl text-xs mb-4">
 {typeof structureError === 'string' ? structureError : (structureError as any)?.message || 'Failed to save salary structure'}
 </div>
 )}

 <form onSubmit={handleSaveStructure} className="space-y-4">
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Employee</label>
 <select 
 className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm cursor-pointer"
 value={structureData.employeeId}
 onChange={e => handleEmployeeStructureChange(e.target.value)}
 required
 >
 <option value=""className="bg-white text-slate-400">Select Employee</option>
 {employees.map(emp => (
 <option key={emp.id} value={emp.id} className="bg-white text-slate-800">{emp.firstName} {emp.lastName}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Base Salary</label>
 <input type="number"required className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
 value={structureData.baseSalary} onChange={e => setStructureData({...structureData, baseSalary: Number(e.target.value)})} />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Allowances</label>
 <input type="number"required className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
 value={structureData.allowances} onChange={e => setStructureData({...structureData, allowances: Number(e.target.value)})} />
 </div>
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Deductions</label>
 <input type="number"required className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
 value={structureData.deductions} onChange={e => setStructureData({...structureData, deductions: Number(e.target.value)})} />
 </div>
 </div>
 <button 
 type="submit"
 disabled={isSavingStructure}
 className="w-full bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 text-blue-700 text-blue-600 border border-blue-200 dark:border-blue-600/40 font-semibold py-2.5 rounded-xl text-xs transition-all shadow-sm dark:shadow-lg dark:shadow-blue-600/10 cursor-pointer mt-4 disabled:opacity-50"
 >
 {isSavingStructure ? 'Saving...' : 'Save Structure'}
 </button>
 </form>
 </div>
 </div>
 )}

 <div className={`${canEdit ? 'lg:col-span-2' : 'max-w-5xl'} flex flex-col min-h-0`}>
 <div className="bg-white /70 rounded-lg border border-slate-200 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden flex-1 flex flex-col">
 <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
 <h2 className="text-sm font-semibold text-slate-900">{canViewAll ? 'Recent Payslips' : 'My Payslips'}</h2>
 </div>
 <div className="flex-1 overflow-x-auto">
 <table className="w-full min-w-[550px] text-left border-collapse">
 <thead>
 <tr className="bg-slate-50 text-[10px] text-slate-500 border-b border-slate-200/50">
 <th className="px-6 py-3 font-semibold">Employee</th>
 <th className="px-6 py-3 font-semibold">Period</th>
 <th className="px-6 py-3 font-semibold">Gross Pay</th>
 <th className="px-6 py-3 font-semibold">Net Pay</th>
 <th className="px-6 py-3 font-semibold text-right">Action</th>
 </tr>
 </thead>
 <tbody className="text-xs">
 {payslips.map((slip, idx) => (
 <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }} key={slip.id} className="border-b border-slate-200/50 hover:bg-blue-50/40 transition-colors">
 <td className="px-6 py-4 font-medium text-slate-800">
 {getEmpName(slip.employeeId)}
 </td>
 <td className="px-6 py-4 text-slate-500">
 {getMonthName(slip.month)} {slip.year}
 </td>
 <td className="px-6 py-4 text-slate-500">
 ${slip.grossPay.toLocaleString()}
 </td>
 <td className="px-6 py-4 font-bold text-slate-900">
 ${slip.netPay.toLocaleString()}
 </td>
 <td className="px-6 py-4 text-right">
 <button className="text-blue-600 hover:text-blue-400 font-bold uppercase text-[9px] tracking-widest transition-colors">
 <Download size={14} className="inline mr-1"/> View
 </button>
 </td>
 </motion.tr>
 ))}
 {payslips.length === 0 && (
 <tr>
 <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No payslips generated yet.</td>
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
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
 FileText, Shield, FileCheck, Plus, Trash2, Eye, ExternalLink,
 Download, Search, X, Calendar, UserCheck, BookOpen
} from 'lucide-react';
import {
 getHRDocuments, createHRDocument, deleteHRDocument,
 getAgreements, createAgreement, deleteAgreement,
 getTemplates, createTemplate, deleteTemplate, getEmployees
} from '../api';
import { HRDocument, Agreement, DocumentTemplate, Employee } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

type TabId = 'hr-documents' | 'agreements' | 'templates';

export default function DocumentsContracts() {
 const { canViewAll } = useAuth();
 const [activeTab, setActiveTab] = useState<TabId>('hr-documents');

 const [documents, setDocuments] = useState<HRDocument[]>([]);
 const [agreements, setAgreements] = useState<Agreement[]>([]);
 const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
 const [employees, setEmployees] = useState<Employee[]>([]);

 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');

 // Modals state
 const [showDocModal, setShowDocModal] = useState(false);
 const [docForm, setDocForm] = useState({ name: '', category: 'Policy', fileUrl: '' });

 const [showAgrModal, setShowAgrModal] = useState(false);
 const [agrForm, setAgrForm] = useState({
 employee: '',
 duration: '12 Months',
 agreementType: 'Employment Contract',
 startDate: new Date().toISOString().split('T')[0],
 endDate: '',
 fileUrl: '',
 });

 const [showTplModal, setShowTplModal] = useState(false);
 const [tplForm, setTplForm] = useState({
 name: '',
 type: 'Offer Letter' as const,
 fileUrl: '',
 description: '',
 });

 const [submitting, setSubmitting] = useState(false);

 const loadData = useCallback(async () => {
 try {
 setLoading(true);
 const [docs, agrs, tpls, emps] = await Promise.all([
 getHRDocuments().catch(() => []),
 getAgreements().catch(() => []),
 getTemplates().catch(() => []),
 getEmployees().catch(() => []),
 ]);
 setDocuments(Array.isArray(docs) ? docs : []);
 setAgreements(Array.isArray(agrs) ? agrs : []);
 setTemplates(Array.isArray(tpls) ? tpls : []);
 setEmployees(Array.isArray(emps) ? emps : []);
 } catch {
 toast.error('Failed to load documents');
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 loadData();
 }, [loadData]);

 // Submit handlers
 const handleUploadDoc = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!docForm.name.trim() || !docForm.fileUrl.trim()) {
 toast.error('Name and file URL are required');
 return;
 }
 try {
 setSubmitting(true);
 await createHRDocument(docForm);
 toast.success('Document uploaded successfully');
 setShowDocModal(false);
 setDocForm({ name: '', category: 'Policy', fileUrl: '' });
 loadData();
 } catch {
 toast.error('Failed to upload document');
 } finally {
 setSubmitting(false);
 }
 };

 const handleAddAgreement = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!agrForm.employee || !agrForm.fileUrl) {
 toast.error('Employee and agreement file URL are required');
 return;
 }
 try {
 setSubmitting(true);
 await createAgreement(agrForm);
 toast.success('Agreement record added');
 setShowAgrModal(false);
 setAgrForm({
 employee: '',
 duration: '12 Months',
 agreementType: 'Employment Contract',
 startDate: new Date().toISOString().split('T')[0],
 endDate: '',
 fileUrl: '',
 });
 loadData();
 } catch {
 toast.error('Failed to add agreement');
 } finally {
 setSubmitting(false);
 }
 };

 const handleAddTemplate = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!tplForm.name || !tplForm.fileUrl) {
 toast.error('Template title and file link are required');
 return;
 }
 try {
 setSubmitting(true);
 await createTemplate(tplForm);
 toast.success('Template saved');
 setShowTplModal(false);
 setTplForm({ name: '', type: 'Offer Letter', fileUrl: '', description: '' });
 loadData();
 } catch {
 toast.error('Failed to save template');
 } finally {
 setSubmitting(false);
 }
 };

 const handleDeleteDoc = async (id: string) => {
 try {
 await deleteHRDocument(id);
 toast.success('Document deleted');
 loadData();
 } catch {
 toast.error('Failed to delete document');
 }
 };

 const handleDeleteAgr = async (id: string) => {
 try {
 await deleteAgreement(id);
 toast.success('Agreement deleted');
 loadData();
 } catch {
 toast.error('Failed to delete agreement');
 }
 };

 const handleDeleteTpl = async (id: string) => {
 try {
 await deleteTemplate(id);
 toast.success('Template deleted');
 loadData();
 } catch {
 toast.error('Failed to delete template');
 }
 };

 return (
 <motion.div
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4 }}
 className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col min-h-full space-y-4 sm:space-y-6"
 >
 {/* Page Header */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3">
 <FileText className="text-blue-600 dark:text-blue-600 h-7 w-7 sm:h-8 sm:w-8"/>
 Documents & Contracts
 </h1>
 <p className="text-slate-500 text-xs sm:text-sm mt-1">
 Store organizational policies, manage legally binding employee contracts, and access formal letter templates.
 </p>
 </div>

 {canViewAll && (
 <div className="flex gap-2">
 {activeTab === 'hr-documents' && (
 <button
 onClick={() => setShowDocModal(true)}
 className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md transition-all shadow-md shadow-blue-600/30"
 >
 <Plus size={16} /> Upload Document
 </button>
 )}
 {activeTab === 'agreements' && (
 <button
 onClick={() => setShowAgrModal(true)}
 className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md transition-all shadow-md shadow-blue-600/30"
 >
 <Plus size={16} /> Add Agreement
 </button>
 )}
 {activeTab === 'templates' && (
 <button
 onClick={() => setShowTplModal(true)}
 className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md transition-all shadow-md shadow-blue-600/30"
 >
 <Plus size={16} /> Add Template
 </button>
 )}
 </div>
 )}
 </div>

 {/* Tabs Row */}
 <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
 <button
 onClick={() => setActiveTab('hr-documents')}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
 activeTab === 'hr-documents'
 ? 'bg-blue-600 text-white shadow-sm'
 : 'text-slate-500 hover:text-slate-900'
 }`}
 >
 <Shield size={16} /> HR Policies & Documents ({documents.length})
 </button>

 <button
 onClick={() => setActiveTab('agreements')}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
 activeTab === 'agreements'
 ? 'bg-blue-600 text-white shadow-sm'
 : 'text-slate-500 hover:text-slate-900'
 }`}
 >
 <FileCheck size={16} /> Employee Agreements ({agreements.length})
 </button>

 <button
 onClick={() => setActiveTab('templates')}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
 activeTab === 'templates'
 ? 'bg-blue-600 text-white shadow-sm'
 : 'text-slate-500 hover:text-slate-900'
 }`}
 >
 <BookOpen size={16} /> Standard Templates ({templates.length})
 </button>
 </div>

 {/* Tab 1: HR Documents */}
 {activeTab === 'hr-documents' && (
 <div className="relative bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">

 {documents.length === 0 ? (
 <div className="p-12 text-center text-slate-500 text-xs">No documents uploaded yet.</div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full min-w-[650px] text-left text-sm">
 <thead className="bg-slate-50/75 text-slate-500 uppercase text-xs font-medium tracking-wider border-b border-slate-200">
 <tr>
 <th className="py-4 px-6">Document Name</th>
 <th className="py-4 px-6">Category</th>
 <th className="py-4 px-6">Uploaded At</th>
 <th className="py-4 px-6 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
 {documents.map((doc) => (
 <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors">
 <td className="py-4 px-6">
 <div className="font-bold text-slate-900 flex items-center gap-2">
 <FileText size={16} className="text-blue-600 dark:text-blue-600"/>
 {doc.name}
 </div>
 </td>
 <td className="py-4 px-6">
 <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-600/10 text-blue-700 text-blue-600 border border-blue-200 dark:border-blue-600/20">
 {doc.category || 'General'}
 </span>
 </td>
 <td className="py-4 px-6 text-xs text-slate-500">
 {new Date(doc.uploadedAt).toLocaleDateString()}
 </td>
 <td className="py-4 px-6 text-right">
 <div className="flex items-center justify-end gap-2">
 <a
 href={doc.fileUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
 title="View Document"
 >
 <ExternalLink size={16} />
 </a>
 {canViewAll && (
 <button
 onClick={() => handleDeleteDoc(doc.id)}
 className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
 title="Delete Document"
 >
 <Trash2 size={16} />
 </button>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 )}

 {/* Tab 2: Employee Agreements */}
 {activeTab === 'agreements' && (
 <div className="relative bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">

 {agreements.length === 0 ? (
 <div className="p-12 text-center text-slate-500 text-xs">No employee agreements registered yet.</div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full min-w-[650px] text-left text-sm">
 <thead className="bg-slate-50/75 text-slate-500 uppercase text-xs font-medium tracking-wider border-b border-slate-200">
 <tr>
 <th className="py-4 px-6">Employee</th>
 <th className="py-4 px-6">Agreement Type</th>
 <th className="py-4 px-6">Duration & Validity</th>
 <th className="py-4 px-6">Status</th>
 <th className="py-4 px-6 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
 {agreements.map((agr) => (
 <tr key={agr.id} className="hover:bg-blue-50/30 transition-colors">
 <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
 <UserCheck size={16} className="text-emerald-500"/>
 {agr.employee}
 </td>
 <td className="py-4 px-6 text-slate-600">
 {agr.agreementType}
 </td>
 <td className="py-4 px-6 text-xs text-slate-500">
 <div>{agr.duration}</div>
 <div className="text-[11px] text-slate-400 mt-0.5">
 {agr.startDate} to {agr.endDate || 'Ongoing'}
 </div>
 </td>
 <td className="py-4 px-6">
 <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
 {agr.status || 'Active'}
 </span>
 </td>
 <td className="py-4 px-6 text-right">
 <div className="flex items-center justify-end gap-2">
 <a
 href={agr.fileUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
 title="View Agreement"
 >
 <ExternalLink size={16} />
 </a>
 {canViewAll && (
 <button
 onClick={() => handleDeleteAgr(agr.id)}
 className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
 title="Delete Agreement"
 >
 <Trash2 size={16} />
 </button>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 )}

 {/* Tab 3: Document Templates */}
 {activeTab === 'templates' && (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
 {templates.map((tpl) => (
 <div
 key={tpl.id}
 className="relative bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
 >

 <div>
 <div className="flex justify-between items-start">
 <span className="px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
 {tpl.type}
 </span>
 {canViewAll && (
 <button
 onClick={() => handleDeleteTpl(tpl.id)}
 className="text-slate-400 hover:text-rose-500 p-1 rounded"
 >
 <Trash2 size={14} />
 </button>
 )}
 </div>

 <h3 className="text-base font-bold text-slate-900 mt-3 flex items-center gap-2">
 <FileText size={18} className="text-blue-600 dark:text-blue-600 shrink-0"/>
 {tpl.name}
 </h3>
 <p className="text-xs text-slate-500 mt-1">{tpl.description || 'Pre-formatted corporate template.'}</p>
 </div>

 <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
 <a
 href={tpl.fileUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
 >
 <Download size={14} /> Download Template
 </a>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Upload Doc Modal */}
 <AnimatePresence>
 {showDocModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
 <motion.div
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="w-full max-w-md bg-white border border-slate-200/80 rounded-lg shadow-lg p-6"
 >
 <div className="flex justify-between items-center pb-3 border-b border-slate-100">
 <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
 <FileText className="text-blue-600"size={18} /> Upload HR Document
 </h3>
 <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-slate-600">
 <X size={16} />
 </button>
 </div>

 <form onSubmit={handleUploadDoc} className="space-y-4 pt-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Document Title *
 </label>
 <input
 type="text"
 required
 value={docForm.name}
 onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
 placeholder="e.g. Remote Work Security Policy"
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Category
 </label>
 <select
 value={docForm.category}
 onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 >
 {['Policy', 'Security', 'HR Guidelines', 'Operations', 'Compliance', 'Handbook'].map(c => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Document File Link / URL *
 </label>
 <input
 type="url"
 required
 value={docForm.fileUrl}
 onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
 placeholder="https://drive.google.com/..."
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>

 <div className="flex justify-end gap-3 pt-2">
 <button
 type="button"
 onClick={() => setShowDocModal(false)}
 className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-md"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-md shadow-blue-600/30"
 >
 {submitting ? 'Uploading...' : 'Save Document'}
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Add Agreement Modal */}
 <AnimatePresence>
 {showAgrModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
 <motion.div
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="w-full max-w-md bg-white border border-slate-200/80 rounded-lg shadow-lg p-6"
 >
 <div className="flex justify-between items-center pb-3 border-b border-slate-100">
 <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
 <FileCheck className="text-emerald-500"size={18} /> Register Agreement
 </h3>
 <button onClick={() => setShowAgrModal(false)} className="text-slate-400 hover:text-slate-600">
 <X size={16} />
 </button>
 </div>

 <form onSubmit={handleAddAgreement} className="space-y-4 pt-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Employee *
 </label>
 <select
 required
 value={agrForm.employee}
 onChange={(e) => setAgrForm({ ...agrForm, employee: e.target.value })}
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 >
 <option value="">Select Employee</option>
 {employees.map(e => (
 <option key={e.id} value={`${e.firstName} ${e.lastName}`}>
 {e.firstName} {e.lastName} ({e.department})
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Agreement Type
 </label>
 <input
 type="text"
 value={agrForm.agreementType}
 onChange={(e) => setAgrForm({ ...agrForm, agreementType: e.target.value })}
 placeholder="e.g. Non-Disclosure Agreement, Employment Contract"
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Start Date
 </label>
 <input
 type="date"
 value={agrForm.startDate}
 onChange={(e) => setAgrForm({ ...agrForm, startDate: e.target.value })}
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 End Date
 </label>
 <input
 type="date"
 value={agrForm.endDate}
 onChange={(e) => setAgrForm({ ...agrForm, endDate: e.target.value })}
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Document File Link *
 </label>
 <input
 type="url"
 required
 value={agrForm.fileUrl}
 onChange={(e) => setAgrForm({ ...agrForm, fileUrl: e.target.value })}
 placeholder="https://..."
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>

 <div className="flex justify-end gap-3 pt-2">
 <button
 type="button"
 onClick={() => setShowAgrModal(false)}
 className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-md"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-md shadow-blue-600/30"
 >
 {submitting ? 'Saving...' : 'Add Agreement'}
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Add Template Modal */}
 <AnimatePresence>
 {showTplModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
 <motion.div
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="w-full max-w-md bg-white border border-slate-200/80 rounded-lg shadow-lg p-6"
 >
 <div className="flex justify-between items-center pb-3 border-b border-slate-100">
 <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
 <FileText className="text-purple-500"size={18} /> Add Template
 </h3>
 <button onClick={() => setShowTplModal(false)} className="text-slate-400 hover:text-slate-600">
 <X size={16} />
 </button>
 </div>

 <form onSubmit={handleAddTemplate} className="space-y-4 pt-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Template Name *
 </label>
 <input
 type="text"
 required
 value={tplForm.name}
 onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })}
 placeholder="e.g. Senior Offer Letter 2026"
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Template Type
 </label>
 <select
 value={tplForm.type}
 onChange={(e) => setTplForm({ ...tplForm, type: e.target.value as any })}
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 >
 {['Offer Letter', 'Intern Letter', 'NDA', 'Quotation', 'Policy', 'Other'].map(t => (
 <option key={t} value={t}>{t}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Description
 </label>
 <input
 type="text"
 value={tplForm.description}
 onChange={(e) => setTplForm({ ...tplForm, description: e.target.value })}
 placeholder="Brief explanation of when to use"
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Template File Download Link *
 </label>
 <input
 type="url"
 required
 value={tplForm.fileUrl}
 onChange={(e) => setTplForm({ ...tplForm, fileUrl: e.target.value })}
 placeholder="https://..."
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>

 <div className="flex justify-end gap-3 pt-2">
 <button
 type="button"
 onClick={() => setShowTplModal(false)}
 className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-md"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-md shadow-blue-600/30"
 >
 {submitting ? 'Saving...' : 'Add Template'}
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
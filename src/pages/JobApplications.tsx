import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
 Users, ArrowLeft, Plus, CheckCircle, XCircle, ChevronRight,
 Mail, Phone, FileText, Star, Briefcase, Trash2, Edit3, X
} from 'lucide-react';
import {
 getJob, getJobApplications, createJobApplication,
 updateApplicationRound, updateApplicationStatus, deleteJobApplication
} from '../api';
import { JobPosting, JobApplication, InterviewRound } from '../types';
import toast from 'react-hot-toast';

export default function JobApplications() {
 const { jobId } = useParams<{ jobId: string }>();
 const navigate = useNavigate();

 const [job, setJob] = useState<JobPosting | null>(null);
 const [applications, setApplications] = useState<JobApplication[]>([]);
 const [loading, setLoading] = useState(true);
 const [activeTab, setActiveTab] = useState<string>('ALL');

 // Candidate detail/action modal
 const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
 const [newCandidateModal, setNewCandidateModal] = useState(false);
 const [submitting, setSubmitting] = useState(false);

 // New applicant form
 const [candidateForm, setCandidateForm] = useState({
 candidateName: '',
 candidateEmail: '',
 candidatePhone: '',
 resumeUrl: '',
 portfolioUrl: '',
 notes: '',
 });

 const loadData = useCallback(async () => {
 if (!jobId) return;
 try {
 setLoading(true);
 const [jobData, appsData] = await Promise.all([
 getJob(jobId).catch(() => null),
 getJobApplications(jobId).catch(() => []),
 ]);
 setJob(jobData);
 setApplications(Array.isArray(appsData) ? appsData : []);
 } catch {
 toast.error('Failed to load applicant pipeline');
 } finally {
 setLoading(false);
 }
 }, [jobId]);

 useEffect(() => {
 loadData();
 }, [loadData]);

 const handleAddCandidate = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!candidateForm.candidateName || !candidateForm.candidateEmail) {
 toast.error('Name and email are required');
 return;
 }
 if (!jobId) return;

 try {
 setSubmitting(true);
 const firstRoundId = job?.rounds?.[0]?.id || 'r1';
 await createJobApplication(jobId, {
 ...candidateForm,
 currentRoundId: firstRoundId,
 status: 'APPLIED',
 });
 toast.success('Candidate added to pipeline');
 setNewCandidateModal(false);
 setCandidateForm({ candidateName: '', candidateEmail: '', candidatePhone: '', resumeUrl: '', portfolioUrl: '', notes: '' });
 loadData();
 } catch (err: any) {
 toast.error(err?.message || 'Failed to add candidate');
 } finally {
 setSubmitting(false);
 }
 };

 const handleAdvanceRound = async (appId: string, currentRoundId?: string) => {
 if (!job?.rounds || job.rounds.length === 0) return;
 const currentIndex = job.rounds.findIndex(r => r.id === currentRoundId);
 if (currentIndex < job.rounds.length - 1) {
 const nextRound = job.rounds[currentIndex + 1];
 try {
 await updateApplicationRound(appId, nextRound.id, 'INTERVIEWING');
 toast.success(`Advanced to ${nextRound.title}`);
 loadData();
 if (selectedApp?.id === appId) {
 setSelectedApp(prev => prev ? { ...prev, currentRoundId: nextRound.id, status: 'INTERVIEWING' } : null);
 }
 } catch {
 toast.error('Failed to advance round');
 }
 } else {
 // Last round -> Hire!
 handleStatusChange(appId, 'HIRED');
 }
 };

 const handleStatusChange = async (appId: string, status: 'HIRED' | 'REJECTED' | 'INTERVIEWING' | 'IN_REVIEW') => {
 try {
 await updateApplicationStatus(appId, status);
 toast.success(`Applicant marked as ${status}`);
 loadData();
 if (selectedApp?.id === appId) {
 setSelectedApp(prev => prev ? { ...prev, status } : null);
 }
 } catch {
 toast.error('Failed to update status');
 }
 };

 const handleDeleteApplicant = async (appId: string) => {
 try {
 await deleteJobApplication(appId);
 toast.success('Applicant removed');
 setSelectedApp(null);
 loadData();
 } catch {
 toast.error('Failed to remove applicant');
 }
 };

 const getRoundName = (roundId?: string) => {
 const round = job?.rounds?.find(r => r.id === roundId);
 return round ? round.title : 'Initial Review';
 };

 const getStatusBadge = (status: string) => {
 switch (status) {
 case 'HIRED':
 return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] uppercase font-bold tracking-widest">Hired</span>;
 case 'REJECTED':
 return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] uppercase font-bold tracking-widest">Rejected</span>;
 case 'INTERVIEWING':
 return <span className="px-2.5 py-1 bg-blue-600/10 text-blue-600 border border-blue-600/20 rounded-full text-[10px] uppercase font-bold tracking-widest">Interviewing</span>;
 default:
 return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] uppercase font-bold tracking-widest">Applied</span>;
 }
 };

 const filteredApps = applications.filter(app => {
 if (activeTab === 'ALL') return true;
 if (activeTab === 'HIRED') return app.status === 'HIRED';
 if (activeTab === 'REJECTED') return app.status === 'REJECTED';
 if (activeTab === 'ACTIVE') return app.status !== 'HIRED' && app.status !== 'REJECTED';
 return app.currentRoundId === activeTab;
 });

 return (
 <motion.div
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4 }}
 className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col min-h-full space-y-4 sm:space-y-6"
 >
 {/* Back button & Page title */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-3 sm:gap-4 min-w-0">
 <button
 onClick={() => navigate('/hrm/careers')}
 className="p-2.5 rounded-xl bg-white/80 border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors shadow-sm cursor-pointer shrink-0"
 >
 <ArrowLeft size={18} />
 </button>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-600 ">
 <span>Careers Pipeline</span>
 <span>/</span>
 <span className="truncate">{job?.department || 'Engineering'}</span>
 </div>
 <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
 {job?.title || 'Applicant Pipeline'}
 </h1>
 </div>
 </div>

 <button
 onClick={() => setNewCandidateModal(true)}
 className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md transition-all shadow-md shadow-blue-600/30 cursor-pointer self-start sm:self-auto"
 >
 <Plus size={16} /> Add Candidate
 </button>
 </div>

 {/* Rounds & Stages Tabs */}
 <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
 <button
 onClick={() => setActiveTab('ALL')}
 className={`px-4 py-2 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
 activeTab === 'ALL'
 ? 'bg-blue-600 text-white shadow-sm'
 : 'text-slate-500 hover:text-slate-900'
 }`}
 >
 All Applicants ({applications.length})
 </button>

 <button
 onClick={() => setActiveTab('ACTIVE')}
 className={`px-4 py-2 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
 activeTab === 'ACTIVE'
 ? 'bg-blue-600 text-white shadow-sm'
 : 'text-slate-500 hover:text-slate-900'
 }`}
 >
 Active Pipeline ({applications.filter(a => a.status !== 'HIRED' && a.status !== 'REJECTED').length})
 </button>

 {job?.rounds?.map((round) => (
 <button
 key={round.id}
 onClick={() => setActiveTab(round.id)}
 className={`px-4 py-2 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
 activeTab === round.id
 ? 'bg-blue-600 text-white shadow-sm'
 : 'text-slate-500 hover:text-slate-900'
 }`}
 >
 {round.title} ({applications.filter(a => a.currentRoundId === round.id).length})
 </button>
 ))}

 <button
 onClick={() => setActiveTab('HIRED')}
 className={`px-4 py-2 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
 activeTab === 'HIRED'
 ? 'bg-emerald-600 text-white shadow-sm'
 : 'text-emerald-600 dark:text-emerald-400 hover:underline'
 }`}
 >
 Hired ({applications.filter(a => a.status === 'HIRED').length})
 </button>
 </div>

 {/* Main Applicants Grid & Detail View */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
 {/* Applicants List */}
 <div className="lg:col-span-2 space-y-3">
 {loading ? (
 <div className="p-12 text-center">
 <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"/>
 </div>
 ) : filteredApps.length === 0 ? (
 <div className="p-12 text-center bg-white/80/80 rounded-lg border border-slate-200">
 <Users className="h-10 w-10 text-slate-400 mx-auto mb-2 opacity-60"/>
 <p className="text-sm font-semibold text-slate-700">No applicants in this stage</p>
 <p className="text-xs text-slate-400 mt-1">Add candidates or select another tab.</p>
 </div>
 ) : (
 filteredApps.map((app) => (
 <div
 key={app.id}
 onClick={() => setSelectedApp(app)}
 className={`p-4 rounded-lg border transition-all cursor-pointer bg-white ${
 selectedApp?.id === app.id
 ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md'
 : 'border-slate-200 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
 }`}
 >
 <div className="flex justify-between items-start">
 <div>
 <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
 {app.candidateName}
 </h3>
 <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
 <span className="flex items-center gap-1"><Mail size={12} /> {app.candidateEmail}</span>
 {app.candidatePhone && <span className="flex items-center gap-1"><Phone size={12} /> {app.candidatePhone}</span>}
 </div>
 </div>
 <div>
 {getStatusBadge(app.status)}
 </div>
 </div>

 <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
 <div className="text-slate-500 font-medium">
 Current Stage: <span className="text-blue-600 dark:text-blue-600 font-bold">{getRoundName(app.currentRoundId)}</span>
 </div>
 <div className="flex items-center gap-2">
 {app.status !== 'HIRED' && app.status !== 'REJECTED' && (
 <button
 onClick={(e) => { e.stopPropagation(); handleAdvanceRound(app.id, app.currentRoundId); }}
 className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-600 bg-blue-600/10 hover:bg-blue-700/20 border border-blue-600/20 rounded-lg flex items-center gap-1"
 >
 Advance <ChevronRight size={12} />
 </button>
 )}
 </div>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Selected Candidate Inspector Drawer */}
 <div className="lg:col-span-1">
 {selectedApp ? (
 <div className="sticky top-6 bg-white rounded-lg border border-slate-200 p-6 shadow-xl space-y-5">
 <div className="flex justify-between items-start">
 <div>
 <h3 className="text-lg font-bold text-slate-900">{selectedApp.candidateName}</h3>
 <p className="text-xs text-slate-500">{selectedApp.candidateEmail}</p>
 </div>
 <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600">
 <X size={16} />
 </button>
 </div>

 <div className="p-3 bg-slate-50/60 rounded-xl space-y-2 text-xs">
 <div className="flex justify-between">
 <span className="text-slate-400 font-medium">Status:</span>
 <span>{getStatusBadge(selectedApp.status)}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-slate-400 font-medium">Current Stage:</span>
 <span className="font-bold text-slate-800">{getRoundName(selectedApp.currentRoundId)}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-slate-400 font-medium">Applied Date:</span>
 <span className="text-slate-800">{new Date(selectedApp.appliedAt).toLocaleDateString()}</span>
 </div>
 </div>

 {selectedApp.notes && (
 <div>
 <p className="text-xs font-bold text-slate-400 mb-1">Interview Notes</p>
 <p className="text-xs text-slate-600 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
 {selectedApp.notes}
 </p>
 </div>
 )}

 {/* Action Buttons */}
 <div className="space-y-2 pt-2 border-t border-slate-100">
 <button
 onClick={() => handleAdvanceRound(selectedApp.id, selectedApp.currentRoundId)}
 className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
 >
 Advance to Next Round <ChevronRight size={14} />
 </button>

 <div className="grid grid-cols-2 gap-2">
 <button
 onClick={() => handleStatusChange(selectedApp.id, 'HIRED')}
 className="py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
 >
 <CheckCircle size={14} /> Hire
 </button>
 <button
 onClick={() => handleStatusChange(selectedApp.id, 'REJECTED')}
 className="py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
 >
 <XCircle size={14} /> Reject
 </button>
 </div>

 <button
 onClick={() => handleDeleteApplicant(selectedApp.id)}
 className="w-full py-1.5 text-xs text-rose-400 hover:text-rose-500 hover:underline flex items-center justify-center gap-1 pt-2"
 >
 <Trash2 size={12} /> Remove from pipeline
 </button>
 </div>
 </div>
 ) : (
 <div className="bg-white/50/30 border border-dashed border-slate-300 rounded-lg p-8 text-center text-slate-400 text-xs">
 Select an applicant to review interview history and advance stages.
 </div>
 )}
 </div>
 </div>

 {/* Add Candidate Modal */}
 <AnimatePresence>
 {newCandidateModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
 <motion.div
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="w-full max-w-md bg-white border border-slate-200/80 rounded-lg shadow-lg p-6"
 >
 <div className="flex justify-between items-center pb-3 border-b border-slate-100">
 <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
 <Users className="text-blue-600 dark:text-blue-600"size={18} />
 Add Applicant
 </h3>
 <button onClick={() => setNewCandidateModal(false)} className="text-slate-400 hover:text-slate-600">
 <X size={16} />
 </button>
 </div>

 <form onSubmit={handleAddCandidate} className="space-y-4 pt-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Candidate Full Name *
 </label>
 <input
 type="text"
 required
 value={candidateForm.candidateName}
 onChange={(e) => setCandidateForm({ ...candidateForm, candidateName: e.target.value })}
 placeholder="e.g. Anandha Krishnan"
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Email Address *
 </label>
 <input
 type="email"
 required
 value={candidateForm.candidateEmail}
 onChange={(e) => setCandidateForm({ ...candidateForm, candidateEmail: e.target.value })}
 placeholder="anand@example.com"
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Phone Number
 </label>
 <input
 type="text"
 value={candidateForm.candidatePhone}
 onChange={(e) => setCandidateForm({ ...candidateForm, candidatePhone: e.target.value })}
 placeholder="+91 98400 00000"
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Resume or Portfolio URL
 </label>
 <input
 type="url"
 value={candidateForm.resumeUrl}
 onChange={(e) => setCandidateForm({ ...candidateForm, resumeUrl: e.target.value })}
 placeholder="https://drive.google.com/... or LinkedIn"
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1">
 Initial Remarks / Referral
 </label>
 <textarea
 rows={3}
 value={candidateForm.notes}
 onChange={(e) => setCandidateForm({ ...candidateForm, notes: e.target.value })}
 placeholder="Internal notes regarding referral or test score..."
 className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-md text-xs text-slate-900 outline-none focus:border-blue-500"
 />
 </div>

 <div className="flex justify-end gap-3 pt-2">
 <button
 type="button"
 onClick={() => setNewCandidateModal(false)}
 className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-md"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-md shadow-blue-600/30"
 >
 {submitting ? 'Adding...' : 'Add Applicant'}
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

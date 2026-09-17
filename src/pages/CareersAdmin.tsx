import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Plus, Pencil, Trash2, Eye, Globe, FileText,
  Users, Check, X, Search, Filter, Calendar, MapPin, Building
} from 'lucide-react';
import { getJobs, createJob, updateJob, publishJob, closeJob, deleteJob } from '../api';
import { JobPosting, JobField, InterviewRound } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const defaultFields: JobField[] = [
  { id: 'f1', label: 'Experience', value: '3+ Years', fieldType: 'TEXT', section: 'PRIMARY', order: 1 },
  { id: 'f2', label: 'Salary Range', value: '$60,000 - $85,000', fieldType: 'TAG', section: 'PRIMARY', order: 2 },
  { id: 'f3', label: 'Location', value: 'Remote / Hybrid', fieldType: 'TAG', section: 'PRIMARY', order: 3 },
  { id: 'f4', label: 'Responsibilities', value: 'Collaborate with cross-functional teams to deliver scalable enterprise solutions.', fieldType: 'TEXTAREA', section: 'SECONDARY', order: 1 },
  { id: 'f5', label: 'Qualifications', value: 'B.S. in Computer Science or equivalent work experience with modern stack.', fieldType: 'TEXTAREA', section: 'SECONDARY', order: 2 },
];

const defaultRounds: InterviewRound[] = [
  { id: 'r1', title: 'Round 1: Screening Call', shortDescription: 'HR & background review (30 mins)', order: 1 },
  { id: 'r2', title: 'Round 2: Technical Assessment', shortDescription: 'System design and coding problem (60 mins)', order: 2 },
  { id: 'r3', title: 'Round 3: Team & Leadership Fit', shortDescription: 'Discussion with department leads', order: 3 },
  { id: 'r4', title: 'Round 4: Final Offer Discussion', shortDescription: 'Compensation and joining timeline', order: 4 },
];

export default function CareersAdmin() {
  const navigate = useNavigate();
  const { canViewAll } = useAuth();

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create / Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    location: 'Remote / Chennai',
    employmentType: 'Full-Time',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'CLOSED',
  });
  const [fields, setFields] = useState<JobField[]>(defaultFields);
  const [rounds, setRounds] = useState<InterviewRound[]>(defaultRounds);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<JobPosting | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to fetch job postings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const openCreate = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      department: 'Engineering',
      location: 'Remote / Chennai',
      employmentType: 'Full-Time',
      status: 'DRAFT',
    });
    setFields([...defaultFields]);
    setRounds([...defaultRounds]);
    setShowModal(true);
  };

  const openEdit = (job: JobPosting) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      department: job.department || 'Engineering',
      location: job.location || 'Remote',
      employmentType: job.employmentType || 'Full-Time',
      status: job.status,
    });
    setFields(job.fields?.length ? job.fields : [...defaultFields]);
    setRounds(job.rounds?.length ? job.rounds : [...defaultRounds]);
    setShowModal(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a job title');
      return;
    }

    try {
      setSubmitting(true);
      if (editingJob) {
        await updateJob(editingJob.id, {
          ...formData,
          fields,
          rounds,
        });
        toast.success('Job posting updated successfully');
      } else {
        await createJob({
          ...formData,
          fields,
          rounds,
        });
        toast.success('Job posting created successfully');
      }
      setShowModal(false);
      fetchJobs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save job posting');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (job: JobPosting) => {
    try {
      await publishJob(job.id);
      toast.success(`"${job.title}" is now Published`);
      fetchJobs();
    } catch {
      toast.error('Failed to publish job');
    }
  };

  const handleClose = async (job: JobPosting) => {
    try {
      await closeJob(job.id);
      toast.success(`"${job.title}" is now Closed`);
      fetchJobs();
    } catch {
      toast.error('Failed to close job');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteJob(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
      fetchJobs();
    } catch {
      toast.error('Failed to delete job');
    }
  };

  const addCustomField = (section: 'PRIMARY' | 'SECONDARY') => {
    const newField: JobField = {
      id: `f_${Date.now()}`,
      label: section === 'PRIMARY' ? 'Skill or Perk' : 'More Detail',
      value: '',
      fieldType: section === 'PRIMARY' ? 'TAG' : 'TEXTAREA',
      section,
      order: fields.length + 1,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<JobField>) => {
    setFields(fields.map(f => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const addRound = () => {
    const order = rounds.length + 1;
    const newRound: InterviewRound = {
      id: `r_${Date.now()}`,
      title: `Round ${order}: New Stage`,
      shortDescription: 'Evaluation description',
      order,
    };
    setRounds([...rounds, newRound]);
  };

  const updateRound = (id: string, updates: Partial<InterviewRound>) => {
    setRounds(rounds.map(r => (r.id === id ? { ...r, ...updates } : r)));
  };

  const removeRound = (id: string) => {
    setRounds(rounds.filter(r => r.id !== id));
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      (job.department && job.department.toLowerCase().includes(search.toLowerCase())) ||
      (job.location && job.location.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] uppercase font-bold tracking-widest">Published</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-full text-[10px] uppercase font-bold tracking-widest">Closed</span>;
      default:
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] uppercase font-bold tracking-widest">Draft</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col min-h-full space-y-4 sm:space-y-6"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 sm:gap-3">
            <Briefcase className="text-indigo-600 dark:text-indigo-400 h-7 w-7 sm:h-8 sm:w-8" />
            Careers & Recruitment
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Create job openings, configure custom criteria and multi-stage interview rounds.
          </p>
        </div>

        {canViewAll && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30 active:scale-95"
          >
            <Plus size={16} /> Post a Job
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 p-5 shadow-sm overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Openings</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{jobs.length}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Briefcase size={22} />
            </div>
          </div>
        </div>

        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 p-5 shadow-sm overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/80 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Published Active</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {jobs.filter(j => j.status === 'PUBLISHED').length}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Globe size={22} />
            </div>
          </div>
        </div>

        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 p-5 shadow-sm overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/80 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Drafts / In Review</p>
              <h3 className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                {jobs.filter(j => j.status === 'DRAFT').length}
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
              <FileText size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white/80 dark:bg-[#0C1017]/80 backdrop-blur-xl p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/50">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search job title, department, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            {['ALL', 'PUBLISHED', 'DRAFT', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === st
                    ? 'bg-white dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-indigo-500/40'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Job Postings Table / Cards */}
      <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-lg overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent pointer-events-none" />

        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="h-12 w-12 text-slate-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">No job openings found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or click "Post a Job" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-4 px-6">Job Opening</th>
                  <th className="py-4 px-6">Department & Type</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Interview Pipeline</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {job.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {job.location || 'Remote'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building size={14} className="text-slate-400" />
                        <span>{job.department || 'General'}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{job.employmentType || 'Full-Time'}</div>
                    </td>

                    <td className="py-4 px-6">
                      {getStatusBadge(job.status)}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 rounded-md font-mono">
                          {(job.rounds || []).length} Rounds
                        </span>
                        <button
                          onClick={() => navigate(`/careers/${job.id}/applications`)}
                          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          <Users size={14} /> Applicants
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/careers/${job.id}/applications`)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Applicants"
                        >
                          <Users size={16} />
                        </button>

                        <button
                          onClick={() => openEdit(job)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Job"
                        >
                          <Pencil size={16} />
                        </button>

                        {job.status !== 'PUBLISHED' ? (
                          <button
                            onClick={() => handlePublish(job)}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors"
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => handleClose(job)}
                            className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 rounded-lg transition-colors"
                          >
                            Close
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteTarget(job)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl bg-white dark:bg-[#0C1017] border border-slate-200/90 dark:border-slate-700/80 rounded-2xl shadow-2xl p-6 overflow-hidden my-8 max-h-[90vh] flex flex-col"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase size={20} className="text-indigo-600 dark:text-indigo-400" />
                  {editingJob ? 'Edit Job Opening' : 'Post a New Job Opening'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveJob} className="space-y-6 overflow-y-auto flex-1 pt-4 pr-1">
                {/* Basic Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Department
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    >
                      {['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Employment Type
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    >
                      {['Full-Time', 'Part-Time', 'Contract', 'Internship'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Location / Workplace
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Remote / Hybrid / Chennai"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>

                {/* Primary & Secondary Fields */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Custom Fields & Details
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => addCustomField('PRIMARY')}
                        className="px-2.5 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-500/20"
                      >
                        + Primary Field
                      </button>
                      <button
                        type="button"
                        onClick={() => addCustomField('SECONDARY')}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-500/20"
                      >
                        + Secondary Field
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {fields.map((f) => (
                      <div key={f.id} className="flex gap-2 items-start bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-indigo-500/10 text-indigo-500 shrink-0 mt-1">
                          {f.section}
                        </span>
                        <input
                          type="text"
                          value={f.label}
                          onChange={(e) => updateField(f.id, { label: e.target.value })}
                          placeholder="Field Label"
                          className="w-1/3 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          value={f.value}
                          onChange={(e) => updateField(f.id, { value: e.target.value })}
                          placeholder="Field Value or details"
                          className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeField(f.id)}
                          className="text-rose-400 hover:text-rose-500 p-1.5"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interview Rounds */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Interview Rounds ({rounds.length})
                    </h3>
                    <button
                      type="button"
                      onClick={addRound}
                      className="px-2.5 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-500/20"
                    >
                      + Add Round
                    </button>
                  </div>

                  <div className="space-y-3">
                    {rounds.map((r, i) => (
                      <div key={r.id} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {i + 1}
                        </span>
                        <input
                          type="text"
                          value={r.title}
                          onChange={(e) => updateRound(r.id, { title: e.target.value })}
                          placeholder="Round Title"
                          className="w-1/3 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                        />
                        <input
                          type="text"
                          value={r.shortDescription}
                          onChange={(e) => updateRound(r.id, { shortDescription: e.target.value })}
                          placeholder="Description / Duration"
                          className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeRound(r.id)}
                          className="text-rose-400 hover:text-rose-500 p-1.5"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-indigo-600/30 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingJob ? 'Update Job' : 'Post Job'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#0C1017] border border-slate-200/90 dark:border-slate-700/80 rounded-2xl shadow-2xl p-6"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trash2 className="text-rose-500" size={18} /> Delete Job Posting
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                Are you sure you want to delete <b>{deleteTarget.title}</b>? All associated applicant records will also be removed. This cannot be undone.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { DEPARTMENTS, Department } from '../shared/roles';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Plus, Pencil, Trash2, Globe,
  Users, Check, X, Search, Calendar, MapPin, Building,
  Mail, ChevronDown, ChevronUp, Copy, Sparkles, Layers,
  ExternalLink, ArrowUpRight, Clock, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import {
  getJobs, createJob, updateJob, publishJob, closeJob, deleteJob,
  getAllJobApplications
} from '../api';
import { JobPosting, JobField, InterviewRound, JobApplication } from '../types';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/error';
import { EmailTemplateEditor } from '../components/hrm/EmailTemplateEditor';
import toast from 'react-hot-toast';

const defaultFields: JobField[] = [
  { id: 'f1', label: 'Experience', value: '3+ Years', fieldType: 'TEXT', section: 'PRIMARY', order: 1 },
  { id: 'f2', label: 'Salary Range', value: '$70,000 - $95,000 / yr', fieldType: 'TAG', section: 'PRIMARY', order: 2 },
  { id: 'f3', label: 'Workplace', value: 'Remote / Hybrid', fieldType: 'TAG', section: 'PRIMARY', order: 3 },
  { id: 'f4', label: 'Responsibilities', value: 'Lead feature delivery, collaborate with cross-functional team leads, and ensure code quality and system performance.', fieldType: 'TEXTAREA', section: 'SECONDARY', order: 1 },
  { id: 'f5', label: 'Qualifications', value: 'Strong problem-solving background in modern stack, with great communication skills.', fieldType: 'TEXTAREA', section: 'SECONDARY', order: 2 },
];

const defaultRounds: InterviewRound[] = [
  { id: 'r1', title: 'Round 1: Screening Call', shortDescription: 'HR initial alignment and background review (30m)', order: 1 },
  { id: 'r2', title: 'Round 2: Technical Evaluation', shortDescription: 'Live architecture and problem-solving challenge (60m)', order: 2 },
  { id: 'r3', title: 'Round 3: Leadership & Team Fit', shortDescription: 'Discussion with department leads and founders', order: 3 },
  { id: 'r4', title: 'Round 4: Offer & Compensation', shortDescription: 'Final offer letter terms and joining timeline', order: 4 },
];

export default function CareersAdmin() {
  const navigate = useNavigate();
  const { canViewAll } = useAuth();

  // Fast memory / session cache for zero-delay initial render
  const [jobs, setJobs] = useState<JobPosting[]>(() => {
    try {
      const cached = sessionStorage.getItem('cached_admin_jobs');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(jobs.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'DETAILS' | 'FIELDS' | 'ROUNDS' | 'TEMPLATES'>('DETAILS');
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    department: DEPARTMENTS[0] as string,
    location: 'Remote / Hybrid / Chennai',
    employmentType: 'Full-Time',
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED' | 'CLOSED',
  });
  const [fields, setFields] = useState<JobField[]>(defaultFields);
  const [rounds, setRounds] = useState<InterviewRound[]>(defaultRounds);
  const [applicationConfirmationTemplate, setApplicationConfirmationTemplate] = useState('');
  const [roundAdvanceTemplate, setRoundAdvanceTemplate] = useState('');
  const [rejectionTemplate, setRejectionTemplate] = useState('');
  const [hireTemplate, setHireTemplate] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<JobPosting | null>(null);

  // Available merge tags for email templates
  const availableTags = useMemo(() => {
    const base = [
      { tag: 'fullName', label: 'Applicant Name ({{fullName}})' },
      { tag: 'email', label: 'Applicant Email ({{email}})' },
      { tag: 'phone', label: 'Applicant Phone ({{phone}})' },
      { tag: 'qualification', label: 'Qualification ({{qualification}})' },
      { tag: 'experience', label: 'Experience ({{experience}})' },
      { tag: 'currentOrg', label: 'Current Org ({{currentOrg}})' },
      { tag: 'resumeLink', label: 'Resume Link ({{resumeLink}})' },
      { tag: 'coverNote', label: 'Cover Note ({{coverNote}})' },
      { tag: 'jobTitle', label: 'Job Title ({{jobTitle}})' },
      { tag: 'roundTitle', label: 'Round Title ({{roundTitle}})' },
      { tag: 'roundShortDescription', label: 'Round Description ({{roundShortDescription}})' },
    ];
    fields.forEach((f) => {
      const slug = f.label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      if (slug) {
        base.push({ tag: `field_${slug}`, label: `${f.label} ({{field_${slug}}})` });
      }
    });
    return base;
  }, [fields]);

  const loadAllData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);
      const [jobsData, appsData] = await Promise.all([
        getJobs().catch(() => []),
        getAllJobApplications().catch(() => []),
      ]);
      const validJobs = Array.isArray(jobsData) ? jobsData : [];
      setJobs(validJobs);
      setApplications(Array.isArray(appsData) ? appsData : []);
      try {
        sessionStorage.setItem('cached_admin_jobs', JSON.stringify(validJobs));
      } catch {}
    } catch (err: any) {
      if (!isSilent) toast.error(err?.message || 'Failed to sync job postings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => loadAllData(true), 15000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  // Map application counts per job
  const appsCountByJob = useMemo(() => {
    const map = new Map<string, number>();
    applications.forEach((app) => {
      const count = map.get(app.jobId) || 0;
      map.set(app.jobId, count + 1);
    });
    return map;
  }, [applications]);

  const openCreate = () => {
    setEditingJob(null);
    setActiveModalTab('DETAILS');
    setFormData({
      title: '',
      department: DEPARTMENTS[0],
      location: 'Remote / Hybrid / Chennai',
      employmentType: 'Full-Time',
      status: 'PUBLISHED',
    });
    setFields([...defaultFields]);
    setRounds([...defaultRounds]);
    setApplicationConfirmationTemplate('');
    setRoundAdvanceTemplate('');
    setRejectionTemplate('');
    setHireTemplate('');
    setShowModal(true);
  };

  const openEdit = (job: JobPosting) => {
    setEditingJob(job);
    setActiveModalTab('DETAILS');
    setFormData({
      title: job.title || '',
      department: job.department || DEPARTMENTS[0],
      location: job.location || 'Remote',
      employmentType: job.employmentType || 'Full-Time',
      status: job.status || 'PUBLISHED',
    });
    setFields(job.fields?.length ? [...job.fields] : [...defaultFields]);
    setRounds(job.rounds?.length ? [...job.rounds] : [...defaultRounds]);
    setApplicationConfirmationTemplate(job.applicationConfirmationTemplate || '');
    setRoundAdvanceTemplate(job.roundAdvanceTemplate || '');
    setRejectionTemplate(job.rejectionTemplate || '');
    setHireTemplate(job.hireTemplate || '');
    setShowModal(true);
  };

  const handleDuplicate = (job: JobPosting) => {
    setEditingJob(null);
    setActiveModalTab('DETAILS');
    setFormData({
      title: `${job.title} (Copy)`,
      department: job.department || DEPARTMENTS[0],
      location: job.location || 'Remote',
      employmentType: job.employmentType || 'Full-Time',
      status: 'DRAFT',
    });
    setFields(job.fields?.length ? [...job.fields] : [...defaultFields]);
    setRounds(job.rounds?.length ? [...job.rounds] : [...defaultRounds]);
    setApplicationConfirmationTemplate(job.applicationConfirmationTemplate || '');
    setRoundAdvanceTemplate(job.roundAdvanceTemplate || '');
    setRejectionTemplate(job.rejectionTemplate || '');
    setHireTemplate(job.hireTemplate || '');
    setShowModal(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a job title');
      return;
    }

    const payload = {
      ...formData,
      fields,
      rounds,
      applicationConfirmationTemplate: applicationConfirmationTemplate.trim() || undefined,
      roundAdvanceTemplate: roundAdvanceTemplate.trim() || undefined,
      rejectionTemplate: rejectionTemplate.trim() || undefined,
      hireTemplate: hireTemplate.trim() || undefined,
    };

    try {
      setSubmitting(true);
      if (editingJob) {
        // Optimistic update
        setJobs(prev => prev.map(j => (j.id === editingJob.id ? { ...j, ...payload } : j)));
        await updateJob(editingJob.id, payload);
        toast.success('Job opening updated successfully');
      } else {
        const created = await createJob(payload);
        if (created && created.id) {
          setJobs(prev => [created, ...prev]);
        }
        toast.success('Job opening posted successfully');
      }
      setShowModal(false);
      loadAllData(true);
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to save job posting'));
      loadAllData(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (job: JobPosting, newStatus: 'PUBLISHED' | 'CLOSED' | 'DRAFT') => {
    // Optimistic UI update
    setJobs(prev => prev.map(j => (j.id === job.id ? { ...j, status: newStatus } : j)));
    try {
      if (newStatus === 'PUBLISHED') {
        await publishJob(job.id);
        toast.success(`"${job.title}" is now Published & Live`);
      } else if (newStatus === 'CLOSED') {
        await closeJob(job.id);
        toast.success(`"${job.title}" is now Closed`);
      } else {
        await updateJob(job.id, { status: 'DRAFT' });
        toast.success(`"${job.title}" set to Draft`);
      }
    } catch {
      toast.error('Failed to change status');
      loadAllData(true);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    // Optimistic delete
    setJobs(prev => prev.filter(j => j.id !== targetId));
    setDeleteTarget(null);
    try {
      await deleteJob(targetId);
      toast.success(`"${deleteTarget.title}" deleted`);
    } catch {
      toast.error('Failed to delete job');
      loadAllData(true);
    }
  };

  // Custom field helpers
  const addCustomField = (section: 'PRIMARY' | 'SECONDARY') => {
    const newField: JobField = {
      id: `f_${Date.now()}`,
      label: section === 'PRIMARY' ? 'Key Perk / Skill' : 'Custom Description',
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

  // Round helpers
  const addRound = () => {
    const newRound: InterviewRound = {
      id: `r_${Date.now()}`,
      title: `Round ${rounds.length + 1}: Interview Stage`,
      shortDescription: 'Evaluation criteria and notes',
      order: rounds.length + 1,
    };
    setRounds([...rounds, newRound]);
  };

  const updateRound = (id: string, updates: Partial<InterviewRound>) => {
    setRounds(rounds.map(r => (r.id === id ? { ...r, ...updates } : r)));
  };

  const removeRound = (id: string) => {
    if (rounds.length <= 1) {
      toast.error('Job must have at least one interview stage');
      return;
    }
    setRounds(rounds.filter(r => r.id !== id));
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchSearch = (j.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (j.department || '').toLowerCase().includes(search.toLowerCase()) ||
        (j.location || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || j.status === statusFilter;
      const matchDept = deptFilter === 'ALL' || j.department === deptFilter;
      return matchSearch && matchStatus && matchDept;
    });
  }, [jobs, search, statusFilter, deptFilter]);

  const stats = useMemo(() => {
    return {
      total: jobs.length,
      published: jobs.filter(j => j.status === 'PUBLISHED').length,
      draft: jobs.filter(j => j.status === 'DRAFT').length,
      closed: jobs.filter(j => j.status === 'CLOSED').length,
      applications: applications.length,
    };
  }, [jobs, applications]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Briefcase size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recruitment & Careers Hub</h1>
              <p className="text-xs text-slate-500 mt-0.5">Manage enterprise job openings, candidate stages, and public job portal</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => loadAllData(false)}
            disabled={refreshing}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <a
            href="/careers"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
          >
            <Globe size={15} className="text-slate-500" />
            <span>Public Site</span>
            <ArrowUpRight size={13} className="text-slate-400" />
          </a>

          <button
            onClick={openCreate}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>Post New Opening</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">All Openings</p>
            <h4 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
            <Layers size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Live / Published</p>
            <h4 className="text-2xl font-black text-emerald-600 mt-1">{stats.published}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Drafts</p>
            <h4 className="text-2xl font-black text-amber-600 mt-1">{stats.draft}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Closed</p>
            <h4 className="text-2xl font-black text-slate-500 mt-1">{stats.closed}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
            <AlertCircle size={18} />
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 rounded-xl shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-blue-100 uppercase tracking-wider">Total Applicants</p>
            <h4 className="text-2xl font-black text-white mt-1">{stats.applications}</h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
            <Users size={18} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search openings by title, location, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
          >
            <option value="ALL">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published (Live)</option>
            <option value="DRAFT">Draft</option>
            <option value="CLOSED">Closed</option>
          </select>

          {(search || statusFilter !== 'ALL' || deptFilter !== 'ALL') && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); setDeptFilter('ALL'); }}
              className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 transition-colors"
            >
              <X size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Jobs Grid / List */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-9 h-9 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold mt-3">Loading job openings...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Briefcase size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Job Openings Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || statusFilter !== 'ALL' || deptFilter !== 'ALL'
              ? 'No openings match your active search filters.'
              : 'You haven\'t posted any job openings yet. Create your first opening to begin recruiting!'}
          </p>
          <button
            onClick={openCreate}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
          >
            <Plus size={16} /> Post Opening
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredJobs.map((job) => {
            const appCount = appsCountByJob.get(job.id) || 0;
            return (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        job.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : job.status === 'CLOSED'
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          job.status === 'PUBLISHED' ? 'bg-emerald-500' : job.status === 'CLOSED' ? 'bg-slate-400' : 'bg-amber-500'
                        }`} />
                        {job.status}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2 hover:text-blue-600 transition-colors cursor-pointer" onClick={() => openEdit(job)}>
                        {job.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicate(job)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Duplicate Job Opening"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        onClick={() => openEdit(job)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Job Opening"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(job)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Opening"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Building size={13} className="text-slate-400" /> {job.department || 'General'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" /> {job.location || 'Remote'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase size={13} className="text-slate-400" /> {job.employmentType || 'Full-Time'}
                    </span>
                  </div>

                  {/* Highlights / Primary tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(job.fields || [])
                      .filter(f => f.section === 'PRIMARY' && f.value)
                      .slice(0, 3)
                      .map((f, i) => (
                        <span key={i} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                          {f.value}
                        </span>
                      ))}
                    {(job.rounds || []).length > 0 && (
                      <span className="text-[11px] font-medium bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md">
                        {job.rounds.length} Stage Process
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer action bar */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/hrm/careers/${job.id}/applications`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    <Users size={14} />
                    <span>Applicants ({appCount})</span>
                  </button>

                  <a
                    href={`/careers/${job.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                    title="View Public Career Page"
                  >
                    <ExternalLink size={15} />
                  </a>

                  {job.status === 'PUBLISHED' ? (
                    <button
                      onClick={() => handleToggleStatus(job, 'CLOSED')}
                      className="px-2.5 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                    >
                      Close
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus(job, 'PUBLISHED')}
                      className="px-2.5 py-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full CRUD / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-600 text-white rounded-xl">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {editingJob ? `Edit Opening: ${editingJob.title}` : 'Post New Job Opening'}
                    </h2>
                    <p className="text-[11px] text-slate-500">Configure job attributes, perks, interview pipeline & candidate notifications</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="flex border-b border-slate-200 px-6 bg-white shrink-0 overflow-x-auto gap-2">
                {[
                  { id: 'DETAILS', label: '1. Basic Information' },
                  { id: 'FIELDS', label: `2. Custom Fields (${fields.length})` },
                  { id: 'ROUNDS', label: `3. Interview Stages (${rounds.length})` },
                  { id: 'TEMPLATES', label: '4. Email Templates' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveModalTab(tab.id as any)}
                    className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                      activeModalTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSaveJob} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* TAB 1: Basic Information */}
                {activeModalTab === 'DETAILS' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Senior Full Stack Engineer"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Department
                        </label>
                        <select
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                        >
                          {DEPARTMENTS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Employment Type
                        </label>
                        <select
                          value={formData.employmentType}
                          onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                        >
                          {['Full-Time', 'Part-Time', 'Contract', 'Internship'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Initial Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                        >
                          <option value="PUBLISHED">Published (Live to candidates)</option>
                          <option value="DRAFT">Draft</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Location / Workplace Tag
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Remote / Hybrid / Chennai HQ"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: Custom Fields */}
                {activeModalTab === 'FIELDS' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Custom Tags & Field Breakdown</h4>
                        <p className="text-[11px] text-slate-500">Add highlight badges, salary benchmarks, and description sections</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => addCustomField('PRIMARY')}
                          className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          + Highlight Tag
                        </button>
                        <button
                          type="button"
                          onClick={() => addCustomField('SECONDARY')}
                          className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          + Section Block
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {fields.map((f) => (
                        <div key={f.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex gap-3 items-start">
                          <span className={`text-[10px] font-extrabold px-2 py-1 rounded-md uppercase tracking-wider mt-1 shrink-0 ${
                            f.section === 'PRIMARY' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {f.section}
                          </span>

                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={f.label}
                              onChange={(e) => updateField(f.id, { label: e.target.value })}
                              placeholder="Field Label (e.g. Experience)"
                              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                            <div className="sm:col-span-2">
                              {f.section === 'SECONDARY' ? (
                                <textarea
                                  rows={2}
                                  value={f.value}
                                  onChange={(e) => updateField(f.id, { value: e.target.value })}
                                  placeholder="Detailed section content or requirements..."
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={f.value}
                                  onChange={(e) => updateField(f.id, { value: e.target.value })}
                                  placeholder="Tag Value (e.g. 4+ Years in React)"
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                                />
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeField(f.id)}
                            className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors mt-0.5"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: Interview Stages */}
                {activeModalTab === 'ROUNDS' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Multi-Stage Candidate Evaluation Pipeline</h4>
                        <p className="text-[11px] text-slate-500">Define each interview round candidates will progress through</p>
                      </div>
                      <button
                        type="button"
                        onClick={addRound}
                        className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                      >
                        + Add Stage
                      </button>
                    </div>

                    <div className="space-y-3">
                      {rounds.map((r, idx) => (
                        <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-1">
                            {idx + 1}
                          </div>

                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={r.title}
                              onChange={(e) => updateRound(r.id, { title: e.target.value })}
                              placeholder="Stage Title (e.g. Round 2: System Design)"
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                            />
                            <input
                              type="text"
                              value={r.shortDescription}
                              onChange={(e) => updateRound(r.id, { shortDescription: e.target.value })}
                              placeholder="Short description / duration / focus area"
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeRound(r.id)}
                            className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors mt-1"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: Email Notification Templates */}
                {activeModalTab === 'TEMPLATES' && (
                  <div className="space-y-6">
                    <EmailTemplateEditor
                      label="1. Candidate Application Received Confirmation"
                      description="Sent automatically to applicant immediately upon form submission."
                      template={applicationConfirmationTemplate}
                      onChange={setApplicationConfirmationTemplate}
                      availableTags={availableTags}
                    />

                    <EmailTemplateEditor
                      label="2. Shortlist / Round Advancement Notification"
                      description="Dispatched when recruiter advances candidate to the next round."
                      template={roundAdvanceTemplate}
                      onChange={setRoundAdvanceTemplate}
                      availableTags={availableTags}
                    />

                    <EmailTemplateEditor
                      label="3. Rejection / Respectful Decision Email"
                      description="Dispatched when an applicant is rejected."
                      template={rejectionTemplate}
                      onChange={setRejectionTemplate}
                      availableTags={availableTags}
                    />

                    <EmailTemplateEditor
                      label="4. Offer of Employment / Congratulations"
                      description="Dispatched when candidate successfully finishes the final round and is hired."
                      template={hireTemplate}
                      onChange={setHireTemplate}
                      availableTags={availableTags}
                    />
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>

                  <div className="flex gap-2">
                    {activeModalTab !== 'DETAILS' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeModalTab === 'FIELDS') setActiveModalTab('DETAILS');
                          else if (activeModalTab === 'ROUNDS') setActiveModalTab('FIELDS');
                          else if (activeModalTab === 'TEMPLATES') setActiveModalTab('ROUNDS');
                        }}
                        className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                      >
                        Previous Step
                      </button>
                    )}

                    {activeModalTab !== 'TEMPLATES' ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeModalTab === 'DETAILS') setActiveModalTab('FIELDS');
                          else if (activeModalTab === 'FIELDS') setActiveModalTab('ROUNDS');
                          else if (activeModalTab === 'ROUNDS') setActiveModalTab('TEMPLATES');
                        }}
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                      >
                        Next: {activeModalTab === 'DETAILS' ? 'Custom Fields' : activeModalTab === 'FIELDS' ? 'Interview Stages' : 'Email Templates'}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2"
                      >
                        <Check size={16} />
                        {submitting ? 'Saving Opening...' : editingJob ? 'Update Job Opening' : 'Publish Job Opening'}
                      </button>
                    )}
                  </div>
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
              className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="text-rose-500" size={18} /> Delete Job Opening
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to delete <b>{deleteTarget.title}</b>? All associated pipeline records and applicant data for this opening will also be permanently deleted.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, ArrowLeft, Plus, CheckCircle, XCircle, ChevronRight,
  Mail, Phone, FileText, Star, Briefcase, Trash2, Edit3, X,
  Calendar, Clock, Video, ExternalLink, RefreshCw, LayoutGrid,
  ListFilter, Search, UserCheck, UserX, MessageSquare, ChevronDown,
  Building, GraduationCap, Award, Send, AlertCircle, Sparkles, Check, Globe
} from 'lucide-react';
import {
  getJob, getJobs, getJobApplications, getAllJobApplications,
  createJobApplication, updateJobApplication, updateApplicationRound,
  updateApplicationStatus, decideJobApplication, deleteJobApplication
} from '../api';
import { JobPosting, JobApplication, InterviewRound } from '../types';
import toast from 'react-hot-toast';

export default function JobApplications() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  // All jobs & currently active job
  const [allJobs, setAllJobs] = useState<JobPosting[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(jobId || 'ALL');
  const [currentJob, setCurrentJob] = useState<JobPosting | null>(null);

  // Applications list
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected candidate drawer / details
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [isEditingCandidate, setIsEditingCandidate] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'PROFILE' | 'ROUNDS' | 'INTERVIEW' | 'EMAILS'>('PROFILE');

  // Candidate Edit / Scheduler State
  const [editForm, setEditForm] = useState<Partial<JobApplication>>({});

  // Add Candidate modal
  const [newCandidateModal, setNewCandidateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [candidateForm, setCandidateForm] = useState({
    jobId: jobId || '',
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    qualification: '',
    experience: '',
    currentOrg: '',
    resumeUrl: '',
    portfolioUrl: '',
    coverNote: '',
    notes: '',
  });

  // Load jobs list
  const loadJobsList = useCallback(async () => {
    try {
      const data = await getJobs();
      setAllJobs(Array.isArray(data) ? data : []);
      if (jobId && jobId !== 'ALL') {
        const found = data.find(j => j.id === jobId);
        if (found) setCurrentJob(found);
      }
    } catch {
      // ignore
    }
  }, [jobId]);

  // Load applicants
  const loadData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      let appsData: JobApplication[] = [];
      if (selectedJobId && selectedJobId !== 'ALL') {
        appsData = await getJobApplications(selectedJobId);
      } else {
        appsData = await getAllJobApplications();
      }

      setApplications(Array.isArray(appsData) ? appsData : []);

      // If active candidate selected, refresh reference
      if (selectedApp) {
        const updated = appsData.find(a => a.id === selectedApp.id);
        if (updated) setSelectedApp(updated);
      }
    } catch {
      if (!isBackground) toast.error('Failed to load applicant pipeline');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedJobId, selectedApp]);

  useEffect(() => {
    loadJobsList();
  }, [loadJobsList]);

  useEffect(() => {
    if (selectedJobId && selectedJobId !== 'ALL') {
      const found = allJobs.find(j => j.id === selectedJobId);
      setCurrentJob(found || null);
    } else {
      setCurrentJob(null);
    }
    loadData();
  }, [selectedJobId, allJobs, loadData]);

  // Real-time auto-polling every 5 seconds for instant updates without page refresh
  useEffect(() => {
    const timer = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Open candidate details drawer
  const handleOpenCandidate = (app: JobApplication) => {
    setSelectedApp(app);
    setEditForm({ ...app });
    setIsEditingCandidate(false);
    setActiveDrawerTab('PROFILE');
  };

  // Add Candidate handler
  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateForm.candidateName || !candidateForm.candidateEmail) {
      toast.error('Name and email are required');
      return;
    }
    const targetJobId = candidateForm.jobId || selectedJobId;
    if (!targetJobId || targetJobId === 'ALL') {
      toast.error('Please select a target job opening');
      return;
    }

    const job = allJobs.find(j => j.id === targetJobId);
    const firstRoundId = job?.rounds?.[0]?.id || 'r1';

    try {
      setSubmitting(true);
      const newApp = await createJobApplication(targetJobId, {
        ...candidateForm,
        currentRoundId: firstRoundId,
        status: 'APPLIED',
      });
      // Optimistic update
      setApplications(prev => [newApp, ...prev]);
      toast.success('Candidate added to pipeline');
      setNewCandidateModal(false);
      setCandidateForm({
        jobId: targetJobId,
        candidateName: '',
        candidateEmail: '',
        candidatePhone: '',
        qualification: '',
        experience: '',
        currentOrg: '',
        resumeUrl: '',
        portfolioUrl: '',
        coverNote: '',
        notes: '',
      });
      loadData(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add candidate');
    } finally {
      setSubmitting(false);
    }
  };

  // Advance candidate to next round
  const handleAdvanceRound = async (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    const targetJob = allJobs.find(j => j.id === app.jobId) || currentJob;
    const rounds = targetJob?.rounds || [];
    
    const currentIndex = rounds.findIndex(r => r.id === app.currentRoundId);
    if (currentIndex < rounds.length - 1) {
      const nextRound = rounds[currentIndex + 1];
      // Optimistic UI update
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, currentRoundId: nextRound.id, status: 'INTERVIEWING' } : a));
      if (selectedApp?.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, currentRoundId: nextRound.id, status: 'INTERVIEWING' } : null);
      }
      try {
        await updateApplicationRound(appId, nextRound.id, 'INTERVIEWING');
        toast.success(`Candidate upgraded to ${nextRound.title}`);
        loadData(true);
      } catch {
        toast.error('Failed to advance round');
        loadData();
      }
    } else {
      // Last round -> Offer / Hire
      handleStatusChange(appId, 'HIRED');
    }
  };

  // Direct upgrade to ANY specific round
  const handleDirectRoundUpgrade = async (appId: string, targetRoundId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    const targetJob = allJobs.find(j => j.id === app.jobId) || currentJob;
    const targetRound = targetJob?.rounds?.find(r => r.id === targetRoundId);
    const roundTitle = targetRound?.title || 'Selected Stage';

    // Optimistic UI update
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, currentRoundId: targetRoundId, status: 'INTERVIEWING' } : a));
    if (selectedApp?.id === appId) {
      setSelectedApp(prev => prev ? { ...prev, currentRoundId: targetRoundId, status: 'INTERVIEWING' } : null);
    }

    try {
      await updateApplicationRound(appId, targetRoundId, 'INTERVIEWING');
      toast.success(`Upgraded to ${roundTitle}`);
      loadData(true);
    } catch {
      toast.error('Failed to update stage');
      loadData();
    }
  };

  // Status Change (HIRED / REJECTED / APPLIED / INTERVIEWING)
  const handleStatusChange = async (appId: string, status: 'HIRED' | 'REJECTED' | 'INTERVIEWING' | 'IN_REVIEW' | 'APPLIED') => {
    // Optimistic UI update
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    if (selectedApp?.id === appId) {
      setSelectedApp(prev => prev ? { ...prev, status } : null);
    }

    try {
      await updateApplicationStatus(appId, status);
      if (status === 'HIRED') {
        toast.success('Candidate marked as HIRED! Provisioned to employee roster.');
      } else if (status === 'REJECTED') {
        toast.success('Candidate marked as REJECTED. Notification sent.');
      } else {
        toast.success(`Status updated to ${status}`);
      }
      loadData(true);
    } catch {
      toast.error('Failed to update status');
      loadData();
    }
  };

  // Rating update
  const handleRatingChange = async (appId: string, rating: number) => {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, rating } : a));
    if (selectedApp?.id === appId) {
      setSelectedApp(prev => prev ? { ...prev, rating } : null);
    }
    try {
      await updateJobApplication(appId, { rating });
      toast.success(`Rating updated: ${rating} ★`);
    } catch {
      toast.error('Failed to save rating');
    }
  };

  // Save candidate profile / interview schedule updates
  const handleSaveCandidateDetails = async () => {
    if (!selectedApp) return;
    try {
      setSubmitting(true);
      const updated = await updateJobApplication(selectedApp.id, editForm);
      // Optimistic update
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, ...updated } : a));
      setSelectedApp(updated);
      setIsEditingCandidate(false);
      toast.success('Candidate profile updated');
      loadData(true);
    } catch {
      toast.error('Failed to update candidate details');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete applicant
  const handleDeleteApplicant = async (appId: string) => {
    if (!window.confirm('Are you sure you want to remove this applicant from the recruitment pipeline?')) return;
    setApplications(prev => prev.filter(a => a.id !== appId));
    if (selectedApp?.id === appId) setSelectedApp(null);

    try {
      await deleteJobApplication(appId);
      toast.success('Applicant removed from pipeline');
      loadData(true);
    } catch {
      toast.error('Failed to remove applicant');
      loadData();
    }
  };

  // Helper to get round name
  const getRoundName = (jobIdForApp?: string, roundId?: string) => {
    const job = allJobs.find(j => j.id === jobIdForApp) || currentJob;
    const round = job?.rounds?.find(r => r.id === roundId);
    return round ? round.title : 'Screening / Applied';
  };

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (app.candidateName || '').toLowerCase().includes(q) ||
          (app.candidateEmail || '').toLowerCase().includes(q) ||
          (app.candidatePhone || '').toLowerCase().includes(q) ||
          (app.qualification || '').toLowerCase().includes(q) ||
          (app.currentOrg || '').toLowerCase().includes(q) ||
          (app.notes || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [applications, searchQuery]);

  // Kanban Columns definition
  const kanbanColumns = useMemo(() => {
    if (currentJob && currentJob.rounds && currentJob.rounds.length > 0) {
      const stageCols = currentJob.rounds.map(round => ({
        id: round.id,
        title: round.title,
        badgeColor: 'bg-blue-100 text-blue-700',
        items: filteredApps.filter(a => a.currentRoundId === round.id && a.status !== 'HIRED' && a.status !== 'REJECTED')
      }));
      return [
        ...stageCols,
        {
          id: 'HIRED',
          title: 'Hired & Offer Accepted',
          badgeColor: 'bg-emerald-100 text-emerald-700',
          items: filteredApps.filter(a => a.status === 'HIRED')
        },
        {
          id: 'REJECTED',
          title: 'Not Moving Forward',
          badgeColor: 'bg-rose-100 text-rose-700',
          items: filteredApps.filter(a => a.status === 'REJECTED')
        }
      ];
    } else {
      // Default standard columns when viewing All Jobs or no custom rounds
      return [
        {
          id: 'APPLIED',
          title: 'Applied / Screening',
          badgeColor: 'bg-amber-100 text-amber-700',
          items: filteredApps.filter(a => (a.status === 'APPLIED' || !a.status || a.status === 'IN_REVIEW') && a.status !== 'HIRED' && a.status !== 'REJECTED')
        },
        {
          id: 'INTERVIEWING',
          title: 'Interviewing / Evaluation',
          badgeColor: 'bg-blue-100 text-blue-700',
          items: filteredApps.filter(a => a.status === 'INTERVIEWING' || a.status === 'IN_PROGRESS')
        },
        {
          id: 'HIRED',
          title: 'Hired & Provisioned',
          badgeColor: 'bg-emerald-100 text-emerald-700',
          items: filteredApps.filter(a => a.status === 'HIRED')
        },
        {
          id: 'REJECTED',
          title: 'Archived / Rejected',
          badgeColor: 'bg-rose-100 text-rose-700',
          items: filteredApps.filter(a => a.status === 'REJECTED')
        }
      ];
    }
  }, [currentJob, filteredApps]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-4 sm:p-6 max-w-[1600px] mx-auto flex flex-col min-h-screen space-y-4"
    >
      {/* ── Sleek Compact Header Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        {/* Left Title & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/hrm/careers')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
            title="Back to Careers Admin"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-600">
              <span>Recruitment Pipeline</span>
              <span>/</span>
              <span className="truncate">{currentJob?.department || 'Twincord HRM'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                {currentJob ? currentJob.title : 'All Job Applications'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {applications.length} {applications.length === 1 ? 'applicant' : 'applicants'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls: Search, Job Selector, View Toggle, Add Candidate */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Compact Inline Search */}
          <div className="relative w-48 sm:w-56">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate..."
              className="w-full pl-8 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Job Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="px-2.5 py-1.5 pr-7 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer appearance-none transition-colors max-w-[180px] truncate"
            >
              <option value="ALL">All Jobs ({allJobs.length})</option>
              {allJobs.map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg">
            <button
              onClick={() => setViewMode('KANBAN')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'KANBAN' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid size={13} /> Board
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'TABLE' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table List View"
            >
              <ListFilter size={13} /> Table
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => loadData(true)}
            className={`p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors ${refreshing ? 'animate-spin text-blue-600' : ''}`}
            title="Refresh pipeline"
          >
            <RefreshCw size={14} />
          </button>

          {/* Add Candidate Button */}
          <button
            onClick={() => {
              setCandidateForm(prev => ({ ...prev, jobId: selectedJobId !== 'ALL' ? selectedJobId : allJobs[0]?.id || '' }));
              setNewCandidateModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus size={14} /> Add Candidate
          </button>
        </div>
      </div>

      {/* ── Main Pipeline: Kanban Board or Table ── */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">Loading pipeline...</p>
        </div>
      ) : viewMode === 'KANBAN' ? (
        /* ── STREAMLINED KANBAN BOARD ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map(col => (
            <div
              key={col.id}
              className="bg-slate-100/70 rounded-xl border border-slate-200 flex flex-col min-h-[400px] shadow-xs"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-200/80 flex items-center justify-between bg-white rounded-t-xl">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800 truncate" title={col.title}>
                    {col.title}
                  </h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.badgeColor}`}>
                  {col.items.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-2 space-y-2 flex-1">
                {col.items.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg bg-white/40">
                    <p className="text-[11px] font-medium">No candidates in this stage</p>
                  </div>
                ) : (
                  col.items.map(app => {
                    const appJob = allJobs.find(j => j.id === app.jobId);
                    return (
                      <div
                        key={app.id}
                        onClick={() => handleOpenCandidate(app)}
                        className={`p-3 rounded-lg border bg-white cursor-pointer transition-all hover:shadow-sm hover:border-blue-400 group relative ${
                          selectedApp?.id === app.id ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs' : 'border-slate-200 shadow-xs'
                        }`}
                      >
                        {/* Header: Name + Rating */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                            {app.candidateName || app.fullName}
                          </h4>
                          {/* Rating display */}
                          <div className="flex items-center text-amber-500 shrink-0">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={10}
                                className={star <= (app.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Job position badge if viewing ALL jobs */}
                        {selectedJobId === 'ALL' && appJob && (
                          <div className="mt-1">
                            <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-full">
                              {appJob.title}
                            </span>
                          </div>
                        )}

                        {/* Contact info snippet */}
                        <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-500">
                          <p className="flex items-center gap-1 truncate">
                            <Mail size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate">{app.candidateEmail || app.email}</span>
                          </p>
                          {(app.candidatePhone || app.phone) && (
                            <p className="flex items-center gap-1 truncate">
                              <Phone size={11} className="text-slate-400 shrink-0" />
                              <span>{app.candidatePhone || app.phone}</span>
                            </p>
                          )}
                        </div>

                        {/* Scheduled Interview badge if present */}
                        {app.interviewDate && (
                          <div className="mt-2 p-1.5 bg-indigo-50/80 border border-indigo-100 rounded flex items-center justify-between text-[10px] text-indigo-700">
                            <span className="flex items-center gap-1 font-semibold">
                              <Calendar size={11} /> {new Date(app.interviewDate).toLocaleDateString()} {app.interviewTime && `@ ${app.interviewTime}`}
                            </span>
                            {app.meetingLink && (
                              <a
                                href={app.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 underline"
                              >
                                Join <ExternalLink size={9} />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Card Footer: Advance button & Applied date */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-[10px] text-slate-400">
                            {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recent'}
                          </span>

                          {app.status !== 'HIRED' && app.status !== 'REJECTED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdvanceRound(app.id);
                              }}
                              className="px-2 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded flex items-center gap-0.5 transition-colors"
                              title="Advance to next round"
                            >
                              Advance <ChevronRight size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Target Role</th>
                  <th className="py-3 px-4">Current Stage / Round</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Interview Schedule</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No candidates match your search.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map(app => {
                    const appJob = allJobs.find(j => j.id === app.jobId);
                    return (
                      <tr
                        key={app.id}
                        onClick={() => handleOpenCandidate(app)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        {/* Candidate */}
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-900 text-xs">{app.candidateName || app.fullName}</div>
                          <div className="text-slate-500 text-[11px]">{app.candidateEmail || app.email}</div>
                          {(app.candidatePhone || app.phone) && <div className="text-slate-400 text-[10px]">{app.candidatePhone || app.phone}</div>}
                        </td>

                        {/* Role */}
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-slate-700">{appJob?.title || 'General Applicant'}</span>
                          <div className="text-slate-400 text-[10px]">{appJob?.department || 'Twincord'}</div>
                        </td>

                        {/* Current Stage */}
                        <td className="py-2.5 px-4">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-100">
                            {getRoundName(app.jobId, app.currentRoundId)}
                          </div>
                        </td>

                        {/* Rating */}
                        <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                onClick={() => handleRatingChange(app.id, s)}
                                className="hover:scale-125 transition-transform cursor-pointer"
                              >
                                <Star
                                  size={12}
                                  className={s <= (app.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                                />
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* Schedule */}
                        <td className="py-2.5 px-4">
                          {app.interviewDate ? (
                            <div className="text-indigo-700 font-semibold text-[11px] flex items-center gap-1">
                              <Calendar size={11} /> {new Date(app.interviewDate).toLocaleDateString()}
                              {app.interviewTime && <span className="text-slate-500">({app.interviewTime})</span>}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Not scheduled</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-4">
                          {app.status === 'HIRED' ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] uppercase">Hired</span>
                          ) : app.status === 'REJECTED' ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px] uppercase">Rejected</span>
                          ) : app.status === 'INTERVIEWING' ? (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px] uppercase">Interviewing</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] uppercase">Applied</span>
                          )}
                        </td>

                        {/* Quick Actions */}
                        <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {app.status !== 'HIRED' && app.status !== 'REJECTED' && (
                              <button
                                onClick={() => handleAdvanceRound(app.id)}
                                className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-[11px] font-bold flex items-center gap-0.5"
                                title="Advance to Next Round"
                              >
                                Advance <ChevronRight size={11} />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenCandidate(app)}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                              title="View & Edit Dossier"
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Candidate Profile & Action Dossier Drawer ── */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 truncate">
                      {selectedApp.candidateName || selectedApp.fullName}
                    </h2>
                    {selectedApp.status === 'HIRED' ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] uppercase">Hired</span>
                    ) : selectedApp.status === 'REJECTED' ? (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px] uppercase">Rejected</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px] uppercase">In Pipeline</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{selectedApp.candidateEmail || selectedApp.email}</span>
                    {(selectedApp.candidatePhone || selectedApp.phone) && <span>· {selectedApp.candidatePhone || selectedApp.phone}</span>}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Tab Navigation */}
              <div className="flex items-center gap-2 px-4 border-b border-slate-200 bg-white">
                <button
                  onClick={() => setActiveDrawerTab('PROFILE')}
                  className={`py-2.5 px-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeDrawerTab === 'PROFILE' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveDrawerTab('ROUNDS')}
                  className={`py-2.5 px-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeDrawerTab === 'ROUNDS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Round Upgrades
                </button>
                <button
                  onClick={() => setActiveDrawerTab('INTERVIEW')}
                  className={`py-2.5 px-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeDrawerTab === 'INTERVIEW' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Interview Scheduler
                </button>
                <button
                  onClick={() => setActiveDrawerTab('EMAILS')}
                  className={`py-2.5 px-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeDrawerTab === 'EMAILS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Email Logs ({selectedApp.emailLogs?.length || 0})
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-5 overflow-y-auto flex-1 space-y-5">
                {/* ── TAB 1: PROFILE & DOSSIER ── */}
                {activeDrawerTab === 'PROFILE' && (
                  <div className="space-y-4">
                    {/* Rating Bar */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Recruiter Rating</p>
                        <p className="text-[11px] text-slate-500">Candidate evaluation</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleRatingChange(selectedApp.id, s)}
                            className="p-0.5 hover:scale-125 transition-transform"
                          >
                            <Star
                              size={18}
                              className={s <= (selectedApp.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Candidate Details Grid */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <span className="text-slate-400 font-semibold block text-[11px]">Qualification</span>
                        <span className="font-bold text-slate-800">{selectedApp.qualification || 'Not provided'}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <span className="text-slate-400 font-semibold block text-[11px]">Experience</span>
                        <span className="font-bold text-slate-800">{selectedApp.experience || 'Not provided'}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <span className="text-slate-400 font-semibold block text-[11px]">Current Org / College</span>
                        <span className="font-bold text-slate-800">{selectedApp.currentOrg || 'Not provided'}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <span className="text-slate-400 font-semibold block text-[11px]">Application Date</span>
                        <span className="font-bold text-slate-800">{selectedApp.appliedAt ? new Date(selectedApp.appliedAt).toLocaleDateString() : 'Recent'}</span>
                      </div>
                    </div>

                    {/* Resume / Portfolio Links */}
                    {(selectedApp.resumeUrl || selectedApp.portfolioUrl) && (
                      <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg space-y-1.5">
                        <p className="text-xs font-bold text-blue-900">Attachments</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedApp.resumeUrl && (
                            <a
                              href={selectedApp.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-blue-600 border border-blue-200 rounded text-xs font-bold shadow-xs hover:bg-blue-50"
                            >
                              <FileText size={12} /> View Resume <ExternalLink size={10} />
                            </a>
                          )}
                          {selectedApp.portfolioUrl && (
                            <a
                              href={selectedApp.portfolioUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-slate-700 border border-slate-200 rounded text-xs font-bold shadow-xs hover:bg-slate-50"
                            >
                              <Globe size={12} /> Portfolio <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cover Note */}
                    {selectedApp.coverNote && (
                      <div>
                        <p className="text-xs font-bold text-slate-600 mb-1">Cover Note</p>
                        <p className="text-xs text-slate-700 p-3 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap">
                          {selectedApp.coverNote}
                        </p>
                      </div>
                    )}

                    {/* Internal Interview Notes / Feedback */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-700">Interview / Evaluation Notes</label>
                        <button
                          onClick={handleSaveCandidateDetails}
                          disabled={submitting}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Save Notes
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={editForm.notes ?? selectedApp.notes ?? ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add candidate evaluation notes, strengths, feedback..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* ── TAB 2: ROUND UPGRADES & STAGE PROGRESSION ── */}
                {activeDrawerTab === 'ROUNDS' && (
                  <div className="space-y-5">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs font-semibold text-slate-500">Current Assigned Stage</p>
                      <p className="text-sm font-bold text-blue-700 mt-0.5">
                        {getRoundName(selectedApp.jobId, selectedApp.currentRoundId)}
                      </p>
                    </div>

                    {/* Direct Round Upgrade Selector */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                        Move to Specific Round
                      </h4>
                      <div className="space-y-2">
                        {(allJobs.find(j => j.id === selectedApp.jobId) || currentJob)?.rounds?.map((round, idx) => {
                          const isCurrent = round.id === selectedApp.currentRoundId;
                          return (
                            <div
                              key={round.id}
                              className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                                isCurrent
                                  ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <p className="text-xs font-bold text-slate-900">{round.title}</p>
                                </div>
                                {round.shortDescription && (
                                  <p className="text-[11px] text-slate-500 mt-0.5 ml-7">{round.shortDescription}</p>
                                )}
                              </div>

                              <div>
                                {isCurrent ? (
                                  <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                                    Active Round
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleDirectRoundUpgrade(selectedApp.id, round.id)}
                                    className="px-2.5 py-0.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    Move Here
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Stage Decision Action */}
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <p className="text-xs font-bold text-slate-800">Pipeline Actions</p>
                      <button
                        onClick={() => handleAdvanceRound(selectedApp.id)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1 transition-all"
                      >
                        Advance to Next Round <ChevronRight size={13} />
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleStatusChange(selectedApp.id, 'HIRED')}
                          className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <CheckCircle size={14} /> Final Hire
                        </button>
                        <button
                          onClick={() => handleStatusChange(selectedApp.id, 'REJECTED')}
                          className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: INTERVIEW SCHEDULER ── */}
                {activeDrawerTab === 'INTERVIEW' && (
                  <div className="space-y-3.5">
                    <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg">
                      <p className="text-xs font-bold text-indigo-950">Schedule Interview</p>
                      <p className="text-[11px] text-indigo-700">Set date, time, interviewer, and meeting URL.</p>
                    </div>

                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Interview Date</label>
                          <input
                            type="date"
                            value={editForm.interviewDate ?? selectedApp.interviewDate ?? ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, interviewDate: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Interview Time</label>
                          <input
                            type="time"
                            value={editForm.interviewTime ?? selectedApp.interviewTime ?? ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, interviewTime: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Interviewer Name / Panel</label>
                        <input
                          type="text"
                          placeholder="e.g. Lead Engineer, Hiring Manager"
                          value={editForm.interviewerName ?? selectedApp.interviewerName ?? ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, interviewerName: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Meeting Link (Google Meet / Zoom)</label>
                        <input
                          type="url"
                          placeholder="https://meet.google.com/xyz-abcd-efg"
                          value={editForm.meetingLink ?? selectedApp.meetingLink ?? ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleSaveCandidateDetails}
                        disabled={submitting}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1"
                      >
                        <Calendar size={13} /> Save Interview Schedule
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: EMAIL DISPATCH LOGS ── */}
                {activeDrawerTab === 'EMAILS' && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-800">Email History</p>
                    {(!selectedApp.emailLogs || selectedApp.emailLogs.length === 0) ? (
                      <div className="p-6 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                        <Mail className="mx-auto mb-1.5 opacity-50" size={20} />
                        <p className="text-xs font-semibold">No emails recorded</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Dispatches are tracked automatically on stage advances.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedApp.emailLogs.map((log, i) => (
                          <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-900">{log.subject}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                log.status === 'Sent' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {log.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500">
                              To: {log.to} · {new Date(log.sentAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer: Delete action */}
              <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <button
                  onClick={() => handleDeleteApplicant(selectedApp.id)}
                  className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded flex items-center gap-1 font-semibold transition-colors"
                >
                  <Trash2 size={12} /> Remove
                </button>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-3.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Candidate Modal ── */}
      <AnimatePresence>
        {newCandidateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-2xl p-5 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="text-blue-600" size={16} />
                  Add Candidate
                </h3>
                <button onClick={() => setNewCandidateModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleAddCandidate} className="space-y-3 pt-3 overflow-y-auto flex-1 pr-1">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Target Job Position *</label>
                  <select
                    required
                    value={candidateForm.jobId}
                    onChange={(e) => setCandidateForm({ ...candidateForm, jobId: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-500"
                  >
                    <option value="">Select Target Job Opening</option>
                    {allJobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title} ({j.department})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Candidate Name *</label>
                    <input
                      type="text"
                      required
                      value={candidateForm.candidateName}
                      onChange={(e) => setCandidateForm({ ...candidateForm, candidateName: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={candidateForm.candidateEmail}
                      onChange={(e) => setCandidateForm({ ...candidateForm, candidateEmail: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
                    <input
                      type="text"
                      value={candidateForm.candidatePhone}
                      onChange={(e) => setCandidateForm({ ...candidateForm, candidatePhone: e.target.value })}
                      placeholder="+91 98400 00000"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Qualification</label>
                    <input
                      type="text"
                      value={candidateForm.qualification}
                      onChange={(e) => setCandidateForm({ ...candidateForm, qualification: e.target.value })}
                      placeholder="B.Tech Computer Science"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Experience</label>
                    <input
                      type="text"
                      value={candidateForm.experience}
                      onChange={(e) => setCandidateForm({ ...candidateForm, experience: e.target.value })}
                      placeholder="3.5 Years"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Current Org</label>
                    <input
                      type="text"
                      value={candidateForm.currentOrg}
                      onChange={(e) => setCandidateForm({ ...candidateForm, currentOrg: e.target.value })}
                      placeholder="Acme Corp"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Resume Link</label>
                  <input
                    type="url"
                    value={candidateForm.resumeUrl}
                    onChange={(e) => setCandidateForm({ ...candidateForm, resumeUrl: e.target.value })}
                    placeholder="https://drive.google.com/resume.pdf"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={candidateForm.notes}
                    onChange={(e) => setCandidateForm({ ...candidateForm, notes: e.target.value })}
                    placeholder="Candidate notes..."
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setNewCandidateModal(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs"
                  >
                    {submitting ? 'Adding...' : 'Add Candidate'}
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

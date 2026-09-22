import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ListTodo, CheckCircle2, Clock, AlertCircle, Plus, Search,
  Filter, Calendar, User, UserCheck, Shield, Trash2, Edit3,
  CheckCircle, ArrowUpRight, ArrowRight, ChevronDown, X,
  AlertTriangle, Sparkles, Folder, Flag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getEmployeeTasks, createEmployeeTask, updateEmployeeTask, deleteEmployeeTask, getUsers } from '../api';
import type { EmployeeTask, UserAccount } from '../types';
import toast from 'react-hot-toast';

type TabView = 'my-tasks' | 'assigned-by-me' | 'all-tasks';
type StatusFilter = 'all' | 'Pending' | 'In Progress' | 'Done';

const CATEGORIES = [
  'General',
  'Engineering',
  'Operations',
  'Sales',
  'Marketing',
  'HR & Compliance',
  'Design',
  'Customer Support'
];

export default function Tasks() {
  const { user, isAdmin, canViewAll, canAssignTasks } = useAuth();

  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabView>('my-tasks');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [category, setCategory] = useState('General');
  const [dueDate, setDueDate] = useState('');

  // Edit task modal
  const [editingTask, setEditingTask] = useState<EmployeeTask | null>(null);

  // Load tasks & users
  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedTasks, fetchedUsersRes] = await Promise.all([
        getEmployeeTasks().catch(() => []),
        getUsers({}).catch(() => ({ data: [], total: 0 }))
      ]);

      setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
      const userList = fetchedUsersRes.data || (Array.isArray(fetchedUsersRes) ? fetchedUsersRes : []);
      setUsers(userList);
    } catch (err) {
      console.error('Failed to load tasks data:', err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Tab view filter
      if (activeTab === 'my-tasks') {
        const isAssignedToUser =
          task.assignedToId === user?.id ||
          (user?.email && task.assignedToEmail?.toLowerCase() === user.email.toLowerCase()) ||
          (user?.firstName && task.assignedToName?.toLowerCase().includes(user.firstName.toLowerCase()));
        if (!isAssignedToUser) return false;
      } else if (activeTab === 'assigned-by-me') {
        const isAssignedByUser =
          task.assignedById === user?.id ||
          (user?.firstName && task.assignedByName?.toLowerCase().includes(user.firstName.toLowerCase()));
        if (!isAssignedByUser) return false;
      }
      // 'all-tasks' shows everything

      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = (task.description || '').toLowerCase().includes(query);
        const matchesAssignee = (task.assignedToName || '').toLowerCase().includes(query);
        const matchesAssigner = (task.assignedByName || '').toLowerCase().includes(query);
        const matchesCategory = (task.category || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesAssignee && !matchesAssigner && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, activeTab, statusFilter, priorityFilter, searchQuery, user]);

  // Statistics
  const stats = useMemo(() => {
    const myTasks = tasks.filter(t =>
      t.assignedToId === user?.id ||
      (user?.email && t.assignedToEmail?.toLowerCase() === user.email.toLowerCase()) ||
      (user?.firstName && t.assignedToName?.toLowerCase().includes(user.firstName.toLowerCase()))
    );

    const pending = myTasks.filter(t => t.status === 'Pending').length;
    const inProgress = myTasks.filter(t => t.status === 'In Progress').length;
    const done = myTasks.filter(t => t.status === 'Done').length;

    return {
      totalMyTasks: myTasks.length,
      pending,
      inProgress,
      done,
      allPending: tasks.filter(t => t.status === 'Pending').length,
      allInProgress: tasks.filter(t => t.status === 'In Progress').length,
      allDone: tasks.filter(t => t.status === 'Done').length
    };
  }, [tasks, user]);

  // Handle status toggle (cycle: Pending -> In Progress -> Done -> Pending)
  const handleStatusChange = async (taskId: string, newStatus: 'Pending' | 'In Progress' | 'Done') => {
    try {
      const updated = await updateEmployeeTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
      toast.success(`Task moved to ${newStatus}`);
    } catch {
      toast.error('Failed to update task status');
    }
  };

  // Quick checkbox toggle to Done / Pending
  const handleQuickToggleDone = async (task: EmployeeTask) => {
    const nextStatus = task.status === 'Done' ? 'Pending' : 'Done';
    await handleStatusChange(task.id, nextStatus);
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteEmployeeTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  // Handle Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    if (!assignedToId) {
      toast.error('Please select an employee to assign this task');
      return;
    }

    const selectedUser = users.find(u => u.id === assignedToId);
    const assignedToName = selectedUser?.name || 'Employee';
    const assignedToEmail = selectedUser?.email || '';

    try {
      setIsSubmitting(true);
      const newTask = await createEmployeeTask({
        title: title.trim(),
        description: description.trim(),
        assignedToId,
        assignedToName,
        assignedToEmail,
        assignedById: user?.id || 'system',
        assignedByName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Leadership',
        assignedByRole: user?.role || 'Executive',
        priority,
        category,
        dueDate: dueDate || undefined
      });

      setTasks(prev => [newTask, ...prev]);
      toast.success(`Task assigned to ${assignedToName}!`);
      setIsAssignModalOpen(false);

      // Reset form
      setTitle('');
      setDescription('');
      setAssignedToId('');
      setPriority('Medium');
      setCategory('General');
      setDueDate('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Priority color badge helper
  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Urgent':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'High':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Medium':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'Low':
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  // Status color badge helper
  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Done':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'In Progress':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'Pending':
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  const isOverdue = (dueDateStr?: string, status?: string) => {
    if (!dueDateStr || status === 'Done') return false;
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col min-h-full space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-indigo-600/10 text-indigo-500 rounded-xl">
              <ListTodo size={28} />
            </span>
            Tasks Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Assign, track, and manage employee tasks across departments in real-time.
          </p>
        </div>

        {/* Action Button: Visible only if user has task assignment privilege */}
        {canAssignTasks && (
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/25 active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Assign New Task</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent" />
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">My Total Tasks</p>
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <ListTodo size={14} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {stats.totalMyTasks}
          </p>
        </div>

        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" />
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pending</p>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock size={14} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-500 dark:text-amber-400 mt-2">
            {stats.pending}
          </p>
        </div>

        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/80 to-transparent" />
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">In Progress</p>
            <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <AlertCircle size={14} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-sky-500 dark:text-sky-400 mt-2">
            {stats.inProgress}
          </p>
        </div>

        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/80 to-transparent" />
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Done / Completed</p>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-500 dark:text-emerald-400 mt-2">
            {stats.done}
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-6">
        {/* Navigation Tabs & Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-5">
          {/* Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'my-tasks'
                  ? 'bg-white dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-indigo-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              My Tasks ({stats.totalMyTasks})
            </button>
            <button
              onClick={() => setActiveTab('assigned-by-me')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'assigned-by-me'
                  ? 'bg-white dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-indigo-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Assigned by Me
            </button>
            {(canAssignTasks || canViewAll) && (
              <button
                onClick={() => setActiveTab('all-tasks')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'all-tasks'
                    ? 'bg-white dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-indigo-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All Org Tasks ({tasks.length})
              </button>
            )}
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mr-1">Status:</span>
            {(['all', 'Pending', 'In Progress', 'Done'] as StatusFilter[]).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Priority Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks by title, assignee, or category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400 shrink-0" />
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Tasks List Content */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <ListTodo size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No tasks found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters to see more tasks.'
                : activeTab === 'my-tasks'
                ? 'You currently have no tasks assigned to you. Enjoy your day!'
                : 'No tasks have been assigned in this view yet.'}
            </p>
            {canAssignTasks && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Assign a Task
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => {
              const overdue = isOverdue(task.dueDate, task.status);
              const isDone = task.status === 'Done';
              const canDelete = isAdmin || task.assignedById === user?.id;

              return (
                <div
                  key={task.id}
                  className={`group relative bg-white dark:bg-[#10141D] border rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-xs hover:shadow-md ${
                    isDone
                      ? 'border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/5'
                      : overdue
                      ? 'border-rose-500/40 bg-rose-50/10 dark:bg-rose-950/5'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Checkbox + Title + Description */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Checkbox button */}
                      <button
                        type="button"
                        onClick={() => handleQuickToggleDone(task)}
                        className={`mt-1 h-5 w-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-500 text-transparent'
                        }`}
                        title={isDone ? 'Mark as Pending' : 'Mark as Done'}
                      >
                        <CheckCircle size={14} className={isDone ? 'opacity-100' : 'opacity-0'} />
                      </button>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-sm sm:text-base font-bold text-slate-900 dark:text-white transition-all ${
                              isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                            }`}
                          >
                            {task.title}
                          </h4>

                          {/* Priority Pill */}
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wider ${getPriorityBadge(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>

                          {/* Category Tag */}
                          {task.category && (
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {task.category}
                            </span>
                          )}

                          {/* Overdue Alert */}
                          {overdue && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <AlertTriangle size={10} /> Overdue
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Metadata Footer */}
                        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 pt-1 flex-wrap">
                          {/* Assignee */}
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                              {task.assignedToName?.[0] || 'E'}
                            </span>
                            <span className="font-semibold text-xs">{task.assignedToName}</span>
                          </div>

                          {/* Assigner */}
                          <div className="text-[11px] text-slate-400">
                            By <span className="font-medium text-slate-500 dark:text-slate-400">{task.assignedByName}</span> ({task.assignedByRole || 'Leadership'})
                          </div>

                          {/* Due Date */}
                          {task.dueDate && (
                            <div className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-rose-500 font-semibold' : ''}`}>
                              <Calendar size={12} />
                              <span>Due: {task.dueDate}</span>
                            </div>
                          )}

                          {/* Completed Date if done */}
                          {isDone && task.completedAt && (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 size={12} />
                              <span>Done {new Date(task.completedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Status Dropdown / Action & Delete */}
                    <div className="flex items-center gap-2 sm:self-start shrink-0 pt-2 sm:pt-0">
                      {/* Status Dropdown */}
                      <div className="relative">
                        <select
                          value={task.status}
                          onChange={e => handleStatusChange(task.id, e.target.value as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer appearance-none pr-7 ${getStatusBadge(
                            task.status
                          )}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                        <ChevronDown
                          size={12}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"
                        />
                      </div>

                      {/* Delete button (only assigner or admin) */}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={e => handleDeleteTask(task.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign Task Modal */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#0C1017] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                    <ListTodo size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Assign New Task</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Assign a task with priority and deadline. The assignee will be notified immediately.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Update security headers for authentication API"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Assignee Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Assign To Employee *
                  </label>
                  <select
                    required
                    value={assignedToId}
                    onChange={e => setAssignedToId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Select Employee --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.role} ({u.department || 'TwinERP'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority & Category Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Description / Instructions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details, deliverables, or acceptance criteria..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Assigning...</span>
                      </>
                    ) : (
                      <span>Assign Task</span>
                    )}
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

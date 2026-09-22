import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck, Users, Search, ToggleLeft, ToggleRight,
  RefreshCw, Save, ChevronDown, ChevronUp, Info,
  LayoutDashboard, UserCog, UserRound, Briefcase, FileText,
  TrendingUp, Clock, Calendar, BarChart2, DollarSign, Award,
  Megaphone, PartyPopper, Mail, UserMinus, UserX, BarChart,
  Settings, Globe, FolderKanban, Check, Undo2, X, MessageSquare, ListTodo
} from 'lucide-react';
import { getUsers } from '../api';
import { useAuth } from '../context/AuthContext';
import type { UserAccount } from '../types';
import type { ModuleKey, UserPrivileges } from '../types';
import toast from 'react-hot-toast';

// ─── Module Definitions ────────────────────────────────────────────────────
interface ModuleDef {
  key: ModuleKey;
  label: string;
  icon: React.ReactNode;
  group: string;
  defaultForAll?: boolean; // true if non-HR employees get this by default
}

const MODULE_DEFINITIONS: ModuleDef[] = [
  // Top-Level Navigation Modules (Top of Sidebar)
  { key: 'hrm',            label: 'HRM Module',       icon: <LayoutDashboard size={14} />, group: 'Top-Level Navigation', defaultForAll: true },
  { key: 'crm',            label: 'CRM Module',       icon: <Globe size={14} />,           group: 'Top-Level Navigation', defaultForAll: true },
  { key: 'projects',       label: 'Projects Module',  icon: <FolderKanban size={14} />,    group: 'Top-Level Navigation', defaultForAll: true },

  // HRM - Core
  { key: 'dashboard',      label: 'Dashboard',       icon: <LayoutDashboard size={14} />, group: 'HRM Core',    defaultForAll: true },
  { key: 'tasks',          label: 'Tasks',           icon: <ListTodo size={14} />,        group: 'HRM Core',    defaultForAll: true },
  { key: 'team-chat',      label: 'Team Chat',        icon: <MessageSquare size={14} />,   group: 'HRM Core',    defaultForAll: true },
  { key: 'user-management',label: 'User Accounts',   icon: <UserCog size={14} />,         group: 'HRM Core',    defaultForAll: false },
  { key: 'employees',      label: 'Employees',        icon: <Users size={14} />,           group: 'HRM Core',    defaultForAll: false },
  { key: 'lifecycle',      label: 'Lifecycle',        icon: <TrendingUp size={14} />,      group: 'HRM Core',    defaultForAll: true },
  // HRM - Attendance & Leaves
  { key: 'attendance',     label: 'Attendance',       icon: <Clock size={14} />,           group: 'Attendance',  defaultForAll: false },
  { key: 'leaves',         label: 'Leave Requests',   icon: <Calendar size={14} />,        group: 'Attendance',  defaultForAll: true },
  { key: 'leave-balance',  label: 'Leave Balance',    icon: <BarChart2 size={14} />,       group: 'Attendance',  defaultForAll: true },
  { key: 'holidays',       label: 'Holidays',         icon: <Calendar size={14} />,        group: 'Attendance',  defaultForAll: false },
  // HRM - Finance
  { key: 'payslips',       label: 'Payslips',         icon: <DollarSign size={14} />,      group: 'Finance',     defaultForAll: true },
  // HRM - People
  { key: 'awards',         label: 'Awards',           icon: <Award size={14} />,           group: 'People',      defaultForAll: false },
  { key: 'announcements',  label: 'Announcements',    icon: <Megaphone size={14} />,       group: 'People',      defaultForAll: true },
  { key: 'events',         label: 'Events',           icon: <PartyPopper size={14} />,     group: 'People',      defaultForAll: true },
  { key: 'letters',        label: 'Letter Generator', icon: <Mail size={14} />,            group: 'People',      defaultForAll: false },
  // HRM - Exits
  { key: 'resignations',   label: 'Resignations',     icon: <UserMinus size={14} />,       group: 'Exits',       defaultForAll: true },
  { key: 'terminations',   label: 'Terminations',     icon: <UserX size={14} />,           group: 'Exits',       defaultForAll: false },
  // HRM - Analytics & Docs
  { key: 'analytics',      label: 'Analytics',        icon: <BarChart size={14} />,        group: 'Reports',     defaultForAll: true },
  { key: 'careers',        label: 'Careers & Jobs',   icon: <Briefcase size={14} />,       group: 'Reports',     defaultForAll: true },
  { key: 'documents',      label: 'Documents',        icon: <FileText size={14} />,        group: 'Reports',     defaultForAll: true },
  { key: 'settings',       label: 'Settings',         icon: <Settings size={14} />,        group: 'Reports',     defaultForAll: true },
];

const MODULE_GROUPS = Array.from(new Set(MODULE_DEFINITIONS.map(m => m.group)));

// Build default allowed modules for a regular employee
const DEFAULT_EMPLOYEE_MODULES: ModuleKey[] = MODULE_DEFINITIONS
  .filter(m => m.defaultForAll)
  .map(m => m.key);

// ─── Helper ────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'from-indigo-600 to-indigo-500',
  'from-violet-600 to-violet-500',
  'from-purple-600 to-purple-500',
  'from-sky-600 to-sky-500',
  'from-emerald-600 to-emerald-500',
  'from-amber-600 to-amber-500',
];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

// ─── Component ────────────────────────────────────────────────────────────
export default function Privileges() {
  const { user: adminUser, isAdmin, privilegesMap, saveUserPrivileges, clearUserPrivileges } = useAuth();

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [draftModules, setDraftModules] = useState<Record<string, Set<ModuleKey>>>({});
  const [draftTaskAssign, setDraftTaskAssign] = useState<Record<string, boolean>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access denied. This section is restricted to Administrators.');
    }
  }, [isAdmin]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getUsers({}).catch(() => ({ data: [], total: 0 }));
      const allUsers: UserAccount[] = res.data || (Array.isArray(res) ? res : []);
      // Exclude admin accounts from the list (no point setting admin privileges)
      setUsers(allUsers.filter(u => u.role?.toLowerCase() !== 'admin'));
    } catch {
      toast.error('Failed to load user list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // When expanding a user, initialise their draft from saved privileges or defaults
  const handleExpand = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);

    const userObj = users.find(u => u.id === userId);
    const userRole = (userObj?.role || '').trim().toUpperCase();
    const defaultCanAssign = ['CEO', 'CTO', 'COO', 'ADMIN'].includes(userRole);

    if (!draftModules[userId]) {
      const saved = privilegesMap[userId];
      const initial: Set<ModuleKey> = saved
        ? new Set(saved.allowedModules)
        : new Set(DEFAULT_EMPLOYEE_MODULES);
      setDraftModules(prev => ({ ...prev, [userId]: initial }));
    }

    if (draftTaskAssign[userId] === undefined) {
      const saved = privilegesMap[userId];
      const initialCanAssign = saved?.canAssignTasks !== undefined ? saved.canAssignTasks : defaultCanAssign;
      setDraftTaskAssign(prev => ({ ...prev, [userId]: initialCanAssign }));
    }
  };

  const toggleModule = (userId: string, moduleKey: ModuleKey) => {
    setDraftModules(prev => {
      const current = new Set(prev[userId] || DEFAULT_EMPLOYEE_MODULES);
      if (current.has(moduleKey)) {
        current.delete(moduleKey);
      } else {
        current.add(moduleKey);
      }
      return { ...prev, [userId]: current };
    });
  };

  const toggleGroupAll = (userId: string, group: string, enable: boolean) => {
    const groupKeys = MODULE_DEFINITIONS.filter(m => m.group === group).map(m => m.key);
    setDraftModules(prev => {
      const current = new Set(prev[userId] || DEFAULT_EMPLOYEE_MODULES);
      groupKeys.forEach(k => { enable ? current.add(k) : current.delete(k); });
      return { ...prev, [userId]: current };
    });
  };

  const grantAll = (userId: string) => {
    setDraftModules(prev => ({
      ...prev,
      [userId]: new Set(MODULE_DEFINITIONS.map(m => m.key)),
    }));
  };

  const revokeAll = (userId: string) => {
    setDraftModules(prev => ({ ...prev, [userId]: new Set() }));
  };

  const resetToDefault = (userId: string) => {
    const userObj = users.find(u => u.id === userId);
    const userRole = (userObj?.role || '').trim().toUpperCase();
    const defaultCanAssign = ['CEO', 'CTO', 'COO', 'ADMIN'].includes(userRole);
    setDraftModules(prev => ({ ...prev, [userId]: new Set(DEFAULT_EMPLOYEE_MODULES) }));
    setDraftTaskAssign(prev => ({ ...prev, [userId]: defaultCanAssign }));
  };

  const handleSave = async (userId: string) => {
    if (!adminUser) return;
    const modules = draftModules[userId];
    if (!modules) return;

    try {
      setSavingUserId(userId);
      const userObj = users.find(u => u.id === userId);
      const userRole = (userObj?.role || '').trim().toUpperCase();
      const defaultCanAssign = ['CEO', 'CTO', 'COO', 'ADMIN'].includes(userRole);
      const canAssign = draftTaskAssign[userId] !== undefined ? draftTaskAssign[userId] : defaultCanAssign;

      const privileges: UserPrivileges = {
        userId,
        allowedModules: Array.from(modules),
        canAssignTasks: canAssign,
        grantedBy: adminUser.id,
        updatedAt: new Date().toISOString(),
      };
      saveUserPrivileges(privileges);
      toast.success('Privileges saved successfully');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleClearPrivileges = (userId: string, name: string) => {
    clearUserPrivileges(userId);
    const userObj = users.find(u => u.id === userId);
    const userRole = (userObj?.role || '').trim().toUpperCase();
    const defaultCanAssign = ['CEO', 'CTO', 'COO', 'ADMIN'].includes(userRole);
    setDraftModules(prev => ({ ...prev, [userId]: new Set(DEFAULT_EMPLOYEE_MODULES) }));
    setDraftTaskAssign(prev => ({ ...prev, [userId]: defaultCanAssign }));
    toast.success(`Privileges for ${name} reset to role defaults`);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-rose-400 font-semibold">
        🔒 Access Denied — Admin only.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col min-h-full space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-indigo-600/10 text-indigo-500 rounded-xl">
              <ShieldCheck size={28} />
            </span>
            Privileges Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Grant or restrict module-level access for each employee. Only you (Admin) can manage this.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/50 rounded-xl px-4 py-2.5">
          <Info size={14} className="text-indigo-400 shrink-0" />
          <span>Toggle modules per employee. Changes persist in the browser.</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 p-4 shadow-sm overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Users</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{users.length}</p>
        </div>
        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 p-4 shadow-sm overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Custom Privileges Set</p>
          <p className="text-2xl font-extrabold text-amber-500 dark:text-amber-400 mt-1">
            {users.filter(u => privilegesMap[u.id]).length}
          </p>
        </div>
        <div className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 p-4 shadow-sm overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/80 to-transparent" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Modules</p>
          <p className="text-2xl font-extrabold text-emerald-500 dark:text-emerald-400 mt-1">{MODULE_DEFINITIONS.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search employees by name, email, or department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors shadow-sm"
        />
      </div>

      {/* User List */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">No users found.</div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u, idx) => {
            const isExpanded = expandedUserId === u.id;
            const hasCustom = !!privilegesMap[u.id];
            const draft = draftModules[u.id];

            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="relative bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm overflow-hidden"
              >
                {/* Top accent */}
                <div className={`absolute inset-x-0 top-0 h-[2px] ${hasCustom ? 'bg-gradient-to-r from-transparent via-amber-500/80 to-transparent' : 'bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent'}`} />

                {/* User Row Header */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  onClick={() => handleExpand(u.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${avatarColor(u.name)} text-white flex items-center justify-center text-xs font-bold shadow-md shrink-0`}>
                      {getInitials(u.name)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-[11px] text-slate-400">{u.email} · {u.department}</p>
                    </div>
                    {/* Badges */}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      {u.role}
                    </span>
                    {hasCustom && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                        <ShieldCheck size={10} /> Custom Privileges
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasCustom && (
                      <span className="text-[10px] text-slate-400">
                        {privilegesMap[u.id]?.allowedModules.length} / {MODULE_DEFINITIONS.length} modules
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>

                {/* Expanded Privileges Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                        {/* Quick actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Quick:</span>
                          <button
                            onClick={() => grantAll(u.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                          >
                            <Check size={11} /> Grant All
                          </button>
                          <button
                            onClick={() => revokeAll(u.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors"
                          >
                            <X size={11} /> Revoke All
                          </button>
                          <button
                            onClick={() => resetToDefault(u.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-slate-500/10 text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-500/20 transition-colors"
                          >
                            <RefreshCw size={11} /> Reset to Defaults
                          </button>
                          {hasCustom && (
                            <button
                              onClick={() => handleClearPrivileges(u.id, u.name)}
                              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-colors"
                            >
                              <Undo2 size={11} /> Clear Custom
                            </button>
                          )}
                        </div>

                        {/* Task Assignment Permission Switch */}
                        {(() => {
                          const userRole = (u.role || '').trim().toUpperCase();
                          const defaultCanAssign = ['CEO', 'CTO', 'COO', 'ADMIN'].includes(userRole);
                          const canAssign = draftTaskAssign[u.id] !== undefined ? draftTaskAssign[u.id] : defaultCanAssign;

                          return (
                            <div className="bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <ListTodo className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                    Task Assignment Permission
                                  </span>
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                    canAssign
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                      : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20'
                                  }`}>
                                    {canAssign ? 'Can Assign Tasks' : 'Cannot Assign Tasks'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                                  COO, CTO, and CEO can assign tasks to employees by default. Use this toggle to grant or revoke task creation and assignment privileges for this employee.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => setDraftTaskAssign(prev => ({ ...prev, [u.id]: !canAssign }))}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer ${
                                  canAssign
                                    ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500'
                                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                                }`}
                              >
                                {canAssign ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                <span>{canAssign ? 'Allowed' : 'Restricted'}</span>
                              </button>
                            </div>
                          );
                        })()}

                        {/* Module Groups */}
                        <div className="space-y-4">
                          {MODULE_GROUPS.map(group => {
                            const groupModules = MODULE_DEFINITIONS.filter(m => m.group === group);
                            const allOn = groupModules.every(m => draft?.has(m.key));
                            const someOn = groupModules.some(m => draft?.has(m.key));

                            return (
                              <div key={group}>
                                {/* Group Header */}
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{group}</span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => toggleGroupAll(u.id, group, true)}
                                      className="text-[10px] text-emerald-500 hover:text-emerald-400 font-semibold px-2 py-0.5 rounded hover:bg-emerald-500/10 transition-colors"
                                    >
                                      All On
                                    </button>
                                    <button
                                      onClick={() => toggleGroupAll(u.id, group, false)}
                                      className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold px-2 py-0.5 rounded hover:bg-rose-500/10 transition-colors"
                                    >
                                      All Off
                                    </button>
                                  </div>
                                </div>

                                {/* Module Toggles */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {groupModules.map(mod => {
                                    const isOn = draft?.has(mod.key) ?? false;
                                    return (
                                      <button
                                        key={mod.key}
                                        onClick={() => toggleModule(u.id, mod.key)}
                                        className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 text-left ${
                                          isOn
                                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                                        }`}
                                      >
                                        <span className="flex items-center gap-2">
                                          <span className={isOn ? 'text-indigo-500' : 'text-slate-400'}>
                                            {mod.icon}
                                          </span>
                                          {mod.label}
                                        </span>
                                        {isOn
                                          ? <ToggleRight size={16} className="text-indigo-500 shrink-0" />
                                          : <ToggleLeft size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                        }
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => handleSave(u.id)}
                            disabled={savingUserId === u.id}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30 active:scale-95"
                          >
                            <Save size={14} />
                            {savingUserId === u.id ? 'Saving...' : `Save Privileges for ${u.name.split(' ')[0]}`}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

import React from 'react';
import {
  LayoutDashboard, ListTodo, MessageSquare, ShieldCheck, Shield, Users, Briefcase, FileText, 
  TrendingUp, Clock, Calendar, BarChart2, Award, Megaphone, PartyPopper, Mail, UserMinus, 
  UserX, Settings as SettingsIcon, Phone, UploadCloud, Shuffle, Building, CreditCard, 
  UserPlus, FileCheck, Network, DollarSign, Globe, FolderKanban, BarChart
} from 'lucide-react';
import type { ModuleKey } from '../types';

export type ModuleName = 'HRM' | 'CRM' | 'Projects';

export interface ModuleDef {
  id: string;
  key?: ModuleKey; // The privilege key (optional if it doesn't need privileges mapping)
  label: string;
  path: string;
  icon: React.ReactNode;
  group: string;
  module: ModuleName;
  adminNav: boolean; // Whether it shows in the Admin Sidebar
  defaultForAll?: boolean; // True if non-HR employees get this by default (Privileges)
  hrOnly?: boolean; // Existing sidebar logic
  adminOnly?: boolean; // Existing sidebar logic
}

export const MODULE_REGISTRY: ModuleDef[] = [
  // Top-Level Navigation Modules (Top of Sidebar - mostly for privileges page organization)
  { id: 'hrm-priv', key: 'hrm', label: 'HRM Module', path: '#', icon: <LayoutDashboard size={14} />, group: 'Top-Level Navigation', module: 'HRM', adminNav: false, defaultForAll: true },
  { id: 'crm-priv', key: 'crm', label: 'CRM Module', path: '#', icon: <Globe size={14} />, group: 'Top-Level Navigation', module: 'CRM', adminNav: false, defaultForAll: true },
  { id: 'projects-priv', key: 'projects', label: 'Projects Module', path: '#', icon: <FolderKanban size={14} />, group: 'Top-Level Navigation', module: 'Projects', adminNav: false, defaultForAll: true },

  // Overview
  { id: 'dashboard', key: 'dashboard', label: 'Dashboard', path: '/', icon: <LayoutDashboard size={14} />, group: 'Overview', module: 'HRM', adminNav: true, defaultForAll: true, hrOnly: false, adminOnly: false },
  { id: 'analytics', key: 'analytics', label: 'Analytics', path: '/analytics', icon: <BarChart size={14} />, group: 'Overview', module: 'HRM', adminNav: true, defaultForAll: true, hrOnly: false, adminOnly: false },
  
  // People & Access
  { id: 'employees', key: 'employees', label: 'Employees', path: '/employees', icon: <Users size={14} />, group: 'People & Access', module: 'HRM', adminNav: true, defaultForAll: false, hrOnly: true, adminOnly: false },
  { id: 'user-management', key: 'user-management', label: 'User Accounts', path: '/user-management', icon: <Shield size={14} />, group: 'People & Access', module: 'HRM', adminNav: true, defaultForAll: false, hrOnly: true, adminOnly: false },
  { id: 'privileges', key: 'privileges', label: 'Privileges', path: '/privileges', icon: <ShieldCheck size={14} />, group: 'People & Access', module: 'HRM', adminNav: true, defaultForAll: false, hrOnly: false, adminOnly: true },
  { id: 'org-structure', label: 'Org Structure (pending build)', path: '#', icon: <Network size={14} />, group: 'People & Access', module: 'HRM', adminNav: true, hrOnly: true },

  // Hiring
  { id: 'careers', key: 'careers', label: 'Careers & Jobs', path: '/hrm/careers', icon: <Briefcase size={14} />, group: 'Hiring', module: 'HRM', adminNav: true, defaultForAll: true, hrOnly: false, adminOnly: false },
  { id: 'job-applications', label: 'Job Applications', path: '/hrm/careers', icon: <FileCheck size={14} />, group: 'Hiring', module: 'HRM', adminNav: true, hrOnly: true },

  // Work & Teams
  { id: 'tasks', key: 'tasks', label: 'Tasks', path: '/tasks', icon: <ListTodo size={14} />, group: 'Work & Teams', module: 'HRM', adminNav: true, defaultForAll: true, hrOnly: false, adminOnly: false },
  { id: 'projects-all', label: 'All Projects', path: '/projects/all', icon: <Briefcase size={14} />, group: 'Work & Teams', module: 'Projects', adminNav: true, hrOnly: false },
  { id: 'team-chat', key: 'team-chat', label: 'Team Chat', path: '/chat', icon: <MessageSquare size={14} />, group: 'Work & Teams', module: 'HRM', adminNav: true, defaultForAll: true, hrOnly: false, adminOnly: false },
  { id: 'projects-clients', label: 'Clients', path: '/projects/clients', icon: <Building size={14} />, group: 'Work & Teams', module: 'Projects', adminNav: true, hrOnly: true },

  // Approvals & HR Ops
  { id: 'leaves', key: 'leaves', label: 'Leave Requests', path: '/leaves', icon: <Calendar size={14} />, group: 'Approvals & HR Ops', module: 'HRM', adminNav: true, defaultForAll: true, hrOnly: false, adminOnly: false },
  { id: 'attendance', key: 'attendance', label: 'Attendance (org-wide)', path: '/attendance', icon: <Clock size={14} />, group: 'Approvals & HR Ops', module: 'HRM', adminNav: true, defaultForAll: false, hrOnly: true, adminOnly: false },
  { id: 'resignations', key: 'resignations', label: 'Resignations', path: '/resignations', icon: <UserMinus size={14} />, group: 'Approvals & HR Ops', module: 'HRM', adminNav: true, defaultForAll: true, hrOnly: false, adminOnly: false },
  { id: 'terminations', key: 'terminations', label: 'Terminations', path: '/terminations', icon: <UserX size={14} />, group: 'Approvals & HR Ops', module: 'HRM', adminNav: true, defaultForAll: false, hrOnly: true, adminOnly: false },
  { id: 'lifecycle', key: 'lifecycle', label: 'Lifecycle', path: '/lifecycle', icon: <TrendingUp size={14} />, group: 'Approvals & HR Ops', module: 'HRM', adminNav: true, defaultForAll: true, hrOnly: false, adminOnly: false },
  { id: 'payslips', key: 'payslips', label: 'Payroll/Payslips', path: '/payslips', icon: <DollarSign size={14} />, group: 'Approvals & HR Ops', module: 'HRM', adminNav: true, defaultForAll: true, hrOnly: false, adminOnly: false },

  // Company
  { id: 'announcements', key: 'announcements', label: 'Announcements', path: '/announcements', icon: <Megaphone size={14} />, group: 'Company', module: 'HRM', adminNav: true, defaultForAll: true, hrOnly: false, adminOnly: false },
  { id: 'events', key: 'events', label: 'Events', path: '/events', icon: <PartyPopper size={14} />, group: 'Company', module: 'HRM', adminNav: true, defaultForAll: true, hrOnly: false, adminOnly: false },
  { id: 'awards', key: 'awards', label: 'Awards', path: '/awards', icon: <Award size={14} />, group: 'Company', module: 'HRM', adminNav: true, defaultForAll: false, hrOnly: true, adminOnly: false },
  { id: 'documents', key: 'documents', label: 'Documents & Letters', path: '/documents', icon: <FileText size={14} />, group: 'Company', module: 'HRM', adminNav: true, defaultForAll: true, hrOnly: false, adminOnly: false },
  
  // System
  { id: 'settings', key: 'settings', label: 'Settings', path: '/settings', icon: <SettingsIcon size={14} />, group: 'System', module: 'HRM', adminNav: true, defaultForAll: true, hrOnly: false, adminOnly: false },

  // Personal self-service (Not in admin sidebar)
  { id: 'my-attendance', label: 'My Attendance', path: '/attendance', icon: <Clock size={14} />, group: 'Personal', module: 'HRM', adminNav: false, hrOnly: false },
  { id: 'leave-balance', key: 'leave-balance', label: 'My Leave Balance', path: '/leave-balance', icon: <BarChart2 size={14} />, group: 'Personal', module: 'HRM', adminNav: false, defaultForAll: true, hrOnly: false },
  { id: 'my-payslips', label: 'My Payslips', path: '/payslips', icon: <DollarSign size={14} />, group: 'Personal', module: 'HRM', adminNav: false, hrOnly: false },
  
  // Ex-HRM (Company) moved out of admin
  { id: 'holidays', key: 'holidays', label: 'Holidays', path: '/holidays', icon: <Calendar size={14} />, group: 'Company', module: 'HRM', adminNav: false, defaultForAll: false, hrOnly: true, adminOnly: false },
  { id: 'letters', key: 'letters', label: 'Letter Generator', path: '/letters', icon: <Mail size={14} />, group: 'Company', module: 'HRM', adminNav: false, defaultForAll: false, hrOnly: true, adminOnly: false },

  // CRM Module
  { id: 'crm-dashboard', label: 'Dashboard', path: '/crm', icon: <LayoutDashboard size={14} />, group: 'CRM', module: 'CRM', adminNav: false, hrOnly: false },
  { id: 'crm-leads', label: 'Leads', path: '/crm/leads', icon: <Users size={14} />, group: 'CRM', module: 'CRM', adminNav: false, hrOnly: false },
  { id: 'crm-upload-leads', label: 'Upload Leads', path: '/crm/upload-leads', icon: <UploadCloud size={14} />, group: 'CRM', module: 'CRM', adminNav: false, hrOnly: false },
  { id: 'crm-distribute-leads', label: 'Distribute Leads', path: '/crm/distribute-leads', icon: <Shuffle size={14} />, group: 'CRM', module: 'CRM', adminNav: false, hrOnly: false },
  { id: 'crm-customers', label: 'Customers', path: '/crm/customers', icon: <Building size={14} />, group: 'CRM', module: 'CRM', adminNav: false, hrOnly: false },
  { id: 'crm-calls', label: 'Calls', path: '/crm/calls', icon: <Phone size={14} />, group: 'CRM', module: 'CRM', adminNav: false, hrOnly: false },
  { id: 'crm-payments', label: 'Payments', path: '/crm/payments', icon: <CreditCard size={14} />, group: 'CRM', module: 'CRM', adminNav: false, hrOnly: false },
  { id: 'crm-sales', label: 'Sales Team', path: '/crm/sales', icon: <UserPlus size={14} />, group: 'CRM', module: 'CRM', adminNav: false, hrOnly: false },
  { id: 'crm-reports', label: 'Reports', path: '/crm/reports', icon: <BarChart2 size={14} />, group: 'CRM', module: 'CRM', adminNav: false, hrOnly: false },
  { id: 'crm-settings', label: 'Settings', path: '/crm/settings', icon: <SettingsIcon size={14} />, group: 'CRM', module: 'CRM', adminNav: false, hrOnly: false },

  // Projects Module (Main)
  { id: 'projects-dashboard-main', label: 'Projects Dashboard', path: '/projects', icon: <LayoutDashboard size={14} />, group: 'Projects Main', module: 'Projects', adminNav: false, hrOnly: false },
];

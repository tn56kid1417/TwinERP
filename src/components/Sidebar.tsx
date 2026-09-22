import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Phone, Users, Clock, Calendar, FileText, LayoutDashboard, BarChart2,
  UserMinus, UserX, Award, Megaphone, LogOut, Mail, PartyPopper, Briefcase,
  Building, PieChart, Sun, Moon, UserPlus, Settings as SettingsIcon,
  CreditCard, UploadCloud, Shuffle, Shield, ShieldCheck, TrendingUp, X,
  MessageSquare, ListTodo
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Module = 'HRM' | 'CRM' | 'Projects';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, canViewAll, isAdmin, hasModuleAccess } = useAuth();
  const [activeModule, setActiveModule] = useState<Module>('HRM');

  const availableModules: Module[] = (['HRM', 'CRM', 'Projects'] as Module[]).filter(mod => {
    if (mod === 'HRM') return hasModuleAccess('hrm');
    if (mod === 'CRM') return hasModuleAccess('crm');
    if (mod === 'Projects') return hasModuleAccess('projects');
    return true;
  });

  useEffect(() => {
    onClose?.();
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith('/crm')) {
      if (hasModuleAccess('crm')) setActiveModule('CRM');
    } else if (location.pathname.startsWith('/projects')) {
      if (hasModuleAccess('projects')) setActiveModule('Projects');
    } else {
      if (hasModuleAccess('hrm')) setActiveModule('HRM');
    }
  }, [location.pathname, hasModuleAccess]);

  useEffect(() => {
    if (availableModules.length > 0 && !availableModules.includes(activeModule)) {
      setActiveModule(availableModules[0]);
    }
  }, [availableModules, activeModule]);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  const hrmNavItems = [
    { name: 'Dashboard',        path: '/',               icon: <LayoutDashboard size={16} />, hrOnly: false, adminOnly: false, moduleKey: 'dashboard' as const },
    { name: 'Tasks',            path: '/tasks',          icon: <ListTodo size={16} />,        hrOnly: false, adminOnly: false, moduleKey: 'tasks' as const },
    { name: 'Team Chat',        path: '/chat',           icon: <MessageSquare size={16} />,   hrOnly: false, adminOnly: false, moduleKey: 'team-chat' as const },
    { name: 'Privileges',       path: '/privileges',     icon: <ShieldCheck size={16} />,     hrOnly: false, adminOnly: true,  moduleKey: null },
    { name: 'User Accounts',    path: '/user-management',icon: <Shield size={16} />,          hrOnly: true,  adminOnly: false, moduleKey: 'user-management' as const },
    { name: 'Employees',        path: '/employees',      icon: <Users size={16} />,           hrOnly: true,  adminOnly: false, moduleKey: 'employees' as const },
    { name: 'Careers & Jobs',   path: '/hrm/careers',   icon: <Briefcase size={16} />,       hrOnly: false, adminOnly: false, moduleKey: 'careers' as const },
    { name: 'Documents',        path: '/documents',      icon: <FileText size={16} />,        hrOnly: false, adminOnly: false, moduleKey: 'documents' as const },
    { name: 'Lifecycle',        path: '/lifecycle',      icon: <TrendingUp size={16} />,      hrOnly: false, adminOnly: false, moduleKey: 'lifecycle' as const },
    { name: 'Attendance',       path: '/attendance',     icon: <Clock size={16} />,           hrOnly: true,  adminOnly: false, moduleKey: 'attendance' as const },
    { name: 'Leave Requests',   path: '/leaves',         icon: <Calendar size={16} />,        hrOnly: false, adminOnly: false, moduleKey: 'leaves' as const },
    { name: 'Leave Balance',    path: '/leave-balance',  icon: <BarChart2 size={16} />,       hrOnly: false, adminOnly: false, moduleKey: 'leave-balance' as const },
    { name: 'Holidays',         path: '/holidays',       icon: <Calendar size={16} />,        hrOnly: true,  adminOnly: false, moduleKey: 'holidays' as const },
    { name: 'Payslips',         path: '/payslips',       icon: <FileText size={16} />,        hrOnly: false, adminOnly: false, moduleKey: 'payslips' as const },
    { name: 'Awards',           path: '/awards',         icon: <Award size={16} />,           hrOnly: true,  adminOnly: false, moduleKey: 'awards' as const },
    { name: 'Announcements',    path: '/announcements',  icon: <Megaphone size={16} />,       hrOnly: false, adminOnly: false, moduleKey: 'announcements' as const },
    { name: 'Events',           path: '/events',         icon: <PartyPopper size={16} />,     hrOnly: false, adminOnly: false, moduleKey: 'events' as const },
    { name: 'Letter Generator', path: '/letters',        icon: <Mail size={16} />,            hrOnly: true,  adminOnly: false, moduleKey: 'letters' as const },
    { name: 'Resignations',     path: '/resignations',   icon: <UserMinus size={16} />,       hrOnly: false, adminOnly: false, moduleKey: 'resignations' as const },
    { name: 'Terminations',     path: '/terminations',   icon: <UserX size={16} />,           hrOnly: true,  adminOnly: false, moduleKey: 'terminations' as const },
    { name: 'Analytics',        path: '/analytics',      icon: <BarChart2 size={16} />,       hrOnly: false, adminOnly: false, moduleKey: 'analytics' as const },
    { name: 'Settings',         path: '/settings',       icon: <SettingsIcon size={16} />,    hrOnly: false, adminOnly: false, moduleKey: 'settings' as const },
  ];

  const crmNavItems = [
    { name: 'Dashboard',        path: '/crm',                  icon: <LayoutDashboard size={16} />, hrOnly: false },
    { name: 'Leads',            path: '/crm/leads',            icon: <Users size={16} />,           hrOnly: false },
    ...(user?.department === 'Marketing' || user?.role === 'Marketing' || canViewAll
      ? [{ name: 'Upload Leads',    path: '/crm/upload-leads',     icon: <UploadCloud size={16} />,     hrOnly: false }] : []),
    ...(user?.role === 'Sales Team Leader'
      ? [{ name: 'Distribute Leads',path: '/crm/distribute-leads', icon: <Shuffle size={16} />,         hrOnly: false }] : []),
    { name: 'Customers',        path: '/crm/customers',        icon: <Building size={16} />,        hrOnly: false },
    { name: 'Calls',            path: '/crm/calls',            icon: <Phone size={16} />,           hrOnly: false },
    { name: 'Payments',         path: '/crm/payments',         icon: <CreditCard size={16} />,      hrOnly: false },
    { name: 'Sales Team',       path: '/crm/sales',            icon: <UserPlus size={16} />,        hrOnly: false },
    { name: 'Reports',          path: '/crm/reports',          icon: <BarChart2 size={16} />,       hrOnly: false },
    { name: 'Settings',         path: '/crm/settings',         icon: <SettingsIcon size={16} />,    hrOnly: false },
  ];

  const projectNavItems = [
    { name: 'Projects Dashboard', path: '/projects',        icon: <LayoutDashboard size={16} />, hrOnly: false },
    { name: 'All Projects',       path: '/projects/all',    icon: <Briefcase size={16} />,       hrOnly: false },
    { name: 'Clients',            path: '/projects/clients',icon: <Building size={16} />,        hrOnly: true  },
  ];

  const getActiveNavItems = () => {
    let items;
    switch (activeModule) {
      case 'CRM':      items = crmNavItems;     break;
      case 'Projects': items = projectNavItems; break;
      case 'HRM':
      default:         items = hrmNavItems;     break;
    }
    return items.filter(item => {
      if (item.adminOnly) return isAdmin;
      if (isAdmin) return true;
      if (item.hrOnly && !canViewAll) return false;
      if (item.moduleKey) return hasModuleAccess(item.moduleKey);
      return true;
    });
  };

  const navItems = getActiveNavItems();
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col h-full w-64 shrink-0 overflow-hidden
          lg:static lg:translate-x-0
          transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          background: 'var(--erp-surface)',
          borderRight: '1px solid var(--erp-border)',
        }}
      >
        {/* Logo row */}
        <div
          className="px-5 h-14 flex items-center justify-between shrink-0"
          style={{ borderBottom: '1px solid var(--erp-border)' }}
        >
          <img
            src="/logo.png"
            alt="TwinERP"
            className="h-7 object-contain"
            style={{ filter: isDarkMode ? 'none' : 'invert(1)' }}
          />
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md transition-colors cursor-pointer"
            style={{ color: 'var(--erp-text-3)' }}
            aria-label="Close Sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Module switcher — only when more than one module is available */}
        {availableModules.length > 1 && (
          <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--erp-border)' }}>
            <div
              className="flex rounded-md overflow-hidden"
              style={{
                background: 'var(--erp-surface-2)',
                border: '1px solid var(--erp-border)',
              }}
            >
              {availableModules.map(mod => (
                <button
                  key={mod}
                  onClick={() => {
                    setActiveModule(mod);
                    if (mod === 'HRM') navigate('/');
                    else if (mod === 'CRM') navigate('/crm');
                    else if (mod === 'Projects') navigate('/projects');
                    if (window.innerWidth < 1024) onClose?.();
                  }}
                  className="flex-1 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                  style={{
                    background: activeModule === mod ? 'var(--erp-blue)' : 'transparent',
                    color: activeModule === mod ? 'var(--erp-text-inv)' : 'var(--erp-text-3)',
                  }}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto erp-scroll px-3 py-3 space-y-0.5">
          {navItems.map(item => {
            const isExactMatch = location.pathname === item.path;
            const isSubRouteMatch = item.path !== '/' && item.path !== '/crm' && item.path !== '/projects' && location.pathname.startsWith(item.path);
            const isActive = isExactMatch || isSubRouteMatch;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => { if (window.innerWidth < 1024) onClose?.(); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-150 cursor-pointer"
                style={{
                  background:  isActive ? 'var(--erp-blue-light)' : 'transparent',
                  color:       isActive ? 'var(--erp-blue)'       : 'var(--erp-text-2)',
                  fontWeight:  isActive ? 600 : 400,
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--erp-surface-2)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--erp-text-1)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--erp-text-2)';
                  }
                }}
              >
                <span style={{ color: isActive ? 'var(--erp-blue)' : 'var(--erp-text-3)', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile bottom user section */}
        <div
          className="lg:hidden px-4 py-3 shrink-0 flex items-center gap-3"
          style={{ borderTop: '1px solid var(--erp-border)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold"
            style={{ background: 'var(--erp-blue)', color: 'var(--erp-text-inv)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--erp-text-1)' }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--erp-text-3)' }}>
              {user?.role}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-md transition-colors cursor-pointer"
              style={{ color: 'var(--erp-text-3)' }}
              title="Toggle theme"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-md transition-colors cursor-pointer"
              style={{ color: 'var(--erp-text-3)' }}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Floating user widget — desktop only */}
      {typeof document !== 'undefined' && createPortal(
        <motion.div
          drag
          dragMomentum={false}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="hidden lg:flex fixed bottom-4 left-4 z-50 items-center gap-3 px-3.5 py-2.5 rounded-lg select-none cursor-grab active:cursor-grabbing"
          style={{
            background: 'var(--erp-surface)',
            border: '1px solid var(--erp-border)',
            boxShadow: 'var(--shadow-dropdown)',
            width: 220,
          }}
          title="Drag to reposition"
        >
          <div
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold"
            style={{ background: 'var(--erp-blue)', color: 'var(--erp-text-inv)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-medium truncate leading-tight" style={{ color: 'var(--erp-text-1)' }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs truncate leading-tight mt-0.5" style={{ color: 'var(--erp-text-3)' }}>
              {user?.role}
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); toggleTheme(); }}
              className="p-1.5 rounded-md transition-colors cursor-pointer"
              style={{ color: 'var(--erp-text-3)' }}
              title="Toggle theme"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); logout(); }}
              className="p-1.5 rounded-md transition-colors cursor-pointer"
              style={{ color: 'var(--erp-text-3)' }}
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </motion.div>,
        document.body
      )}
    </>
  );
};

export default Sidebar;

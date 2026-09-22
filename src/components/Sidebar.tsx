import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Phone, Users, Clock, Calendar, FileText, LayoutDashboard, BarChart2, UserMinus, UserX, Award, Megaphone, LogOut, Mail, PartyPopper, Briefcase, Building, PieChart, Sun, Moon, UserPlus, Settings as SettingsIcon, CreditCard, UploadCloud, Shuffle, Shield, ShieldCheck, TrendingUp, X, MessageSquare, ListTodo } from 'lucide-react';
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

  // Filter top-level modules according to admin privileges
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

  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
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
    { name: 'Dashboard',        path: '/',               icon: <LayoutDashboard size={20} />, hrOnly: false, adminOnly: false, moduleKey: 'dashboard' as const },
    { name: 'Tasks',            path: '/tasks',          icon: <ListTodo size={20} />,        hrOnly: false, adminOnly: false, moduleKey: 'tasks' as const },
    { name: 'Team Chat',        path: '/chat',           icon: <MessageSquare size={20} />,   hrOnly: false, adminOnly: false, moduleKey: 'team-chat' as const },
    { name: 'Privileges',       path: '/privileges',     icon: <ShieldCheck size={20} />,     hrOnly: false, adminOnly: true,  moduleKey: null },
    { name: 'User Accounts',    path: '/user-management',icon: <Shield size={20} />,          hrOnly: true,  adminOnly: false, moduleKey: 'user-management' as const },
    { name: 'Employees',        path: '/employees',      icon: <Users size={20} />,           hrOnly: true,  adminOnly: false, moduleKey: 'employees' as const },
    { name: 'Careers & Jobs',   path: '/hrm/careers',    icon: <Briefcase size={20} />,       hrOnly: false, adminOnly: false, moduleKey: 'careers' as const },
    { name: 'Documents',        path: '/documents',      icon: <FileText size={20} />,        hrOnly: false, adminOnly: false, moduleKey: 'documents' as const },
    { name: 'Lifecycle',        path: '/lifecycle',      icon: <TrendingUp size={20} />,      hrOnly: false, adminOnly: false, moduleKey: 'lifecycle' as const },
    { name: 'Attendances',      path: '/attendance',     icon: <Clock size={20} />,           hrOnly: true,  adminOnly: false, moduleKey: 'attendance' as const },
    { name: 'Leave Requests',   path: '/leaves',         icon: <Calendar size={20} />,        hrOnly: false, adminOnly: false, moduleKey: 'leaves' as const },
    { name: 'Leave Balance',    path: '/leave-balance',  icon: <BarChart2 size={20} />,       hrOnly: false, adminOnly: false, moduleKey: 'leave-balance' as const },
    { name: 'Holidays',         path: '/holidays',       icon: <Calendar size={20} />,        hrOnly: true,  adminOnly: false, moduleKey: 'holidays' as const },
    { name: 'Payslips',         path: '/payslips',       icon: <FileText size={20} />,        hrOnly: false, adminOnly: false, moduleKey: 'payslips' as const },
    { name: 'Awards',           path: '/awards',         icon: <Award size={20} />,           hrOnly: true,  adminOnly: false, moduleKey: 'awards' as const },
    { name: 'Announcements',    path: '/announcements',  icon: <Megaphone size={20} />,       hrOnly: false, adminOnly: false, moduleKey: 'announcements' as const },
    { name: 'Events',           path: '/events',         icon: <PartyPopper size={20} />,     hrOnly: false, adminOnly: false, moduleKey: 'events' as const },
    { name: 'Letter Generator', path: '/letters',        icon: <Mail size={20} />,            hrOnly: true,  adminOnly: false, moduleKey: 'letters' as const },
    { name: 'Resignations',     path: '/resignations',   icon: <UserMinus size={20} />,       hrOnly: false, adminOnly: false, moduleKey: 'resignations' as const },
    { name: 'Terminations',     path: '/terminations',   icon: <UserX size={20} />,           hrOnly: true,  adminOnly: false, moduleKey: 'terminations' as const },
    { name: 'Analytics',        path: '/analytics',      icon: <BarChart2 size={20} />,       hrOnly: false, adminOnly: false, moduleKey: 'analytics' as const },
    { name: 'Settings',         path: '/settings',       icon: <SettingsIcon size={20} />,    hrOnly: false, adminOnly: false, moduleKey: 'settings' as const },
  ];

  const crmNavItems = [
    { name: 'Dashboard', path: '/crm', icon: <LayoutDashboard size={20} />, hrOnly: false },
    { name: 'Leads', path: '/crm/leads', icon: <Users size={20} />, hrOnly: false },
    ...(user?.department === 'Marketing' || user?.role === 'Marketing' || canViewAll ? [{ name: 'Upload Leads', path: '/crm/upload-leads', icon: <UploadCloud size={20} />, hrOnly: false }] : []),
    ...(user?.role === 'Sales Team Leader' ? [{ name: 'Distribute Leads', path: '/crm/distribute-leads', icon: <Shuffle size={20} />, hrOnly: false }] : []),
    { name: 'Customers', path: '/crm/customers', icon: <Building size={20} />, hrOnly: false },
    { name: 'Calls', path: '/crm/calls', icon: <Phone size={20} />, hrOnly: false },
    { name: 'Payments', path: '/crm/payments', icon: <CreditCard size={20} />, hrOnly: false },

    { name: 'Sales Team', path: '/crm/sales', icon: <UserPlus size={20} />, hrOnly: false },
    { name: 'Reports', path: '/crm/reports', icon: <BarChart2 size={20} />, hrOnly: false },
    { name: 'Settings', path: '/crm/settings', icon: <SettingsIcon size={20} />, hrOnly: false },
  ];

  const projectNavItems = [
    { name: 'Projects Dashboard', path: '/projects', icon: <LayoutDashboard size={20} />, hrOnly: false },
    { name: 'All Projects', path: '/projects/all', icon: <Briefcase size={20} />, hrOnly: false },
    { name: 'Clients', path: '/projects/clients', icon: <Building size={20} />, hrOnly: true },
  ];

  const getActiveNavItems = () => {
    let items;
    switch (activeModule) {
      case 'CRM':
        items = crmNavItems;
        break;
      case 'Projects':
        items = projectNavItems;
        break;
      case 'HRM':
      default:
        items = hrmNavItems;
        break;
    }
    return items.filter(item => {
      // Admin-only items (e.g. Privileges) — show only to Admin
      if (item.adminOnly) return isAdmin;
      // Admin sees everything
      if (isAdmin) return true;
      // hrOnly items require elevated role
      if (item.hrOnly && !canViewAll) return false;
      // If admin has set custom privileges for this user, check module access
      if (item.moduleKey) return hasModuleAccess(item.moduleKey);
      return true;
    });
  };

  const navItems = getActiveNavItems();

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 sm:w-64 bg-white/95 dark:bg-[#0C1017]/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col h-full shrink-0 overflow-hidden shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-5 flex items-center justify-between gap-3 shrink-0 border-b border-slate-200/60 dark:border-slate-800/60 lg:border-none">
          <img src="/logo.png" alt="TwinERP Logo" className="h-8 object-contain invert dark:invert-0" />
          <button 
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {availableModules.length > 0 && (
          <div className="px-4 my-3 shrink-0">
            <div className="bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-1 flex">
              {availableModules.map((mod) => (
              <button
                key={mod}
                onClick={() => {
                  setActiveModule(mod);
                  if (mod === 'HRM') navigate('/');
                  else if (mod === 'CRM') navigate('/crm');
                  else if (mod === 'Projects') navigate('/projects');
                  if (window.innerWidth < 1024) onClose?.();
                }}
                className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-colors ${
                  activeModule === mod 
                    ? 'bg-white dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 border border-slate-200/80 dark:border-indigo-500/30 shadow-sm dark:shadow-none' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>
        )}
        
        <nav className="flex-1 min-h-0 px-4 py-1 pb-6 lg:pb-28 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isExactMatch = location.pathname === item.path;
            const isSubRouteMatch = item.path !== '/' && item.path !== '/crm' && item.path !== '/projects' && location.pathname.startsWith(item.path);
            const isActive = isExactMatch || isSubRouteMatch;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onClose?.();
                  }
                }}
                className={`group flex items-center gap-3 px-3 py-2 transition-all duration-300 rounded-lg cursor-pointer overflow-hidden relative ${
                  isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-600/10 text-indigo-700 dark:text-indigo-400 border-r-2 border-indigo-500 shadow-[inset_0_0_20px_rgba(79,70,229,0.05)] dark:shadow-[inset_0_0_20px_rgba(79,70,229,0.1)]' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-300 hover:translate-x-1 hover:shadow-sm dark:hover:shadow-none'
                }`}
              >
                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/10" />}
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </div>
                <span className="text-sm font-medium relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Drawer Bottom User Section (visible on mobile screens only) */}
        <div className="lg:hidden p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-md shadow-indigo-500/30">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider truncate">
                {user?.role}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button 
                type="button"
                onClick={toggleTheme} 
                className="text-slate-400 hover:text-amber-500 dark:hover:text-amber-300 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer" 
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button 
                type="button"
                onClick={logout} 
                className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer" 
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Floating User Profile Widget - Desktop only (hidden on mobile to prevent blocking UI) */}
      {typeof document !== 'undefined' && createPortal(
        <motion.div 
          drag
          dragMomentum={false}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden lg:flex fixed bottom-4 left-4 z-50 items-center gap-3 p-2.5 px-3.5 rounded-2xl bg-white/90 dark:bg-[#0C1017]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/60 shadow-xl shadow-slate-900/10 dark:shadow-black/80 ring-1 ring-black/5 dark:ring-white/10 select-none cursor-grab active:cursor-grabbing w-[232px] group"
          title="Drag to reposition anywhere on the dashboard"
        >
          <div className="absolute top-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent pointer-events-none" />
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex-shrink-0 border border-white/20 flex items-center justify-center text-xs font-bold shadow-md shadow-indigo-500/30">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate tracking-tight leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider truncate leading-tight mt-0.5">
              {user?.role}
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleTheme(); }} 
              className="text-slate-400 hover:text-amber-500 dark:hover:text-amber-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer" 
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); logout(); }} 
              className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer" 
              title="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </motion.div>,
        document.body
      )}
    </>
  );
};

export default Sidebar;

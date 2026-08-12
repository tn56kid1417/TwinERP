import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Phone, Users, Clock, Calendar, FileText, LayoutDashboard, BarChart2, UserMinus, UserX, Award, Megaphone, LogOut, Mail, PartyPopper, Briefcase, Building, PieChart, Sun, Moon, UserPlus, Settings as SettingsIcon, CreditCard , UploadCloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Module = 'HRM' | 'CRM' | 'Projects';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, canViewAll } = useAuth();
  const [activeModule, setActiveModule] = useState<Module>('HRM');
  
  useEffect(() => {
    if (location.pathname.startsWith('/crm')) {
      setActiveModule('CRM');
    } else if (location.pathname.startsWith('/projects')) {
      setActiveModule('Projects');
    } else {
      setActiveModule('HRM');
    }
  }, [location.pathname]);

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
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, hrOnly: false },
    { name: 'Employees', path: '/employees', icon: <Users size={20} />, hrOnly: true },
    { name: 'Attendances', path: '/attendance', icon: <Clock size={20} />, hrOnly: true },
    { name: 'Leave Requests', path: '/leaves', icon: <Calendar size={20} />, hrOnly: false },
    { name: 'Leave Balance', path: '/leave-balance', icon: <BarChart2 size={20} />, hrOnly: false },
    { name: 'Holidays', path: '/holidays', icon: <Calendar size={20} />, hrOnly: true },
    { name: 'Payslips', path: '/payslips', icon: <FileText size={20} />, hrOnly: false },
    { name: 'Awards', path: '/awards', icon: <Award size={20} />, hrOnly: true },
    { name: 'Announcements', path: '/announcements', icon: <Megaphone size={20} />, hrOnly: false },
    { name: 'Events', path: '/events', icon: <PartyPopper size={20} />, hrOnly: false },
    { name: 'Letter Generator', path: '/letters', icon: <Mail size={20} />, hrOnly: true },
    { name: 'Resignations', path: '/resignations', icon: <UserMinus size={20} />, hrOnly: false },
    { name: 'Terminations', path: '/terminations', icon: <UserX size={20} />, hrOnly: true },
    { name: 'Analytics', path: '/analytics', icon: <BarChart2 size={20} />, hrOnly: false },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon size={20} />, hrOnly: false },
  ];

  const crmNavItems = [
    { name: 'Dashboard', path: '/crm', icon: <LayoutDashboard size={20} />, hrOnly: false },
    { name: 'Leads', path: '/crm/leads', icon: <Users size={20} />, hrOnly: false },
    ...(user?.department === 'Marketing' || user?.role === 'Marketing' || canViewAll ? [{ name: 'Upload Leads', path: '/crm/upload-leads', icon: <UploadCloud size={20} />, hrOnly: false }] : []),
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
    return items.filter(item => !item.hrOnly || canViewAll);
  };

  const navItems = getActiveNavItems();

  return (
    <div className="w-64 bg-slate-50 dark:bg-[#11141B]/60 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800/50 flex flex-col min-h-screen">
      <div className="p-6 flex items-center gap-3">
        <img src="/logo.png" alt="TwinERP Logo" className="h-8 object-contain invert dark:invert-0" />
      </div>

      <div className="px-4 mb-4">
        <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-1 flex">
          {(['HRM', 'CRM', 'Projects'] as Module[]).map((mod) => (
            <button
              key={mod}
              onClick={() => {
                setActiveModule(mod);
                if (mod === 'HRM') navigate('/');
                else if (mod === 'CRM') navigate('/crm');
                else if (mod === 'Projects') navigate('/projects');
              }}
              className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-colors ${
                activeModule === mod 
                  ? 'bg-indigo-100 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 shadow-sm dark:shadow-none' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isExactMatch = location.pathname === item.path;
          const isSubRouteMatch = item.path !== '/' && item.path !== '/crm' && item.path !== '/projects' && location.pathname.startsWith(item.path);
          const isActive = isExactMatch || isSubRouteMatch;
          return (
            <Link
              key={item.path}
              to={item.path}
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
      
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/50">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-bold text-slate-900 dark:text-white">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-medium">{user?.role}</p>
          </div>
          <button onClick={toggleTheme} className="text-slate-500 dark:text-slate-500 hover:text-indigo-400 p-1 rounded-md transition-colors" title="Toggle Theme">
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={logout} className="text-slate-500 dark:text-slate-500 hover:text-red-400 p-1 rounded-md transition-colors" title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

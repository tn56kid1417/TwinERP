import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sun, Moon, LogOut, X, ChevronDown, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MODULE_REGISTRY, ModuleDef, ModuleName } from '../config/modules';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const ADMIN_GROUPS_ORDER = [
  'Overview',
  'People & Access',
  'Hiring',
  'Work & Teams',
  'Approvals & HR Ops',
  'Company',
  'System'
];

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, canViewAll, isAdmin, hasModuleAccess } = useAuth();
  const [activeModule, setActiveModule] = useState<ModuleName>('HRM');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('erp_sidebar_groups');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const availableModules: ModuleName[] = (['HRM', 'CRM', 'Projects'] as ModuleName[]).filter(mod => {
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

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = { ...prev, [group]: !prev[group] };
      localStorage.setItem('erp_sidebar_groups', JSON.stringify(next));
      return next;
    });
  };

  // Compute active items
  const getActiveNavItems = (): ModuleDef[] => {
    return MODULE_REGISTRY.filter(item => {
      if (item.group === 'Top-Level Navigation' || item.group === 'Personal') return false;

      // CRM dynamic logic
      if (item.id === 'crm-upload-leads') {
         return activeModule === 'CRM' && (user?.department === 'Marketing' || user?.role === 'Marketing' || canViewAll);
      }
      if (item.id === 'crm-distribute-leads') {
         return activeModule === 'CRM' && (user?.role === 'Sales Team Leader');
      }

      if (isAdmin && activeModule !== 'CRM') {
         // Unified view for Admin: combines HRM and Projects groups
         if (item.module === 'CRM') return false;
         return item.adminNav;
      }

      // Non-admin or CRM mode
      if (item.module !== activeModule) return false;
      if (item.adminOnly) return false;
      if (item.hrOnly && !canViewAll) return false;
      if (item.id && !hasModuleAccess(item.id as any)) return false;
      return true;
    });
  };

  const navItems = getActiveNavItems();

  // Auto-expand group containing active route on mount/route change
  useEffect(() => {
    if (isAdmin && activeModule !== 'CRM') {
      const activeItem = navItems.find(item => {
        const isExactMatch = location.pathname === item.path;
        const isSubRouteMatch = item.path !== '/' && item.path !== '/crm' && item.path !== '/projects' && location.pathname.startsWith(item.path);
        return isExactMatch || isSubRouteMatch;
      });
      if (activeItem && activeItem.group && expandedGroups[activeItem.group] === undefined) {
        setExpandedGroups(prev => {
          const next = { ...prev, [activeItem.group]: true };
          localStorage.setItem('erp_sidebar_groups', JSON.stringify(next));
          return next;
        });
      }
    }
  }, [location.pathname, navItems, isAdmin, activeModule]);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`;

  const renderNavItems = () => {
    const isGroupedView = isAdmin && activeModule !== 'CRM';

    if (!isGroupedView) {
      // Flat list for non-admin or CRM
      return navItems.map(item => {
        const isExactMatch = location.pathname === item.path;
        const isSubRouteMatch = item.path !== '/' && item.path !== '/crm' && item.path !== '/projects' && location.pathname.startsWith(item.path);
        const isActive = isExactMatch || isSubRouteMatch;
        return (
          <Link
            key={item.id}
            to={item.path}
            onClick={() => { if (window.innerWidth < 1024) onClose?.(); }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-150 cursor-pointer"
            style={{
              background: isActive ? 'var(--erp-blue-light)' : 'transparent',
              color: isActive ? 'var(--erp-blue)' : 'var(--erp-text-2)',
              fontWeight: isActive ? 600 : 400,
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
            <span>{item.label}</span>
          </Link>
        );
      });
    }

    // Grouped view for Admin
    return ADMIN_GROUPS_ORDER.map(groupName => {
      const groupItems = navItems.filter(i => i.group === groupName);
      if (groupItems.length === 0) return null;

      // Default true if undefined
      const actuallyExpanded = expandedGroups[groupName] !== false;

      return (
        <div key={groupName} className="mb-2">
          <button
            onClick={() => toggleGroup(groupName)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            {groupName}
            {actuallyExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <AnimatePresence initial={false}>
            {actuallyExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-0.5 mt-1"
              >
                {groupItems.map(item => {
                  const isExactMatch = location.pathname === item.path;
                  const isSubRouteMatch = item.path !== '/' && item.path !== '/crm' && item.path !== '/projects' && location.pathname.startsWith(item.path);
                  const isActive = isExactMatch || isSubRouteMatch;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => { if (window.innerWidth < 1024) onClose?.(); }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-150 cursor-pointer"
                      style={{
                        background: isActive ? 'var(--erp-blue-light)' : 'transparent',
                        color: isActive ? 'var(--erp-blue)' : 'var(--erp-text-2)',
                        fontWeight: isActive ? 600 : 400,
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
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

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
          {renderNavItems()}
        </nav>

        {/* Mobile bottom user section */}
        <div
          className="lg:hidden px-4 py-3 shrink-0 flex items-center gap-3 relative cursor-pointer"
          style={{ borderTop: '1px solid var(--erp-border)' }}
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
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
              onClick={e => { e.stopPropagation(); toggleTheme(); }}
              className="p-1.5 rounded-md transition-colors cursor-pointer"
              style={{ color: 'var(--erp-text-3)' }}
              title="Toggle theme"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); logout(); }}
              className="p-1.5 rounded-md transition-colors cursor-pointer"
              style={{ color: 'var(--erp-text-3)' }}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>

          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full mb-2 left-2 right-2 rounded-lg overflow-hidden py-1 z-50"
                style={{
                  background: 'var(--erp-surface)',
                  border: '1px solid var(--erp-border)',
                  boxShadow: 'var(--shadow-dropdown)',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--erp-text-3)' }}>
                  My Space
                </div>
                {MODULE_REGISTRY.filter(m => m.group === 'Personal').map(item => (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => { setIsProfileMenuOpen(false); onClose?.(); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150 cursor-pointer"
                    style={{ color: 'var(--erp-text-1)' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--erp-surface-2)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <span style={{ color: 'var(--erp-text-3)' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
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
          className="hidden lg:flex fixed bottom-4 left-4 z-50 items-center gap-3 px-3.5 py-2.5 rounded-lg select-none cursor-pointer"
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
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

          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full mb-2 left-0 w-full rounded-lg overflow-hidden py-1 z-50 cursor-auto"
                style={{
                  background: 'var(--erp-surface)',
                  border: '1px solid var(--erp-border)',
                  boxShadow: 'var(--shadow-dropdown)',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--erp-text-3)' }}>
                  My Space
                </div>
                {MODULE_REGISTRY.filter(m => m.group === 'Personal').map(item => (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => { setIsProfileMenuOpen(false); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150 cursor-pointer"
                    style={{ color: 'var(--erp-text-1)' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--erp-surface-2)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <span style={{ color: 'var(--erp-text-3)' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>,
        document.body
      )}
    </>
  );
};

export default Sidebar;

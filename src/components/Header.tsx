import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Clock, AlertTriangle, FileText, UserX, Menu, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api';
import { AppNotification } from '../types';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isHR, isAdmin } = useAuth();
  const hideBranding = location.pathname.startsWith('/careers');

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'manager' | 'overdue'>('all');

  const isManager = isHR || isAdmin || user?.role === 'Manager' || user?.role?.toLowerCase().includes('manager') || user?.department === 'HR';

  const fetchNotifications = async () => {
    try {
      const savedDuration = localStorage.getItem('breakDuration');
      const breakMins = savedDuration ? parseInt(savedDuration, 10) : 45;
      const data = await getNotifications(breakMins);

      // Merge with client-cached manager notifications
      let localNotifs: AppNotification[] = [];
      try {
        const stored = localStorage.getItem('manager_notifications');
        if (stored) {
          localNotifs = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to parse local manager notifications:', e);
      }

      const map = new Map<string, AppNotification>();
      // First insert server data
      (Array.isArray(data) ? data : []).forEach(n => map.set(n.id, n));
      // Then merge local notifications (preserving reads if any)
      localNotifs.forEach(n => {
        if (!map.has(n.id)) {
          map.set(n.id, n);
        }
      });

      const merged = Array.from(map.values()).sort((a, b) => 
        new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
      );

      // Filter for target user or role
      const filtered = merged.filter(n => {
        if (n.targetUserId && user?.id) {
          if (n.targetUserId !== user.id && !isAdmin) return false;
        }
        if (!n.targetRole || n.targetRole === 'All') return true;
        if (isManager) {
          if (n.targetRole === 'HR' || n.targetRole === 'Manager' || n.targetRole.includes('Manager') || n.targetRole.includes('HR')) return true;
          if (n.type === 'overdue_break' || n.type === 'mention') return true;
        }
        return false;
      });

      setNotifications(filtered);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('manager_notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('manager_notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [isHR, isAdmin, user]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const overdueNotifications = notifications.filter(n => n.type === 'overdue_break');
  const unreadOverdueCount = overdueNotifications.filter(n => !n.read).length;
  const managerNotifications = notifications.filter(n => 
    n.type === 'overdue_break' || 
    n.targetRole?.includes('Manager') || 
    n.targetRole?.includes('HR')
  );

  const displayedNotifications = activeTab === 'overdue' 
    ? overdueNotifications 
    : activeTab === 'manager' 
      ? managerNotifications 
      : notifications;

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      // Also update local storage
      const stored = localStorage.getItem('manager_notifications');
      if (stored) {
        try {
          const list: AppNotification[] = JSON.parse(stored);
          const updated = list.map(n => ({ ...n, read: true }));
          localStorage.setItem('manager_notifications', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  const handleMarkOneAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error(err);
    }
    // Update local storage if present
    try {
      const stored = localStorage.getItem('manager_notifications');
      if (stored) {
        const list: AppNotification[] = JSON.parse(stored);
        const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
        localStorage.setItem('manager_notifications', JSON.stringify(updated));
      }
    } catch (e) {
      console.error(e);
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'overdue_break':
        return <AlertTriangle size={18} className="text-rose-500 animate-pulse" />;
      case 'approval':
        return <Check size={16} className="text-emerald-500" />;
      case 'alert':
        return <AlertTriangle size={16} className="text-amber-500" />;
      case 'mention':
        return <MessageSquare size={16} className="text-indigo-500" />;
      case 'policy':
      default:
        return <FileText size={16} className="text-indigo-500" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-50/80 dark:bg-[#0A0C10]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/50 px-4 sm:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu size={22} />
          </button>
          {!hideBranding && (
            <div className="lg:hidden flex items-center gap-2">
              <img src="/logo.png" alt="TwinERP Logo" className="h-6 object-contain invert dark:invert-0" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => {
              setIsNotificationsOpen(true);
              fetchNotifications();
            }}
            className="relative p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className={`absolute top-1.5 right-2 w-2.5 h-2.5 border-2 border-white dark:border-[#0A0C10] rounded-full ${
                unreadOverdueCount > 0 ? 'bg-rose-500 animate-pulse ring-2 ring-rose-400/50' : 'bg-indigo-500'
              }`} />
            )}
          </button>
        </div>
      </header>

      {/* Slide-out Notifications Panel */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
              onClick={() => setIsNotificationsOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] max-w-full bg-white dark:bg-[#11141B] border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    unreadOverdueCount > 0 
                      ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' 
                      : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    <Bell size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                      Notifications
                      {unreadOverdueCount > 0 && (
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                          {unreadOverdueCount} Overdue
                        </span>
                      )}
                    </h2>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">{unreadCount} unread</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  <button 
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Manager Tab Filters */}
              {isManager && (
                <div className="px-5 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('manager')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'manager'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    Manager ({managerNotifications.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('overdue')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'overdue'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : unreadOverdueCount > 0
                          ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <AlertTriangle size={13} className={unreadOverdueCount > 0 ? "animate-pulse" : ""} />
                    Overdue Breaks ({overdueNotifications.length})
                  </button>
                </div>
              )}

              {/* Manager Urgent Alert Banner inside slide-out */}
              {isManager && unreadOverdueCount > 0 && activeTab !== 'overdue' && (
                <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-rose-500/15 to-amber-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                    <AlertTriangle size={16} className="text-rose-500 animate-pulse flex-shrink-0" />
                    <span>
                      <strong className="font-bold">Manager Alert:</strong> {unreadOverdueCount} overdue break{unreadOverdueCount > 1 ? 's' : ''} detected!
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('overdue')}
                    className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Filter &rarr;
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {displayedNotifications.length === 0 ? (
                  <div className="text-center text-slate-500 dark:text-slate-400 py-12 flex flex-col items-center">
                    <Bell size={32} className="text-slate-300 dark:text-slate-700 mb-4" />
                    <p className="font-medium">No {activeTab === 'overdue' ? 'overdue break' : activeTab === 'manager' ? 'manager' : ''} notifications</p>
                    <p className="text-sm mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  displayedNotifications.map(notification => {
                    const isOverdue = notification.type === 'overdue_break';
                    return (
                      <div 
                        key={notification.id} 
                        onClick={() => {
                          if (!notification.read) handleMarkOneAsRead(notification.id);
                          if (notification.type === 'mention') {
                            setIsNotificationsOpen(false);
                            navigate('/team-chat');
                          }
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isOverdue && !notification.read
                            ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40 shadow-md ring-1 ring-rose-400/20'
                            : isOverdue && notification.read
                              ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200/50 dark:border-rose-900/30'
                              : notification.read 
                                ? 'bg-slate-50 dark:bg-[#1A1D23]/50 border-slate-200 dark:border-slate-800/50' 
                                : 'bg-white dark:bg-[#1A1D23] border-indigo-200 dark:border-indigo-500/30 shadow-sm'
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            isOverdue
                              ? 'bg-rose-500/20 dark:bg-rose-500/30'
                              : notification.read 
                                ? 'bg-slate-200 dark:bg-slate-800' 
                                : 'bg-indigo-50 dark:bg-indigo-500/10'
                          }`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                {isOverdue && (
                                  <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-extrabold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 mb-1">
                                    Manager Alert • Overdue Break
                                  </span>
                                )}
                                <h4 className={`text-sm font-bold ${
                                  isOverdue 
                                    ? 'text-rose-600 dark:text-rose-400' 
                                    : notification.read 
                                      ? 'text-slate-700 dark:text-slate-300' 
                                      : 'text-slate-900 dark:text-white'
                                }`}>
                                  {typeof notification.title === 'string' ? notification.title : (notification.title as any)?.message || 'Notification'}
                                </h4>
                              </div>
                              {!notification.read && (
                                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'}`}></span>
                              )}
                            </div>
                            <p className={`text-sm mb-3 ${
                              isOverdue && !notification.read 
                                ? 'text-rose-800 dark:text-rose-200 font-medium' 
                                : notification.read 
                                  ? 'text-slate-500' 
                                  : 'text-slate-600 dark:text-slate-300'
                            }`}>
                              {typeof notification.message === 'string' ? notification.message : (notification.message as any)?.message || JSON.stringify(notification.message || '')}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={12} />
                                {notification.time}
                              </p>
                              {isOverdue && !notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkOneAsRead(notification.id);
                                  }}
                                  className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-sm"
                                >
                                  Mark Reviewed
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

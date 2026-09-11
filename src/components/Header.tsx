import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Clock, AlertTriangle, FileText, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api';
import { AppNotification } from '../types';

export default function Header() {
  const { user, isHR, isAdmin } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      // Filter for target role if set, or show all for HR/Admin
      const filtered = data.filter(n => {
        if (!n.targetRole || n.targetRole === 'All') return true;
        if (n.targetRole === 'HR' && (isHR || isAdmin)) return true;
        return false;
      });
      setNotifications(filtered);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, [isHR, isAdmin]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  const handleMarkOneAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'overdue_break':
        return <AlertTriangle size={18} className="text-rose-500 animate-pulse" />;
      case 'approval':
        return <Check size={16} className="text-emerald-500" />;
      case 'alert':
        return <AlertTriangle size={16} className="text-amber-500" />;
      case 'policy':
      default:
        return <FileText size={16} className="text-indigo-500" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-50/80 dark:bg-[#0A0C10]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/50 px-8 py-3 flex justify-between items-center">
        <div>
           {/* Left side spacing or title if needed */}
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-[#0A0C10] rounded-full animate-pulse" />
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
              className="fixed top-0 right-0 bottom-0 w-[420px] bg-white dark:bg-[#11141B] border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                    <Bell size={18} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">Notifications</h2>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">{unreadCount} unread</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold transition-colors uppercase tracking-wider"
                    >
                      Mark all as read
                    </button>
                  )}
                  <button 
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center text-slate-500 dark:text-slate-400 py-12 flex flex-col items-center">
                    <Bell size={32} className="text-slate-300 dark:text-slate-700 mb-4" />
                    <p className="font-medium">No new notifications</p>
                    <p className="text-sm mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  notifications.map(notification => {
                    const isOverdue = notification.type === 'overdue_break';
                    return (
                      <div 
                        key={notification.id} 
                        onClick={() => !notification.read && handleMarkOneAsRead(notification.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isOverdue && !notification.read
                            ? 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-400/40 dark:border-rose-500/40 shadow-sm'
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
                              <h4 className={`text-sm font-bold ${
                                isOverdue 
                                  ? 'text-rose-600 dark:text-rose-400' 
                                  : notification.read 
                                    ? 'text-slate-700 dark:text-slate-300' 
                                    : 'text-slate-900 dark:text-white'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${isOverdue ? 'bg-rose-500' : 'bg-indigo-500'}`}></span>
                              )}
                            </div>
                            <p className={`text-sm mb-3 ${
                              isOverdue && !notification.read 
                                ? 'text-rose-700 dark:text-rose-300 font-medium' 
                                : notification.read 
                                  ? 'text-slate-500' 
                                  : 'text-slate-600 dark:text-slate-300'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                              <Clock size={12} />
                              {notification.time}
                            </p>
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

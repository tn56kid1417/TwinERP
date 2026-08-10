import React, { useState } from 'react';
import { Bell, X, Check, Clock, AlertTriangle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Mock notifications
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'approval',
      title: 'Pending Approval',
      message: 'Leave request from John Doe requires your approval.',
      time: '10 mins ago',
      read: false,
      icon: <Check size={16} className="text-emerald-500" />
    },
    {
      id: 2,
      type: 'alert',
      title: 'Project Deadline Alert',
      message: 'Website Redesign project is due in 2 days.',
      time: '1 hour ago',
      read: false,
      icon: <AlertTriangle size={16} className="text-amber-500" />
    },
    {
      id: 3,
      type: 'policy',
      title: 'HR Policy Change',
      message: 'Updated work from home guidelines have been published.',
      time: '1 day ago',
      read: true,
      icon: <FileText size={16} className="text-indigo-500" />
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
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
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-[#0A0C10] rounded-full animate-pulse" />
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
              className="fixed top-0 right-0 bottom-0 w-[400px] bg-white dark:bg-[#11141B] border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col"
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
                      onClick={markAllAsRead}
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
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        notification.read 
                          ? 'bg-slate-50 dark:bg-[#1A1D23]/50 border-slate-200 dark:border-slate-800/50' 
                          : 'bg-white dark:bg-[#1A1D23] border-indigo-200 dark:border-indigo-500/30 shadow-sm'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.read ? 'bg-slate-200 dark:bg-slate-800' : 'bg-indigo-50 dark:bg-indigo-500/10'
                        }`}>
                          {notification.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-sm font-bold ${notification.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className={`text-sm mb-3 ${notification.read ? 'text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                            {notification.message}
                          </p>
                          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={12} />
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

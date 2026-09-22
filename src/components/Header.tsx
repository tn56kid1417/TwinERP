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

      let localNotifs: AppNotification[] = [];
      try {
        const stored = localStorage.getItem('manager_notifications');
        if (stored) localNotifs = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse local manager notifications:', e);
      }

      const map = new Map<string, AppNotification>();
      (Array.isArray(data) ? data : []).forEach(n => map.set(n.id, n));
      localNotifs.forEach(n => { if (!map.has(n.id)) map.set(n.id, n); });

      const merged = Array.from(map.values()).sort((a, b) =>
        new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
      );

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
    n.type === 'overdue_break' || n.targetRole?.includes('Manager') || n.targetRole?.includes('HR')
  );
  const displayedNotifications = activeTab === 'overdue'
    ? overdueNotifications
    : activeTab === 'manager'
      ? managerNotifications
      : notifications;

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      const stored = localStorage.getItem('manager_notifications');
      if (stored) {
        try {
          const list: AppNotification[] = JSON.parse(stored);
          localStorage.setItem('manager_notifications', JSON.stringify(list.map(n => ({ ...n, read: true }))));
        } catch (e) { console.error(e); }
      }
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  const handleMarkOneAsRead = async (id: string) => {
    try { await markNotificationRead(id); } catch (err) { console.error(err); }
    try {
      const stored = localStorage.getItem('manager_notifications');
      if (stored) {
        const list: AppNotification[] = JSON.parse(stored);
        localStorage.setItem('manager_notifications', JSON.stringify(list.map(n => n.id === id ? { ...n, read: true } : n)));
      }
    } catch (e) { console.error(e); }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'overdue_break': return <AlertTriangle size={15} style={{ color: 'var(--erp-danger)' }} />;
      case 'approval':      return <Check size={15} style={{ color: 'var(--erp-success)' }} />;
      case 'alert':         return <AlertTriangle size={15} style={{ color: 'var(--erp-warning)' }} />;
      case 'mention':       return <MessageSquare size={15} style={{ color: 'var(--erp-blue)' }} />;
      default:              return <FileText size={15} style={{ color: 'var(--erp-text-3)' }} />;
    }
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 h-14 shrink-0"
        style={{
          background: 'var(--erp-surface)',
          borderBottom: '1px solid var(--erp-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-md transition-colors cursor-pointer"
            style={{ color: 'var(--erp-text-3)' }}
            aria-label="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>
          {!hideBranding && (
            <div className="lg:hidden">
              <img src="/logo.png" alt="TwinERP" className="h-6 object-contain" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => { setIsNotificationsOpen(true); fetchNotifications(); }}
            className="relative p-2 rounded-md transition-colors cursor-pointer"
            style={{ color: 'var(--erp-text-3)' }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                className="absolute top-2 right-2 w-2 h-2 rounded-full"
                style={{
                  background: unreadOverdueCount > 0 ? 'var(--erp-danger)' : 'var(--erp-blue)',
                }}
              />
            )}
          </button>
        </div>
      </header>

      {/* Notifications panel */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.25)' }}
              onClick={() => setIsNotificationsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
              className="fixed top-0 right-0 bottom-0 z-50 flex flex-col w-full sm:w-[420px] max-w-full"
              style={{
                background: 'var(--erp-surface)',
                borderLeft: '1px solid var(--erp-border)',
                boxShadow: 'var(--shadow-modal)',
              }}
            >
              {/* Panel header */}
              <div
                className="px-5 h-14 flex items-center justify-between shrink-0"
                style={{ borderBottom: '1px solid var(--erp-border)' }}
              >
                <div className="flex items-center gap-2">
                  <Bell size={16} style={{ color: 'var(--erp-text-3)' }} />
                  <h2 className="text-base font-semibold" style={{ color: 'var(--erp-text-1)' }}>
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--erp-blue)', color: '#fff' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs font-medium transition-colors cursor-pointer"
                      style={{ color: 'var(--erp-blue)' }}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-1.5 rounded-md transition-colors cursor-pointer"
                    style={{ color: 'var(--erp-text-3)' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Tab filter (manager view only) */}
              {isManager && (
                <div
                  className="px-5 py-2.5 flex items-center gap-2 shrink-0"
                  style={{ borderBottom: '1px solid var(--erp-border)', background: 'var(--erp-surface-2)' }}
                >
                  {([['all', `All (${notifications.length})`], ['manager', `Manager (${managerNotifications.length})`], ['overdue', `Overdue (${overdueNotifications.length})`]] as [string, string][]).map(([tab, label]) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className="px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
                      style={{
                        background: activeTab === tab ? (tab === 'overdue' ? 'var(--erp-danger)' : 'var(--erp-blue)') : 'transparent',
                        color: activeTab === tab ? '#fff' : 'var(--erp-text-3)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Overdue alert banner */}
              {isManager && unreadOverdueCount > 0 && activeTab !== 'overdue' && (
                <div
                  className="mx-4 mt-3 px-4 py-3 rounded-md flex items-center justify-between shrink-0"
                  style={{
                    background: 'rgba(220,38,38,0.06)',
                    border: '1px solid rgba(220,38,38,0.25)',
                  }}
                >
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--erp-danger)' }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>{unreadOverdueCount}</strong> overdue break{unreadOverdueCount > 1 ? 's' : ''} detected
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('overdue')}
                    className="text-xs font-medium cursor-pointer transition-opacity hover:opacity-70"
                    style={{ color: 'var(--erp-danger)' }}
                  >
                    View →
                  </button>
                </div>
              )}

              {/* Notification list */}
              <div className="flex-1 overflow-y-auto erp-scroll p-4 space-y-2">
                {displayedNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Bell size={28} style={{ color: 'var(--erp-border-2)' }} />
                    <p className="text-sm" style={{ color: 'var(--erp-text-3)' }}>No notifications</p>
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
                        className="flex gap-3 p-3 rounded-md cursor-pointer transition-colors"
                        style={{
                          background: notification.read ? 'transparent' : 'var(--erp-surface-2)',
                          border: `1px solid ${isOverdue && !notification.read ? 'rgba(220,38,38,0.25)' : 'var(--erp-border)'}`,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--erp-surface-2)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = notification.read ? 'transparent' : 'var(--erp-surface-2)'; }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                          style={{ background: 'var(--erp-surface-2)', border: '1px solid var(--erp-border)' }}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-snug" style={{ color: isOverdue && !notification.read ? 'var(--erp-danger)' : 'var(--erp-text-1)' }}>
                              {typeof notification.title === 'string' ? notification.title : (notification.title as any)?.message || 'Notification'}
                            </p>
                            {!notification.read && (
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                                style={{ background: isOverdue ? 'var(--erp-danger)' : 'var(--erp-blue)' }}
                              />
                            )}
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'var(--erp-text-3)' }}>
                            {typeof notification.message === 'string' ? notification.message : (notification.message as any)?.message || ''}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--erp-text-3)' }}>
                              <Clock size={11} />
                              {notification.time}
                            </span>
                            {isOverdue && !notification.read && (
                              <button
                                onClick={e => { e.stopPropagation(); handleMarkOneAsRead(notification.id); }}
                                className="text-xs font-medium px-2 py-0.5 rounded transition-colors cursor-pointer"
                                style={{ background: 'var(--erp-danger)', color: '#fff' }}
                              >
                                Reviewed
                              </button>
                            )}
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

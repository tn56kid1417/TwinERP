import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, Clock, CheckCircle, LogIn, LogOut, Megaphone, Award as AwardIcon, Calendar, Coffee, Settings, PartyPopper, Zap, FolderPlus, X, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getEmployees, clockIn, clockOut, breakIn, breakOut, getAllAttendance, getAnnouncements, getAwards, getHolidays, getEvents, getLeaves, checkOverdueBreaks } from '../api';
import { Employee, Attendance, Announcement, Award, Holiday, AppEvent, LeaveRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const Dashboard = () => {
  const { user, canViewAll, canEdit, isHR, isAdmin } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  
  // Break state
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(parseInt(localStorage.getItem('breakDuration') || '45', 10));
  const [isEditingBreak, setIsEditingBreak] = useState(false);
  const [tempBreakDuration, setTempBreakDuration] = useState(breakDurationMinutes.toString());
  const [breakTimeRemaining, setBreakTimeRemaining] = useState<number | null>(null);
  const [breakOverdueSeconds, setBreakOverdueSeconds] = useState<number>(0);
  const [overdueEmployees, setOverdueEmployees] = useState<any[]>([]);
  const hasTriggeredAlertRef = useRef<Record<string, boolean>>({});

  const today = new Date().toISOString().split('T')[0];
  const currentEmpId = user?.id || selectedEmpId || (employees[0]?.id ?? '');

  useEffect(() => {
    if (user?.id && selectedEmpId !== user.id) {
      setSelectedEmpId(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const saveLocalAttendance = (att: Attendance) => {
    try {
      localStorage.setItem(`attendance_${att.employeeId}_${att.date}`, JSON.stringify(att));
    } catch (e) {
      console.error('Failed to cache attendance locally:', e);
    }
  };

  const fetchData = async () => {
    try {
      const [emps, atts, anns, awds, hols, evts, lvs] = await Promise.all([getEmployees(), getAllAttendance(), getAnnouncements(), getAwards(), getHolidays(), getEvents(), getLeaves()]);
      setEmployees(emps);
      setAnnouncements(anns);
      setAwards(awds);
      setHolidays(hols);
      setEvents(evts);
      setLeaves(lvs);
      
      const activeId = user?.id || selectedEmpId || emps[0]?.id;
      if (emps.length > 0 && !selectedEmpId && activeId) {
        setSelectedEmpId(activeId);
      }

      // Merge local attendance cache so state survives server restarts and serverless cold starts
      let mergedAtts = [...atts];
      if (activeId) {
        const stored = localStorage.getItem(`attendance_${activeId}_${today}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as Attendance;
            const existsIndex = mergedAtts.findIndex(a => a.employeeId === activeId && a.date === today);
            if (existsIndex >= 0) {
              mergedAtts[existsIndex] = { ...mergedAtts[existsIndex], ...parsed };
            } else {
              mergedAtts.push(parsed);
            }
          } catch (e) {
            console.error('Failed to parse cached attendance:', e);
          }
        }
      }
      setAttendances(mergedAtts);
    } catch (err) {
      console.error(err);
    }
  };

  const presentTodayCount = attendances.filter(a => a.date === today && (a.status === 'Present' || a.status === 'Half-Day')).length;
  
  const selectedEmpAttendance = attendances.find(a => a.employeeId === currentEmpId && a.date === today);
  const isClockedIn = selectedEmpAttendance !== undefined;
  const isClockedOut = selectedEmpAttendance?.clockOutTime !== null && selectedEmpAttendance?.clockOutTime !== undefined;
  const isOnBreak = selectedEmpAttendance?.breakInTime !== null && selectedEmpAttendance?.breakInTime !== undefined && !selectedEmpAttendance?.breakOutTime;
  const hasTakenBreak = selectedEmpAttendance?.breakOutTime !== null && selectedEmpAttendance?.breakOutTime !== undefined;

  const checkOverdueBreaksPeriodically = async () => {
    try {
      const res = await checkOverdueBreaks(breakDurationMinutes);
      if (res && res.overdueEmployees) {
        setOverdueEmployees(res.overdueEmployees);
        if ((isHR || isAdmin) && res.overdueEmployees.length > 0) {
          res.overdueEmployees.forEach((emp: any) => {
            if (!hasTriggeredAlertRef.current[emp.employeeId]) {
              hasTriggeredAlertRef.current[emp.employeeId] = true;
              toast.error(
                `Manager Alert: ${emp.employeeName} exceeded break limit (${breakDurationMinutes} mins) without breaking out!`,
                { duration: 8000, id: `break-alert-${emp.employeeId}`, icon: '⚠️' }
              );
            }
          });

          // Sync to local storage manager_notifications for instant Header visibility
          try {
            const todayStr = new Date().toISOString().split('T')[0];
            const stored = JSON.parse(localStorage.getItem('manager_notifications') || '[]');
            const existingMap = new Map<string, any>(stored.map((n: any) => [n.id, n]));

            res.overdueEmployees.forEach((emp: any) => {
              const id = `notif_break_${emp.employeeId}_${todayStr}`;
              if (!existingMap.has(id)) {
                existingMap.set(id, {
                  id,
                  type: 'overdue_break',
                  title: 'Manager Alert: Overdue Break',
                  message: `${emp.employeeName} exceeded break limit (${breakDurationMinutes} mins) and has not broken out on time. Immediate manager review advised.`,
                  time: 'Just now',
                  timestamp: new Date().toISOString(),
                  read: false,
                  targetRole: 'Manager,HR',
                  employeeId: emp.employeeId,
                  employeeName: emp.employeeName,
                  overdueMinutes: emp.overdueMinutes
                });
              }
            });
            localStorage.setItem('manager_notifications', JSON.stringify(Array.from(existingMap.values())));
            window.dispatchEvent(new Event('manager_notifications_updated'));
          } catch (e) {
            console.error('Failed to sync manager notifications to localStorage:', e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to check overdue breaks:', err);
    }
  };

  useEffect(() => {
    checkOverdueBreaksPeriodically();
    const interval = setInterval(checkOverdueBreaksPeriodically, 12000);
    return () => clearInterval(interval);
  }, [breakDurationMinutes, isHR, isAdmin, attendances]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOnBreak && selectedEmpAttendance?.breakInTime) {
      interval = setInterval(() => {
        const breakStart = new Date(selectedEmpAttendance.breakInTime!).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - breakStart) / 1000);
        const limit = breakDurationMinutes * 60;
        const remaining = limit - elapsed;

        if (remaining > 0) {
          setBreakTimeRemaining(remaining);
          setBreakOverdueSeconds(0);
        } else {
          setBreakTimeRemaining(0);
          const overdue = Math.abs(remaining);
          setBreakOverdueSeconds(overdue);
          // When current user break expires, ensure HR alert is immediately dispatched
          if (!hasTriggeredAlertRef.current[currentEmpId]) {
            hasTriggeredAlertRef.current[currentEmpId] = true;
            checkOverdueBreaksPeriodically();
          }
        }
      }, 1000);
    } else {
      setBreakTimeRemaining(null);
      setBreakOverdueSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isOnBreak, selectedEmpAttendance, breakDurationMinutes, currentEmpId]);

  const handleSaveBreakDuration = () => {
    const val = parseInt(tempBreakDuration, 10);
    if (!isNaN(val) && val > 0) {
      setBreakDurationMinutes(val);
      localStorage.setItem('breakDuration', val.toString());
      setIsEditingBreak(false);
    }
  };

  const handleClockIn = async () => {
    setActionError('');
    setActionMessage('');
    const targetId = currentEmpId;
    if (!targetId) return;
    const nowIso = new Date().toISOString();
    try {
      const res = await clockIn(targetId, nowIso);
      saveLocalAttendance(res);
      setActionMessage('Clocked in successfully');
      fetchData();
    } catch (err: any) {
      const localRecord: Attendance = {
        id: `local_${Date.now()}`,
        employeeId: targetId,
        date: today,
        clockInTime: nowIso,
        clockOutTime: null,
        status: 'Present'
      };
      saveLocalAttendance(localRecord);
      setAttendances(prev => [...prev.filter(a => !(a.employeeId === targetId && a.date === today)), localRecord]);
      setActionMessage('Clocked in successfully');
    }
  };

  const handleClockOut = async () => {
    setActionError('');
    setActionMessage('');
    const targetId = currentEmpId;
    if (!targetId) return;
    const clockInTime = selectedEmpAttendance?.clockInTime || new Date().toISOString();
    try {
      const res = await clockOut(targetId, clockInTime);
      saveLocalAttendance(res);
      setActionMessage('Clocked out successfully');
      fetchData();
    } catch (err: any) {
      if (selectedEmpAttendance) {
        const updated: Attendance = {
          ...selectedEmpAttendance,
          clockOutTime: new Date().toISOString(),
          status: 'Present'
        };
        saveLocalAttendance(updated);
        setAttendances(prev => prev.map(a => (a.employeeId === targetId && a.date === today) ? updated : a));
        setActionMessage('Clocked out successfully');
      } else {
        setActionError(err.response?.data?.error || 'Failed to clock out');
      }
    }
  };

  const handleBreakIn = async () => {
    setActionError('');
    setActionMessage('');
    const targetId = currentEmpId;
    if (!targetId) return;
    const clockInTime = selectedEmpAttendance?.clockInTime || new Date().toISOString();
    try {
      const res = await breakIn(targetId, clockInTime);
      saveLocalAttendance(res);
      setActionMessage('Break started successfully');
      fetchData();
    } catch (err: any) {
      if (selectedEmpAttendance) {
        const updated: Attendance = {
          ...selectedEmpAttendance,
          breakInTime: new Date().toISOString()
        };
        saveLocalAttendance(updated);
        setAttendances(prev => prev.map(a => (a.employeeId === targetId && a.date === today) ? updated : a));
        setActionMessage('Break started successfully');
      } else {
        setActionError(err.response?.data?.error || 'Failed to start break');
      }
    }
  };

  const handleBreakOut = async () => {
    setActionError('');
    setActionMessage('');
    const targetId = currentEmpId;
    if (!targetId) return;
    const clockInTime = selectedEmpAttendance?.clockInTime || new Date().toISOString();
    const breakInTime = selectedEmpAttendance?.breakInTime || new Date().toISOString();
    try {
      const res = await breakOut(targetId, clockInTime, breakInTime);
      saveLocalAttendance(res);
      setActionMessage('Break ended successfully');
      fetchData();
    } catch (err: any) {
      if (selectedEmpAttendance) {
        const updated: Attendance = {
          ...selectedEmpAttendance,
          breakOutTime: new Date().toISOString()
        };
        saveLocalAttendance(updated);
        setAttendances(prev => prev.map(a => (a.employeeId === targetId && a.date === today) ? updated : a));
        setActionMessage('Break ended successfully');
      } else {
        setActionError(err.response?.data?.error || 'Failed to end break');
      }
    }
  };

  const myAwards = awards.filter(a => a.employeeId === user?.id);

  const recentActivities = [
    ...overdueEmployees.map(emp => ({
      id: `overdue-${emp.employeeId}`,
      type: 'overdue_break',
      icon: <AlertTriangle size={16} className="text-rose-500 animate-pulse" />,
      title: 'Manager Alert: Overdue Break',
      description: `${emp.employeeName} has exceeded break limit (${breakDurationMinutes} mins) and is overdue by ${emp.overdueMinutes}m.`,
      date: new Date(),
      bgColor: 'bg-rose-500/10 dark:bg-rose-500/10',
      borderColor: 'border-rose-500/30 dark:border-rose-500/30'
    })),
    ...employees.map(emp => ({
      id: `emp-${emp.id}`,
      type: 'onboarding',
      icon: <UserPlus size={16} className="text-emerald-500" />,
      title: 'New Employee Onboarded',
      description: `${emp.firstName} ${emp.lastName} joined the ${emp.department} department as ${emp.role}.`,
      date: new Date(emp.hireDate),
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/10',
      borderColor: 'border-emerald-500/20 dark:border-emerald-500/20'
    })),
    ...leaves.filter(l => l.status === 'Approved').map(leave => {
      const emp = employees.find(e => e.id === leave.employeeId);
      return {
        id: `leave-${leave.id}`,
        type: 'leave_approved',
        icon: <CheckCircle size={16} className="text-blue-500" />,
        title: 'Leave Request Approved',
        description: `${emp?.firstName || 'Employee'} ${emp?.lastName || ''}'s ${leave.leaveType} leave from ${leave.startDate} to ${leave.endDate} was approved.`,
        date: new Date(leave.startDate),
        bgColor: 'bg-blue-500/10 dark:bg-blue-500/10',
        borderColor: 'border-blue-500/20 dark:border-blue-500/20'
      };
    })
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);

  const departmentData = React.useMemo(() => {
    const counts = employees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [employees]);

  const attendanceTodayData = React.useMemo(() => {
    const present = attendances.filter(a => a.date === today && (a.status === 'Present' || a.status === 'Half-Day')).length;
    const absent = employees.length > 0 ? employees.length - present : 0;
    return [
      { name: 'Present', value: present },
      { name: 'Absent', value: absent }
    ];
  }, [attendances, employees.length, today]);

  const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#c084fc', '#22d3ee'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="p-8 max-w-7xl mx-auto w-full min-h-full flex flex-col space-y-8 pb-16"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 dark:text-slate-500 mt-1">Welcome back, {user?.firstName}. Here is what's happening today.</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => setIsQuickActionsOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Zap size={16} /> Quick Actions
          </button>
        )}
      </div>

      {/* Quick Actions Modal */}
      {isQuickActionsOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1A1D23] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap size={18} className="text-indigo-500" /> Quick Actions
              </h3>
              <button 
                onClick={() => setIsQuickActionsOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <Link to="/employees" className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/30 rounded-xl transition-all group">
                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <UserPlus size={24} className="text-emerald-500" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">New Employee</span>
              </Link>
              <Link to="/projects/all" className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/30 rounded-xl transition-all group">
                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <FolderPlus size={24} className="text-indigo-500" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">New Project</span>
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      {/* Overdue Break Alert Banner for Manager & HR */}
      {(isHR || isAdmin) && overdueEmployees.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-amber-500/10 border border-rose-500/30 dark:border-rose-500/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                Manager Alert: Overdue Break Detected
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400">
                  {overdueEmployees.length} Employee{overdueEmployees.length > 1 ? 's' : ''} Overdue
                </span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {overdueEmployees.map(e => `${e.employeeName} (+${e.overdueMinutes}m overdue)`).join(', ')} exceeded the {breakDurationMinutes} mins break limit without breaking out. Present in Manager Notifications panel.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => checkOverdueBreaksPeriodically()}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              Check Again
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {canViewAll && (
          <>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="md:col-span-1 bg-white dark:bg-[#1A1D23]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300">
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1 group-hover:text-indigo-400 transition-colors">Total Employees</p>
                <h3 className="text-3xl font-medium text-slate-900 dark:text-white group-hover:scale-105 origin-left transition-transform">{employees.length}</h3>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <span>Active Team</span>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="md:col-span-1 bg-white dark:bg-[#1A1D23]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300">
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1 group-hover:text-indigo-400 transition-colors">Present Today</p>
                <h3 className="text-3xl font-medium text-slate-900 dark:text-white group-hover:scale-105 origin-left transition-transform">{presentTodayCount}</h3>
              </div>
              <div className="mt-4 w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="w-[0%] h-full bg-indigo-500 group-hover:bg-indigo-400 transition-colors duration-500" style={{ width: employees.length ? `${(presentTodayCount / employees.length) * 100}%` : '0%' }}></div>
              </div>
            </motion.div>
          </>
        )}

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className={`bg-white dark:bg-[#1A1D23]/60 backdrop-blur-md border border-indigo-500/30 p-5 rounded-xl flex flex-col group hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/20 hover:border-indigo-400/50 transition-all duration-300 relative overflow-hidden ${canViewAll ? 'md:col-span-2' : 'md:col-span-4 max-w-2xl'}`}>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex justify-between items-center mb-4">
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <Clock size={12} /> My Attendance ({user?.firstName} {user?.lastName})
            </p>
          </div>
          
          {actionError && (
            <div className="text-xs text-rose-500 dark:text-rose-400 mb-3 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 flex items-center justify-between gap-2">
              <span>{actionError}</span>
              <button 
                type="button"
                onClick={() => setActionError('')} 
                className="p-0.5 hover:bg-rose-500/20 rounded text-rose-500 dark:text-rose-400 transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {actionMessage && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-3 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 flex items-center justify-between gap-2">
              <span>{actionMessage}</span>
              <button 
                type="button"
                onClick={() => setActionMessage('')} 
                className="p-0.5 hover:bg-emerald-500/20 rounded text-emerald-600 dark:text-emerald-400 transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-4 mt-auto">
            {!isClockedIn ? (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
                onClick={handleClockIn}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/25 dark:bg-emerald-600 dark:hover:bg-emerald-500 border border-transparent px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all h-[38px] flex items-center justify-center gap-2"
              >
                <LogIn size={14} /> Punch In
              </motion.button>
            ) : !isClockedOut ? (
              <div className="flex gap-4 w-full">
                {!isOnBreak ? (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
                    onClick={handleBreakIn}
                    disabled={hasTakenBreak}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white shadow-sm dark:bg-amber-600 dark:hover:bg-amber-500 border border-transparent px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all h-[38px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Coffee size={14} /> {hasTakenBreak ? 'Break Taken' : 'Break In'}
                  </motion.button>
                ) : (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
                    onClick={handleBreakOut}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white shadow-sm dark:bg-amber-600 dark:hover:bg-amber-500 border border-transparent px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all h-[38px] flex items-center justify-center gap-2"
                  >
                    <Coffee size={14} /> Break Out
                  </motion.button>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
                  onClick={handleClockOut}
                  disabled={isOnBreak}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white shadow-sm dark:bg-rose-600 dark:hover:bg-rose-500 border border-transparent px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all h-[38px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut size={14} /> Punch Out
                </motion.button>
              </div>
            ) : null}
          </div>
          
          <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-4 flex flex-col gap-2">
            <div className="flex gap-4">
              <span>Status: <strong className={isClockedOut ? 'text-slate-500 dark:text-slate-500 dark:text-slate-400' : isOnBreak ? 'text-amber-400' : isClockedIn ? 'text-emerald-400' : 'text-slate-500 dark:text-slate-500 dark:text-slate-400'}>{isClockedOut ? 'Punched Out' : isOnBreak ? 'On Break' : isClockedIn ? 'Punched In' : 'Not Punched In'}</strong></span>
              {isClockedIn && <span>Time In: <strong className="text-slate-700 dark:text-slate-300">{new Date(selectedEmpAttendance!.clockInTime).toLocaleTimeString()}</strong></span>}
              {isClockedOut && <span>Time Out: <strong className="text-slate-700 dark:text-slate-300">{new Date(selectedEmpAttendance!.clockOutTime!).toLocaleTimeString()}</strong></span>}
            </div>

            {(isOnBreak || hasTakenBreak || canViewAll) && (
              <div className="flex items-center gap-4 p-2 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-amber-400">
                  <Coffee size={14} />
                  <span>Break Time: 
                    {isOnBreak && breakTimeRemaining !== null ? (
                      breakOverdueSeconds > 0 ? (
                        <strong className="ml-1 text-rose-500 font-extrabold animate-pulse">
                          ⚠️ OVERDUE by {Math.floor(breakOverdueSeconds / 60)}:{(breakOverdueSeconds % 60).toString().padStart(2, '0')} (HR Manager Alerted)
                        </strong>
                      ) : (
                        <strong className="ml-1 text-amber-500 dark:text-amber-300">
                          {Math.floor(breakTimeRemaining / 60)}:{(breakTimeRemaining % 60).toString().padStart(2, '0')} min remaining
                        </strong>
                      )
                    ) : (
                      <strong className="ml-1 text-slate-700 dark:text-slate-300">{breakDurationMinutes} mins</strong>
                    )}
                  </span>
                </div>
                
                {canViewAll && (
                  <div className="flex items-center gap-2 ml-auto">
                    {isEditingBreak ? (
                      <>
                        <input 
                          type="number" 
                          value={tempBreakDuration} 
                          onChange={(e) => setTempBreakDuration(e.target.value)} 
                          className="w-16 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-2 py-1 rounded outline-none focus:ring-1 focus:ring-indigo-500 border border-slate-300 dark:border-slate-700"
                        />
                        <button onClick={handleSaveBreakDuration} className="text-emerald-400 hover:text-emerald-300 text-xs font-bold uppercase tracking-widest"><CheckCircle size={14} /></button>
                      </>
                    ) : (
                      <button onClick={() => setIsEditingBreak(true)} className="text-slate-500 dark:text-slate-500 dark:text-slate-400 hover:text-indigo-400 flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest transition-colors"><Settings size={12}/> Edit</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {canViewAll && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Department Distribution */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="bg-white dark:bg-[#1A1D23]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col group hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Department Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '0.5rem', color: '#F8FAFC', fontSize: '12px' }}
                    itemStyle={{ color: '#F8FAFC' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Attendance Today */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="bg-white dark:bg-[#1A1D23]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col group hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Attendance Today</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceTodayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    cursor={{ fill: '#334155', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '0.5rem', color: '#F8FAFC', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {attendanceTodayData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Conditional Panel: Recent Employees for HR, My Awards for Employees */}
        {canViewAll ? (
          <div className="bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden flex flex-col group hover:border-slate-300 dark:hover:border-slate-700 shadow-lg shadow-slate-200/40 dark:shadow-black/40 transition-all duration-300">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center group-hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-400 dark:group-hover:text-indigo-300 transition-colors">Recent Employees</h2>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase font-bold tracking-widest transition-colors">View All</motion.button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 overflow-y-auto">
              {employees.slice(0, 5).map(emp => (
                <div key={emp.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-600 transition-colors">
                      {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{emp.firstName} {emp.lastName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500">{emp.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{emp.department}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 tracking-tighter">{emp.role}</p>
                  </div>
                </div>
              ))}
              {employees.length === 0 && (
                <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-500">
                  No employees found.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden flex flex-col group hover:border-amber-500/40 shadow-lg shadow-slate-200/40 dark:shadow-black/40 transition-all duration-300">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center transition-colors">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-amber-400 transition-colors">
                <AwardIcon size={16} className="text-amber-400" /> My Awards
              </h2>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {myAwards.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-500 py-4">No awards yet. Keep up the good work!</div>
              ) : (
                myAwards.map(award => (
                  <div key={award.id} className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-lg p-4 flex gap-4 items-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 cursor-default">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
                      <AwardIcon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-800 dark:text-slate-200">{award.awardType}</h3>
                      <p className="text-xs text-amber-400 mt-1 font-semibold">{award.gift}</p>
                      {award.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{award.description}</p>}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest text-right">
                      {award.date}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-6">
          {/* Announcements Panel */}
          <div className="bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden flex flex-col group hover:border-slate-300 dark:hover:border-slate-700 shadow-lg shadow-slate-200/40 dark:shadow-black/40 transition-all duration-300">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center transition-colors">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-indigo-400 dark:group-hover:text-indigo-300 transition-colors">
                <Megaphone size={16} className="text-indigo-400" /> Announcements
              </h2>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[300px]">
              {announcements.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-500 py-4">No recent announcements.</div>
              ) : (
                announcements.map(ann => (
                  <div key={ann.id} className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-lg p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 cursor-default">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-slate-800 dark:text-slate-200">{ann.title}</h3>
                      <span className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest">{ann.date}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{ann.content}</p>
                    <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-widest">
                      Posted by {ann.author}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Events Panel */}
          <div className="bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden flex flex-col group hover:border-slate-300 dark:hover:border-slate-700 shadow-lg shadow-slate-200/40 dark:shadow-black/40 transition-all duration-300">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center transition-colors">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-indigo-400 transition-colors">
                <PartyPopper size={16} className="text-indigo-400" /> Upcoming Events
              </h2>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[300px]">
              {events.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-500 py-4">No upcoming events scheduled.</div>
              ) : (
                events.map(event => (
                  <div key={event.id} className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-lg p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 cursor-default">
                    <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-1">{event.title}</h3>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">{event.description}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">
                      <span className="text-slate-700 dark:text-slate-300 mr-2">{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {event.time}</span>
                      <span>{event.location}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Holidays Panel */}
        <div className="bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden flex flex-col group hover:border-slate-300 dark:hover:border-slate-700 shadow-lg shadow-slate-200/40 dark:shadow-black/40 transition-all duration-300">
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center transition-colors">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-emerald-400 transition-colors">
              <Calendar size={16} className="text-emerald-400" /> Upcoming Holidays
            </h2>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[624px]">
            {holidays.length === 0 ? (
              <div className="text-center text-slate-500 dark:text-slate-500 py-4">No upcoming holidays scheduled.</div>
            ) : (
              holidays.map(hol => (
                <div key={hol.id} className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-lg p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 cursor-default">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-slate-800 dark:text-slate-200">{hol.name}</h3>
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded text-[9px] uppercase font-bold tracking-widest">{hol.type}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{hol.startDate}</span>
                    {hol.startDate !== hol.endDate && <span> to <span className="text-slate-700 dark:text-slate-300 font-medium">{hol.endDate}</span></span>}
                  </div>
                  <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-widest">
                    {hol.isPaid ? <span className="text-emerald-400">Paid Holiday</span> : <span>Unpaid Holiday</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {canViewAll && (
        <div className="pt-2">
          <div className="bg-white/85 dark:bg-[#0C1017]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden flex flex-col group hover:border-slate-300 dark:hover:border-slate-700 shadow-lg shadow-slate-200/40 dark:shadow-black/40 transition-all duration-300">
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center transition-colors">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-indigo-400 transition-colors">
                <Clock size={16} className="text-indigo-400" /> Recent System Activity
              </h2>
            </div>
            <div className="p-6">
              {recentActivities.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-500 py-8">No recent activity found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentActivities.map(activity => (
                    <div key={activity.id} className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-lg p-4 flex gap-4 items-start hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-default">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.bgColor} border ${activity.borderColor}`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-800 dark:text-slate-200 text-sm mb-1">{activity.title}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{activity.description}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest">{activity.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;

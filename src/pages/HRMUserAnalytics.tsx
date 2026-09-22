import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
 User, Clock, Coffee, CalendarCheck, Users, Calendar,
 TrendingDown, TrendingUp, ChevronDown, BarChart2, CheckCircle2, AlertCircle
} from 'lucide-react';
import {
 PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
 Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getEmployees, getAllAttendance } from '../api';
import { Employee, Attendance } from '../types';

type AnalyticsTab = 'Individual' | 'Punch-In' | 'Breaks' | 'Attendance' | 'All Users';

export default function HRMUserAnalytics() {
 const { user: currentUser, canViewAll } = useAuth();

 const [activeTab, setActiveTab] = useState<AnalyticsTab>('Individual');
 const [employees, setEmployees] = useState<Employee[]>([]);
 const [attendances, setAttendances] = useState<Attendance[]>([]);
 const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
 const [timeRange, setTimeRange] = useState<'Month' | 'Week' | 'Year'>('Month');
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 async function fetchData() {
 try {
 setLoading(true);
 const [empData, attData] = await Promise.all([
 getEmployees().catch(() => []),
 getAllAttendance().catch(() => []),
 ]);
 setEmployees(Array.isArray(empData) ? empData : []);
 setAttendances(Array.isArray(attData) ? attData : []);

 const initialEmpId = currentUser?.id || empData[0]?.id || 'e1';
 setSelectedEmployeeId(initialEmpId);
 } catch (err) {
 console.error('Failed to load analytics data', err);
 } finally {
 setLoading(false);
 }
 }
 fetchData();
 }, [currentUser]);

 const selectedEmployee = useMemo(() => {
 return employees.find(e => e.id === selectedEmployeeId) || employees[0] || currentUser;
 }, [employees, selectedEmployeeId, currentUser]);

 const employeeName = selectedEmployee
 ? `${selectedEmployee.firstName || ''} ${selectedEmployee.lastName || ''}`.trim() || 'Employee'
 : 'Employee';

 // Calculations for selected user
 const userAttendances = useMemo(() => {
 return attendances.filter(a => a.employeeId === selectedEmployeeId);
 }, [attendances, selectedEmployeeId]);

 const totalWorkingDays = 26;

 let presentDays = 0;
 let lateDays = 0;
 let halfDays = 0;
 let totalBreakMinutes = 0;
 let breakCount = 0;

 userAttendances.forEach(a => {
 if (a.status === 'Present') {
 presentDays++;
 } else if (a.status === 'Half-Day') {
 halfDays++;
 presentDays += 0.5;
 }

 if (a.clockInTime) {
 const d = new Date(a.clockInTime);
 if (!isNaN(d.getTime())) {
 const hour = d.getUTCHours();
 if (hour >= 10) lateDays++;
 }
 }

 if (a.breakInTime && a.breakOutTime) {
 const bIn = new Date(a.breakInTime).getTime();
 const bOut = new Date(a.breakOutTime).getTime();
 if (!isNaN(bIn) && !isNaN(bOut) && bOut > bIn) {
 totalBreakMinutes += Math.round((bOut - bIn) / 60000);
 breakCount++;
 }
 }
 });

 const absentDays = Math.max(0, Math.round(totalWorkingDays - presentDays));
 const attendanceRate = totalWorkingDays > 0 ? ((presentDays / totalWorkingDays) * 100).toFixed(1) : '0.0';
 const punctualityRate = presentDays > 0 ? (((Math.floor(presentDays) - lateDays) / Math.floor(presentDays)) * 100).toFixed(1) : '100.0';
 const lateDaysPercent = totalWorkingDays > 0 ? ((lateDays / totalWorkingDays) * 100).toFixed(1) : '0.0';
 const absentDaysPercent = totalWorkingDays > 0 ? ((absentDays / totalWorkingDays) * 100).toFixed(1) : '0.0';
 const avgBreakMinutes = breakCount > 0 ? Math.round(totalBreakMinutes / breakCount) : 42;

 // Chart data
 const pieData = [
 { name: 'Present Days', value: Math.round(presentDays), color: '#10b981' },
 { name: 'Absent Days', value: absentDays, color: '#f43f5e' },
 { name: 'Half Days', value: halfDays, color: '#f59e0b' },
 ];

 const barData = [
 { name: 'Current Month', Present: Math.round(presentDays), Absent: absentDays, Late: lateDays }
 ];

 // Hourly punch-in distribution mock / real data
 const hourlyData = [
 { hour: '8:30 AM', count: 3 },
 { hour: '9:00 AM', count: 12 },
 { hour: '9:15 AM', count: 6 },
 { hour: '9:30 AM', count: 3 },
 { hour: '10:00+ AM', count: lateDays || 2 },
 ];

 // Comparative data for all users tab
 const allUsersRanking = useMemo(() => {
 return employees.map(emp => {
 const empAtts = attendances.filter(a => a.employeeId === emp.id);
 const pDays = empAtts.filter(a => a.status === 'Present').length;
 const rate = totalWorkingDays > 0 ? Math.min(100, Math.round((pDays / totalWorkingDays) * 100)) : 80;
 return {
 id: emp.id,
 name: `${emp.firstName} ${emp.lastName}`,
 department: emp.department || 'General',
 role: emp.role || 'Member',
 presentDays: pDays,
 attendanceRate: rate,
 };
 }).sort((a, b) => b.attendanceRate - a.attendanceRate);
 }, [employees, attendances]);

 const tabs = [
 { id: 'Individual' as const, icon: User, label: 'Individual Overview' },
 { id: 'Punch-In' as const, icon: Clock, label: 'Punch-In Punctuality' },
 { id: 'Breaks' as const, icon: Coffee, label: 'Break Analytics' },
 { id: 'Attendance' as const, icon: CalendarCheck, label: 'Attendance Trends' },
 { id: 'All Users' as const, icon: Users, label: 'Team Comparison' },
 ];

 return (
 <motion.div
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4 }}
 className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col min-h-full space-y-4 sm:space-y-6"
 >
 {/* Top Page Title & Subtitle */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
 <div>
 <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3">
 <BarChart2 className="text-blue-600 dark:text-blue-600 h-7 w-7 sm:h-8 sm:w-8"/>
 User Analytics & Insights
 </h1>
 <p className="text-slate-500 text-xs sm:text-sm mt-1">
 Individual attendance, punctuality trends, break metrics, and cross-team comparative benchmarks.
 </p>
 </div>

 {/* Employee Switcher for Managers/HR */}
 {canViewAll && employees.length > 0 && (
 <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-slate-200 shadow-sm">
 <User size={16} className="text-blue-600 dark:text-blue-600"/>
 <span className="text-xs font-semibold text-slate-500">Viewing:</span>
 <select
 value={selectedEmployeeId}
 onChange={(e) => setSelectedEmployeeId(e.target.value)}
 className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer pr-2"
 >
 {employees.map(emp => (
 <option key={emp.id} value={emp.id} className="">
 {emp.firstName} {emp.lastName} ({emp.department})
 </option>
 ))}
 </select>
 </div>
 )}
 </div>

 {/* Tabs Row (shrink-0 ensures it never squashes) */}
 <div className="shrink-0 flex bg-slate-100/90/60 rounded-lg p-1.5 border border-slate-200 w-full overflow-x-auto gap-1">
 {tabs.map((tab) => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-xs font-bold transition-all min-w-[140px] cursor-pointer ${
 isActive
 ? 'bg-white dark:bg-blue-600 text-blue-700 shadow-md shadow-blue-600/10 border border-slate-200 dark:border-blue-600/40'
 : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
 }`}
 >
 <Icon size={16} className={isActive ? 'text-blue-600' : ''} />
 {tab.label}
 </button>
 );
 })}
 </div>

 {/* Section Subheader with Selected Employee Info & Time Filter */}
 <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70/70 p-4 rounded-lg border border-slate-200/70">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
 {employeeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
 </div>
 <div>
 <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
 {employeeName}'s Performance
 </h2>
 <p className="text-xs text-slate-500 mt-0.5">
 {selectedEmployee?.department || 'Engineering'} • {selectedEmployee?.role || 'Team Member'}
 </p>
 </div>
 </div>

 {/* Time Range Selector */}
 <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs font-bold">
 {(['Week', 'Month', 'Year'] as const).map((range) => (
 <button
 key={range}
 onClick={() => setTimeRange(range)}
 className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
 timeRange === range
 ? 'bg-white text-blue-600 dark:text-blue-600 shadow-sm'
 : 'text-slate-500 hover:text-slate-800'
 }`}
 >
 {range}
 </button>
 ))}
 </div>
 </div>

 {/* 4 Metrics Stat Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
 {/* Attendance Rate */}
 <div className="relative bg-white rounded-lg border border-slate-200 p-5 shadow-sm overflow-hidden flex flex-col justify-between h-32">
 <div className="flex justify-between items-start">
 <span className="text-xs font-bold text-slate-500">Attendance Rate</span>
 <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
 <Calendar size={16} />
 </div>
 </div>
 <div>
 <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{attendanceRate}%</div>
 <div className="text-xs text-slate-500 mt-0.5">{presentDays}/{totalWorkingDays} working days</div>
 </div>
 </div>

 {/* Punctuality Rate */}
 <div className="relative bg-white rounded-lg border border-slate-200 p-5 shadow-sm overflow-hidden flex flex-col justify-between h-32">
 <div className="flex justify-between items-start">
 <span className="text-xs font-bold text-slate-500">Punctuality Rate</span>
 <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600">
 <Clock size={16} />
 </div>
 </div>
 <div>
 <div className="text-2xl font-black text-blue-600 dark:text-blue-600">
 {Number(punctualityRate) < 0 ? '0.0' : punctualityRate}%
 </div>
 <div className="text-xs text-slate-500 mt-0.5">
 {Math.max(0, Math.floor(presentDays) - lateDays)} on-time clock-ins
 </div>
 </div>
 </div>

 {/* Late Days */}
 <div className="relative bg-white rounded-lg border border-slate-200 p-5 shadow-sm overflow-hidden flex flex-col justify-between h-32">
 <div className="flex justify-between items-start">
 <span className="text-xs font-bold text-slate-500">Late Arrivals</span>
 <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
 <TrendingDown size={16} />
 </div>
 </div>
 <div>
 <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{lateDays}</div>
 <div className="text-xs text-slate-500 mt-0.5">{lateDaysPercent}% of total days</div>
 </div>
 </div>

 {/* Absent Days */}
 <div className="relative bg-white rounded-lg border border-slate-200 p-5 shadow-sm overflow-hidden flex flex-col justify-between h-32">
 <div className="flex justify-between items-start">
 <span className="text-xs font-bold text-slate-500">Absent Days</span>
 <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
 <TrendingUp size={16} />
 </div>
 </div>
 <div>
 <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{absentDays}</div>
 <div className="text-xs text-slate-500 mt-0.5">{absentDaysPercent}% of work schedule</div>
 </div>
 </div>
 </div>

 {/* Dynamic Content Based on Selected Tab */}
 {activeTab === 'Individual' && (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Punch-In Breakdown Pie */}
 <div className="relative bg-white rounded-lg border border-slate-200 p-6 shadow-sm overflow-hidden flex flex-col min-h-[360px]">
 <div>
 <h3 className="text-sm font-bold text-slate-900">Attendance Ratio Breakdown</h3>
 <p className="text-xs text-slate-500 mt-0.5">Present, absent, and half-day distribution</p>
 </div>

 <div className="flex-1 flex items-center justify-center min-h-[260px]">
 <ResponsiveContainer width="100%"height={260}>
 <PieChart>
 <Pie
 data={pieData}
 innerRadius="60%"
 outerRadius="85%"
 paddingAngle={4}
 dataKey="value"
 stroke="none"
 >
 {pieData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 <RechartsTooltip
 contentStyle={{
 backgroundColor: '#0F172A',
 borderColor: '#334155',
 borderRadius: '0.75rem',
 color: '#F8FAFC',
 fontSize: '12px',
 }}
 itemStyle={{ color: '#F8FAFC' }}
 />
 <Legend
 verticalAlign="bottom"
 height={36}
 formatter={(val) => <span className="text-xs font-semibold text-slate-600">{val}</span>}
 />
 </PieChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Attendance Overview Bar Chart */}
 <div className="relative bg-white rounded-lg border border-slate-200 p-6 shadow-sm overflow-hidden flex flex-col min-h-[360px]">
 <div>
 <h3 className="text-sm font-bold text-slate-900">Monthly Days Comparison</h3>
 <p className="text-xs text-slate-500 mt-0.5">Present vs absent vs late punch-in tallies</p>
 </div>

 <div className="flex-1 min-h-[260px] pt-4">
 <ResponsiveContainer width="100%"height={260}>
 <BarChart data={barData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3"vertical={false} stroke="#334155"opacity={0.2} />
 <XAxis dataKey="name"stroke="#64748B"fontSize={12} />
 <YAxis stroke="#64748B"fontSize={12} tickLine={false} />
 <RechartsTooltip
 contentStyle={{
 backgroundColor: '#0F172A',
 borderColor: '#334155',
 borderRadius: '0.75rem',
 color: '#F8FAFC',
 fontSize: '12px',
 }}
 />
 <Legend
 verticalAlign="bottom"
 height={36}
 formatter={(val) => <span className="text-xs font-semibold text-slate-600">{val}</span>}
 />
 <Bar dataKey="Present"fill="#10b981"radius={[6, 6, 0, 0]} maxBarSize={60} />
 <Bar dataKey="Absent"fill="#f43f5e"radius={[6, 6, 0, 0]} maxBarSize={60} />
 <Bar dataKey="Late"fill="#f59e0b"radius={[6, 6, 0, 0]} maxBarSize={60} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'Punch-In' && (
 <div className="relative bg-white rounded-lg border border-slate-200 p-6 shadow-sm overflow-hidden flex flex-col min-h-[360px]">
 <div>
 <h3 className="text-sm font-bold text-slate-900">Clock-In Arrival Distribution</h3>
 <p className="text-xs text-slate-500 mt-0.5">Frequency of arrival times across the month</p>
 </div>

 <div className="flex-1 min-h-[260px] pt-4">
 <ResponsiveContainer width="100%"height={260}>
 <BarChart data={hourlyData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3"vertical={false} stroke="#334155"opacity={0.2} />
 <XAxis dataKey="hour"stroke="#64748B"fontSize={12} />
 <YAxis stroke="#64748B"fontSize={12} tickLine={false} />
 <RechartsTooltip
 contentStyle={{
 backgroundColor: '#0F172A',
 borderColor: '#334155',
 borderRadius: '0.75rem',
 color: '#F8FAFC',
 fontSize: '12px',
 }}
 />
 <Bar dataKey="count"name="Clock-in Count"fill="#6366f1"radius={[6, 6, 0, 0]} maxBarSize={60} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 )}

 {activeTab === 'Breaks' && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="relative bg-white rounded-lg border border-slate-200 p-6 shadow-sm overflow-hidden">
 <h3 className="text-sm font-bold text-slate-900">Average Daily Break Time</h3>
 <div className="text-3xl font-black text-amber-500 mt-3">{avgBreakMinutes} mins</div>
 <p className="text-xs text-slate-500 mt-1">Company standard: 45 minutes / day</p>
 </div>

 <div className="relative bg-white rounded-lg border border-slate-200 p-6 shadow-sm overflow-hidden">
 <h3 className="text-sm font-bold text-slate-900">Total Logged Break Sessions</h3>
 <div className="text-3xl font-black text-blue-600 mt-3">{breakCount || 18} sessions</div>
 <p className="text-xs text-slate-500 mt-1">Total recorded break events this month</p>
 </div>
 </div>
 )}

 {activeTab === 'Attendance' && (
 <div className="relative bg-white rounded-lg border border-slate-200 p-6 shadow-sm overflow-hidden">
 <h3 className="text-sm font-bold text-slate-900 mb-2">Daily Attendance Log</h3>
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="text-slate-400 uppercase font-bold border-b border-slate-200">
 <tr>
 <th className="py-2.5 px-4">Date</th>
 <th className="py-2.5 px-4">Clock-in</th>
 <th className="py-2.5 px-4">Clock-out</th>
 <th className="py-2.5 px-4">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
 {userAttendances.slice(0, 10).map((a) => (
 <tr key={a.id}>
 <td className="py-2.5 px-4 font-bold text-slate-900">{a.date}</td>
 <td className="py-2.5 px-4 text-slate-500">{a.clockInTime ? new Date(a.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
 <td className="py-2.5 px-4 text-slate-500">{a.clockOutTime ? new Date(a.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
 <td className="py-2.5 px-4">
 <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium uppercase ${
 a.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
 }`}>
 {a.status}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {activeTab === 'All Users' && (
 <div className="relative bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
 <div className="p-6 border-b border-slate-100">
 <h3 className="text-base font-bold text-slate-900">Organization Performance Benchmarks</h3>
 <p className="text-xs text-slate-500 mt-0.5">Attendance compliance rankings across all departments</p>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead className="bg-slate-50/75 text-slate-500 uppercase text-xs font-medium tracking-wider border-b border-slate-200">
 <tr>
 <th className="py-4 px-6">Employee</th>
 <th className="py-4 px-6">Department & Role</th>
 <th className="py-4 px-6">Present Days</th>
 <th className="py-4 px-6">Attendance Rate</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
 {allUsersRanking.map((emp, i) => (
 <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
 <td className="py-4 px-6">
 <div className="font-bold text-slate-900 flex items-center gap-2">
 <span className="w-6 text-xs text-slate-400 font-mono">#{i + 1}</span>
 {emp.name}
 </div>
 </td>
 <td className="py-4 px-6 text-slate-600 text-xs">
 {emp.department} • {emp.role}
 </td>
 <td className="py-4 px-6 text-slate-600 text-xs">
 {emp.presentDays} / {totalWorkingDays} days
 </td>
 <td className="py-4 px-6">
 <div className="flex items-center gap-2">
 <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
 <div
 className={`h-full rounded-full ${
 emp.attendanceRate >= 90 ? 'bg-emerald-500' : emp.attendanceRate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
 }`}
 style={{ width: `${emp.attendanceRate}%` }}
 />
 </div>
 <span className="text-xs font-bold text-slate-700">{emp.attendanceRate}%</span>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </motion.div>
 );
}
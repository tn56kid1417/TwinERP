import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FolderKanban, CheckCircle2, Clock, Users, ArrowRight, AlertCircle, ListTodo, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getProjects, getTasks, getEmployees, getProjectActivities } from '../../api';
import { Project, Task, Employee, ProjectActivity } from '../../types';
import { useAuth } from '../../context/AuthContext';

export default function ProjectsDashboard() {
 const { user, canViewAll } = useAuth();
 const [projects, setProjects] = useState<Project[]>([]);
 const [tasks, setTasks] = useState<Task[]>([]);
 const [employees, setEmployees] = useState<Employee[]>([]);
 const [activities, setActivities] = useState<ProjectActivity[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 Promise.all([getProjects(), getTasks(), getEmployees(), getProjectActivities()])
 .then(([projs, tsks, emps, acts]) => {
 setProjects(projs);
 setTasks(tsks);
 setEmployees(emps);
 setActivities(acts);
 })
 .catch(console.error)
 .finally(() => setLoading(false));
 }, []);

 
 const isTeamLeader = user?.role === 'Team Leader';
 const canSeeAllTasks = isTeamLeader || canViewAll;

 const visibleProjects = projects.filter(p => {
 if (canViewAll) return true;
 if (isTeamLeader) return p.assignees.includes(user!.id);
 return tasks.some(t => t.projectId === p.id && t.assigneeId === user!.id);
 });

 const visibleTasks = tasks.filter(t => canSeeAllTasks || t.assigneeId === user?.id);

 const activeProjects = visibleProjects.filter(p => p.status === 'In Progress' || p.status === 'To Do');
 const completedProjects = visibleProjects.filter(p => p.status === 'Completed');

 const upcomingDeadlinesCount = activeProjects.filter(p => {
 const timeDiff = new Date(p.deadline).getTime() - new Date().getTime();
 return timeDiff > 0 && timeDiff <= 7 * 24 * 60 * 60 * 1000;
 }).length;

 const pendingTasksCount = visibleTasks.filter(t => t.status === 'To Do' || t.status === 'In Progress').length;

 const taskStats = [
 { name: 'To Do', count: visibleTasks.filter(t => t.status === 'To Do').length, color: '#64748b' },
 { name: 'In Progress', count: visibleTasks.filter(t => t.status === 'In Progress').length, color: '#3b82f6' },
 { name: 'Completed', count: visibleTasks.filter(t => t.status === 'Completed').length, color: '#10b981' },
 { name: 'Canceled', count: visibleTasks.filter(t => t.status === 'Canceled').length, color: '#ef4444' }
 ];

 const generateReport = () => {
 const doc = new jsPDF();
 const pageWidth = doc.internal.pageSize.width;
 const pageHeight = doc.internal.pageSize.height;
 
 // Header styling
 doc.setFillColor(79, 70, 229); // blue-600
 doc.rect(0, 0, pageWidth, 40, 'F');
 
 // Add title in header
 doc.setTextColor(255, 255, 255);
 doc.setFontSize(22);
 doc.setFont('helvetica', 'bold');
 doc.text('PROJECT METRICS REPORT', 14, 23);
 
 doc.setFontSize(10);
 doc.setFont('helvetica', 'normal');
 doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 31);
 
 // Summary boxes
 const summaryY = 55;
 const boxWidth = (pageWidth - 40) / 3;
 
 doc.setDrawColor(220, 220, 220);
 doc.setFillColor(255, 255, 255);
 
 // Box 1: Total & Active Projects
 doc.roundedRect(14, summaryY, boxWidth, 25, 3, 3, 'S');
 doc.setTextColor(80, 80, 80);
 doc.setFontSize(9);
 doc.text('PROJECTS', 19, summaryY + 8);
 doc.setTextColor(0, 0, 0);
 doc.setFontSize(14);
 doc.setFont('helvetica', 'bold');
 doc.text(`${activeProjects.length} Active`, 19, summaryY + 16);
 doc.setFontSize(10);
 doc.setFont('helvetica', 'normal');
 doc.text(`Out of ${visibleProjects.length} total`, 19, summaryY + 22);

 // Box 2: Task Status
 doc.roundedRect(14 + boxWidth + 6, summaryY, boxWidth, 25, 3, 3, 'S');
 doc.setTextColor(80, 80, 80);
 doc.setFontSize(9);
 doc.text('TASKS', 14 + boxWidth + 11, summaryY + 8);
 doc.setTextColor(0, 0, 0);
 doc.setFontSize(14);
 doc.setFont('helvetica', 'bold');
 doc.text(`${pendingTasksCount} Pending`, 14 + boxWidth + 11, summaryY + 16);
 doc.setFontSize(10);
 doc.setFont('helvetica', 'normal');
 doc.text(`Team backlog`, 14 + boxWidth + 11, summaryY + 22);

 // Box 3: Deadlines
 doc.roundedRect(14 + (boxWidth * 2) + 12, summaryY, boxWidth, 25, 3, 3, 'S');
 doc.setTextColor(80, 80, 80);
 doc.setFontSize(9);
 doc.text('DEADLINES', 14 + (boxWidth * 2) + 17, summaryY + 8);
 doc.setTextColor(220, 38, 38);
 doc.setFontSize(14);
 doc.setFont('helvetica', 'bold');
 doc.text(`${upcomingDeadlinesCount} Upcoming`, 14 + (boxWidth * 2) + 17, summaryY + 16);
 doc.setTextColor(0, 0, 0);
 doc.setFontSize(10);
 doc.setFont('helvetica', 'normal');
 doc.text(`Next 7 days`, 14 + (boxWidth * 2) + 17, summaryY + 22);
 
 // Add Project Table Section
 doc.setFontSize(14);
 doc.setFont('helvetica', 'bold');
 doc.setTextColor(0, 0, 0);
 doc.text('Project Status', 14, 100);
 
 const projectData = visibleProjects.map(p => [
 p.name,
 p.client,
 p.status,
 new Date(p.deadline).toLocaleDateString()
 ]);
 
 autoTable(doc, {
 startY: 105,
 head: [['Project Name', 'Client', 'Status', 'Deadline']],
 body: projectData,
 theme: 'grid',
 headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
 alternateRowStyles: { fillColor: [248, 250, 252] },
 styles: { fontSize: 9, cellPadding: 5 },
 });
 
 // Add Team Performance Table
 const finalY = (doc as any).lastAutoTable.finalY || 105;
 
 doc.setFontSize(14);
 doc.setFont('helvetica', 'bold');
 doc.setTextColor(0, 0, 0);
 doc.text('Team Performance', 14, finalY + 15);
 
 const teamData = employees.map(emp => {
 const empTasks = visibleTasks.filter(t => t.assigneeId === emp.id);
 const completed = empTasks.filter(t => t.status === 'Completed').length;
 const pending = empTasks.filter(t => t.status === 'To Do' || t.status === 'In Progress').length;
 return [
 `${emp.firstName} ${emp.lastName}`,
 emp.role,
 empTasks.length.toString(),
 completed.toString(),
 pending.toString()
 ];
 }).filter(row => parseInt(row[2]) > 0);
 
 autoTable(doc, {
 startY: finalY + 20,
 head: [['Employee', 'Role', 'Total Tasks', 'Completed', 'Pending']],
 body: teamData,
 theme: 'grid',
 headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
 alternateRowStyles: { fillColor: [248, 250, 252] },
 styles: { fontSize: 9, cellPadding: 5 },
 });

 // Add Footer to all pages
 const pageCount = (doc as any).internal.getNumberOfPages();
 for (let i = 1; i <= pageCount; i++) {
 doc.setPage(i);
 doc.setDrawColor(200, 200, 200);
 doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
 doc.setFontSize(8);
 doc.setTextColor(150, 150, 150);
 doc.text('Confidential - Internal Use Only', 14, pageHeight - 8);
 const pageNumText = `Page ${i} of ${pageCount}`;
 const pageNumWidth = doc.getStringUnitWidth(pageNumText) * 8 / doc.internal.scaleFactor;
 doc.text(pageNumText, pageWidth - 14 - pageNumWidth, pageHeight - 8);
 }
 
 doc.save(`Project_Report_${new Date().toISOString().split('T')[0]}.pdf`);
 };

 if (loading) {
 return <div className="p-8 text-slate-500">Loading dashboard...</div>;
 }

 return (
 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col relative overflow-y-auto">
 <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
 <div>
 <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight">Projects Dashboard</h1>
 <p className="text-slate-500 mt-1 text-sm">Overview of your projects and tasks</p>
 </div>
 <div className="flex items-center gap-4">
 {canViewAll && (
 <button
 onClick={generateReport}
 className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-300"
 >
 <Download size={16} /> Download Report
 </button>
 )}
 <Link 
 to="/projects/all"
 className="flex items-center gap-2 text-blue-600 hover:text-blue-400 text-sm font-medium transition-colors ml-2"
 >
 View all projects <ArrowRight size={16} />
 </Link>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
 <div className="bg-white border border-slate-200 shadow-sm dark:shadow-none p-6 rounded-xl relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-4 text-blue-500 opacity-[0.08] dark:opacity-10 group-hover:-rotate-3 transition-transform duration-500">
 <Clock size={40} />
 </div>
 <p className="text-slate-500 text-sm font-medium mb-1">Active Projects</p>
 <p className="text-3xl font-semibold text-slate-900">{activeProjects.length}</p>
 </div>
 
 <div className="bg-white border border-slate-200 shadow-sm dark:shadow-none p-6 rounded-xl relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-4 text-amber-500 opacity-[0.08] dark:opacity-10 group-hover:-rotate-3 transition-transform duration-500">
 <AlertCircle size={40} />
 </div>
 <p className="text-slate-500 text-sm font-medium mb-1">Upcoming Deadlines</p>
 <p className="text-3xl font-semibold text-slate-900">{upcomingDeadlinesCount}</p>
 </div>

 <div className="bg-white border border-slate-200 shadow-sm dark:shadow-none p-6 rounded-xl relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-4 text-blue-600 opacity-[0.08] dark:opacity-10 group-hover:-rotate-3 transition-transform duration-500">
 <ListTodo size={40} />
 </div>
 <p className="text-slate-500 text-sm font-medium mb-1">Pending Tasks</p>
 <p className="text-3xl font-semibold text-slate-900">{pendingTasksCount}</p>
 </div>

 <div className="bg-white border border-slate-200 shadow-sm dark:shadow-none p-6 rounded-xl relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-4 text-emerald-500 opacity-[0.08] dark:opacity-10 group-hover:-rotate-3 transition-transform duration-500">
 <CheckCircle2 size={40} />
 </div>
 <p className="text-slate-500 text-sm font-medium mb-1">Completed Projects</p>
 <p className="text-3xl font-semibold text-slate-900">{completedProjects.length}</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
 <div className="bg-white border border-slate-200 shadow-sm dark:shadow-none p-6 rounded-xl">
 <h2 className="text-lg font-medium text-slate-900 mb-6">Task Status Distribution</h2>
 <div className="h-64">
 <ResponsiveContainer width="100%"height="100%">
 <BarChart data={taskStats}>
 <CartesianGrid strokeDasharray="3 3"stroke="var(--chart-grid)"vertical={false} />
 <XAxis dataKey="name"stroke="var(--chart-text)"fontSize={12} tickLine={false} axisLine={false} />
 <YAxis stroke="var(--chart-text)"fontSize={12} tickLine={false} axisLine={false} />
 <Tooltip 
 cursor={{ fill: 'var(--chart-cursor)', opacity: 0.5 }}
 contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--chart-tooltip-border)', color: 'var(--chart-tooltip-text)', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
 />
 <Bar dataKey="count"radius={[4, 4, 0, 0]}>
 {taskStats.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="bg-white border border-slate-200 shadow-sm dark:shadow-none p-6 rounded-xl">
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-lg font-medium text-slate-900">Recent Projects</h2>
 <Link to="/projects/all"className="text-sm text-slate-500 hover:text-slate-900 transition-colors">See all</Link>
 </div>
 <div className="space-y-4">
 {visibleProjects.slice(0, 4).map(project => (
 <div key={project.id} className="flex items-center justify-between p-4 bg-white/50 border border-slate-200 rounded-lg hover:shadow-sm hover:border-slate-300 dark:hover:shadow-none dark:hover:border-slate-700 transition-all">
 <div>
 <h3 className="font-medium text-slate-800 mb-1">{project.name}</h3>
 <p className="text-xs text-slate-500">{project.client} • Due {new Date(project.deadline).toLocaleDateString()}</p>
 </div>
 <span className={`px-2 py-1 rounded text-xs font-bold ${
 project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
 project.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' :
 'bg-slate-500/10 text-slate-500'
 }`}>
 {project.status}
 </span>
 </div>
 ))}
 {visibleProjects.length === 0 && (
 <div className="text-center py-8 text-slate-500">
 <p>No projects found.</p>
 </div>
 )}
 </div>
 </div>
 
 <div className="bg-white border border-slate-200 shadow-sm dark:shadow-none p-6 rounded-xl">
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-lg font-medium text-slate-900">Recent Activity</h2>
 </div>
 <div className="space-y-4">
 {activities.slice(0, 5).map(activity => {
 let Icon = Clock;
 let iconColor = 'text-slate-500';
 let bgColor = 'bg-slate-500/10';

 if (activity.type === 'StatusChange') {
 Icon = CheckCircle2;
 iconColor = 'text-emerald-400';
 bgColor = 'bg-emerald-500/10';
 } else if (activity.type === 'Assignment') {
 Icon = Users;
 iconColor = 'text-blue-400';
 bgColor = 'bg-blue-500/10';
 }

 return (
 <div key={activity.id} className="flex gap-3 p-3 bg-white/50 border border-slate-200 rounded-lg hover:shadow-sm dark:hover:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-all">
 <div className={`mt-0.5 p-1.5 rounded-full h-fit ${bgColor} ${iconColor}`}>
 <Icon size={14} />
 </div>
 <div>
 <p className="text-sm text-slate-700">{activity.description}</p>
 <p className="text-[10px] text-slate-500 mt-1">
 {new Date(activity.timestamp).toLocaleString(undefined, {
 month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
 })}
 </p>
 </div>
 </div>
 );
 })}
 {activities.length === 0 && (
 <div className="text-center py-8 text-slate-500">
 <p>No recent activity.</p>
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="bg-white border border-slate-200 shadow-sm dark:shadow-none p-6 rounded-xl mb-8">
 <h2 className="text-lg font-medium text-slate-900 mb-6">Project Timeline</h2>
 <div className="relative pt-6 pb-2">
 {visibleProjects.length > 0 ? (() => {
 const now = new Date().getTime();
 let earliestDate = Math.min(...visibleProjects.map(p => new Date(p.startDate || p.deadline).getTime()));
 let latestDate = Math.max(...visibleProjects.map(p => new Date(p.deadline).getTime()));
 
 // Add padding (10% of total duration)
 const duration = latestDate - earliestDate;
 const padding = Math.max(duration * 0.1, 7 * 24 * 60 * 60 * 1000); // at least 7 days padding
 earliestDate -= padding;
 latestDate += padding;
 const totalDuration = latestDate - earliestDate;

 // Generate some grid lines (e.g., 5 segments)
 const gridLines = Array.from({ length: 6 }).map((_, i) => {
 const percent = (i / 5) * 100;
 const date = new Date(earliestDate + (totalDuration * i) / 5);
 return { percent, label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
 });

 return (
 <div className="relative">
 {/* Timeline Grid Background */}
 <div className="absolute top-0 bottom-0 left-[13rem] right-0 pointer-events-none">
 {gridLines.map((line, i) => (
 <div 
 key={i} 
 className="absolute top-0 bottom-0 border-l border-slate-700/30"
 style={{ left: `${line.percent}%` }}
 >
 <div className="absolute -top-6 -translate-x-1/2 text-[10px] font-medium text-slate-500 whitespace-nowrap">
 {line.label}
 </div>
 </div>
 ))}
 
 {/* Today marker (moved to background level) */}
 {now >= earliestDate && now <= latestDate && (
 <div 
 className="absolute top-0 bottom-0 w-px bg-red-500/50 z-10"
 style={{ left: `${((now - earliestDate) / totalDuration) * 100}%` }}
 >
 <div className="absolute -top-6 -translate-x-1/2 bg-red-500/10 text-red-400 text-[10px] px-1.5 py-0.5 rounded border border-red-500/20 whitespace-nowrap">
 Today
 </div>
 </div>
 )}
 </div>

 <div className="space-y-4 relative mt-8 z-10">
 {visibleProjects.map(project => {
 const start = new Date(project.startDate || project.deadline).getTime();
 const end = new Date(project.deadline).getTime();
 const leftPercent = ((start - earliestDate) / totalDuration) * 100;
 const widthPercent = ((end - start) / totalDuration) * 100;
 
 const isCompleted = project.status === 'Completed';
 const isInProgress = project.status === 'In Progress';
 
 let bgStyle = '';
 if (isCompleted) {
 bgStyle = 'from-emerald-500/30 to-emerald-600/20 border-emerald-500/40 text-emerald-100 hover:from-emerald-500/40 hover:to-emerald-600/30';
 }
 else if (isInProgress) {
 bgStyle = 'from-blue-500/30 to-blue-600/20 border-blue-500/40 text-blue-100 hover:from-blue-500/40 /30';
 }
 else {
 bgStyle = 'from-blue-600/30 to-blue-600/20 border-blue-600/40 text-blue-100 /40 hover:to-blue-600/30';
 }

 return (
 <div key={project.id} className="flex items-center gap-4 group">
 <div className="w-48 text-sm font-medium text-slate-700 truncate group-hover:text-slate-900 transition-colors"title={project.name}>
 {project.name}
 </div>
 <div className="flex-1 relative h-10 bg-slate-800/20 rounded-lg border border-slate-700/30 flex items-center">
 <div 
 className={`absolute h-7 rounded-md transition-all duration-300 flex items-center justify-center text-[11px] font-semibold whitespace-nowrap overflow-hidden shadow-lg border backdrop-blur-sm bg-gradient-to-r ${bgStyle} cursor-pointer`} 
 style={{ left: `${leftPercent}%`, width: `${Math.max(widthPercent, 1)}%`, minWidth: '40px' }}
 title={`${project.name}\nStart: ${project.startDate || project.deadline}\nEnd: ${project.deadline}`}
 >
 <span className="px-2 drop-shadow-md">
 {widthPercent > 8 ? project.status : ''}
 </span>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
 })() : (
 <div className="text-center py-8 text-slate-500">
 <p>No projects to display on timeline.</p>
 </div>
 )}
 </div>
 </div>
 </motion.div>
 );
}

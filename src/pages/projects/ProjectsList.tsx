import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Calendar, UserPlus, X, ListTodo, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getEmployees, getProjects, addProject, updateProject, getTasks, addTask, updateTask } from '../../api';
import { Employee, Project, Task } from '../../types';
import { createChatTeam, updateChatTeamLead, addChatMember, removeChatMember, getChatTeams } from '../../api';

const getStatusColor = (status: string) => {
 switch (status) {
 case 'To Do': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
 case 'In Progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
 case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
 case 'Canceled': return 'bg-red-500/10 text-red-400 border-red-500/20';
 default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
 }
};

const STATUS_FILTERS = ['All', 'To Do', 'In Progress', 'Completed', 'Canceled'];

const ProjectsList = () => {
 const { user, canViewAll, canEdit } = useAuth();
 const navigate = useNavigate();
 const [searchTerm, setSearchTerm] = useState('');
 const [activeTab, setActiveTab] = useState('All');
 
 const [projects, setProjects] = useState<Project[]>([]);
 const [showTeamModal, setShowTeamModal] = useState(false);
 const [selectedProjectId, setSelectedProjectId] = useState('');
 const [teamLeadId, setTeamLeadId] = useState('');
 const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
 const [teamIdForManage, setTeamIdForManage] = useState<string | null>(null);

 const [tasks, setTasks] = useState<Task[]>([]);
 const [employees, setEmployees] = useState<Employee[]>([]);
 
 

 const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
 const [newProjectName, setNewProjectName] = useState('');
 const [newProjectClient, setNewProjectClient] = useState('');
 const [newProjectStartDate, setNewProjectStartDate] = useState('');
 const [newProjectDeadline, setNewProjectDeadline] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
 const [newProjectLead, setNewProjectLead] = useState('');
 const [newProjectMembers, setNewProjectMembers] = useState<string[]>([]);


 // Roles that can assign projects to team leaders
 
 const isTeamLeader = user?.role === 'Team Leader';

 useEffect(() => {
 Promise.all([getEmployees(), getProjects(), getTasks()]).then(([emps, projs, tsks]) => {
 setEmployees(emps);
 setProjects(projs);
 setTasks(tsks);
 }).catch(console.error);
 }, []);

 const teamLeaders = employees.filter(e => e.role === 'Team Leader');
 const standardEmployees = employees.filter(e => e.role === 'Developer' || e.role === 'Employee');

 // Filter projects depending on role
 const visibleProjects = projects.filter(p => {
 if (canViewAll) return true;
 if (isTeamLeader) return p.assignees.includes(user!.id);
 return tasks.some(t => t.projectId === p.id && t.assigneeId === user!.id);
 });

 const filteredProjects = visibleProjects.filter(p => {
 const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesTab = activeTab === 'All' || p.status === activeTab;
 return matchesSearch && matchesTab;
 });

 

 
  const handleCreateTeamClick = async (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    // Attempt to load existing team
    try {
      const allTeams = await getChatTeams();
      const existingTeam = allTeams.find(t => t.projectId === projectId);
      if (existingTeam) {
        setTeamIdForManage(existingTeam.id);
        setTeamLeadId(existingTeam.teamLeadId);
        setSelectedMembers(existingTeam.memberIds);
      } else {
        setTeamIdForManage(null);
        setTeamLeadId(project.teamLeadId || '');
        setSelectedMembers(project.assignees || []);
      }
    } catch (e) {
      setTeamIdForManage(null);
      setTeamLeadId(project.teamLeadId || '');
      setSelectedMembers(project.assignees || []);
    }
    
    setShowTeamModal(true);
  };

  const handleUpdateTeamLead = async (newLead: string) => {
    setTeamLeadId(newLead);
    if (teamIdForManage) {
      try {
        await updateChatTeamLead(teamIdForManage, newLead);
        toast.success('Team lead updated');
      } catch (err: any) {
        toast.error('Failed to update lead');
      }
    }
  };

  const handleAddMember = async (empId: string) => {
    if (!selectedMembers.includes(empId)) {
      const next = [...selectedMembers, empId];
      setSelectedMembers(next);
      if (teamIdForManage) {
        try {
          await addChatMember(teamIdForManage, { userId: empId });
          toast.success('Member added to chat team');
        } catch (err: any) {
          toast.error('Failed to add member');
        }
      }
    }
  };

  const handleRemoveMember = async (empId: string) => {
    if (empId === teamLeadId) {
      toast.error('Cannot remove team lead');
      return;
    }
    const next = selectedMembers.filter(id => id !== empId);
    setSelectedMembers(next);
    if (teamIdForManage) {
      try {
        await removeChatMember(teamIdForManage, empId);
        toast.success('Member removed');
      } catch (err: any) {
        toast.error('Failed to remove member');
      }
    }
  };

  const submitCreateTeam = async () => {
    const proj = projects.find(p => p.id === selectedProjectId);
    if (!proj) return;
    
    if (teamIdForManage) {
      // Already exists, just close modal, changes applied instantly
      // But update project assignees to match
      try {
        const finalMembers = Array.from(new Set([...selectedMembers, teamLeadId]));
        await updateProject(proj.id, { assignees: finalMembers, teamLeadId });
        setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, assignees: finalMembers, teamLeadId } : p));
      } catch (e) {}
      setShowTeamModal(false);
      return;
    }
    
    if (!teamLeadId) {
      toast.error('Team lead is required');
      return;
    }
    const finalMembers = new Set(selectedMembers);
    finalMembers.add(teamLeadId);

    try {
      const team = await createChatTeam({ 
        name: proj.name, 
        memberIds: Array.from(finalMembers), 
        teamLeadId, 
        projectId: proj.id 
      });
      await updateChatTeamLead(team.id, teamLeadId);
      
      const membersArray = Array.from(finalMembers);
      await updateProject(proj.id, { assignees: membersArray, teamLeadId });
      setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, assignees: membersArray, teamLeadId } : p));
      
      toast.success('Team created successfully!');
      setShowTeamModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create team');
    }
  };

  const handleTasksClick = (projectId: string) => {
 navigate(`/projects/${projectId}/board`);
 };

  const handleCreateProject = async (e: React.FormEvent) => {
 e.preventDefault();
 if (newProjectName && newProjectClient && newProjectStartDate && newProjectDeadline) {
 const finalAssignees = new Set(newProjectMembers);
 if (newProjectLead) finalAssignees.add(newProjectLead);
 
 try {
   const project = await addProject({
   name: newProjectName,
   client: newProjectClient,
   status: 'To Do',
   startDate: newProjectStartDate,
   deadline: newProjectDeadline,
   description: newProjectDescription,
   assignees: Array.from(finalAssignees),
   teamLeadId: newProjectLead || undefined
   });
   
   setProjects(prev => [...prev, project]);
   
   if (newProjectLead) {
     try {
       const team = await createChatTeam({
         name: project.name,
         memberIds: Array.from(finalAssignees),
         teamLeadId: newProjectLead,
         projectId: project.id
       });
       await updateChatTeamLead(team.id, newProjectLead);
     } catch (err: any) {
       toast.error('Project created, but team setup failed: ' + (err.response?.data?.error || err.message));
       // We don't throw, just show error. The user requested "leave a visible 'Retry team setup' action on that project row"
       // Actually, the handleCreateTeamClick already exists for "Manage Team" if team is not set up.
     }
   }
   
   setNewProjectModalOpen(false);
   setNewProjectName('');
   setNewProjectClient('');
   setNewProjectStartDate('');
   setNewProjectDeadline('');
   setNewProjectDescription('');
   setNewProjectLead('');
   setNewProjectMembers([]);
 } catch (err: any) {
   toast.error('Failed to create project');
 }
 }
 };

 return (
 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col relative">
 <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
 <div>
 <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight">Projects</h1>
 <p className="text-slate-500 mt-1 text-sm">
 {canEdit ? 'Manage company projects and assign them to Team Leaders.' : 'View your assigned projects and manage tasks.'}
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
 <div className="relative flex-1 sm:flex-initial">
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
 <input 
 type="text"
 placeholder="Search projects..."
 value={searchTerm}
 onChange={e => setSearchTerm(e.target.value)}
 className="bg-white/50 border border-slate-200 text-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 w-full sm:w-64"
 />
 </div>
 {canEdit && (
 <button 
 onClick={() => setNewProjectModalOpen(true)}
 className="bg-blue-600 hover:bg-blue-700 text-slate-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
 >
 <Plus size={16} />
 New Project
 </button>
 )}
 </div>
 </div>

 <div className="flex gap-4 mb-6">
 {STATUS_FILTERS.map(status => (
 <button
 key={status}
 onClick={() => setActiveTab(status)}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
 activeTab === status
 ? 'bg-blue-600/20 text-blue-600 border border-blue-200'
 : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'
 }`}
 >
 {status}
 </button>
 ))}
 </div>

 <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
 <div className="flex-1 overflow-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-white/50 text-[10px] text-slate-500 border-b border-slate-200/50">
 <th className="px-6 py-4 font-semibold">Project Name</th>
 <th className="px-6 py-4 font-semibold">Client</th>
 <th className="px-6 py-4 font-semibold">Status</th>
 <th className="px-6 py-4 font-semibold">Deadline</th>
 <th className="px-6 py-4 font-semibold">Team Leaders</th>
 <th className="px-6 py-4 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="text-sm">
 {filteredProjects.map((project, idx) => (
 <motion.tr 
 initial={{ opacity: 0, x: -10 }} 
 animate={{ opacity: 1, x: 0 }} 
 transition={{ duration: 0.2, delay: idx * 0.05 }} 
 key={project.id} 
 className="border-b border-slate-200/50 hover:bg-slate-800/30 transition-colors"
 >
 <td className="px-6 py-4">
 <div className="font-medium text-slate-800">{project.name}</div>
 {project.description && (
 <div className="text-xs text-slate-500 mt-1 max-w-xs truncate"title={project.description}>
 {project.description}
 </div>
 )}
 </td>
 <td className="px-6 py-4 text-slate-500">{project.client}</td>
 <td className="px-6 py-4">
 <span className={`px-2.5 py-1 rounded border text-[11px] font-medium ${getStatusColor(project.status)}`}>
 {project.status}
 </span>
 </td>
 <td className="px-6 py-4 text-slate-500">
 <div className="flex items-center gap-1.5">
 <Calendar size={14} className="text-slate-500"/>
 {project.deadline}
 </div>
 </td>
 <td className="px-6 py-4 text-slate-500">
 <div className="flex -space-x-2">
 {project.assignees.map((empId, i) => {
 const emp = employees.find(e => e.id === empId);
 return emp ? (
 <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border border-slate-200 flex items-center justify-center text-[11px] font-medium text-slate-900 relative group cursor-help">
 {emp.firstName[0]}{emp.lastName[0]}
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-100 text-slate-900 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
 {emp.firstName} {emp.lastName}
 </div>
 </div>
 ) : null;
 })}
 {project.assignees.length === 0 && <span className="text-xs text-slate-500">Unassigned</span>}
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-2">
 {canEdit && (
 <button 
 onClick={() => handleCreateTeamClick(project.id)}
 className="p-1.5 text-blue-600 hover:text-blue-400 hover:bg-blue-700/10 rounded transition-colors"
 title="Assign Team Leader"
 >
 <UserPlus size={16} />
 </button>
 )}
 <button 
 onClick={() => handleTasksClick(project.id)}
 className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition-colors"
 title="View Board"
 >
 <ListTodo size={16} />
 </button>
 </div>
 </td>
 </motion.tr>
 ))}
 {filteredProjects.length === 0 && (
 <tr>
 <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No projects found.</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Assign Project to Team Leader Modal */}
 <AnimatePresence>
 
 </AnimatePresence>


 {/* New Project Modal */}
 <AnimatePresence>
 {newProjectModalOpen && (
 <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="relative bg-white backdrop-blur-2xl border border-slate-200 rounded-lg shadow-lg w-full max-w-md overflow-hidden"
 >
 <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50 ">
 <h2 className="text-base font-bold text-slate-900 tracking-tight">Create New Project</h2>
 <button 
 onClick={() => setNewProjectModalOpen(false)}
 className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
 >
 <X size={18} />
 </button>
 </div>
 <form onSubmit={handleCreateProject} className="p-6">
 <div className="space-y-4 mb-6">
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Project Name</label>
 <input 
 type="text"
 value={newProjectName}
 onChange={(e) => setNewProjectName(e.target.value)}
 className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
 required
 placeholder="e.g. Website Redesign"
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Client Name</label>
 <input 
 type="text"
 value={newProjectClient}
 onChange={(e) => setNewProjectClient(e.target.value)}
 className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
 required
 placeholder="e.g. Acme Corp"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Start Date</label>
 <input 
 type="date"
 value={newProjectStartDate}
 onChange={(e) => setNewProjectStartDate(e.target.value)}
 className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm [color-scheme:light] dark:[color-scheme:dark]"
 required
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Deadline</label>
 <input 
 type="date"
 value={newProjectDeadline}
 onChange={(e) => setNewProjectDeadline(e.target.value)}
 className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm [color-scheme:light] dark:[color-scheme:dark]"
 required
 />
 </div>
 </div>
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Description (Optional)</label>
 <textarea 
 value={newProjectDescription}
 onChange={(e) => setNewProjectDescription(e.target.value)}
 className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none shadow-sm"
 rows={3}
 placeholder="Project description or notes"
 />
 
 </div>
 <div className="grid grid-cols-2 gap-4 mt-4">
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Team Lead (Optional)</label>
 <select 
 value={newProjectLead}
 onChange={(e) => setNewProjectLead(e.target.value)}
 className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
 >
 <option value="">Select Team Lead</option>
 {employees.map(emp => (
 <option key={emp.id} value={emp.id}>{emp.firstName + ' ' + emp.lastName || emp.firstName + ' ' + emp.lastName}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-xs font-medium text-slate-600 mb-1.5">Team Members (Optional)</label>
 <select 
 multiple
 value={newProjectMembers}
 onChange={(e) => setNewProjectMembers(Array.from(e.target.selectedOptions, option => option.value))}
 className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
 style={{ height: '80px' }}
 >
 {employees.map(emp => (
 <option key={emp.id} value={emp.id}>{emp.firstName + ' ' + emp.lastName || emp.firstName + ' ' + emp.lastName}</option>
 ))}
 </select>
 <p className="text-[10px] text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
 </div>
 </div>
 </div>
 <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">

 <button 
 type="button"
 onClick={() => setNewProjectModalOpen(false)}
 className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors border border-slate-200 cursor-pointer"
 >
 Cancel
 </button>
 <button 
 type="submit"
 className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-all shadow-sm cursor-pointer"
 >
 Create Project
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </motion.div>
 );
};

export default ProjectsList;
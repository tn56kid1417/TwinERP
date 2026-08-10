import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Calendar, UserPlus, X, ListTodo, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getEmployees, getProjects, addProject, updateProject, getTasks, addTask, updateTask } from '../../api';
import { Employee, Project, Task } from '../../types';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'To Do': return 'bg-slate-500/10 text-slate-500 dark:text-slate-500 dark:text-slate-400 border-slate-500/20';
    case 'In Progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'Canceled': return 'bg-red-500/10 text-red-400 border-red-500/20';
    default: return 'bg-slate-500/10 text-slate-500 dark:text-slate-500 dark:text-slate-400 border-slate-500/20';
  }
};

const STATUS_FILTERS = ['All', 'To Do', 'In Progress', 'Completed', 'Canceled'];

const ProjectsList = () => {
  const { user, canViewAll, canEdit } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [newProjectStartDate, setNewProjectStartDate] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

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

  const handleAssignProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedEmployeeId(teamLeaders[0]?.id || '');
    setAssignModalOpen(true);
  };

  const handleAssignProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProjectId && selectedEmployeeId) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project && !project.assignees.includes(selectedEmployeeId)) {
        const updated = await updateProject(selectedProjectId, { assignees: [...project.assignees, selectedEmployeeId] });
        setProjects(prev => prev.map(p => p.id === selectedProjectId ? updated : p));
      }
    }
    setAssignModalOpen(false);
  };

  const handleTasksClick = (projectId: string) => {
    navigate(`/projects/${projectId}/board`);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName && newProjectClient && newProjectStartDate && newProjectDeadline) {
      const project = await addProject({
        name: newProjectName,
        client: newProjectClient,
        status: 'To Do',
        startDate: newProjectStartDate,
        deadline: newProjectDeadline,
        description: newProjectDescription
      });
      setProjects(prev => [...prev, project]);
      setNewProjectModalOpen(false);
      setNewProjectName('');
      setNewProjectClient('');
      setNewProjectStartDate('');
      setNewProjectDeadline('');
      setNewProjectDescription('');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">Projects</h1>
          <p className="text-slate-500 dark:text-slate-500 mt-1">
            {canEdit ? 'Manage company projects and assign them to Team Leaders.' : 'View your assigned projects and manage tasks.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500/50 w-64"
            />
          </div>
          {canEdit && (
            <button 
              onClick={() => setNewProjectModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-500 dark:text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1A1D23] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/50 dark:bg-slate-900/50 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800/50">
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
                  className="border-b border-slate-200/80 dark:border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{project.name}</div>
                    {project.description && (
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-1 max-w-xs truncate" title={project.description}>
                        {project.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-500 dark:text-slate-400">{project.client}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-500 dark:text-slate-500" />
                      {project.deadline}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-500 dark:text-slate-400">
                    <div className="flex -space-x-2">
                      {project.assignees.map((empId, i) => {
                        const emp = employees.find(e => e.id === empId);
                        return emp ? (
                          <div key={i} className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-900 dark:text-white relative group cursor-help">
                            {emp.firstName[0]}{emp.lastName[0]}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
                              {emp.firstName} {emp.lastName}
                            </div>
                          </div>
                        ) : null;
                      })}
                      {project.assignees.length === 0 && <span className="text-xs text-slate-500 dark:text-slate-500">Unassigned</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit && (
                        <button 
                          onClick={() => handleAssignProjectClick(project.id)}
                          className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded transition-colors"
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
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-500">No projects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Project to Team Leader Modal */}
      <AnimatePresence>
        {assignModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1A1D23] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Assign Team Leader</h2>
                <button 
                  onClick={() => setAssignModalOpen(false)}
                  className="text-slate-500 dark:text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAssignProjectSubmit} className="p-6">
                <div className="mb-6">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-500 dark:text-slate-400 mb-2">Select Team Leader</label>
                  <select 
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    required
                  >
                    <option value="" disabled>Select a team leader...</option>
                    {teamLeaders.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Only employees with the 'Team Leader' role can be assigned as project owners.</p>
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setAssignModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Assign
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* New Project Modal */}
      <AnimatePresence>
        {newProjectModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1A1D23] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create New Project</h2>
                <button 
                  onClick={() => setNewProjectModalOpen(false)}
                  className="text-slate-500 dark:text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateProject} className="p-6">
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-500 dark:text-slate-400 mb-2">Project Name</label>
                    <input 
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      required
                      placeholder="e.g. Website Redesign"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-500 dark:text-slate-400 mb-2">Client Name</label>
                    <input 
                      type="text"
                      value={newProjectClient}
                      onChange={(e) => setNewProjectClient(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      required
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-500 dark:text-slate-400 mb-2">Start Date</label>
                      <input 
                        type="date"
                        value={newProjectStartDate}
                        onChange={(e) => setNewProjectStartDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-500 dark:text-slate-400 mb-2">Deadline</label>
                      <input 
                        type="date"
                        value={newProjectDeadline}
                        onChange={(e) => setNewProjectDeadline(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-500 dark:text-slate-400 mb-2">Description (Optional)</label>
                    <textarea 
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                      rows={3}
                      placeholder="Project description or notes"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setNewProjectModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
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

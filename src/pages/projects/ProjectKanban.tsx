import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, User } from 'lucide-react';
import { getProjects, getTasks, addTask, updateTask, getEmployees } from '../../api';
import { Project, Task, Employee } from '../../types';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['To Do', 'In Progress', 'Completed', 'Canceled'] as const;

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'High': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'Medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'Low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    default: return 'bg-slate-500/10 text-slate-500 dark:text-slate-500 dark:text-slate-400 border-slate-500/20';
  }
};

export default function ProjectKanban() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, canViewAll, canEdit } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [isAddingTask, setIsAddingTask] = useState<string | null>(null); // status column adding to

  useEffect(() => {
    Promise.all([getProjects(), getTasks(), getEmployees()]).then(([projs, tsks, emps]) => {
      const p = projs.find(x => x.id === id);
      if (p) setProject(p);
      setTasks(tsks.filter(t => t.projectId === id));
      setEmployees(emps);
    }).catch(console.error);
  }, [id]);

  const isTeamLeader = user?.role === 'Team Leader';
  
  const canSeeAllTasks = isTeamLeader || canViewAll;
  const canManageTasks = isTeamLeader || canEdit;
  
  const standardEmployees = employees.filter(e => e.role === 'Developer' || e.role === 'Employee');

  const visibleTasks = tasks.filter(t => canSeeAllTasks || t.assigneeId === user?.id);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (!canManageTasks && task.assigneeId !== user?.id) {
      return; // Not authorized to move this task
    }

    if (task.status !== status) {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: status as any } : t));
      
      try {
        await updateTask(taskId, { status: status as any });
      } catch (err) {
        console.error(err);
        // Revert on failure
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task.status } : t));
      }
    }
  };

  const handleAddTask = async (e: React.FormEvent, status: string) => {
    e.preventDefault();
    if (id && newTaskName && newTaskAssignee) {
      const task = await addTask({
        projectId: id,
        name: newTaskName,
        status: status as any,
        assigneeId: newTaskAssignee,
        description: newTaskDescription,
        priority: newTaskPriority
      });
      setTasks(prev => [...prev, task]);
      setNewTaskName('');
      setNewTaskAssignee('');
      setNewTaskDescription('');
      setNewTaskPriority('Medium');
      setIsAddingTask(null);
    }
  };

  if (!project) return <div className="p-8 text-slate-500 dark:text-slate-500 dark:text-slate-400">Loading...</div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col">
      <div className="mb-8 flex items-center gap-4">
        <button 
          onClick={() => navigate('/projects/all')}
          className="p-2 text-slate-500 dark:text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">{project.name}</h1>
          <p className="text-slate-500 dark:text-slate-500 mt-1">Kanban Board for {project.client}</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {STATUSES.map(status => {
          const columnTasks = visibleTasks.filter(t => t.status === status);
          return (
            <div 
              key={status} 
              className="flex-shrink-0 w-80 flex flex-col bg-white dark:bg-[#1A1D23] border border-slate-200 dark:border-slate-800 rounded-xl max-h-full"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{status}</h3>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 min-h-[150px]">
                {columnTasks.map(task => {
                  const assignee = employees.find(e => e.id === task.assigneeId);
                  return (
                    <motion.div
                      layout
                      key={task.id}
                      draggable={canManageTasks || task.assigneeId === user?.id}
                      onDragStart={(e: any) => handleDragStart(e, task.id)}
                      className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-lg cursor-grab active:cursor-grabbing hover:border-slate-300 dark:border-slate-700 transition-colors flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{task.name}</p>
                        {task.priority && task.status !== 'Canceled' && (
                          <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-500 whitespace-pre-wrap">{task.description}</p>
                      )}
                      {assignee && (
                        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-500 mt-1">
                          <span className="flex items-center gap-1.5">
                            <User size={12} /> 
                            {assignee.firstName} {assignee.lastName}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
                {canManageTasks && isAddingTask === status && status === 'To Do' ? (
                  <form onSubmit={(e) => handleAddTask(e, status)} className="bg-white/50 dark:bg-slate-900/50 border border-indigo-500/30 p-3 rounded-lg">
                    <input 
                      type="text" 
                      required
                      value={newTaskName}
                      onChange={e => setNewTaskName(e.target.value)}
                      placeholder="Task name"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded px-2 py-1.5 text-xs focus:outline-none mb-2"
                      autoFocus
                    />
                    <textarea
                      value={newTaskDescription}
                      onChange={e => setNewTaskDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded px-2 py-1.5 text-xs focus:outline-none mb-2 resize-none"
                      rows={2}
                    />
                    <select 
                      required
                      value={newTaskAssignee}
                      onChange={e => setNewTaskAssignee(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded px-2 py-1.5 text-xs focus:outline-none mb-2"
                    >
                      <option value="" disabled>Assignee</option>
                      {standardEmployees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                    </select>
                    <select
                      required
                      value={newTaskPriority}
                      onChange={e => setNewTaskPriority(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded px-2 py-1.5 text-xs focus:outline-none mb-3"
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-indigo-600 text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded hover:bg-indigo-500 transition-colors">
                        Add
                      </button>
                      <button type="button" onClick={() => setIsAddingTask(null)} className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-xs px-2 py-1.5 hover:text-slate-800 dark:text-slate-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  canManageTasks && status === 'To Do' && (
                    <button 
                      onClick={() => setIsAddingTask(status)}
                      className="flex items-center gap-2 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:text-slate-300 text-sm p-2 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent border-dashed hover:border-slate-300 dark:border-slate-700 w-full"
                    >
                      <Plus size={14} /> Add Task
                    </button>
                  )
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

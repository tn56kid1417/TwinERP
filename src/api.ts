import axios from 'axios';
import { Employee, Attendance, LeaveRequest, Payslip, SalaryStructure, Resignation, Termination, Holiday, Award, Announcement, AppEvent, AppNotification } from './types';


const api = axios.create({
  baseURL: '/api',
});

// Auth
export const login = (email: string, password?: string) => api.post<{token: string, user: Employee}>('/login', { email, password }).then(res => res.data);

// Employee APIs
export const getEmployees = () => api.get<Employee[]>('/employees').then(res => res.data);
export const addEmployee = (emp: Omit<Employee, 'id' | 'isActive'>) => api.post<Employee>('/employees', emp).then(res => res.data);
export const updateEmployee = (id: string, emp: Partial<Employee>) => api.put<Employee>(`/employees/${id}`, emp).then(res => res.data);
export const deleteEmployee = (id: string) => api.delete(`/employees/${id}`);

// Attendance APIs
export const clockIn = (employeeId: string, clockInTime?: string) => api.post<Attendance>('/attendance/clock-in', { employeeId, clockInTime }).then(res => res.data);
export const clockOut = (employeeId: string, clockInTime?: string) => api.post<Attendance>('/attendance/clock-out', { employeeId, clockInTime }).then(res => res.data);
export const breakIn = (employeeId: string, clockInTime?: string) => api.post<Attendance>('/attendance/break-in', { employeeId, clockInTime }).then(res => res.data);
export const breakOut = (employeeId: string, clockInTime?: string, breakInTime?: string) => api.post<Attendance>('/attendance/break-out', { employeeId, clockInTime, breakInTime }).then(res => res.data);
export const getAttendance = (employeeId: string) => api.get<Attendance[]>(`/attendance/${employeeId}`).then(res => res.data);
export const getAllAttendance = () => api.get<Attendance[]>('/attendance').then(res => res.data);

// Leave APIs
export const getLeaves = () => api.get<LeaveRequest[]>('/leaves').then(res => res.data);
export const requestLeave = (leave: Omit<LeaveRequest, 'id' | 'status'>) => api.post<LeaveRequest>('/leaves', leave).then(res => res.data);
export const updateLeaveStatus = (id: string, status: string, approvedBy?: string) => api.put<LeaveRequest>(`/leaves/${id}`, { status, approvedBy }).then(res => res.data);

// Payroll APIs
export const getSalaryStructures = () => api.get<SalaryStructure[]>('/payroll/structures').then(res => res.data);
export const setSalaryStructure = (data: Omit<SalaryStructure, 'id'>) => api.post<SalaryStructure>('/payroll/structures', data).then(res => res.data);
export const generatePayslip = (employeeId: string, month: number, year: number) => api.post<Payslip>('/payroll/generate', { employeeId, month, year }).then(res => res.data);
export const getPayslips = (employeeId: string) => api.get<Payslip[]>(`/payroll/${employeeId}`).then(res => res.data);
export const getAllPayslips = () => api.get<Payslip[]>('/payroll').then(res => res.data);

// Resignation APIs
export const getResignations = () => api.get<Resignation[]>('/resignations').then(res => res.data);
export const addResignation = (data: Omit<Resignation, 'id' | 'status'>) => api.post<Resignation>('/resignations', data).then(res => res.data);
export const updateResignationStatus = (id: string, status: string, approvedBy?: string) => api.put<Resignation>(`/resignations/${id}`, { status, approvedBy }).then(res => res.data);

// Termination APIs
export const getTerminations = () => api.get<Termination[]>('/terminations').then(res => res.data);
export const addTermination = (data: Omit<Termination, 'id' | 'status'>) => api.post<Termination>('/terminations', data).then(res => res.data);
export const updateTerminationStatus = (id: string, status: string, approvedBy?: string) => api.put<Termination>(`/terminations/${id}`, { status, approvedBy }).then(res => res.data);

// Holiday APIs
export const getHolidays = () => api.get<Holiday[]>('/holidays').then(res => res.data);
export const addHoliday = (data: Omit<Holiday, 'id'>) => api.post<Holiday>('/holidays', data).then(res => res.data);
export const deleteHoliday = (id: string) => api.delete(`/holidays/${id}`);

// Award APIs
export const getAwards = () => api.get<Award[]>('/awards').then(res => res.data);
export const addAward = (data: Omit<Award, 'id'>) => api.post<Award>('/awards', data).then(res => res.data);
export const deleteAward = (id: string) => api.delete(`/awards/${id}`);

// Announcement APIs
export const getAnnouncements = () => api.get<Announcement[]>('/announcements').then(res => res.data);
export const addAnnouncement = (data: Omit<Announcement, 'id' | 'date'>) => api.post<Announcement>('/announcements', data).then(res => res.data);
export const updateAnnouncement = (id: string, data: Partial<Announcement>) => api.put<Announcement>(`/announcements/${id}`, data).then(res => res.data);
export const deleteAnnouncement = (id: string) => api.delete(`/announcements/${id}`);

// Event APIs
export const getEvents = () => api.get<AppEvent[]>('/events').then(res => res.data);
export const addEvent = (data: Omit<AppEvent, 'id'>) => api.post<AppEvent>('/events', data).then(res => res.data);
export const deleteEvent = (id: string) => api.delete(`/events/${id}`);

export default api;


// Project APIs
export const getProjects = () => api.get<import('./types').Project[]>('/projects').then(res => res.data);
export const addProject = (data: Omit<import('./types').Project, 'id' | 'assignees'>) => api.post<import('./types').Project>('/projects', data).then(res => res.data);
export const updateProject = (id: string, data: Partial<import('./types').Project>) => api.put<import('./types').Project>(`/projects/${id}`, data).then(res => res.data);

// Task APIs
export const getTasks = () => api.get<import('./types').Task[]>('/tasks').then(res => res.data);
export const addTask = (data: Omit<import('./types').Task, 'id'>) => api.post<import('./types').Task>('/tasks', data).then(res => res.data);
export const updateTask = (id: string, data: Partial<import('./types').Task>) => api.put<import('./types').Task>(`/tasks/${id}`, data).then(res => res.data);
export const deleteTask = (id: string) => api.delete(`/tasks/${id}`);

// Project Activities API
export const getProjectActivities = () => api.get<import('./types').ProjectActivity[]>('/project-activities').then(res => res.data);

// Client APIs
export const getClients = () => api.get<import('./types').Client[]>('/clients').then(res => res.data);
export const addClient = (data: Omit<import('./types').Client, 'id'>) => api.post<import('./types').Client>('/clients', data).then(res => res.data);
export const updateClient = (id: string, data: Partial<import('./types').Client>) => api.put<import('./types').Client>(`/clients/${id}`, data).then(res => res.data);
export const deleteClient = (id: string) => api.delete(`/clients/${id}`);

// Notifications & Overdue Break APIs
export const getNotifications = () => api.get<AppNotification[]>('/notifications').then(res => res.data);
export const createNotification = (data: Partial<AppNotification>) => api.post<AppNotification>('/notifications', data).then(res => res.data);
export const markNotificationRead = (id: string) => api.put<AppNotification>(`/notifications/${id}/read`).then(res => res.data);
export const markAllNotificationsRead = () => api.post<{ success: boolean; count: number }>('/notifications/mark-all-read').then(res => res.data);
export const checkOverdueBreaks = (breakDurationMinutes: number) => 
  api.post<{ overdueCount: number; overdueEmployees: any[]; notifications: AppNotification[] }>('/attendance/check-overdue-breaks', { breakDurationMinutes }).then(res => res.data);

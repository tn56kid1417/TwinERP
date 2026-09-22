import axios from 'axios';
import { Employee, Attendance, LeaveRequest, Payslip, SalaryStructure, Resignation, Termination, Holiday, Award, Announcement, AppEvent, AppNotification } from './types';


const api = axios.create({
  baseURL: '/api',
});

// Inject user identity headers for all requests (used by chat API auth)
api.interceptors.request.use(config => {
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.id)   config.headers['x-user-id']   = user.id;
      if (user?.role) config.headers['x-user-role'] = user.role;
    }
  } catch { /* ignore */ }
  return config;
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
export const getNotifications = (breakDurationMinutes?: number) => 
  api.get<AppNotification[]>('/notifications', { params: breakDurationMinutes ? { breakDurationMinutes } : {} }).then(res => res.data);
export const createNotification = (data: Partial<AppNotification>) => api.post<AppNotification>('/notifications', data).then(res => res.data);
export const markNotificationRead = (id: string) => api.put<AppNotification>(`/notifications/${id}/read`).then(res => res.data);
export const markAllNotificationsRead = () => api.post<{ success: boolean; count: number }>('/notifications/mark-all-read').then(res => res.data);
export const checkOverdueBreaks = (breakDurationMinutes: number) => 
  api.post<{ overdueCount: number; overdueEmployees: any[]; notifications: AppNotification[] }>('/attendance/check-overdue-breaks', { breakDurationMinutes }).then(res => res.data);

// --- Careers & Job Postings APIs ---
export const getJobs = () => api.get<import('./types').JobPosting[]>('/careers/admin').then(res => res.data);
export const getJob = (id: string) => api.get<import('./types').JobPosting>(`/careers/admin/${id}`).then(res => res.data);
export const createJob = (data: Partial<import('./types').JobPosting>) => api.post<import('./types').JobPosting>('/careers/admin', data).then(res => res.data);
export const updateJob = (id: string, data: Partial<import('./types').JobPosting>) => api.patch<import('./types').JobPosting>(`/careers/admin/${id}`, data).then(res => res.data);
export const publishJob = (id: string) => api.patch<import('./types').JobPosting>(`/careers/admin/${id}/publish`).then(res => res.data);
export const closeJob = (id: string) => api.patch<import('./types').JobPosting>(`/careers/admin/${id}/close`).then(res => res.data);
export const deleteJob = (id: string) => api.delete(`/careers/admin/${id}`);

export const getJobApplications = (jobId: string) => api.get<import('./types').JobApplication[]>(`/careers/${jobId}/applications`).then(res => res.data);
export const createJobApplication = (jobId: string, data: Partial<import('./types').JobApplication>) => api.post<import('./types').JobApplication>(`/careers/${jobId}/applications`, data).then(res => res.data);
export const updateApplicationRound = (id: string, roundId: string, status?: string) => api.patch<import('./types').JobApplication>(`/applications/${id}/round`, { roundId, status }).then(res => res.data);
export const updateApplicationStatus = (id: string, status: string, notes?: string) => api.patch<import('./types').JobApplication>(`/applications/${id}/status`, { status, notes }).then(res => res.data);
export const deleteJobApplication = (id: string) => api.delete(`/applications/${id}`);

// --- Documents & Contracts APIs ---
export const getHRDocuments = () => api.get<import('./types').HRDocument[]>('/documents').then(res => res.data);
export const createHRDocument = (data: Partial<import('./types').HRDocument>) => api.post<import('./types').HRDocument>('/documents', data).then(res => res.data);
export const deleteHRDocument = (id: string) => api.delete(`/documents/${id}`);

export const getAgreements = () => api.get<import('./types').Agreement[]>('/documents/agreements').then(res => res.data);
export const createAgreement = (data: Partial<import('./types').Agreement>) => api.post<import('./types').Agreement>('/documents/agreements', data).then(res => res.data);
export const deleteAgreement = (id: string) => api.delete(`/documents/agreements/${id}`);

export const getTemplates = () => api.get<import('./types').DocumentTemplate[]>('/documents/templates').then(res => res.data);
export const createTemplate = (data: Partial<import('./types').DocumentTemplate>) => api.post<import('./types').DocumentTemplate>('/documents/templates', data).then(res => res.data);
export const deleteTemplate = (id: string) => api.delete(`/documents/templates/${id}`);

// --- User Management APIs ---
export const getUsers = (params?: { search?: string; role?: string; status?: string; department?: string; page?: number; limit?: number }) => 
  api.get<{ data: import('./types').UserAccount[]; users: import('./types').UserAccount[]; total: number; page: number; totalPages: number }>('/users', { params }).then(res => res.data);
export const createUser = (data: any) => api.post<import('./types').UserAccount>('/users', data).then(res => res.data);
export const updateUser = (id: string, data: any) => api.patch<import('./types').UserAccount>(`/users/${id}`, data).then(res => res.data);
export const deleteUser = (id: string) => api.delete(`/users/${id}`);
export const resetUserPassword = (id: string, newPassword?: string) => api.patch<{ success: boolean }>(`/users/${id}/reset-password`, { newPassword }).then(res => res.data);
export const getDepartments = () => api.get<{ id: string; name: string }[]>('/org-structure/departments').then(res => res.data);
export const getBranches = () => api.get<{ id: string; name: string }[]>('/org-structure/branches').then(res => res.data);
export const getShifts = () => api.get<{ id: string; name: string; startTime: string; endTime: string }[]>('/attendance/shifts').then(res => res.data);

// --- Lifecycle APIs ---
export const getPromotions = () => api.get<import('./types').Promotion[]>('/lifecycle/promotions').then(res => res.data);
export const createPromotion = (data: Partial<import('./types').Promotion>) => api.post<import('./types').Promotion>('/lifecycle/promotions', data).then(res => res.data);

export const getComplaints = () => api.get<import('./types').Complaint[]>('/lifecycle/complaints').then(res => res.data);
export const createComplaint = (data: Partial<import('./types').Complaint>) => api.post<import('./types').Complaint>('/lifecycle/complaints', data).then(res => res.data);
export const updateComplaintStatus = (id: string, status: string) => api.patch<import('./types').Complaint>(`/lifecycle/complaints/${id}/status`, { status }).then(res => res.data);
export const deleteComplaint = (id: string) => api.delete(`/lifecycle/complaints/${id}`);

// --- Team Chat APIs ---
export const getChatTeams = () =>
  api.get<import('./types').ChatTeamWithMeta[]>('/chat/teams').then(res => res.data);

export const createChatTeam = (data: { name: string; memberIds?: string[]; restrictHistory?: boolean }) =>
  api.post<import('./types').ChatTeam>('/chat/teams', data).then(res => res.data);

export const getChatTeamDetail = (teamId: string) =>
  api.get<{ team: import('./types').ChatTeam; members: import('./types').ChatMembership[] }>(`/chat/teams/${teamId}`).then(res => res.data);

export const getChatMessages = (teamId: string, params?: { before?: string; limit?: number }) =>
  api.get<import('./types').ChatMessage[]>(`/chat/teams/${teamId}/messages`, { params }).then(res => res.data);

export const sendChatMessage = (teamId: string, content: string, type: 'text' | 'file' | 'system' = 'text') =>
  api.post<import('./types').ChatMessage>(`/chat/teams/${teamId}/messages`, { content, type }).then(res => res.data);

export const editChatMessage = (teamId: string, messageId: string, content: string) =>
  api.patch<import('./types').ChatMessage>(`/chat/teams/${teamId}/messages/${messageId}`, { content }).then(res => res.data);

export const deleteChatMessage = (teamId: string, messageId: string) =>
  api.delete<import('./types').ChatMessage>(`/chat/teams/${teamId}/messages/${messageId}`).then(res => res.data);

export const addChatMember = (teamId: string, data: { userId: string; roleInTeam?: string; canPost?: boolean; viewOnly?: boolean }) =>
  api.post(`/chat/teams/${teamId}/members`, data).then(res => res.data);

export const removeChatMember = (teamId: string, userId: string) =>
  api.delete(`/chat/teams/${teamId}/members/${userId}`);

export const getChatReadState = (teamId: string) =>
  api.get<{ last_read_message_id: string | null }>(`/chat/teams/${teamId}/read-state`).then(res => res.data);

export const updateChatReadState = (teamId: string, lastReadMessageId: string) =>
  api.post(`/chat/teams/${teamId}/read-state`, { lastReadMessageId }).then(res => res.data);

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  designation?: string;
  teamId?: string;
  hireDate: string;
  isActive: boolean;
  shift?: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  clockInTime: string;
  clockOutTime: string | null;
  breakInTime?: string | null;
  breakOutTime?: string | null;
  status: 'Present' | 'Absent' | 'Half-Day';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'Sick' | 'Casual' | 'Earned';
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedByRole?: string;
  approvedBy?: string;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  grossPay: number;
  netPay: number;
}

export interface Resignation {
  id: string;
  employeeId: string;
  lastWorkingDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  document?: string;
  approvedBy?: string;
  submittedByRole?: string;
}

export interface Termination {
  id: string;
  employeeId: string;
  terminationType: string;
  noticeDate: string;
  terminationDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  document?: string;
  approvedBy?: string;
  submittedByRole?: string;
}

export interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: string;
  isPaid: boolean;
}

export interface Award {
  id: string;
  employeeId: string;
  awardType: string;
  date: string;
  gift: string;
  description: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

export interface AppEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
  startDate?: string;
  deadline: string;
  assignees: string[]; // Typically Team Leaders assigned by higher-ups
  description?: string;
}

export interface ProjectActivity {
  id: string;
  projectId?: string;
  taskId?: string;
  type: 'StatusChange' | 'Assignment' | 'Creation' | 'Other';
  description: string;
  timestamp: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  status: 'To Do' | 'In Progress' | 'Completed' | 'Canceled';
  assigneeId: string; // Typically Employees assigned by Team Leaders
  description?: string;
  priority?: 'High' | 'Medium' | 'Low';
}

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry: string;
  status: 'Active' | 'Inactive';
}

export interface AppNotification {
  id: string;
  type: 'approval' | 'alert' | 'policy' | 'overdue_break' | 'mention';
  title: string;
  message: string;
  time: string;
  timestamp: string;
  read: boolean;
  targetRole?: string;
  targetUserId?: string;
  employeeId?: string;
  employeeName?: string;
  overdueMinutes?: number;
}

// --- Careers & Recruitment Types ---
export interface JobField {
  id: string;
  label: string;
  value: string;
  fieldType: 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'TAG' | 'LINK';
  section: 'PRIMARY' | 'SECONDARY';
  order: number;
}

export interface InterviewRound {
  id: string;
  title: string;
  shortDescription: string;
  longDescription?: string;
  order: number;
  emailTemplate?: string;
}

export interface JobPosting {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  department?: string;
  location?: string;
  employmentType?: string;
  fields: JobField[];
  rounds: InterviewRound[];
  applicationConfirmationTemplate?: string;
  roundAdvanceTemplate?: string;
  rejectionTemplate?: string;
  hireTemplate?: string;
  createdAt: string;
  publishedAt?: string;
  closedAt?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  qualification?: string;
  experience?: string;
  currentOrg?: string;
  resumeUrl?: string;
  resumeLink?: string;
  portfolioUrl?: string;
  coverNote?: string;
  currentRoundId?: string;
  status: 'APPLIED' | 'IN_REVIEW' | 'INTERVIEWING' | 'HIRED' | 'REJECTED' | 'PENDING';
  appliedAt: string;
  notes?: string;
  rating?: number;
  emailLogs?: Array<{ sentAt: string; subject: string; templateType: string; to: string }>;
}

// --- Documents & Contracts Types ---
export interface HRDocument {
  id: string;
  name: string;
  category: string;
  uploadedAt: string;
  fileUrl: string;
  fileSize?: string;
}

export interface Agreement {
  id: string;
  employee: string;
  duration: string;
  agreementType: string;
  startDate: string;
  endDate: string;
  fileUrl: string;
  status?: 'Active' | 'Expired' | 'Pending';
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'Offer Letter' | 'Intern Letter' | 'Quotation' | 'NDA' | 'Policy' | 'Other';
  fileUrl: string;
  description?: string;
}

// --- User Management Types ---
export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'HR' | 'TL' | 'Member' | 'CEO' | 'COO' | 'CTO' | 'Admin' | string;
  department: string;
  designation?: string;
  branch?: string;
  shift?: string;
  employmentType?: 'FullTime' | 'Intern' | 'Contract';
  joiningDate?: string;
  address?: string;
  status: 'Active' | 'Resigned' | 'Terminated';
}

// --- Lifecycle Types (Promotions & Complaints) ---
export interface Promotion {
  id: string;
  employee: string;
  employeeId?: string;
  oldDepartment: string;
  oldRole: string;
  newDepartment: string;
  newRole: string;
  effectiveDate: string;
  approvedBy?: string;
}

export interface Complaint {
  id: string;
  employee: string;
  employeeId?: string;
  category: 'Management' | 'Salary' | 'AgainstMember' | 'Workplace';
  targetEmployee?: string;
  description: string;
  status: 'Pending' | 'Investigating' | 'Resolved' | 'Dismissed';
  submittedDate: string;
}

// --- Admin Privileges Types ---
export type ModuleKey =
  | 'dashboard'
  | 'user-management'
  | 'employees'
  | 'careers'
  | 'documents'
  | 'lifecycle'
  | 'attendance'
  | 'leaves'
  | 'leave-balance'
  | 'holidays'
  | 'payslips'
  | 'awards'
  | 'announcements'
  | 'events'
  | 'letters'
  | 'resignations'
  | 'terminations'
  | 'analytics'
  | 'settings'
  | 'crm'
  | 'projects'
  | 'team-chat';

export interface UserPrivileges {
  userId: string;
  allowedModules: ModuleKey[];
  grantedBy: string; // admin user ID
  updatedAt: string;
}

/** Map of userId → UserPrivileges, stored in localStorage under 'erp_privileges' */
export type PrivilegesMap = Record<string, UserPrivileges>;

// ─── Team Chat Types ─────────────────────────────────────────────────────────

export interface ChatTeam {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  restrict_history_to_membership_window: boolean;
}

export interface ChatMembership {
  id: string;
  team_id: string;
  user_id: string;
  role_in_team: string;
  can_post: boolean;
  can_delete_others_messages: boolean;
  can_remove_members: boolean;
  view_only: boolean;
  status: 'active' | 'removed';
  joined_at: string;
  removed_at?: string | null;
  removed_by?: string | null;
}

export interface ChatAttachment {
  id: string;
  message_id: string;
  url: string;
  file_name: string;
  mime_type: string;
}

export interface ChatMessage {
  id: string;
  team_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'file' | 'system';
  reply_to_id?: string | null;  // Phase 3
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  attachments?: ChatAttachment[];
}

export interface ChatReadState {
  user_id: string;
  team_id: string;
  last_read_message_id: string | null;
  updated_at: string;
}

/** ChatTeam enriched with membership info + unread count (returned by GET /chat/teams) */
export interface ChatTeamWithMeta extends ChatTeam {
  membership: {
    roleInTeam: string;
    canPost: boolean;
    viewOnly: boolean;
    joinedAt: string;
  };
  unreadCount: number;
}

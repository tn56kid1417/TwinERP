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
  type: 'approval' | 'alert' | 'policy' | 'overdue_break';
  title: string;
  message: string;
  time: string;
  timestamp: string;
  read: boolean;
  targetRole?: string;
  employeeId?: string;
  employeeName?: string;
  overdueMinutes?: number;
}

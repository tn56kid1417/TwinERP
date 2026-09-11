import express from 'express';
import path from 'path';
import fs from 'fs';

const ATTENDANCE_FILE = process.env.VERCEL ? '/tmp/erp_attendances.json' : path.join(process.cwd(), '.attendances.json');

const loadAttendances = (): any[] => {
  try {
    if (fs.existsSync(ATTENDANCE_FILE)) {
      const data = fs.readFileSync(ATTENDANCE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load attendances from file:', err);
  }
  return seedAttendances();
};

const saveAttendances = () => {
  try {
    fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(attendances, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save attendances to file:', err);
  }
};

const NOTIFICATION_FILE = process.env.VERCEL ? '/tmp/erp_notifications.json' : path.join(process.cwd(), '.notifications.json');

const seedNotifications = (): any[] => [
  {
    id: 'n1',
    type: 'approval',
    title: 'Pending Approval',
    message: 'Leave request from Alice Smith requires your approval.',
    time: '10 mins ago',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    read: false,
    targetRole: 'HR'
  },
  {
    id: 'n2',
    type: 'alert',
    title: 'Project Deadline Alert',
    message: 'Website Redesign project is due in 2 days.',
    time: '1 hour ago',
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    read: false,
    targetRole: 'All'
  },
  {
    id: 'n3',
    type: 'policy',
    title: 'HR Policy Change',
    message: 'Updated work from home guidelines have been published.',
    time: '1 day ago',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    read: true,
    targetRole: 'All'
  }
];

const loadNotifications = (): any[] => {
  try {
    if (fs.existsSync(NOTIFICATION_FILE)) {
      const data = fs.readFileSync(NOTIFICATION_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load notifications from file:', err);
  }
  return seedNotifications();
};

const saveNotifications = () => {
  try {
    fs.writeFileSync(NOTIFICATION_FILE, JSON.stringify(notifications, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save notifications to file:', err);
  }
};

let notifications: any[] = loadNotifications();

// --- In-Memory Database ---
let employees: any[] = [
  { id: 'e1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', department: 'Engineering', role: 'Developer', hireDate: '2023-01-15', isActive: true, shift: 'Morning' },
  { id: 'e2', firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', department: 'HR', role: 'Manager', hireDate: '2022-11-01', isActive: true, shift: 'Evening' },
  { id: 'e3', firstName: 'System', lastName: 'Admin', email: 'admin@example.com', department: 'Administration', role: 'Admin', hireDate: '2023-01-01', isActive: true, shift: 'Morning' },
  { id: 'e4', firstName: 'John', lastName: 'CEO', email: 'ceo@example.com', department: 'Executive', role: 'CEO', hireDate: '2021-01-01', isActive: true, shift: 'Morning' },
  { id: 'e5', firstName: 'Jane', lastName: 'CTO', email: 'cto@example.com', department: 'Executive', role: 'CTO', hireDate: '2021-01-01', isActive: true, shift: 'Morning' },
  { id: 'e6', firstName: 'Charlie', lastName: 'Leader', email: 'leader@example.com', department: 'Engineering', role: 'Team Leader', hireDate: '2022-05-10', isActive: true, shift: 'Morning' },
  { id: 'e7', firstName: 'David', lastName: 'Developer', email: 'david@example.com', department: 'Engineering', role: 'Developer', hireDate: '2023-03-20', isActive: true, shift: 'Morning' },
  { id: 'e8', firstName: 'Eve', lastName: 'Engineer', email: 'eve@example.com', department: 'Engineering', role: 'Developer', hireDate: '2023-04-12', isActive: true, shift: 'Evening' },
  { id: 'e9', firstName: 'Frank', lastName: 'Frontend', email: 'frank@example.com', department: 'Engineering', role: 'Developer', hireDate: '2023-05-05', isActive: true, shift: 'Morning' },
  { id: 'e10', firstName: 'Sarah', lastName: 'CRM Lead', email: 'sarah@example.com', department: 'Sales', role: 'Team Leader', hireDate: '2022-08-15', isActive: true, shift: 'Morning' },
  { id: 'e11', firstName: 'Mike', lastName: 'Sales Rep', email: 'mike@example.com', department: 'Sales', role: 'Sales Rep', hireDate: '2023-09-01', isActive: true, shift: 'Morning' },
  { id: 'e12', firstName: 'Mark', lastName: 'Digital Marketer', email: 'mark@example.com', department: 'Marketing', role: 'Marketing Member', hireDate: '2023-10-01', isActive: true, shift: 'Morning' },

  { id: 'user-sales-john', firstName: 'John', lastName: 'Doe', email: 'john@acme.com', department: 'Sales', role: 'Sales Rep', designation: 'Senior Account Manager', hireDate: '2015-01-01', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-sales-jane', firstName: 'Jane', lastName: 'Smith', email: 'jane@acme.com', department: 'Sales', role: 'Sales Rep', designation: 'Sales Representative', hireDate: '2016-01-01', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-leader-1', firstName: 'Michael', lastName: 'Scott', email: 'michael@acme.com', department: 'Sales', role: 'Sales Team Leader', designation: 'Regional Manager', hireDate: '2015-05-10', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-leader-2', firstName: 'Jim', lastName: 'Halpert', email: 'jim@acme.com', department: 'Sales', role: 'Sales Team Leader', designation: 'Co-Manager', hireDate: '2016-05-10', isActive: true, shift: 'Morning', teamId: 'team-beta' },
  { id: 'user-sales-1', firstName: 'Dwight', lastName: 'Schrute', email: 'dwight@acme.com', department: 'Sales', role: 'Sales Rep', designation: 'Assistant to the Regional Manager', hireDate: '2017-03-20', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-sales-2', firstName: 'Stanley', lastName: 'Hudson', email: 'stanley@acme.com', department: 'Sales', role: 'Sales Rep', designation: 'Sales Representative', hireDate: '2018-03-20', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-sales-3', firstName: 'Phyllis', lastName: 'Vance', email: 'phyllis@acme.com', department: 'Sales', role: 'Sales Rep', designation: 'Sales Representative', hireDate: '2019-03-20', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-sales-4', firstName: 'Andy', lastName: 'Bernard', email: 'andy@acme.com', department: 'Sales', role: 'Sales Rep', designation: 'Sales Representative', hireDate: '2020-03-20', isActive: true, shift: 'Morning', teamId: 'team-beta' },
  { id: 'user-sales-5', firstName: 'Ryan', lastName: 'Howard', email: 'ryan@acme.com', department: 'Sales', role: 'Sales Rep', designation: 'Temp Sales', hireDate: '2021-03-20', isActive: true, shift: 'Morning', teamId: 'team-beta' },
  { id: 'user-sales-6', firstName: 'Pam', lastName: 'Beesly', email: 'pam@acme.com', department: 'Sales', role: 'Sales Rep', designation: 'Sales Representative', hireDate: '2022-03-20', isActive: true, shift: 'Morning', teamId: 'team-beta' },
];

const seedAttendances = () => {
  const result: any[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const monthStr = month.toString().padStart(2, '0');
  
  for (let d = 1; d < today.getDate(); d++) {
    const dStr = d.toString().padStart(2, '0');
    const date = `${year}-${monthStr}-${dStr}`;
    result.push({
      id: `a_e1_${d}`,
      employeeId: 'e1',
      date,
      clockInTime: `${date}T09:00:00Z`,
      clockOutTime: `${date}T17:00:00Z`,
      status: Math.random() > 0.1 ? 'Present' : 'Absent'
    });
    result.push({
      id: `a_e2_${d}`,
      employeeId: 'e2',
      date,
      clockInTime: `${date}T09:00:00Z`,
      clockOutTime: Math.random() > 0.8 ? `${date}T13:00:00Z` : `${date}T17:00:00Z`,
      status: Math.random() > 0.8 ? 'Half-Day' : 'Present'
    });
  }
  return result;
};

let attendances: any[] = loadAttendances();
let leaveRequests: any[] = [];
let salaryStructures: any[] = [
  { id: 's1', employeeId: 'e1', baseSalary: 80000, allowances: 5000, deductions: 2000 },
  { id: 's2', employeeId: 'e2', baseSalary: 90000, allowances: 6000, deductions: 2500 },
];
let payslips: any[] = [];
let resignations: any[] = [];
let terminations: any[] = [];
let holidays: any[] = [];
let awards: any[] = [];
let announcements: any[] = [];
let events: any[] = [];
let clients: any[] = [
  { id: 'c1', name: 'Acme Corp', contactPerson: 'John Doe', email: 'john@acme.com', phone: '123-456-7890', industry: 'Retail', status: 'Active' },
  { id: 'c2', name: 'TechStart', contactPerson: 'Jane Smith', email: 'jane@techstart.io', phone: '987-654-3210', industry: 'Technology', status: 'Active' },
  { id: 'c3', name: 'Global Industries', contactPerson: 'Michael Brown', email: 'mbrown@global.com', phone: '555-019-2837', industry: 'Manufacturing', status: 'Inactive' }
];
let projects: any[] = [
  { id: 'p1', name: 'Website Redesign', client: 'Acme Corp', status: 'In Progress', startDate: '2024-10-01', deadline: '2024-12-01', assignees: ['e6'] },
  { id: 'p2', name: 'Mobile App MVP', client: 'TechStart', status: 'To Do', startDate: '2024-11-01', deadline: '2025-01-15', assignees: [] },
  { id: 'p3', name: 'CRM Migration', client: 'Global Industries', status: 'Completed', startDate: '2024-01-15', deadline: '2024-05-20', assignees: ['e6'] }
];
let tasks: any[] = [
  { id: 't1', projectId: 'p1', name: 'Design Mockups', status: 'In Progress', assigneeId: 'e7', priority: 'High', description: 'Create initial Figma mockups for the homepage' },
  { id: 't2', projectId: 'p1', name: 'Frontend Setup', status: 'To Do', assigneeId: 'e8', priority: 'Medium', description: 'Setup React + Vite with Tailwind' },
  { id: 't3', projectId: 'p1', name: 'API Integration', status: 'To Do', assigneeId: 'e1', priority: 'High', description: 'Connect backend API' }
];

let projectActivities: any[] = [
  { id: 'a1', projectId: 'p1', type: 'StatusChange', description: 'Project "Website Redesign" status changed to In Progress', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'a2', taskId: 't1', projectId: 'p1', type: 'Assignment', description: 'Task "Design Mockups" assigned to John Doe', timestamp: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 'a3', taskId: 't1', projectId: 'p1', type: 'StatusChange', description: 'Task "Design Mockups" moved to In Progress', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
];

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use((req, res, next) => { console.log(req.method, req.url); next(); });

  const router = express.Router();

  router.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Auth API
  router.post('/login', (req, res) => {
    const { email, password } = req.body;
    let user = employees.find(e => e.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      user = employees[0];
    }

    res.json({
      token: 'fake-jwt-token-12345',
      user
    });
  });

  // Module A: Core Employee Profile
  router.get('/employees', (req, res) => res.json(employees));
  router.post('/employees', (req, res) => {
    const newEmp = { ...req.body, id: `e${Date.now()}`, isActive: true };
    employees.push(newEmp);
    res.status(201).json(newEmp);
  });
  router.put('/employees/:id', (req, res) => {
    const index = employees.findIndex(e => e.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Employee not found' });
    employees[index] = { ...employees[index], ...req.body };
    res.json(employees[index]);
  });
  router.delete('/employees/:id', (req, res) => {
    employees = employees.filter(e => e.id !== req.params.id);
    res.status(204).send();
  });

  // Module B: Time & Attendance
  router.post('/attendance/clock-in', (req, res) => {
    const { employeeId, clockInTime } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    let record = attendances.find(a => a.employeeId === employeeId && a.date === today);
    if (record) return res.status(400).json({ error: 'Already clocked in today' });

    record = {
      id: `a${Date.now()}`,
      employeeId,
      date: today,
      clockInTime: clockInTime || new Date().toISOString(),
      clockOutTime: null,
      status: 'Present'
    };
    attendances.push(record);
    saveAttendances();
    res.status(201).json(record);
  });

  router.post('/attendance/clock-out', (req, res) => {
    const { employeeId, clockInTime } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    let record = attendances.find(a => a.employeeId === employeeId && a.date === today);
    if (!record) {
      // Auto-recover if record was lost due to serverless cold-start or fresh container
      record = {
        id: `a${Date.now()}`,
        employeeId,
        date: today,
        clockInTime: clockInTime || new Date().toISOString(),
        clockOutTime: new Date().toISOString(),
        status: 'Present'
      };
      attendances.push(record);
      saveAttendances();
      return res.json(record);
    }
    if (record.clockOutTime) return res.status(400).json({ error: 'Already clocked out' });

    record.clockOutTime = new Date().toISOString();
    saveAttendances();
    res.json(record);
  });

  router.post('/attendance/break-in', (req, res) => {
    const { employeeId, clockInTime } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    let record = attendances.find(a => a.employeeId === employeeId && a.date === today);
    if (!record) {
      // Auto-recover if record was lost due to serverless cold-start or fresh container
      record = {
        id: `a${Date.now()}`,
        employeeId,
        date: today,
        clockInTime: clockInTime || new Date().toISOString(),
        clockOutTime: null,
        status: 'Present'
      };
      attendances.push(record);
    }
    if (record.clockOutTime) return res.status(400).json({ error: 'Already clocked out' });
    if (record.breakInTime) return res.status(400).json({ error: 'Already on break' });

    record.breakInTime = req.body.breakInTime || new Date().toISOString();
    saveAttendances();
    res.json(record);
  });

  router.post('/attendance/break-out', (req, res) => {
    const { employeeId, clockInTime, breakInTime } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    let record = attendances.find(a => a.employeeId === employeeId && a.date === today);
    if (!record) {
      // Auto-recover if record was lost due to serverless cold-start or fresh container
      record = {
        id: `a${Date.now()}`,
        employeeId,
        date: today,
        clockInTime: clockInTime || new Date().toISOString(),
        breakInTime: breakInTime || new Date().toISOString(),
        clockOutTime: null,
        status: 'Present'
      };
      attendances.push(record);
    }
    if (!record.breakInTime) {
      record.breakInTime = breakInTime || new Date().toISOString();
    }
    if (record.breakOutTime) return res.status(400).json({ error: 'Already returned from break' });

    record.breakOutTime = new Date().toISOString();
    saveAttendances();
    res.json(record);
  });

  router.get('/attendance', (req, res) => res.json(attendances));

  router.get('/attendance/:employeeId', (req, res) => {
    const empAtt = attendances.filter(a => a.employeeId === req.params.employeeId);
    res.json(empAtt);
  });

  // Helper to detect overdue breaks and ensure manager notifications exist
  const syncOverdueBreakNotifications = (breakDurationMinutes = 45) => {
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();
    const limitMs = Number(breakDurationMinutes) * 60 * 1000;
    const overdueList: any[] = [];

    attendances.forEach(att => {
      if (att.date === today && att.breakInTime && !att.breakOutTime) {
        const breakStartTime = new Date(att.breakInTime).getTime();
        const elapsed = now - breakStartTime;
        if (elapsed > limitMs) {
          const overdueMinutes = Math.floor((elapsed - limitMs) / 60000);
          const emp = employees.find(e => e.id === att.employeeId);
          const empName = emp ? `${emp.firstName} ${emp.lastName}` : `Employee ${att.employeeId}`;

          overdueList.push({
            employeeId: att.employeeId,
            employeeName: empName,
            breakInTime: att.breakInTime,
            overdueMinutes: overdueMinutes > 0 ? overdueMinutes : 1
          });

          // Check if notification already exists for this overdue break today
          const alreadyNotified = notifications.some(
            n => n.type === 'overdue_break' && 
                 n.employeeId === att.employeeId && 
                 n.timestamp && n.timestamp.startsWith(today)
          );

          if (!alreadyNotified) {
            const newNotif = {
              id: `notif_break_${Date.now()}_${att.employeeId}`,
              type: 'overdue_break',
              title: 'Manager Alert: Overdue Break',
              message: `${empName} has exceeded the allocated break time (${breakDurationMinutes} mins) and has not broken out on time. Immediate manager review advised.`,
              time: 'Just now',
              timestamp: new Date().toISOString(),
              read: false,
              targetRole: 'Manager,HR',
              employeeId: att.employeeId,
              employeeName: empName,
              overdueMinutes: overdueMinutes > 0 ? overdueMinutes : 1
            };
            notifications.unshift(newNotif);
            saveNotifications();
          }
        }
      }
    });

    return overdueList;
  };

  // Check Overdue Breaks Endpoint (Alerts HR & Managers)
  router.post('/attendance/check-overdue-breaks', (req, res) => {
    const { breakDurationMinutes = 45 } = req.body;
    const overdueList = syncOverdueBreakNotifications(breakDurationMinutes);

    res.json({
      overdueCount: overdueList.length,
      overdueEmployees: overdueList,
      notifications
    });
  });

  // Notifications API
  router.get('/notifications', (req, res) => {
    const duration = req.query.breakDurationMinutes ? Number(req.query.breakDurationMinutes) : 45;
    syncOverdueBreakNotifications(duration);
    res.json(notifications);
  });

  router.post('/notifications', (req, res) => {
    const newNotif = {
      id: `notif_${Date.now()}`,
      time: 'Just now',
      timestamp: new Date().toISOString(),
      read: false,
      ...req.body
    };
    notifications.unshift(newNotif);
    saveNotifications();
    res.status(201).json(newNotif);
  });

  router.put('/notifications/:id/read', (req, res) => {
    const notif = notifications.find(n => n.id === req.params.id);
    if (notif) {
      notif.read = true;
      saveNotifications();
      return res.json(notif);
    }
    res.status(404).json({ error: 'Notification not found' });
  });

  router.post('/notifications/mark-all-read', (req, res) => {
    notifications.forEach(n => { n.read = true; });
    saveNotifications();
    res.json({ success: true, count: notifications.length });
  });

  // Module C: Leave Management
  router.post('/leaves', (req, res) => {
    const { employeeId, leaveType, startDate, endDate, submittedByRole } = req.body;
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const days = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24);
    if (leaveType === 'Sick' && days > 5) {
      return res.status(400).json({ error: 'Insufficient leave balance for 5+ sick days.' });
    }

    const leave = {
      id: `l${Date.now()}`,
      employeeId, leaveType, startDate, endDate, status: 'Pending', submittedByRole
    };
    leaveRequests.push(leave);
    res.status(201).json(leave);
  });

  router.get('/leaves', (req, res) => res.json(leaveRequests));

  router.put('/leaves/:id', (req, res) => {
    const { status, approvedBy } = req.body;
    const leave = leaveRequests.find(l => l.id === req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave not found' });
    
    leave.status = status;
    if (approvedBy) leave.approvedBy = approvedBy;
    
    res.json(leave);
  });

  // Module D: Payroll Management
  router.get('/payroll/structures', (req, res) => res.json(salaryStructures));
  router.post('/payroll/structures', (req, res) => {
    const { employeeId, baseSalary, allowances, deductions } = req.body;
    let structure = salaryStructures.find(s => s.employeeId === employeeId);
    if (structure) {
      structure.baseSalary = baseSalary;
      structure.allowances = allowances;
      structure.deductions = deductions;
    } else {
      structure = {
        id: `s${Date.now()}`,
        employeeId, baseSalary, allowances, deductions
      };
      salaryStructures.push(structure);
    }
    res.json(structure);
  });

  router.post('/payroll/generate', (req, res) => {
    const { employeeId, month, year } = req.body;
    const structure = salaryStructures.find(s => s.employeeId === employeeId);
    if (!structure) return res.status(404).json({ error: 'Salary structure not found' });

    const grossPay = structure.baseSalary + structure.allowances;
    const netPay = grossPay - structure.deductions;

    const payslip = {
      id: `p${Date.now()}`,
      employeeId,
      month,
      year,
      grossPay,
      netPay
    };
    payslips.push(payslip);
    res.status(201).json(payslip);
  });

  router.get('/payroll', (req, res) => res.json(payslips));
  router.get('/payroll/:employeeId', (req, res) => {
    const empPayslips = payslips.filter(p => p.employeeId === req.params.employeeId);
    res.json(empPayslips);
  });

  // Module E: Resignations
  router.get('/resignations', (req, res) => res.json(resignations));
  
  router.post('/resignations', (req, res) => {
    const { employeeId, lastWorkingDate, reason, submittedByRole } = req.body;
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    
    const existing = resignations.find(r => r.employeeId === employeeId);
    if (existing) return res.status(400).json({ error: 'Resignation request already exists for this employee' });

    const newResignation = {
      id: `r${Date.now()}`,
      employeeId,
      lastWorkingDate,
      reason,
      status: 'Pending',
      submittedByRole
    };
    resignations.push(newResignation);
    res.status(201).json(newResignation);
  });
  
  router.put('/resignations/:id', (req, res) => {
    const { status, approvedBy } = req.body;
    const resignation = resignations.find(r => r.id === req.params.id);
    if (!resignation) return res.status(404).json({ error: 'Resignation not found' });
    
    resignation.status = status;
    if (approvedBy) resignation.approvedBy = approvedBy;
    
    res.json(resignation);
  });

  // Module F: Terminations
  router.get('/terminations', (req, res) => res.json(terminations));
  
  router.post('/terminations', (req, res) => {
    const { employeeId, terminationType, noticeDate, terminationDate, submittedByRole } = req.body;
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    
    const existing = terminations.find(t => t.employeeId === employeeId);
    if (existing) return res.status(400).json({ error: 'Termination record already exists for this employee' });

    const newTermination = {
      id: `t${Date.now()}`,
      employeeId,
      terminationType,
      noticeDate,
      terminationDate,
      status: 'Pending',
      submittedByRole
    };
    terminations.push(newTermination);
    res.status(201).json(newTermination);
  });
  
  router.put('/terminations/:id', (req, res) => {
    const { status, approvedBy } = req.body;
    const termination = terminations.find(t => t.id === req.params.id);
    if (!termination) return res.status(404).json({ error: 'Termination not found' });
    
    termination.status = status;
    if (approvedBy) termination.approvedBy = approvedBy;
    
    res.json(termination);
  });

  // Module G: Holidays
  router.get('/holidays', (req, res) => res.json(holidays));
  
  router.post('/holidays', (req, res) => {
    const newHoliday = { id: `h${Date.now()}`, ...req.body };
    holidays.push(newHoliday);
    res.status(201).json(newHoliday);
  });
  
  router.delete('/holidays/:id', (req, res) => {
    holidays = holidays.filter(h => h.id !== req.params.id);
    res.status(204).end();
  });

  // Module H: Awards
  router.get('/awards', (req, res) => res.json(awards));
  
  router.post('/awards', (req, res) => {
    const { employeeId, awardType, date, gift, description } = req.body;
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    
    const newAward = {
      id: `aw${Date.now()}`,
      employeeId,
      awardType,
      date,
      gift,
      description
    };
    awards.push(newAward);
    res.status(201).json(newAward);
  });
  
  router.delete('/awards/:id', (req, res) => {
    awards = awards.filter(a => a.id !== req.params.id);
    res.status(204).end();
  });

  // Module I: Announcements
  router.get('/announcements', (req, res) => res.json(announcements));
  
  router.post('/announcements', (req, res) => {
    const newAnnouncement = {
      id: `an${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ...req.body
    };
    announcements.unshift(newAnnouncement);
    res.status(201).json(newAnnouncement);
  });
  
  router.put('/announcements/:id', (req, res) => {
    const index = announcements.findIndex(a => a.id === req.params.id);
    if (index !== -1) {
      announcements[index] = { ...announcements[index], ...req.body };
      res.json(announcements[index]);
    } else {
      res.status(404).json({ error: 'Announcement not found' });
    }
  });

  router.delete('/announcements/:id', (req, res) => {
    announcements = announcements.filter(a => a.id !== req.params.id);
    res.status(204).end();
  });

  // Module J: Events
  router.get('/events', (req, res) => res.json(events));
  
  router.post('/events', (req, res) => {
    const newEvent = {
      id: `ev${Date.now()}`,
      ...req.body
    };
    events.push(newEvent);
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    res.status(201).json(newEvent);
  });
  
  router.delete('/events/:id', (req, res) => {
    events = events.filter(e => e.id !== req.params.id);
    res.status(204).end();
  });

  // Clients
  router.get('/clients', (req, res) => res.json(clients));
  router.post('/clients', (req, res) => {
    const newClient = { id: `c${Date.now()}`, ...req.body };
    clients.push(newClient);
    res.status(201).json(newClient);
  });
  router.put('/clients/:id', (req, res) => {
    const index = clients.findIndex(c => c.id === req.params.id);
    if (index !== -1) {
      clients[index] = { ...clients[index], ...req.body };
      res.json(clients[index]);
    } else {
      res.status(404).json({ error: 'Client not found' });
    }
  });

  // Module K: Projects & Tasks
  router.get('/projects', (req, res) => res.json(projects));
  router.post('/projects', (req, res) => {
    const newProject = { id: `p${Date.now()}`, assignees: [], ...req.body };
    projects.push(newProject);
    res.status(201).json(newProject);
  });
  router.put('/projects/:id', (req, res) => {
    const index = projects.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...req.body };
      res.json(projects[index]);
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  });
  router.get('/tasks', (req, res) => res.json(tasks));
  
  router.get('/project-activities', (req, res) => res.json(projectActivities));
  
  router.post('/project-activities', (req, res) => {
    const newActivity = { id: `a${Date.now()}`, timestamp: new Date().toISOString(), ...req.body };
    projectActivities.unshift(newActivity);
    res.status(201).json(newActivity);
  });

  router.post('/tasks', (req, res) => {
    const newTask = { id: `t${Date.now()}`, ...req.body };
    tasks.push(newTask);
    res.status(201).json(newTask);
  });
  router.put('/tasks/:id', (req, res) => {
    const index = tasks.findIndex(t => t.id === req.params.id);
    if (index !== -1) {
      const oldTask = tasks[index];
      tasks[index] = { ...tasks[index], ...req.body };
      
      if (oldTask.status !== tasks[index].status) {
        projectActivities.unshift({
          id: `a${Date.now()}`,
          projectId: tasks[index].projectId,
          taskId: tasks[index].id,
          type: 'StatusChange',
          description: `Task "${tasks[index].name}" moved to ${tasks[index].status}`,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json(tasks[index]);
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  });
  router.delete('/tasks/:id', (req, res) => {
    tasks = tasks.filter(t => t.id !== req.params.id);
    res.status(204).end();
  });

  // Mount on both '/api' and '/' to guarantee routing works regardless of rewrite mode
  app.use('/api', router);
  app.use('/', router);

  // Serve public folder directly in dev mode just in case
  if (process.env.NODE_ENV !== "production") {
    app.use(express.static(path.join(process.cwd(), 'public')));
  }

  return app;
}

const app = createApp();

export default function handler(req: any, res: any) {
  return app(req, res);
}

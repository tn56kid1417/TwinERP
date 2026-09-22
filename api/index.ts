import express from 'express';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

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

let notifications: any[] = loadNotifications();

const saveNotifications = () => {
  try {
    fs.writeFileSync(NOTIFICATION_FILE, JSON.stringify(notifications, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save notifications to file:', err);
  }
};

export const addNotification = (notif: { title: string; message: string; type?: string; targetRole?: string; targetUserId?: string }) => {
  const newNotif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    time: 'Just now',
    timestamp: new Date().toISOString(),
    read: false,
    type: notif.type || 'mention',
    ...notif
  };
  notifications.unshift(newNotif);
  saveNotifications();
  return newNotif;
};

// --- In-Memory Database ---
export let employees: any[] = [
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

export const DEFAULT_CAREER_TEMPLATES = {
  applicationConfirmationTemplate: `<p>Dear {{fullName}},</p>
<p>Thank you for applying to <strong>{{jobTitle}}</strong> at TwinSpace.</p>
<p>We have received your application and will review it shortly. You will be notified about next steps.</p>
<p>Warm regards,<br/>TwinSpace Hiring Team</p>`,

  rejectionTemplate: `<p>Dear {{fullName}},</p>
<p>Thank you for your interest in <strong>{{jobTitle}}</strong> at TwinSpace.</p>
<p>After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.</p>
<p>We appreciate the time and effort you invested and encourage you to apply for future openings that match your profile.</p>
<p>Warm regards,<br/>TwinSpace Hiring Team</p>`,

  roundAdvanceTemplate: `<p>Dear {{fullName}},</p>
<p>Congratulations! You have been shortlisted for the next stage of our hiring process for <strong>{{jobTitle}}</strong>.</p>
<p><strong>{{roundTitle}}</strong></p>
<p>{{roundShortDescription}}</p>
<p>{{roundLongDescription}}</p>
<p>Our team will be in touch shortly with further details. Please reply to this email if you have any questions.</p>
<p>Best regards,<br/>TwinSpace Hiring Team</p>`,

  hireTemplate: `<p>Dear {{fullName}},</p>
<p>We are delighted to inform you that you have been selected for <strong>{{jobTitle}}</strong> at TwinSpace!</p>
<p>Our hiring team will contact you shortly with next steps regarding onboarding and formalities.</p>
<p>Congratulations and welcome aboard!</p>
<p>Warm regards,<br/>TwinSpace Hiring Team</p>`,
};

export function renderTemplate(template: string, context: Record<string, string>): string {
  return (template || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return context[key] !== undefined ? String(context[key]) : '';
  });
}

export function buildMergeContext(application: any, job: any, round: any = null): Record<string, string> {
  return {
    fullName: application.fullName || application.candidateName || '',
    email: application.email || application.candidateEmail || '',
    phone: application.phone || application.candidatePhone || '',
    qualification: application.qualification || '',
    experience: application.experience || '',
    currentOrg: application.currentOrg || '',
    resumeLink: application.resumeLink || application.resumeUrl || '',
    coverNote: application.coverNote || '',
    jobTitle: job?.title || '',
    jobSlug: job?.slug || '',
    roundTitle: round?.title || '',
    roundShortDescription: round?.shortDescription || '',
    roundLongDescription: round?.longDescription || '',
    companyName: 'TwinSpace',
  };
}

const loadChatFile = (file: string, seeder: () => any[]): any[] => {
  try {
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(`Failed to load ${file}:`, e);
  }
  return typeof seeder === 'function' ? seeder() : [];
};

const saveChatFile = (file: string, data: any) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Failed to save ${file}:`, e);
  }
};

const JOBS_FILE = process.env.VERCEL ? '/tmp/erp_jobs.json' : path.join(process.cwd(), '.jobs.json');
const APPLICATIONS_FILE = process.env.VERCEL ? '/tmp/erp_applications.json' : path.join(process.cwd(), '.applications.json');

const seedJobPostings = (): any[] => [
  {
    id: 'job-1',
    title: 'Senior Full Stack Engineer',
    slug: 'senior-full-stack-engineer',
    status: 'PUBLISHED',
    department: 'Engineering',
    location: 'Remote / Chennai',
    employmentType: 'Full-Time',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    applicationConfirmationTemplate: DEFAULT_CAREER_TEMPLATES.applicationConfirmationTemplate,
    roundAdvanceTemplate: DEFAULT_CAREER_TEMPLATES.roundAdvanceTemplate,
    rejectionTemplate: DEFAULT_CAREER_TEMPLATES.rejectionTemplate,
    hireTemplate: DEFAULT_CAREER_TEMPLATES.hireTemplate,
    fields: [
      { id: 'f1', label: 'Experience', value: '4+ Years in Node & React', fieldType: 'TEXT', section: 'PRIMARY', order: 1 },
      { id: 'f2', label: 'Salary Range', value: '$80,000 - $110,000 / yr', fieldType: 'TAG', section: 'PRIMARY', order: 2 },
      { id: 'f3', label: 'Tech Stack', value: 'React, TypeScript, Express, Tailwind', fieldType: 'TAG', section: 'PRIMARY', order: 3 },
      { id: 'f4', label: 'Job Description', value: 'We are seeking an experienced Full Stack Engineer to lead architectural design and feature development for our core ERP applications.', fieldType: 'TEXTAREA', section: 'SECONDARY', order: 1 },
      { id: 'f5', label: 'Perks', value: 'Health insurance, annual learning stipend, flexible remote schedule.', fieldType: 'TEXTAREA', section: 'SECONDARY', order: 2 },
    ],
    rounds: [
      { id: 'r1', title: 'Resume Screening', shortDescription: 'Initial profile review by HR', order: 1 },
      { id: 'r2', title: 'Technical Interview', shortDescription: 'System design and live coding', order: 2 },
      { id: 'r3', title: 'Cultural Fit & Leadership', shortDescription: 'Discussion with Engineering Director', order: 3 },
      { id: 'r4', title: 'Offer & Finalization', shortDescription: 'Salary breakdown and onboarding terms', order: 4 },
    ]
  },
  {
    id: 'job-2',
    title: 'UI/UX Product Designer',
    slug: 'ui-ux-product-designer',
    status: 'PUBLISHED',
    department: 'Design',
    location: 'Hybrid',
    employmentType: 'Full-Time',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    applicationConfirmationTemplate: DEFAULT_CAREER_TEMPLATES.applicationConfirmationTemplate,
    roundAdvanceTemplate: DEFAULT_CAREER_TEMPLATES.roundAdvanceTemplate,
    rejectionTemplate: DEFAULT_CAREER_TEMPLATES.rejectionTemplate,
    hireTemplate: DEFAULT_CAREER_TEMPLATES.hireTemplate,
    fields: [
      { id: 'f21', label: 'Experience', value: '3+ Years in SaaS UX', fieldType: 'TEXT', section: 'PRIMARY', order: 1 },
      { id: 'f22', label: 'Tooling', value: 'Figma, Design Systems, Prototyping', fieldType: 'TAG', section: 'PRIMARY', order: 2 },
      { id: 'f23', label: 'Overview', value: 'Craft intuitive, visually breathtaking enterprise workflows.', fieldType: 'TEXTAREA', section: 'SECONDARY', order: 1 }
    ],
    rounds: [
      { id: 'r21', title: 'Portfolio Review', shortDescription: 'Walkthrough of past designs', order: 1 },
      { id: 'r22', title: 'Design Challenge', shortDescription: '48hr mock design sprint', order: 2 },
      { id: 'r23', title: 'Founder Alignment', shortDescription: 'Vision and fit', order: 3 }
    ]
  }
];

let jobPostings: any[] = loadChatFile(JOBS_FILE, seedJobPostings);
const saveJobPostings = () => saveChatFile(JOBS_FILE, jobPostings);

let jobApplications: any[] = loadChatFile(APPLICATIONS_FILE, () => [
  {
    id: 'app-1',
    jobId: 'job-1',
    candidateName: 'Vikram Sundaram',
    candidateEmail: 'vikram.s@example.com',
    candidatePhone: '+91 98401 23456',
    resumeUrl: 'https://example.com/resumes/vikram.pdf',
    portfolioUrl: 'https://github.com/vikrams',
    currentRoundId: 'r2',
    status: 'INTERVIEWING',
    appliedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    notes: 'Exceptional TypeScript knowledge. Completed round 1 with top remarks.',
    rating: 5
  },
  {
    id: 'app-2',
    jobId: 'job-1',
    candidateName: 'Priya Narayanan',
    candidateEmail: 'priya.n@example.com',
    candidatePhone: '+91 97890 54321',
    resumeUrl: 'https://example.com/resumes/priya.pdf',
    portfolioUrl: 'https://linkedin.com/in/priya',
    currentRoundId: 'r1',
    status: 'IN_REVIEW',
    appliedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    notes: 'Solid full-stack background, 5 years exp.',
    rating: 4
  },
  {
    id: 'app-3',
    jobId: 'job-2',
    candidateName: 'Aravind Menon',
    candidateEmail: 'aravind.m@example.com',
    candidatePhone: '+91 99400 11223',
    resumeUrl: 'https://example.com/resumes/aravind.pdf',
    portfolioUrl: 'https://dribbble.com/aravind',
    currentRoundId: 'r22',
    status: 'INTERVIEWING',
    appliedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    notes: 'Superb visual craftsmanship and typography.',
    rating: 5
  }
]);

let hrDocuments: any[] = [
  { id: 'doc-1', name: 'Employee Code of Conduct 2026', category: 'Policy', uploadedAt: '2026-01-10T10:00:00Z', fileUrl: 'https://example.com/docs/code_of_conduct_2026.pdf', fileSize: '1.2 MB' },
  { id: 'doc-2', name: 'Information Security & Data Protection Policy', category: 'Security', uploadedAt: '2026-01-15T11:30:00Z', fileUrl: 'https://example.com/docs/infosec_policy.pdf', fileSize: '850 KB' },
  { id: 'doc-3', name: 'Health & Remote Work Guidelines', category: 'HR Guidelines', uploadedAt: '2026-02-01T09:15:00Z', fileUrl: 'https://example.com/docs/remote_work.pdf', fileSize: '520 KB' },
];

let agreements: any[] = [
  { id: 'agr-1', employee: 'Alice Smith', duration: 'Permanent / Full-Time', agreementType: 'Employment Contract', startDate: '2023-01-15', endDate: '2028-01-15', fileUrl: 'https://example.com/contracts/alice_employment.pdf', status: 'Active' },
  { id: 'agr-2', employee: 'Bob Johnson', duration: 'Permanent / Full-Time', agreementType: 'Non-Disclosure Agreement', startDate: '2022-11-01', endDate: '2027-11-01', fileUrl: 'https://example.com/contracts/bob_nda.pdf', status: 'Active' },
  { id: 'agr-3', employee: 'David Developer', duration: '12 Months', agreementType: 'Consultant & IP Agreement', startDate: '2023-03-20', endDate: '2024-03-20', fileUrl: 'https://example.com/contracts/david_consultant.pdf', status: 'Active' },
];

let documentTemplates: any[] = [
  { id: 'tpl-1', name: 'Standard Full-Time Offer Letter', type: 'Offer Letter', fileUrl: 'https://example.com/templates/offer_letter.docx', description: 'Standard compensation and joining formal letter' },
  { id: 'tpl-2', name: 'Summer & Fall Intern Agreement', type: 'Intern Letter', fileUrl: 'https://example.com/templates/intern_agreement.docx', description: 'Stipend, project scope and internship duration' },
  { id: 'tpl-3', name: 'Mutual NDA Agreement', type: 'NDA', fileUrl: 'https://example.com/templates/mutual_nda.docx', description: 'Standard company and employee IP & confidentiality pact' },
  { id: 'tpl-4', name: 'Consulting Scope & Quotation', type: 'Quotation', fileUrl: 'https://example.com/templates/quotation.docx', description: 'External vendor or contractor quotation template' },
];

let promotions: any[] = [
  { id: 'pro-1', employee: 'Alice Smith', oldDepartment: 'Engineering', oldRole: 'Junior Developer', newDepartment: 'Engineering', newRole: 'Senior Developer', effectiveDate: '2025-01-01', approvedBy: 'Jane CTO' },
  { id: 'pro-2', employee: 'David Developer', oldDepartment: 'Engineering', oldRole: 'Developer', newDepartment: 'Engineering', newRole: 'Lead Engineer', effectiveDate: '2025-06-01', approvedBy: 'John CEO' },
];

let complaints: any[] = [
  { id: 'cmp-1', employee: 'Eve Engineer', category: 'Workplace', targetEmployee: 'Management', description: 'Requesting ergonomic monitors for 2nd floor workstations.', status: 'Resolved', submittedDate: '2026-02-10' },
  { id: 'cmp-2', employee: 'Frank Frontend', category: 'Salary', description: 'Discrepancy in overtime computation for weekend deployment.', status: 'Investigating', submittedDate: '2026-03-01' },
];

// ─── Supabase Server-side Client (Service Role) ─────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;

export function isSupabaseReady(): boolean {
  return supabaseAdmin !== null;
}

// ─── Chat In-Memory / File Storage Fallback Engine ───────────────────────────
const CHAT_TEAMS_FILE = process.env.VERCEL ? '/tmp/erp_chat_teams.json' : path.join(process.cwd(), '.chat_teams.json');
const CHAT_MEMBERS_FILE = process.env.VERCEL ? '/tmp/erp_chat_members.json' : path.join(process.cwd(), '.chat_members.json');
const CHAT_MSGS_FILE = process.env.VERCEL ? '/tmp/erp_chat_msgs.json' : path.join(process.cwd(), '.chat_msgs.json');
const CHAT_READS_FILE = process.env.VERCEL ? '/tmp/erp_chat_reads.json' : path.join(process.cwd(), '.chat_reads.json');
const CHAT_ATTS_FILE = process.env.VERCEL ? '/tmp/erp_chat_atts.json' : path.join(process.cwd(), '.chat_atts.json');

const seedChatTeams = (): any[] => [
  {
    id: 'team-general',
    name: 'General & Company Wide',
    created_by: 'e3',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    restrict_history_to_membership_window: false
  },
  {
    id: 'team-engineering',
    name: 'Engineering Pod',
    created_by: 'e5',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    restrict_history_to_membership_window: false
  },
  {
    id: 'team-sales',
    name: 'Sales & Client Success',
    created_by: 'e4',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    restrict_history_to_membership_window: false
  }
];

const seedChatMembers = (): any[] => {
  const members: any[] = [];
  // All employees belong to General team
  employees.forEach((emp) => {
    members.push({
      id: `mem-gen-${emp.id}`,
      team_id: 'team-general',
      user_id: emp.id,
      role_in_team: emp.role === 'Admin' ? 'Admin' : (emp.role === 'Manager' || emp.role === 'Team Leader' ? 'Leader' : 'Member'),
      can_post: true,
      can_delete_others_messages: ['Admin', 'HR', 'CEO', 'CTO', 'Manager'].includes(emp.role),
      can_remove_members: ['Admin', 'HR', 'CEO', 'CTO'].includes(emp.role),
      view_only: false,
      status: 'active',
      joined_at: new Date(Date.now() - 7 * 86400000).toISOString()
    });
  });

  // Engineering members
  const engEmployees = employees.filter(e => e.department === 'Engineering' || e.role === 'Admin' || e.role === 'CTO');
  engEmployees.forEach((emp) => {
    members.push({
      id: `mem-eng-${emp.id}`,
      team_id: 'team-engineering',
      user_id: emp.id,
      role_in_team: emp.role === 'CTO' ? 'Lead Architect' : (emp.role === 'Team Leader' ? 'Tech Lead' : (emp.role === 'Admin' ? 'Admin' : 'Developer')),
      can_post: true,
      can_delete_others_messages: ['Admin', 'CTO', 'Team Leader'].includes(emp.role),
      can_remove_members: ['Admin', 'CTO'].includes(emp.role),
      view_only: false,
      status: 'active',
      joined_at: new Date(Date.now() - 5 * 86400000).toISOString()
    });
  });

  // Sales members
  const salesEmployees = employees.filter(e => e.department === 'Sales' || e.role === 'Admin' || e.role === 'CEO');
  salesEmployees.forEach((emp) => {
    members.push({
      id: `mem-sales-${emp.id}`,
      team_id: 'team-sales',
      user_id: emp.id,
      role_in_team: emp.role === 'CEO' ? 'Executive' : (emp.role === 'Team Leader' ? 'Sales Lead' : 'Account Rep'),
      can_post: true,
      can_delete_others_messages: ['Admin', 'CEO', 'Team Leader'].includes(emp.role),
      can_remove_members: ['Admin', 'CEO'].includes(emp.role),
      view_only: false,
      status: 'active',
      joined_at: new Date(Date.now() - 3 * 86400000).toISOString()
    });
  });

  return members;
};

const seedChatMessages = (): any[] => [
  {
    id: 'msg-gen-1',
    team_id: 'team-general',
    sender_id: 'system',
    content: 'Team "General & Company Wide" was created.',
    type: 'system',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'msg-gen-2',
    team_id: 'team-general',
    sender_id: 'e3',
    content: 'Welcome to TwinERP Team Chat! Here you can collaborate across all teams, share documents, mention teammates with @name, and track project milestones.',
    type: 'text',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString()
  },
  {
    id: 'msg-eng-1',
    team_id: 'team-engineering',
    sender_id: 'system',
    content: 'Team "Engineering Pod" was created.',
    type: 'system',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'msg-eng-2',
    team_id: 'team-engineering',
    sender_id: 'e5',
    content: 'Welcome engineering team. Please share your daily sprint blockers and pull requests here.',
    type: 'text',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'msg-sales-1',
    team_id: 'team-sales',
    sender_id: 'system',
    content: 'Team "Sales & Client Success" was created.',
    type: 'system',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'msg-sales-2',
    team_id: 'team-sales',
    sender_id: 'e10',
    content: 'Q3 lead distribution is updated on the CRM dashboard. Let us hit our targets this month!',
    type: 'text',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

let localChatTeams: any[] = loadChatFile(CHAT_TEAMS_FILE, seedChatTeams);
let localChatMembers: any[] = loadChatFile(CHAT_MEMBERS_FILE, seedChatMembers);
let localChatMessages: any[] = loadChatFile(CHAT_MSGS_FILE, seedChatMessages);
let localChatReadStates: any[] = loadChatFile(CHAT_READS_FILE, () => []);
let localChatAttachments: any[] = loadChatFile(CHAT_ATTS_FILE, () => []);

const persistChatTeams = () => saveChatFile(CHAT_TEAMS_FILE, localChatTeams);
const persistChatMembers = () => saveChatFile(CHAT_MEMBERS_FILE, localChatMembers);
const persistChatMessages = () => saveChatFile(CHAT_MSGS_FILE, localChatMessages);
const persistChatReadStates = () => saveChatFile(CHAT_READS_FILE, localChatReadStates);
const persistChatAttachments = () => saveChatFile(CHAT_ATTS_FILE, localChatAttachments);

// ─── Chat Auth & Helpers ───────────────────────────────────────────────────
function getCallerFromHeaders(req: express.Request): { userId: string; userRole: string } | null {
  const userId   = req.headers['x-user-id']   as string | undefined;
  const userRole = req.headers['x-user-role'] as string | undefined;
  if (!userId) return null;
  return { userId, userRole: userRole || 'Member' };
}

function isElevated(role: string): boolean {
  return ['Admin', 'HR', 'CEO', 'CTO', 'Manager'].includes(role);
}

export async function postSystemMessage(teamId: string, text: string): Promise<void> {
  const sysMsg = {
    id:        `sys-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    team_id:   teamId,
    sender_id: 'system',
    content:   text,
    type:      'system',
    created_at: new Date().toISOString()
  };

  localChatMessages.push(sysMsg);
  persistChatMessages();

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('chat_messages').insert(sysMsg);
    } catch (e) {
      console.warn('[chat] Supabase system message error (fallback used):', e);
    }
  }
}

// ─── Team Chat Router ───────────────────────────────────────────────────────
export const chatRouter = express.Router();

// GET /api/chat/teams — list teams caller is an active member of
chatRouter.get('/chat/teams', async (req: express.Request, res: express.Response) => {
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  // 1. Try Supabase if configured
  if (supabaseAdmin) {
    try {
      const sb = supabaseAdmin;
      const { data: memberships, error: mErr } = await sb
        .from('chat_team_memberships')
        .select('team_id, role_in_team, can_post, view_only, joined_at')
        .eq('user_id', caller.userId)
        .eq('status', 'active');

      if (!mErr && memberships) {
        if (!memberships.length) return void res.json([]);
        const teamIds = memberships.map(m => m.team_id);
        const { data: teams, error: tErr } = await sb.from('chat_teams').select('*').in('id', teamIds);
        if (!tErr && teams) {
          const { data: readStates } = await sb
            .from('chat_message_read_state')
            .select('team_id, last_read_message_id')
            .eq('user_id', caller.userId)
            .in('team_id', teamIds);

          const result = await Promise.all(teams.map(async team => {
            const membership = memberships.find(m => m.team_id === team.id)!;
            const readState  = readStates?.find(r => r.team_id === team.id);
            let unreadCount = 0;
            if (readState?.last_read_message_id) {
              const { data: lastMsg } = await sb
                .from('chat_messages')
                .select('created_at')
                .eq('id', readState.last_read_message_id)
                .single();
              if (lastMsg) {
                const { count } = await sb
                  .from('chat_messages')
                  .select('id', { count: 'exact', head: true })
                  .eq('team_id', team.id)
                  .is('deleted_at', null)
                  .neq('sender_id', caller.userId)
                  .gt('created_at', lastMsg.created_at);
                unreadCount = count || 0;
              }
            } else {
              const { count } = await sb
                .from('chat_messages')
                .select('id', { count: 'exact', head: true })
                .eq('team_id', team.id)
                .is('deleted_at', null)
                .neq('sender_id', caller.userId);
              unreadCount = count || 0;
            }
            return {
              ...team,
              membership: {
                roleInTeam: membership.role_in_team,
                canPost:    membership.can_post,
                viewOnly:   membership.view_only,
                joinedAt:   membership.joined_at,
              },
              unreadCount,
            };
          }));
          return void res.json(result);
        }
      }
    } catch (e) {
      console.warn('[chat] Supabase get teams error, using fallback:', e);
    }
  }

  // 2. Resilient local fallback:
  let userMemberships = localChatMembers.filter(m => m.user_id === caller.userId && m.status === 'active');

  // If elevated role has no memberships, automatically ensure they are members of default teams
  if (userMemberships.length === 0 && isElevated(caller.userRole)) {
    localChatTeams.forEach(t => {
      const exists = localChatMembers.find(m => m.team_id === t.id && m.user_id === caller.userId);
      if (!exists) {
        localChatMembers.push({
          id: `mem-${t.id}-${caller.userId}`,
          team_id: t.id,
          user_id: caller.userId,
          role_in_team: caller.userRole,
          can_post: true,
          can_delete_others_messages: true,
          can_remove_members: true,
          view_only: false,
          status: 'active',
          joined_at: new Date().toISOString()
        });
      }
    });
    persistChatMembers();
    userMemberships = localChatMembers.filter(m => m.user_id === caller.userId && m.status === 'active');
  }

  const teamIds = new Set(userMemberships.map(m => m.team_id));
  const accessibleTeams = localChatTeams.filter(t => teamIds.has(t.id));

  const result = accessibleTeams.map(team => {
    const membership = userMemberships.find(m => m.team_id === team.id)!;
    const readState = localChatReadStates.find(r => r.team_id === team.id && r.user_id === caller.userId);

    let unreadCount = 0;
    const teamMsgs = localChatMessages.filter(m => m.team_id === team.id && !m.deleted_at && m.sender_id !== caller.userId);

    if (readState?.last_read_message_id) {
      const lastMsg = localChatMessages.find(m => m.id === readState.last_read_message_id);
      if (lastMsg) {
        unreadCount = teamMsgs.filter(m => new Date(m.created_at).getTime() > new Date(lastMsg.created_at).getTime()).length;
      } else {
        unreadCount = teamMsgs.length;
      }
    } else {
      unreadCount = teamMsgs.length;
    }

    return {
      ...team,
      membership: {
        roleInTeam: membership ? membership.role_in_team : caller.userRole,
        canPost:    membership ? membership.can_post : true,
        viewOnly:   membership ? membership.view_only : false,
        joinedAt:   membership ? membership.joined_at : team.created_at,
      },
      unreadCount,
    };
  });

  res.json(result);
});

// POST /api/chat/teams — create team (HR/Admin/Managers)
chatRouter.post('/chat/teams', async (req: express.Request, res: express.Response) => {
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });
  if (!isElevated(caller.userRole)) return void res.status(403).json({ error: 'Only HR/Admin/Managers can create teams' });

  const { name, memberIds = [], restrictHistory = false } = req.body;
  if (!name?.trim()) return void res.status(400).json({ error: 'Team name is required' });

  const teamId = `team-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const newTeam = {
    id: teamId,
    name: name.trim(),
    created_by: caller.userId,
    created_at: now,
    restrict_history_to_membership_window: Boolean(restrictHistory)
  };

  const creatorMembership = {
    id: `mem-${Date.now()}-creator`,
    team_id: teamId,
    user_id: caller.userId,
    role_in_team: caller.userRole,
    can_post: true,
    can_delete_others_messages: true,
    can_remove_members: true,
    view_only: false,
    status: 'active',
    joined_at: now
  };

  const additionalMembers = (Array.isArray(memberIds) ? memberIds : [])
    .filter((id: string) => id && id !== caller.userId)
    .map((uid: string, i: number) => ({
      id: `mem-${Date.now()}-${i}`,
      team_id: teamId,
      user_id: uid,
      role_in_team: 'Member',
      can_post: true,
      can_delete_others_messages: false,
      can_remove_members: false,
      view_only: false,
      status: 'active',
      joined_at: now
    }));

  const allNewMembers = [creatorMembership, ...additionalMembers];

  // 1. Try Supabase if configured
  if (supabaseAdmin) {
    try {
      const sb = supabaseAdmin;
      const { data: team, error: tErr } = await sb.from('chat_teams').insert(newTeam).select().single();
      if (!tErr && team) {
        await sb.from('chat_team_memberships').insert(allNewMembers);
        await postSystemMessage(teamId, `Team "${name}" was created.`);
        return void res.status(201).json(team);
      }
    } catch (e) {
      console.warn('[chat] Supabase create team error, using fallback:', e);
    }
  }

  // 2. Resilient local fallback:
  localChatTeams.unshift(newTeam);
  localChatMembers.push(...allNewMembers);
  persistChatTeams();
  persistChatMembers();

  await postSystemMessage(teamId, `Team "${name}" was created.`);
  res.status(201).json(newTeam);
});

// GET /api/chat/teams/:teamId — team metadata + member list
chatRouter.get('/chat/teams/:teamId', async (req: express.Request, res: express.Response) => {
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId } = req.params;

  // 1. Try Supabase if configured
  if (supabaseAdmin) {
    try {
      const sb = supabaseAdmin;
      const [teamRes, membersRes] = await Promise.all([
        sb.from('chat_teams').select('*').eq('id', teamId).single(),
        sb.from('chat_team_memberships').select('*').eq('team_id', teamId),
      ]);
      if (!teamRes.error && teamRes.data) {
        return void res.json({ team: teamRes.data, members: membersRes.data || [] });
      }
    } catch (e) {
      console.warn('[chat] Supabase team detail error, using fallback:', e);
    }
  }

  // 2. Resilient local fallback:
  const team = localChatTeams.find(t => t.id === teamId);
  if (!team) return void res.status(404).json({ error: 'Team not found' });

  const members = localChatMembers.filter(m => m.team_id === teamId);
  res.json({ team, members });
});

// GET /api/chat/teams/:teamId/messages — paginated messages
chatRouter.get('/chat/teams/:teamId/messages', async (req: express.Request, res: express.Response) => {
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId } = req.params;
  const before = req.query.before as string | undefined;
  const limit  = Math.min(parseInt(req.query.limit as string || '50', 10), 100);

  // 1. Try Supabase if configured
  if (supabaseAdmin) {
    try {
      const sb = supabaseAdmin;
      const { data: team } = await sb.from('chat_teams').select('restrict_history_to_membership_window').eq('id', teamId).single();
      const { data: membership } = await sb.from('chat_team_memberships').select('*').eq('team_id', teamId).eq('user_id', caller.userId).eq('status', 'active').single();

      let query = sb.from('chat_messages').select('*').eq('team_id', teamId).order('created_at', { ascending: false }).limit(limit);

      if (team?.restrict_history_to_membership_window && membership?.joined_at) {
        query = query.gte('created_at', membership.joined_at);
      }
      if (before) {
        const { data: pivot } = await sb.from('chat_messages').select('created_at').eq('id', before).single();
        if (pivot) query = query.lt('created_at', pivot.created_at);
      }

      const { data: messages, error } = await query;
      if (!error && messages) {
        const msgIds = messages.map(m => m.id);
        let attachmentsByMsg: Record<string, any[]> = {};
        if (msgIds.length > 0) {
          const { data: atts } = await sb.from('chat_message_attachments').select('*').in('message_id', msgIds);
          if (atts) {
            atts.forEach(a => {
              if (!attachmentsByMsg[a.message_id]) attachmentsByMsg[a.message_id] = [];
              attachmentsByMsg[a.message_id].push(a);
            });
          }
        }
        const enriched = messages.map(m => ({ ...m, attachments: attachmentsByMsg[m.id] || [] }));
        return void res.json(enriched.reverse());
      }
    } catch (e) {
      console.warn('[chat] Supabase get messages error, using fallback:', e);
    }
  }

  // 2. Resilient local fallback:
  const team = localChatTeams.find(t => t.id === teamId);
  const membership = localChatMembers.find(m => m.team_id === teamId && m.user_id === caller.userId && m.status === 'active');

  let filtered = localChatMessages.filter(m => m.team_id === teamId);

  if (team?.restrict_history_to_membership_window && membership?.joined_at) {
    filtered = filtered.filter(m => new Date(m.created_at).getTime() >= new Date(membership.joined_at).getTime());
  }

  if (before) {
    const pivot = localChatMessages.find(m => m.id === before);
    if (pivot) {
      filtered = filtered.filter(m => new Date(m.created_at).getTime() < new Date(pivot.created_at).getTime());
    }
  }

  // Sort newest first to slice limit
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const sliced = filtered.slice(0, limit);

  const enriched = sliced.map(m => {
    const attachments = localChatAttachments.filter(a => a.message_id === m.id);
    return { ...m, attachments };
  });

  // Return chronological (ascending)
  res.json(enriched.reverse());
});

// POST /api/chat/teams/:teamId/messages — send a message
chatRouter.post('/chat/teams/:teamId/messages', async (req: express.Request, res: express.Response) => {
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId } = req.params;
  const { content, type = 'text', attachments = [] } = req.body;
  if (!content?.trim() && (!attachments || attachments.length === 0)) {
    return void res.status(400).json({ error: 'Message content or attachment required' });
  }

  const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const msgType = attachments && attachments.length > 0 && !content?.trim() ? 'file' : type;
  const now = new Date().toISOString();

  const newMsg = {
    id: msgId,
    team_id: teamId,
    sender_id: caller.userId,
    content: (content || '').trim(),
    type: msgType,
    created_at: now
  };

  const savedAttachments: any[] = [];
  if (Array.isArray(attachments) && attachments.length > 0) {
    attachments.forEach((att: any, idx: number) => {
      const attObj = {
        id: `att-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        message_id: msgId,
        url: att.url,
        file_name: att.fileName || att.file_name || 'attachment',
        mime_type: att.mimeType || att.mime_type || 'application/octet-stream',
      };
      savedAttachments.push(attObj);
      localChatAttachments.push(attObj);
    });
    persistChatAttachments();
  }

  // Always save in local storage:
  localChatMessages.push(newMsg);
  persistChatMessages();

  // Upsert read state for sender
  const existingReadIndex = localChatReadStates.findIndex(r => r.team_id === teamId && r.user_id === caller.userId);
  if (existingReadIndex >= 0) {
    localChatReadStates[existingReadIndex].last_read_message_id = msgId;
    localChatReadStates[existingReadIndex].updated_at = now;
  } else {
    localChatReadStates.push({
      user_id: caller.userId,
      team_id: teamId,
      last_read_message_id: msgId,
      updated_at: now
    });
  }
  persistChatReadStates();

  // 1. Try syncing to Supabase if configured
  if (supabaseAdmin) {
    try {
      const sb = supabaseAdmin;
      await sb.from('chat_messages').insert(newMsg);
      if (savedAttachments.length > 0) {
        await sb.from('chat_message_attachments').insert(savedAttachments);
      }
      await sb.from('chat_message_read_state').upsert({
        user_id: caller.userId,
        team_id: teamId,
        last_read_message_id: msgId,
        updated_at: now
      }, { onConflict: 'user_id,team_id' });
    } catch (e) {
      console.warn('[chat] Supabase message sync warning:', e);
    }
  }

  // 2. Parse @mentions and trigger ERP notification pipeline
  try {
    const mentionRegex = /@([a-zA-Z0-9_.-]+(?:\s+[a-zA-Z0-9_.-]+)?)/g;
    const mentions = (content || '').match(mentionRegex);
    if (mentions && mentions.length > 0) {
      const teamObj = localChatTeams.find(t => t.id === teamId);
      const teamName = teamObj?.name || 'team chat';

      const activeMemberIds = new Set(
        localChatMembers
          .filter(m => m.team_id === teamId && m.status === 'active')
          .map(m => m.user_id)
      );

      if (Array.isArray(employees) && typeof addNotification === 'function') {
        const cleanedMentions = mentions.map((m: string) => m.slice(1).toLowerCase().trim());

        employees.forEach((emp: any) => {
          if (emp.id === caller.userId) return; // Do not notify self
          if (!activeMemberIds.has(emp.id)) return; // Only notify team members

          const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase().trim();
          const firstName = (emp.firstName || '').toLowerCase().trim();
          const username = (emp.email ? emp.email.split('@')[0] : '').toLowerCase().trim();

          const isMentioned = cleanedMentions.some((m: string) =>
            m === fullName || m === firstName || m === username || m === emp.id.toLowerCase()
          );

          if (isMentioned) {
            addNotification({
              title: `Mentioned in ${teamName}`,
              message: `${caller.userId} mentioned you in ${teamName}: "${content.length > 60 ? content.slice(0, 57) + '...' : content}"`,
              type: 'mention',
              targetRole: 'All',
              targetUserId: emp.id
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('[chat] Failed to process mentions:', err);
  }

  res.status(201).json({
    ...newMsg,
    attachments: savedAttachments
  });
});

// PATCH /api/chat/teams/:teamId/messages/:messageId — edit own message
chatRouter.patch('/chat/teams/:teamId/messages/:messageId', async (req: express.Request, res: express.Response) => {
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId, messageId } = req.params;
  const { content } = req.body;
  if (!content?.trim()) return void res.status(400).json({ error: 'Content required' });

  const msg = localChatMessages.find(m => m.id === messageId && m.team_id === teamId);
  if (!msg) return void res.status(404).json({ error: 'Message not found' });
  if (msg.deleted_at) return void res.status(400).json({ error: 'Cannot edit a deleted message' });
  if (msg.type === 'system') return void res.status(403).json({ error: 'System messages cannot be edited' });
  if (msg.sender_id !== caller.userId) return void res.status(403).json({ error: 'Can only edit your own messages' });

  msg.content = content.trim();
  msg.edited_at = new Date().toISOString();
  persistChatMessages();

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('chat_messages').update({ content: msg.content, edited_at: msg.edited_at }).eq('id', messageId);
    } catch (e) {
      console.warn('[chat] Supabase edit message sync warning:', e);
    }
  }

  res.json(msg);
});

// DELETE /api/chat/teams/:teamId/messages/:messageId — soft delete
chatRouter.delete('/chat/teams/:teamId/messages/:messageId', async (req: express.Request, res: express.Response) => {
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId, messageId } = req.params;
  const msg = localChatMessages.find(m => m.id === messageId && m.team_id === teamId);

  if (!msg) return void res.status(404).json({ error: 'Message not found' });
  if (msg.deleted_at) return void res.status(400).json({ error: 'Already deleted' });
  if (msg.type === 'system') return void res.status(403).json({ error: 'System messages cannot be deleted' });

  const isOwn = msg.sender_id === caller.userId;
  if (!isOwn) {
    const mem = localChatMembers.find(m => m.team_id === teamId && m.user_id === caller.userId && m.status === 'active');
    const canDelete = isElevated(caller.userRole) || mem?.can_delete_others_messages;
    if (!canDelete) return void res.status(403).json({ error: 'Not authorized to delete this message' });
  }

  msg.deleted_at = new Date().toISOString();
  msg.content = '[message removed]';
  persistChatMessages();

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('chat_messages').update({ deleted_at: msg.deleted_at, content: msg.content }).eq('id', messageId);
    } catch (e) {
      console.warn('[chat] Supabase delete message sync warning:', e);
    }
  }

  res.json(msg);
});

// POST /api/chat/teams/:teamId/members — add member
chatRouter.post('/chat/teams/:teamId/members', async (req: express.Request, res: express.Response) => {
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId } = req.params;
  const { userId, roleInTeam = 'Member', canPost = true, viewOnly = false, canDeleteOthersMessages = false, canRemoveMembers = false } = req.body;
  if (!userId) return void res.status(400).json({ error: 'userId required' });

  if (!isElevated(caller.userRole)) {
    const callerMem = localChatMembers.find(m => m.team_id === teamId && m.user_id === caller.userId && m.status === 'active');
    if (!callerMem?.can_remove_members) {
      return void res.status(403).json({ error: 'Only HR/Admin/Lead can add members' });
    }
  }

  const team = localChatTeams.find(t => t.id === teamId);

  // Deactivate any existing membership
  localChatMembers.forEach(m => {
    if (m.team_id === teamId && m.user_id === userId && m.status === 'active') {
      m.status = 'removed';
      m.removed_at = new Date().toISOString();
    }
  });

  const newMembership = {
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    team_id: teamId,
    user_id: userId,
    role_in_team: roleInTeam,
    can_post: Boolean(canPost),
    can_delete_others_messages: Boolean(canDeleteOthersMessages),
    can_remove_members: Boolean(canRemoveMembers),
    view_only: Boolean(viewOnly),
    status: 'active',
    joined_at: new Date().toISOString()
  };

  localChatMembers.push(newMembership);
  persistChatMembers();

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('chat_team_memberships').update({ status: 'removed', removed_at: new Date().toISOString() }).eq('team_id', teamId).eq('user_id', userId).eq('status', 'active');
      await supabaseAdmin.from('chat_team_memberships').insert(newMembership);
    } catch (e) {
      console.warn('[chat] Supabase add member sync warning:', e);
    }
  }

  await postSystemMessage(teamId, `User ${userId} was added to "${team?.name || teamId}" as ${roleInTeam}.`);
  res.status(201).json(newMembership);
});

// DELETE /api/chat/teams/:teamId/members/:userId — remove member
chatRouter.delete('/chat/teams/:teamId/members/:userId', async (req: express.Request, res: express.Response) => {
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId, userId } = req.params;

  if (!isElevated(caller.userRole)) {
    const callerMem = localChatMembers.find(m => m.team_id === teamId && m.user_id === caller.userId && m.status === 'active');
    if (!callerMem?.can_remove_members) {
      return void res.status(403).json({ error: 'Not authorized to remove members' });
    }
  }

  const team = localChatTeams.find(t => t.id === teamId);

  localChatMembers.forEach(m => {
    if (m.team_id === teamId && m.user_id === userId && m.status === 'active') {
      m.status = 'removed';
      m.removed_at = new Date().toISOString();
      m.removed_by = caller.userId;
    }
  });
  persistChatMembers();

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('chat_team_memberships').update({ status: 'removed', removed_at: new Date().toISOString(), removed_by: caller.userId }).eq('team_id', teamId).eq('user_id', userId).eq('status', 'active');
    } catch (e) {
      console.warn('[chat] Supabase remove member sync warning:', e);
    }
  }

  await postSystemMessage(teamId, `User ${userId} was removed from "${team?.name || teamId}".`);
  res.status(204).end();
});

// GET /api/chat/teams/:teamId/read-state
chatRouter.get('/chat/teams/:teamId/read-state', async (req: express.Request, res: express.Response) => {
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId } = req.params;

  if (supabaseAdmin) {
    try {
      const { data } = await supabaseAdmin.from('chat_message_read_state').select('last_read_message_id, updated_at').eq('user_id', caller.userId).eq('team_id', teamId).single();
      if (data) return void res.json(data);
    } catch (e) { /* fallback */ }
  }

  const state = localChatReadStates.find(r => r.team_id === teamId && r.user_id === caller.userId);
  res.json(state || { last_read_message_id: null });
});

// POST /api/chat/teams/:teamId/read-state
chatRouter.post('/chat/teams/:teamId/read-state', async (req: express.Request, res: express.Response) => {
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId } = req.params;
  const { lastReadMessageId } = req.body;
  if (!lastReadMessageId) return void res.status(400).json({ error: 'lastReadMessageId required' });

  const now = new Date().toISOString();
  const idx = localChatReadStates.findIndex(r => r.team_id === teamId && r.user_id === caller.userId);
  if (idx >= 0) {
    localChatReadStates[idx].last_read_message_id = lastReadMessageId;
    localChatReadStates[idx].updated_at = now;
  } else {
    localChatReadStates.push({
      user_id: caller.userId,
      team_id: teamId,
      last_read_message_id: lastReadMessageId,
      updated_at: now
    });
  }
  persistChatReadStates();

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('chat_message_read_state').upsert({
        user_id: caller.userId,
        team_id: teamId,
        last_read_message_id: lastReadMessageId,
        updated_at: now,
      }, { onConflict: 'user_id,team_id' });
    } catch (e) {
      console.warn('[chat] Supabase read state sync warning:', e);
    }
  }

  res.json({ success: true });
});

// GET /api/chat/teams/:teamId/search — search messages in a team
chatRouter.get('/chat/teams/:teamId/search', async (req: express.Request, res: express.Response) => {
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });

  const { teamId } = req.params;
  const q = req.query.q as string;
  if (!q || !q.trim()) return void res.json([]);

  if (supabaseAdmin) {
    try {
      const { data: messages, error } = await supabaseAdmin
        .from('chat_messages')
        .select('*')
        .eq('team_id', teamId)
        .is('deleted_at', null)
        .ilike('content', `%${q.trim()}%`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && messages) return void res.json(messages);
    } catch (e) { /* fallback */ }
  }

  const needle = q.trim().toLowerCase();
  const found = localChatMessages
    .filter(m => m.team_id === teamId && !m.deleted_at && (m.content || '').toLowerCase().includes(needle))
    .slice(0, 50);

  res.json(found);
});

// POST /api/chat/workflow-system-message — post cross-module system message
chatRouter.post('/chat/workflow-system-message', async (req: express.Request, res: express.Response) => {
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });
  if (!isElevated(caller.userRole)) return void res.status(403).json({ error: 'Only managers/executives can trigger workflow messages' });

  const { teamId, text } = req.body;
  if (!teamId || !text?.trim()) return void res.status(400).json({ error: 'teamId and text required' });

  await postSystemMessage(teamId, text.trim());
  res.json({ success: true });
});

// GET /api/chat/teams/:teamId/export — export team chat history to CSV
chatRouter.get('/chat/teams/:teamId/export', async (req: express.Request, res: express.Response) => {
  const caller = getCallerFromHeaders(req);
  if (!caller) return void res.status(401).json({ error: 'Unauthorized' });
  if (!isElevated(caller.userRole)) return void res.status(403).json({ error: 'Only elevated roles (Admin/HR/Managers) can export chat logs' });

  const { teamId } = req.params;
  const team = localChatTeams.find(t => t.id === teamId);

  let messages = localChatMessages
    .filter(m => m.team_id === teamId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (supabaseAdmin) {
    try {
      const { data } = await supabaseAdmin.from('chat_messages').select('*').eq('team_id', teamId).order('created_at', { ascending: true });
      if (data) messages = data;
    } catch (e) { /* fallback */ }
  }

  const rows = [
    ['Message ID', 'Timestamp', 'Sender ID', 'Type', 'Content', 'Status', 'Edited At'].join(',')
  ];

  (messages || []).forEach(m => {
    const isDel = !!m.deleted_at;
    const cleanContent = isDel 
      ? '[message removed]' 
      : `"${(m.content || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    
    rows.push([
      `"${m.id}"`,
      `"${m.created_at}"`,
      `"${m.sender_id}"`,
      `"${m.type}"`,
      cleanContent,
      isDel ? '"Deleted"' : '"Active"',
      m.edited_at ? `"${m.edited_at}"` : '""'
    ].join(','));
  });

  const csvData = rows.join('\r\n');
  const safeName = (team?.name || teamId).replace(/[^a-zA-Z0-9_-]/g, '_');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}_chat_export_${Date.now()}.csv"`);
  res.send(csvData);
});


export function createApp() {
  const app = express();

  // Vercel Serverless request body compatibility:
  // If Vercel pre-parsed the body, parse string or keep object; otherwise run express.json()
  app.use((req: any, _res: any, next: any) => {
    if (typeof req.body === 'string' && req.body.length > 0) {
      try {
        req.body = JSON.parse(req.body);
      } catch { /* ignore */ }
    }
    if (req.body && typeof req.body === 'object') {
      return next();
    }
    express.json({ limit: '10mb' })(req, _res, (err) => {
      if (err) req.body = {};
      next();
    });
  });

  // Guarantee req.body is always a valid object
  app.use((req: any, _res: any, next: any) => {
    if (!req.body || typeof req.body !== 'object') {
      req.body = {};
    }
    next();
  });

  app.use((req, res, next) => { console.log(req.method, req.url); next(); });

  // Mount chat router (Supabase-backed, all /api/chat/* routes)
  app.use('/api', chatRouter);
  app.use('/', chatRouter);

  const router = express.Router();

  router.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Auth API
  router.post('/login', (req, res) => {
    const { email } = req.body || {};
    let user = null;
    if (email && typeof email === 'string') {
      user = employees.find(e => e.email?.toLowerCase() === email.toLowerCase());
    }

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

  // --- Public Careers Portal Endpoints (No Auth Required) ---
  router.get('/careers', (_req, res) => {
    const published = jobPostings.filter(j => j.status === 'PUBLISHED');
    res.json(published);
  });

  router.get('/careers/:slug', (req, res) => {
    const slugOrId = req.params.slug;
    const job = jobPostings.find(j => (j.slug === slugOrId || j.id === slugOrId) && j.status === 'PUBLISHED');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  });

  // Public candidate application submission + Automatic Confirmation Email
  router.post('/careers/:slug/apply', (req, res) => {
    const slugOrId = req.params.slug;
    const job = jobPostings.find(j => (j.slug === slugOrId || j.id === slugOrId) && j.status === 'PUBLISHED');
    if (!job) return res.status(404).json({ message: 'Job posting not found or not published' });

    const {
      fullName, email, phone, qualification, experience, currentOrg, resumeLink, coverNote
    } = req.body || {};

    if (!fullName?.trim()) return res.status(400).json({ message: 'Full name is required' });
    if (!email?.trim()) return res.status(400).json({ message: 'Email is required' });

    const newApp = {
      id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      jobId: job.id,
      candidateName: fullName.trim(),
      fullName: fullName.trim(),
      candidateEmail: email.trim(),
      email: email.trim(),
      candidatePhone: phone?.trim() || '',
      phone: phone?.trim() || '',
      qualification: qualification?.trim() || '',
      experience: experience?.trim() || '',
      currentOrg: currentOrg?.trim() || '',
      resumeUrl: resumeLink?.trim() || '',
      resumeLink: resumeLink?.trim() || '',
      coverNote: coverNote?.trim() || '',
      currentRoundId: job.rounds?.[0]?.id || null,
      status: 'APPLIED',
      appliedAt: new Date().toISOString(),
      emailLogs: [] as any[]
    };

    // Automatically generate and dispatch Application Confirmation Email
    try {
      const template = job.applicationConfirmationTemplate || DEFAULT_CAREER_TEMPLATES.applicationConfirmationTemplate;
      const mergeCtx = buildMergeContext(newApp, job, job.rounds?.[0] || null);
      const renderedHtml = renderTemplate(template, mergeCtx);
      const emailLog = {
        sentAt: new Date().toISOString(),
        to: newApp.email,
        subject: `Application Received - ${job.title} at TwinSpace`,
        templateType: 'application_confirmation',
        html: renderedHtml,
        status: 'Sent'
      };
      newApp.emailLogs.push(emailLog);
      console.log(`[Careers Email] Dispatched Confirmation Email to ${newApp.email} for ${job.title}`);
    } catch (err) {
      console.error('[Careers Email] Failed to render confirmation email:', err);
    }

    jobApplications.unshift(newApp);
    saveChatFile(APPLICATIONS_FILE, jobApplications);

    // Notify HR & Managers on the ERP Header Notification Bell
    try {
      addNotification({
        title: `New Job Application: ${job.title}`,
        message: `${newApp.fullName} applied for ${job.title}. Candidate profile available in recruitment pipeline.`,
        type: 'approval',
        targetRole: 'HR,Manager'
      });
    } catch (err) {
      console.error('Failed to dispatch in-app notification for new application:', err);
    }

    res.status(201).json({ message: 'Application submitted successfully', application: newApp });
  });

  // --- HRM Dashboard Careers & Job Postings Endpoints ---
  router.get('/careers/admin', (_req, res) => {
    res.json(jobPostings);
  });

  router.get('/careers/admin/:id', (req, res) => {
    const job = jobPostings.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ message: 'Job posting not found' });
    res.json(job);
  });

  router.post('/careers/admin', (req, res) => {
    const body = req.body || {};
    const baseSlug = body.slug || (body.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let suffix = 0;
    while (jobPostings.some(j => j.slug === slug)) {
      suffix++;
      slug = `${baseSlug}-${suffix}`;
    }

    const newJob = {
      id: `job-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: body.status || 'DRAFT',
      fields: body.fields || [],
      rounds: body.rounds || [],
      applicationConfirmationTemplate: body.applicationConfirmationTemplate?.trim() || DEFAULT_CAREER_TEMPLATES.applicationConfirmationTemplate,
      roundAdvanceTemplate: body.roundAdvanceTemplate?.trim() || DEFAULT_CAREER_TEMPLATES.roundAdvanceTemplate,
      rejectionTemplate: body.rejectionTemplate?.trim() || DEFAULT_CAREER_TEMPLATES.rejectionTemplate,
      hireTemplate: body.hireTemplate?.trim() || DEFAULT_CAREER_TEMPLATES.hireTemplate,
      ...body,
      slug,
    };
    jobPostings.unshift(newJob);
    saveJobPostings();
    res.status(201).json(newJob);
  });

  router.patch('/careers/admin/:id', (req, res) => {
    const index = jobPostings.findIndex(j => j.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Job not found' });
    jobPostings[index] = { ...jobPostings[index], ...req.body };
    saveJobPostings();
    res.json(jobPostings[index]);
  });

  router.patch('/careers/admin/:id/publish', (req, res) => {
    const job = jobPostings.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.status = 'PUBLISHED';
    job.publishedAt = new Date().toISOString();
    saveJobPostings();
    res.json(job);
  });

  router.patch('/careers/admin/:id/close', (req, res) => {
    const job = jobPostings.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.status = 'CLOSED';
    job.closedAt = new Date().toISOString();
    saveJobPostings();
    res.json(job);
  });

  router.delete('/careers/admin/:id', (req, res) => {
    jobPostings = jobPostings.filter(j => j.id !== req.params.id);
    jobApplications = jobApplications.filter(a => a.jobId !== req.params.id);
    saveJobPostings();
    saveChatFile(APPLICATIONS_FILE, jobApplications);
    res.status(204).end();
  });

  // --- Applications & Candidate Pipeline ---
  router.get('/careers/:jobId/applications', (req, res) => {
    const apps = jobApplications.filter(a => a.jobId === req.params.jobId);
    res.json(apps);
  });

  router.post('/careers/:jobId/applications', (req, res) => {
    const newApp = {
      id: `app-${Date.now()}`,
      jobId: req.params.jobId,
      status: 'APPLIED',
      appliedAt: new Date().toISOString(),
      emailLogs: [],
      ...req.body,
    };
    jobApplications.unshift(newApp);
    saveChatFile(APPLICATIONS_FILE, jobApplications);
    res.status(201).json(newApp);
  });

  // Advance Candidate Round + Automatic Round Advance Email
  router.patch('/applications/:id/round', (req, res) => {
    const app = jobApplications.find(a => a.id === req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    const { roundId, status = 'INTERVIEWING' } = req.body;
    app.currentRoundId = roundId;
    app.status = status;

    const job = jobPostings.find(j => j.id === app.jobId);
    const round = job?.rounds?.find((r: any) => r.id === roundId);

    // Auto-send round advancement email
    try {
      const template = round?.emailTemplate || job?.roundAdvanceTemplate || DEFAULT_CAREER_TEMPLATES.roundAdvanceTemplate;
      const mergeCtx = buildMergeContext(app, job, round);
      const renderedHtml = renderTemplate(template, mergeCtx);
      if (!app.emailLogs) app.emailLogs = [];
      app.emailLogs.push({
        sentAt: new Date().toISOString(),
        to: app.email || app.candidateEmail,
        subject: `Update on your application: ${round?.title || 'Next Round'} - ${job?.title}`,
        templateType: 'round_advance',
        html: renderedHtml,
        status: 'Sent'
      });
      console.log(`[Careers Email] Sent Round Advance Email to ${app.email || app.candidateEmail} for ${round?.title}`);
    } catch (e) {
      console.error('[Careers Email] Failed to send round advance email:', e);
    }

    saveChatFile(APPLICATIONS_FILE, jobApplications);
    res.json(app);
  });

  // Change Candidate Status (HIRED / REJECTED) + Automatic Email
  router.patch('/applications/:id/status', (req, res) => {
    const app = jobApplications.find(a => a.id === req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    const { status, notes } = req.body;
    app.status = status;
    if (notes !== undefined) app.notes = notes;

    const job = jobPostings.find(j => j.id === app.jobId);

    try {
      if (!app.emailLogs) app.emailLogs = [];
      if (status === 'HIRED') {
        const template = job?.hireTemplate || DEFAULT_CAREER_TEMPLATES.hireTemplate;
        const mergeCtx = buildMergeContext(app, job);
        const renderedHtml = renderTemplate(template, mergeCtx);
        app.emailLogs.push({
          sentAt: new Date().toISOString(),
          to: app.email || app.candidateEmail,
          subject: `Offer of Employment: ${job?.title} at TwinSpace`,
          templateType: 'hire',
          html: renderedHtml,
          status: 'Sent'
        });
        console.log(`[Careers Email] Sent Hire Offer Email to ${app.email || app.candidateEmail}`);
      } else if (status === 'REJECTED') {
        const template = job?.rejectionTemplate || DEFAULT_CAREER_TEMPLATES.rejectionTemplate;
        const mergeCtx = buildMergeContext(app, job);
        const renderedHtml = renderTemplate(template, mergeCtx);
        app.emailLogs.push({
          sentAt: new Date().toISOString(),
          to: app.email || app.candidateEmail,
          subject: `Update on your application for ${job?.title} at TwinSpace`,
          templateType: 'rejection',
          html: renderedHtml,
          status: 'Sent'
        });
        console.log(`[Careers Email] Sent Rejection Email to ${app.email || app.candidateEmail}`);
      }
    } catch (e) {
      console.error('[Careers Email] Failed to send status email:', e);
    }

    saveChatFile(APPLICATIONS_FILE, jobApplications);
    res.json(app);
  });

  router.delete('/applications/:id', (req, res) => {
    jobApplications = jobApplications.filter(a => a.id !== req.params.id);
    saveChatFile(APPLICATIONS_FILE, jobApplications);
    res.status(204).end();
  });

  // --- Documents & Contracts Endpoints ---
  router.get('/documents', (req, res) => res.json(hrDocuments));
  router.post('/documents', (req, res) => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      ...req.body
    };
    hrDocuments.unshift(newDoc);
    res.status(201).json(newDoc);
  });
  router.delete('/documents/:id', (req, res) => {
    hrDocuments = hrDocuments.filter(d => d.id !== req.params.id);
    res.status(204).end();
  });

  router.get('/documents/agreements', (req, res) => res.json(agreements));
  router.post('/documents/agreements', (req, res) => {
    const newAgr = {
      id: `agr-${Date.now()}`,
      status: 'Active',
      ...req.body
    };
    agreements.unshift(newAgr);
    res.status(201).json(newAgr);
  });
  router.delete('/documents/agreements/:id', (req, res) => {
    agreements = agreements.filter(a => a.id !== req.params.id);
    res.status(204).end();
  });

  router.get('/documents/templates', (req, res) => res.json(documentTemplates));
  router.post('/documents/templates', (req, res) => {
    const newTpl = {
      id: `tpl-${Date.now()}`,
      ...req.body
    };
    documentTemplates.unshift(newTpl);
    res.status(201).json(newTpl);
  });
  router.delete('/documents/templates/:id', (req, res) => {
    documentTemplates = documentTemplates.filter(t => t.id !== req.params.id);
    res.status(204).end();
  });

  // --- User Management Endpoints ---
  router.get('/users', (req, res) => {
    const { search, role, status, department, page = 1, limit = 50 } = req.query;
    let list = employees.map(e => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      email: e.email,
      phone: e.phone || '+91 98765 43210',
      role: e.role,
      department: e.department,
      departmentId: e.department,
      designation: e.designation || e.role,
      employmentType: 'FullTime',
      branch: 'Global HQ',
      branchId: 'hq',
      shift: e.shift || 'Morning',
      shiftId: 's1',
      address: 'Chennai, TN',
      joiningDate: e.hireDate || '2023-01-01',
      status: e.isActive ? 'Active' : 'Terminated'
    }));

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (role && role !== 'all') {
      list = list.filter(u => u.role.toLowerCase() === String(role).toLowerCase());
    }
    if (status && status !== 'all') {
      list = list.filter(u => u.status.toLowerCase() === String(status).toLowerCase());
    }
    if (department && department !== 'all') {
      list = list.filter(u => u.department.toLowerCase() === String(department).toLowerCase());
    }

    const total = list.length;
    res.json({
      data: list,
      users: list,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1
    });
  });

  router.post('/users', (req, res) => {
    const { name, email, role, department, designation, shift, phone } = req.body;
    const parts = (name || 'New User').trim().split(' ');
    const firstName = parts[0] || 'New';
    const lastName = parts.slice(1).join(' ') || 'User';
    const newEmp = {
      id: `e${Date.now()}`,
      firstName,
      lastName,
      email: email || `user${Date.now()}@example.com`,
      department: department || 'Engineering',
      role: role || 'Developer',
      designation: designation || role || 'Team Member',
      hireDate: new Date().toISOString().split('T')[0],
      isActive: true,
      shift: shift || 'Morning',
      phone: phone || ''
    };
    employees.push(newEmp);
    res.status(201).json({
      id: newEmp.id,
      name: `${newEmp.firstName} ${newEmp.lastName}`,
      ...newEmp,
      status: 'Active'
    });
  });

  router.patch('/users/:id', (req, res) => {
    const emp = employees.find(e => e.id === req.params.id);
    if (!emp) return res.status(404).json({ message: 'User not found' });
    if (req.body.name) {
      const parts = req.body.name.trim().split(' ');
      emp.firstName = parts[0];
      emp.lastName = parts.slice(1).join(' ');
    }
    if (req.body.email) emp.email = req.body.email;
    if (req.body.role) emp.role = req.body.role;
    if (req.body.department) emp.department = req.body.department;
    if (req.body.departmentId) emp.department = req.body.departmentId;
    if (req.body.designation) emp.designation = req.body.designation;
    if (req.body.shift) emp.shift = req.body.shift;
    if (req.body.status) emp.isActive = req.body.status === 'Active';
    res.json({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      ...emp,
      status: emp.isActive ? 'Active' : 'Terminated'
    });
  });

  router.delete('/users/:id', (req, res) => {
    const emp = employees.find(e => e.id === req.params.id);
    if (emp) emp.isActive = false;
    res.status(204).end();
  });

  router.patch('/users/:id/reset-password', (req, res) => {
    res.json({ success: true, message: 'Password reset successfully' });
  });

  router.get('/org-structure/departments', (req, res) => {
    res.json([
      { id: 'Engineering', name: 'Engineering' },
      { id: 'Sales', name: 'Sales' },
      { id: 'Marketing', name: 'Marketing' },
      { id: 'HR', name: 'HR' },
      { id: 'Design', name: 'Design' },
      { id: 'Finance', name: 'Finance' },
      { id: 'Executive', name: 'Executive' }
    ]);
  });

  router.get('/org-structure/branches', (req, res) => {
    res.json([
      { id: 'hq', name: 'Global HQ' },
      { id: 'chennai', name: 'Chennai Tech Campus' },
      { id: 'remote', name: 'Remote Network' }
    ]);
  });

  router.get('/attendance/shifts', (req, res) => {
    res.json([
      { id: 's1', name: 'Morning', startTime: '09:00', endTime: '18:00' },
      { id: 's2', name: 'Evening', startTime: '13:00', endTime: '22:00' },
      { id: 's3', name: 'Night', startTime: '21:00', endTime: '06:00' }
    ]);
  });

  // --- Lifecycle Endpoints (Promotions & Complaints) ---
  router.get('/lifecycle/promotions', (req, res) => res.json(promotions));
  router.post('/lifecycle/promotions', (req, res) => {
    const newPromo = {
      id: `pro-${Date.now()}`,
      ...req.body
    };
    promotions.unshift(newPromo);
    const emp = employees.find(e => `${e.firstName} ${e.lastName}` === req.body.employee);
    if (emp) {
      if (req.body.newDepartment) emp.department = req.body.newDepartment;
      if (req.body.newRole) emp.role = req.body.newRole;
    }
    res.status(201).json(newPromo);
  });

  router.get('/lifecycle/complaints', (req, res) => res.json(complaints));
  router.post('/lifecycle/complaints', (req, res) => {
    const newComp = {
      id: `cmp-${Date.now()}`,
      status: 'Pending',
      submittedDate: new Date().toISOString().split('T')[0],
      ...req.body
    };
    complaints.unshift(newComp);
    res.status(201).json(newComp);
  });

  router.patch('/lifecycle/complaints/:id/status', (req, res) => {
    const comp = complaints.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ message: 'Complaint not found' });
    comp.status = req.body.status;
    res.json(comp);
  });

  router.delete('/lifecycle/complaints/:id', (req, res) => {
    complaints = complaints.filter(c => c.id !== req.params.id);
    res.status(204).end();
  });


  // Mount on both '/api' and '/' to guarantee routing works regardless of rewrite mode
  app.use('/api', router);
  app.use('/', router);

  // Serve public folder directly in dev mode just in case
  if (process.env.NODE_ENV !== "production") {
    app.use(express.static(path.join(process.cwd(), 'public')));
  }

  // Global Express error handler to guarantee API responses never return raw error objects
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('Unhandled API Error:', err);
    const message = typeof err === 'string' ? err : err?.message || 'Internal Server Error';
    res.status(500).json({ error: message });
  });

  return app;
}

const app = createApp();

export default function handler(req: any, res: any) {
  return app(req, res);
}

const fs = require('fs');
const path = require('path');

// 1. UserManagement.tsx
const userMgmtPath = path.join(__dirname, '..', 'src', 'pages', 'UserManagement.tsx');
let userMgmt = fs.readFileSync(userMgmtPath, 'utf8');

if (!userMgmt.includes("import { DEPARTMENTS } from '../shared/roles';")) {
  userMgmt = `import { DEPARTMENTS } from '../shared/roles';\n` + userMgmt;
}
userMgmt = userMgmt.replace("department: 'Engineering',", "department: DEPARTMENTS[0],");
userMgmt = userMgmt.replace("department: departments[0]?.name || 'Engineering',", "department: departments[0]?.name || DEPARTMENTS[0],");
userMgmt = userMgmt.replace("{departments.length === 0 && ['Engineering', 'Sales', 'HR', 'Marketing'].map(d => (", "{departments.length === 0 && DEPARTMENTS.map(d => (");
userMgmt = userMgmt.replace("users.filter(u => ['admin', 'hr', 'tl', 'ceo', 'sales team leader'].includes(u.role?.toLowerCase())).length", "users.filter(u => ['admin', 'ceo', 'coo', 'cto', 'tl'].includes(u.role?.toLowerCase())).length");
fs.writeFileSync(userMgmtPath, userMgmt, 'utf8');

// 2. Lifecycle.tsx
const lifecyclePath = path.join(__dirname, '..', 'src', 'pages', 'Lifecycle.tsx');
let lifecycle = fs.readFileSync(lifecyclePath, 'utf8');
lifecycle = lifecycle.replace("newDepartment: 'Engineering',", "newDepartment: DEPARTMENTS[0],");
lifecycle = lifecycle.replace("newDepartment: 'Engineering',", "newDepartment: DEPARTMENTS[0],");
fs.writeFileSync(lifecyclePath, lifecycle, 'utf8');

// 3. JobApplications.tsx
const jobAppsPath = path.join(__dirname, '..', 'src', 'pages', 'JobApplications.tsx');
let jobApps = fs.readFileSync(jobAppsPath, 'utf8');
jobApps = jobApps.replace("{job?.department || 'Engineering'}", "{job?.department || 'HRM'}");
fs.writeFileSync(jobAppsPath, jobApps, 'utf8');

// 4. HRMUserAnalytics.tsx
const hrmAnalyticsPath = path.join(__dirname, '..', 'src', 'pages', 'HRMUserAnalytics.tsx');
let hrmAnalytics = fs.readFileSync(hrmAnalyticsPath, 'utf8');
hrmAnalytics = hrmAnalytics.replace("{selectedEmployee?.department || 'Engineering'} • {selectedEmployee?.role || 'Team Member'}", "{selectedEmployee?.department || 'HRM'} • {selectedEmployee?.role || 'Member'}");
fs.writeFileSync(hrmAnalyticsPath, hrmAnalytics, 'utf8');

console.log('Frontend standards update complete');

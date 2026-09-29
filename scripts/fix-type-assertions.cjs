const fs = require('fs');
const path = require('path');

// 1. Lifecycle.tsx
const lifecyclePath = path.join(__dirname, '..', 'src', 'pages', 'Lifecycle.tsx');
let lifecycle = fs.readFileSync(lifecyclePath, 'utf8');
lifecycle = lifecycle.replace("newDepartment: DEPARTMENTS[0],", "newDepartment: DEPARTMENTS[0] as string,");
lifecycle = lifecycle.replace("newDepartment: DEPARTMENTS[0],", "newDepartment: DEPARTMENTS[0] as string,");
fs.writeFileSync(lifecyclePath, lifecycle, 'utf8');

// 2. UserManagement.tsx
const userMgmtPath = path.join(__dirname, '..', 'src', 'pages', 'UserManagement.tsx');
let userMgmt = fs.readFileSync(userMgmtPath, 'utf8');
userMgmt = userMgmt.replace("department: DEPARTMENTS[0],", "department: DEPARTMENTS[0] as string,");
fs.writeFileSync(userMgmtPath, userMgmt, 'utf8');

console.log('Type assertions applied');

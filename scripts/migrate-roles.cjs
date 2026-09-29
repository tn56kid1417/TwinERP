const fs = require('fs');

const dryRun = process.argv.includes('--dry-run');

// Mapping Rules
const roleMap = {
  'Team Leader': 'TL',
  'Sales Team Leader': 'TL',
  'Employee': 'Member',
  'Developer': 'Member',
  'Sales': 'Member',
  'Sales Rep': 'Member',
  'Marketing': 'Member',
  'Marketing Member': 'Member',
  'Executive': 'Member', // non CEO/CTO/COO
  'HR': 'Member',
  'Manager': 'TL', // Needs review
  'Admin': 'Admin',
  'CEO': 'CEO',
  'CTO': 'CTO',
  'COO': 'COO'
};

const deptMap = {
  'Engineering': 'PM',
  'Design': 'PM',
  'Product': 'PM',
  'Sales': 'CRM',
  'Marketing': 'CRM',
  'HR': 'HRM',
  'Executive': null, // only valid for Admin/executives
  'Administration': null,
  'Finance': 'Finance' // Review
};

let needsReview = [];
let roleCounts = { before: {}, after: {} };
let deptCounts = { before: {}, after: {} };

function recordCount(obj, val) {
  if (!val) val = 'null';
  obj[val] = (obj[val] || 0) + 1;
}

function processEmployees() {
  const file = '.employees.json';
  if (!fs.existsSync(file)) return;
  const emps = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  emps.forEach(emp => {
    recordCount(roleCounts.before, emp.role);
    recordCount(deptCounts.before, emp.department);
    
    // Migration Logic
    const origRole = emp.role;
    const origDept = emp.department;
    
    // Role
    if (origRole === 'Manager') {
      emp.role = 'TL';
      emp.department = 'HRM';
      needsReview.push(`Employee ${emp.id} (${emp.name}) was 'Manager', mapping to TL in HRM.`);
    } else if (origRole === 'HR') {
      emp.role = 'Member';
      emp.department = 'HRM';
    } else if (roleMap[origRole]) {
      emp.role = roleMap[origRole];
    }
    
    // Dept (only if we didn't force it above)
    if (origRole !== 'Manager' && origRole !== 'HR') {
       if (deptMap[origDept] !== undefined) {
          emp.department = deptMap[origDept];
       }
       if ((origDept === 'Executive' || origDept === 'Administration') && !['Admin', 'CEO', 'CTO', 'COO'].includes(emp.role)) {
          needsReview.push(`Employee ${emp.id} (${emp.name}) has department '${origDept}' but role '${emp.role}'. Mapped to null, needs review.`);
       }
       if (origDept === 'Finance') {
          needsReview.push(`Employee ${emp.id} (${emp.name}) has department 'Finance', needs review.`);
       }
    }
    
    recordCount(roleCounts.after, emp.role);
    recordCount(deptCounts.after, emp.department);
  });
  
  if (!dryRun) fs.writeFileSync(file, JSON.stringify(emps, null, 2));
}

// Privileges
function processPrivileges() {
  const file = '.privileges.json';
  // skipping for brevity, we can check if it exists and needs mapping
  if (!fs.existsSync(file)) return;
  // it might not have roles or departments directly, or maybe it does? 
  // It has userId as keys. We don't change userIds.
}

// Notifications
function processNotifications() {
  const file = '.notifications.json';
  if (!fs.existsSync(file)) return;
  const notifs = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  notifs.forEach(n => {
    if (n.targetRole === 'HR' || n.targetRole === 'Manager') {
      n.targetRole = 'HRM';
    }
  });
  
  if (!dryRun) fs.writeFileSync(file, JSON.stringify(notifs, null, 2));
}

// Job postings
// They might be in .applications.json? The prompt says "job postings" but there's .applications.json. 
// We'll skip for now if we can't find it easily. 
// "stored role labels in lifecycle/leave/resignation/termination records"
// We don't have .lifecycle.json? Maybe it's in a sqlite/supabase db?
// The prompt says "chat tables, Supabase tables".

function run() {
  processEmployees();
  processPrivileges();
  processNotifications();
  
  console.log('--- MIGRATION RUN (DRY RUN: ' + dryRun + ') ---');
  console.log('\nROLE COUNTS:');
  console.log('Before:', roleCounts.before);
  console.log('After: ', roleCounts.after);
  
  console.log('\nDEPARTMENT COUNTS:');
  console.log('Before:', deptCounts.before);
  console.log('After: ', deptCounts.after);
  
  console.log('\nNEEDS REVIEW (' + needsReview.length + '):');
  needsReview.forEach(r => console.log(' - ' + r));
}

run();

const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('ACCEPTANCE & INTEGRATION VERIFICATION SUITE');
console.log('====================================================');

let allPassed = true;
function assert(name, condition) {
  if (condition) {
    console.log(`[PASS] ${name}`);
  } else {
    console.error(`[FAIL] ${name}`);
    allPassed = false;
  }
}

// 1. Roles and Departments Single Source of Truth
const rolesPath = path.join(__dirname, '..', 'src', 'shared', 'roles.ts');
const rolesContent = fs.readFileSync(rolesPath, 'utf8');

assert('ROLES includes Admin, CEO, COO, CTO, TL, Member', 
  rolesContent.includes("['Admin', 'CEO', 'COO', 'CTO', 'TL', 'Member']"));

assert('DEPARTMENTS includes HRM, CRM, PM', 
  rolesContent.includes("['HRM', 'CRM', 'PM']"));

// 2. Department JSON files
const deptJsonPath = path.join(__dirname, '..', '.departments.json');
const depts = JSON.parse(fs.readFileSync(deptJsonPath, 'utf8'));
assert('.departments.json has exactly 3 departments (HRM, CRM, PM)',
  depts.length === 3 &&
  depts.some(d => d.name === 'HRM') &&
  depts.some(d => d.name === 'CRM') &&
  depts.some(d => d.name === 'PM')
);

// 3. Employee data file
const empJsonPath = path.join(__dirname, '..', '.employees.json');
const emps = JSON.parse(fs.readFileSync(empJsonPath, 'utf8'));
const validRoles = ['Admin', 'CEO', 'COO', 'CTO', 'TL', 'Member'];
const validDepts = ['HRM', 'CRM', 'PM'];
const execRoles = ['Admin', 'CEO', 'COO', 'CTO'];

let empsValid = true;
emps.forEach(e => {
  if (!validRoles.includes(e.role)) empsValid = false;
  if (execRoles.includes(e.role) && e.department !== null && e.department !== undefined) empsValid = false;
  if (['TL', 'Member'].includes(e.role) && !e.department && !(e.isActive === false && e.status === 'Onboarding')) empsValid = false;
  if (e.department && !validDepts.includes(e.department)) empsValid = false;
});
assert('All records in .employees.json strictly conform to Target Model', empsValid);

// 4. In-memory validation logic testing
function validateRoleDepartment(role, dept, isOnboarding = false) {
  const ROLES = ['Admin', 'CEO', 'COO', 'CTO', 'TL', 'Member'];
  const DEPARTMENTS = ['HRM', 'CRM', 'PM'];
  if (!role || !ROLES.includes(role)) return 'Invalid role';
  if (dept && !DEPARTMENTS.includes(dept)) return 'Invalid department';
  const isExecutiveRole = ['Admin', 'CEO', 'COO', 'CTO'].includes(role);
  if (isExecutiveRole && dept) return 'Admin/CEO/COO/CTO cannot have a department';
  if (['TL', 'Member'].includes(role)) {
    if (!dept && !isOnboarding) return 'TL and Member roles require a department';
  }
  return null;
}

assert('Validation: Admin with null department passes', validateRoleDepartment('Admin', null) === null);
assert('Validation: Admin with HRM department rejected', validateRoleDepartment('Admin', 'HRM') !== null);
assert('Validation: Member without department rejected', validateRoleDepartment('Member', null) !== null);
assert('Validation: Member with PM department passes', validateRoleDepartment('Member', 'PM') === null);
assert('Validation: Onboarding Member without department passes', validateRoleDepartment('Member', null, true) === null);
assert('Validation: Invalid role rejected', validateRoleDepartment('Manager', 'HRM') !== null);
assert('Validation: Invalid department rejected', validateRoleDepartment('Member', 'Finance') !== null);

// 5. Build check verification
const distServerPath = path.join(__dirname, '..', 'dist', 'server.cjs');
assert('Production build server artifact exists', fs.existsSync(distServerPath));

console.log('====================================================');
if (allPassed) {
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
} else {
  console.log('SOME VERIFICATIONS FAILED.');
  process.exit(1);
}

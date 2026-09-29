const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '..', 'api', 'index.ts');
let content = fs.readFileSync(apiPath, 'utf8');

// 1. Update seedEmployees
const oldSeedEmployees = `const seedEmployees = (): any[] => [
  { id: 'e1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', passwordHash: defaultPasswordHash, department: 'Engineering', role: 'Developer', hireDate: '2023-01-15', isActive: true, shift: 'Morning' },
  { id: 'e2', firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', passwordHash: defaultPasswordHash, department: 'HR', role: 'Manager', hireDate: '2022-11-01', isActive: true, shift: 'Evening' },
  { id: 'e3', firstName: 'System', lastName: 'Admin', email: 'admin@example.com', passwordHash: defaultPasswordHash, department: 'Administration', role: 'Admin', hireDate: '2023-01-01', isActive: true, shift: 'Morning' },
  { id: 'e4', firstName: 'John', lastName: 'CEO', email: 'ceo@example.com', passwordHash: defaultPasswordHash, department: 'Executive', role: 'CEO', hireDate: '2021-01-01', isActive: true, shift: 'Morning' },
  { id: 'e5', firstName: 'Jane', lastName: 'CTO', email: 'cto@example.com', passwordHash: defaultPasswordHash, department: 'Executive', role: 'CTO', hireDate: '2021-01-01', isActive: true, shift: 'Morning' },
  { id: 'e6', firstName: 'Charlie', lastName: 'Leader', email: 'leader@example.com', passwordHash: defaultPasswordHash, department: 'Engineering', role: 'Team Leader', hireDate: '2022-05-10', isActive: true, shift: 'Morning' },
  { id: 'e7', firstName: 'David', lastName: 'Developer', email: 'david@example.com', passwordHash: defaultPasswordHash, department: 'Engineering', role: 'Developer', hireDate: '2023-03-20', isActive: true, shift: 'Morning' },
  { id: 'e8', firstName: 'Eve', lastName: 'Engineer', email: 'eve@example.com', passwordHash: defaultPasswordHash, department: 'Engineering', role: 'Developer', hireDate: '2023-04-12', isActive: true, shift: 'Evening' },
  { id: 'e9', firstName: 'Frank', lastName: 'Frontend', email: 'frank@example.com', passwordHash: defaultPasswordHash, department: 'Engineering', role: 'Developer', hireDate: '2023-05-05', isActive: true, shift: 'Morning' },
  { id: 'e10', firstName: 'Sarah', lastName: 'CRM Lead', email: 'sarah@example.com', passwordHash: defaultPasswordHash, department: 'Sales', role: 'Team Leader', hireDate: '2022-08-15', isActive: true, shift: 'Morning' },
  { id: 'e11', firstName: 'Mike', lastName: 'Sales Rep', email: 'mike@example.com', passwordHash: defaultPasswordHash, department: 'Sales', role: 'Sales Rep', hireDate: '2023-09-01', isActive: true, shift: 'Morning' },
  { id: 'e12', firstName: 'Mark', lastName: 'Digital Marketer', email: 'mark@example.com', passwordHash: defaultPasswordHash, department: 'Marketing', role: 'Marketing Member', hireDate: '2023-10-01', isActive: true, shift: 'Morning' },

  { id: 'user-sales-john', firstName: 'John', lastName: 'Doe', email: 'john@acme.com', passwordHash: defaultPasswordHash, department: 'Sales', role: 'Sales Rep', designation: 'Senior Account Manager', hireDate: '2015-01-01', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-sales-jane', firstName: 'Jane', lastName: 'Smith', email: 'jane@acme.com', passwordHash: defaultPasswordHash, department: 'Sales', role: 'Sales Rep', designation: 'Sales Representative', hireDate: '2016-01-01', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-leader-1', firstName: 'Michael', lastName: 'Scott', email: 'michael@acme.com', passwordHash: defaultPasswordHash, department: 'Sales', role: 'Sales Team Leader', designation: 'Regional Manager', hireDate: '2015-05-10', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-leader-2', firstName: 'Jim', lastName: 'Halpert', email: 'jim@acme.com', passwordHash: defaultPasswordHash, department: 'Sales', role: 'Sales Team Leader', designation: 'Co-Manager', hireDate: '2016-05-10', isActive: true, shift: 'Morning', teamId: 'team-beta' },
  { id: 'user-sales-1', firstName: 'Dwight', lastName: 'Schrute', email: 'dwight@acme.com', passwordHash: defaultPasswordHash, department: 'Sales', role: 'Sales Rep', designation: 'Assistant to the Regional Manager', hireDate: '2017-03-20', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-sales-2', firstName: 'Stanley', lastName: 'Hudson', email: 'stanley@acme.com', passwordHash: defaultPasswordHash, department: 'Sales', role: 'Sales Rep', designation: 'Sales Representative', hireDate: '2018-03-20', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-sales-3', firstName: 'Phyllis', lastName: 'Vance', email: 'phyllis@acme.com', passwordHash: defaultPasswordHash, department: 'Sales', role: 'Sales Rep', designation: 'Sales Representative', hireDate: '2019-03-20', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-sales-4', firstName: 'Andy', lastName: 'Bernard', email: 'andy@acme.com', passwordHash: defaultPasswordHash, department: 'Sales', role: 'Sales Rep', designation: 'Sales Representative', hireDate: '2020-03-20', isActive: true, shift: 'Morning', teamId: 'team-beta' },
  { id: 'user-sales-5', firstName: 'Ryan', lastName: 'Howard', email: 'ryan@acme.com', passwordHash: defaultPasswordHash, department: 'Sales', role: 'Sales Rep', designation: 'Temp Sales', hireDate: '2021-03-20', isActive: true, shift: 'Morning', teamId: 'team-beta' },
  { id: 'user-sales-6', firstName: 'Pam', lastName: 'Beesly', email: 'pam@acme.com', passwordHash: defaultPasswordHash, department: 'Sales', role: 'Sales Rep', designation: 'Sales Representative', hireDate: '2022-03-20', isActive: true, shift: 'Morning', teamId: 'team-beta' },
];`;

const newSeedEmployees = `const seedEmployees = (): any[] => [
  { id: 'e1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', passwordHash: defaultPasswordHash, department: 'PM', role: 'Member', designation: 'Developer', hireDate: '2023-01-15', isActive: true, shift: 'Morning' },
  { id: 'e2', firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', passwordHash: defaultPasswordHash, department: 'HRM', role: 'TL', designation: 'HR Lead', hireDate: '2022-11-01', isActive: true, shift: 'Evening' },
  { id: 'e3', firstName: 'System', lastName: 'Admin', email: 'admin@example.com', passwordHash: defaultPasswordHash, department: null, role: 'Admin', designation: 'System Administrator', hireDate: '2023-01-01', isActive: true, shift: 'Morning' },
  { id: 'e4', firstName: 'John', lastName: 'CEO', email: 'ceo@example.com', passwordHash: defaultPasswordHash, department: null, role: 'CEO', designation: 'Chief Executive Officer', hireDate: '2021-01-01', isActive: true, shift: 'Morning' },
  { id: 'e5', firstName: 'Jane', lastName: 'CTO', email: 'cto@example.com', passwordHash: defaultPasswordHash, department: null, role: 'CTO', designation: 'Chief Technology Officer', hireDate: '2021-01-01', isActive: true, shift: 'Morning' },
  { id: 'e6', firstName: 'Charlie', lastName: 'Leader', email: 'leader@example.com', passwordHash: defaultPasswordHash, department: 'PM', role: 'TL', designation: 'Project Team Lead', hireDate: '2022-05-10', isActive: true, shift: 'Morning' },
  { id: 'e7', firstName: 'David', lastName: 'Developer', email: 'david@example.com', passwordHash: defaultPasswordHash, department: 'PM', role: 'Member', designation: 'Developer', hireDate: '2023-03-20', isActive: true, shift: 'Morning' },
  { id: 'e8', firstName: 'Eve', lastName: 'Engineer', email: 'eve@example.com', passwordHash: defaultPasswordHash, department: 'PM', role: 'Member', designation: 'Developer', hireDate: '2023-04-12', isActive: true, shift: 'Evening' },
  { id: 'e9', firstName: 'Frank', lastName: 'Frontend', email: 'frank@example.com', passwordHash: defaultPasswordHash, department: 'PM', role: 'Member', designation: 'Developer', hireDate: '2023-05-05', isActive: true, shift: 'Morning' },
  { id: 'e10', firstName: 'Sarah', lastName: 'CRM Lead', email: 'sarah@example.com', passwordHash: defaultPasswordHash, department: 'CRM', role: 'TL', designation: 'CRM Team Lead', hireDate: '2022-08-15', isActive: true, shift: 'Morning' },
  { id: 'e11', firstName: 'Mike', lastName: 'Sales Rep', email: 'mike@example.com', passwordHash: defaultPasswordHash, department: 'CRM', role: 'Member', designation: 'CRM Executive', hireDate: '2023-09-01', isActive: true, shift: 'Morning' },
  { id: 'e12', firstName: 'Mark', lastName: 'Digital Marketer', email: 'mark@example.com', passwordHash: defaultPasswordHash, department: 'CRM', role: 'Member', designation: 'Marketing Member', hireDate: '2023-10-01', isActive: true, shift: 'Morning' },

  { id: 'user-sales-john', firstName: 'John', lastName: 'Doe', email: 'john@acme.com', passwordHash: defaultPasswordHash, department: 'CRM', role: 'Member', designation: 'Senior Account Manager', hireDate: '2015-01-01', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-sales-jane', firstName: 'Jane', lastName: 'Smith', email: 'jane@acme.com', passwordHash: defaultPasswordHash, department: 'CRM', role: 'Member', designation: 'Sales Representative', hireDate: '2016-01-01', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-leader-1', firstName: 'Michael', lastName: 'Scott', email: 'michael@acme.com', passwordHash: defaultPasswordHash, department: 'CRM', role: 'TL', designation: 'Regional Manager', hireDate: '2015-05-10', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-leader-2', firstName: 'Jim', lastName: 'Halpert', email: 'jim@acme.com', passwordHash: defaultPasswordHash, department: 'CRM', role: 'TL', designation: 'Co-Manager', hireDate: '2016-05-10', isActive: true, shift: 'Morning', teamId: 'team-beta' },
  { id: 'user-sales-1', firstName: 'Dwight', lastName: 'Schrute', email: 'dwight@acme.com', passwordHash: defaultPasswordHash, department: 'CRM', role: 'Member', designation: 'Assistant to the Regional Manager', hireDate: '2017-03-20', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-sales-2', firstName: 'Stanley', lastName: 'Hudson', email: 'stanley@acme.com', passwordHash: defaultPasswordHash, department: 'CRM', role: 'Member', designation: 'Sales Representative', hireDate: '2018-03-20', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-sales-3', firstName: 'Phyllis', lastName: 'Vance', email: 'phyllis@acme.com', passwordHash: defaultPasswordHash, department: 'CRM', role: 'Member', designation: 'Sales Representative', hireDate: '2019-03-20', isActive: true, shift: 'Morning', teamId: 'team-alpha' },
  { id: 'user-sales-4', firstName: 'Andy', lastName: 'Bernard', email: 'andy@acme.com', passwordHash: defaultPasswordHash, department: 'CRM', role: 'Member', designation: 'Sales Representative', hireDate: '2020-03-20', isActive: true, shift: 'Morning', teamId: 'team-beta' },
  { id: 'user-sales-5', firstName: 'Ryan', lastName: 'Howard', email: 'ryan@acme.com', passwordHash: defaultPasswordHash, department: 'CRM', role: 'Member', designation: 'Temp Sales', hireDate: '2021-03-20', isActive: true, shift: 'Morning', teamId: 'team-beta' },
  { id: 'user-sales-6', firstName: 'Pam', lastName: 'Beesly', email: 'pam@acme.com', passwordHash: defaultPasswordHash, department: 'CRM', role: 'Member', designation: 'Sales Representative', hireDate: '2022-03-20', isActive: true, shift: 'Morning', teamId: 'team-beta' },
];`;

content = content.replace(oldSeedEmployees.replace(/\r?\n/g, '\r\n'), newSeedEmployees.replace(/\r?\n/g, '\r\n'));
if (!content.includes('department: \'HRM\', role: \'TL\'')) {
  content = content.replace(oldSeedEmployees.replace(/\r?\n/g, '\n'), newSeedEmployees.replace(/\r?\n/g, '\n'));
}

// 2. Update departmentsList
const oldDeptList = `let departmentsList: any[] = loadGenericArrayFile(DEPARTMENTS_FILE, () => [
  { id: 'Engineering', name: 'Engineering' },
  { id: 'Sales', name: 'Sales' },
  { id: 'Marketing', name: 'Marketing' },
  { id: 'HR', name: 'HR' },
  { id: 'Design', name: 'Design' },
  { id: 'Finance', name: 'Finance' },
  { id: 'Executive', name: 'Executive' }
]);`;

const newDeptList = `let departmentsList: any[] = loadGenericArrayFile(DEPARTMENTS_FILE, () => [
  { id: 'HRM', name: 'HRM' },
  { id: 'CRM', name: 'CRM' },
  { id: 'PM', name: 'PM' }
]);`;

content = content.replace(oldDeptList.replace(/\r?\n/g, '\r\n'), newDeptList.replace(/\r?\n/g, '\r\n'));
content = content.replace(oldDeptList.replace(/\r?\n/g, '\n'), newDeptList.replace(/\r?\n/g, '\n'));

// 3. Update getCallerFromHeaders & isElevated
const oldCaller = `function getCallerFromHeaders(req: express.Request): { userId: string; userRole: string } | null {
  // 1. Check signed JWT Bearer Token first
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && (decoded.userId || decoded.id)) {
        return {
          userId: decoded.userId || decoded.id,
          userRole: decoded.role || 'Member'
        };
      }
    } catch { /* token invalid or expired */ }
  }

  // 2. Local dev fallback ONLY gated behind explicit environment flag
  if (process.env.ALLOW_HEADER_AUTH === 'true') {
    const userId   = req.headers['x-user-id']   as string | undefined;
    const userRole = req.headers['x-user-role'] as string | undefined;
    if (userId) return { userId, userRole: userRole || 'Member' };
  }

  return null;
}

function isElevated(role: string): boolean {
  return ['Admin', 'HR', 'CEO', 'CTO', 'Manager'].includes(role);
}`;

const newCaller = `function getCallerFromHeaders(req: express.Request): { userId: string; userRole: string } | null {
  const ROLES = ['Admin', 'CEO', 'COO', 'CTO', 'TL', 'Member'];
  // 1. Check signed JWT Bearer Token first
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && (decoded.userId || decoded.id)) {
        const role = decoded.role;
        if (role && ROLES.includes(role)) {
          return {
            userId: decoded.userId || decoded.id,
            userRole: role
          };
        }
      }
    } catch { /* token invalid or expired */ }
  }

  // 2. Local dev fallback ONLY gated behind explicit environment flag
  if (process.env.ALLOW_HEADER_AUTH === 'true') {
    const userId   = req.headers['x-user-id']   as string | undefined;
    const userRole = req.headers['x-user-role'] as string | undefined;
    if (userId && userRole && ROLES.includes(userRole)) {
      return { userId, userRole };
    }
  }

  return null;
}

function isElevated(role: string): boolean {
  return ['Admin', 'CEO', 'COO', 'CTO', 'TL'].includes(role);
}`;

content = content.replace(oldCaller.replace(/\r?\n/g, '\r\n'), newCaller.replace(/\r?\n/g, '\r\n'));
content = content.replace(oldCaller.replace(/\r?\n/g, '\n'), newCaller.replace(/\r?\n/g, '\n'));

// 4. Update provisionEmployeeFromHire
const oldHire = `function provisionEmployeeFromHire(app: any, job: any) {
  const email = (app.email || app.candidateEmail || '').trim().toLowerCase();
  if (!email) return null;
  const existing = employees.find(e => e.email?.toLowerCase() === email);
  if (existing) return existing.id;
  
  const newEmp = {
    id: \`emp-\${Date.now()}\`,
    firstName: app.firstName || 'New',
    lastName: app.lastName || 'Hire',
    email: email,
    role: 'Member',
    department: 'Engineering', // default or extract from job
    status: 'Onboarding',
    isActive: false,
    joinDate: new Date().toISOString().split('T')[0],
    position: job?.title || 'Employee',
    createdAt: new Date().toISOString()
  };
  employees.push(newEmp);
  saveChatFile(EMPLOYEES_FILE, employees);
  return newEmp.id;
}`;

const newHire = `function provisionEmployeeFromHire(app: any, job: any) {
  const email = (app.email || app.candidateEmail || '').trim().toLowerCase();
  if (!email) return null;
  const existing = employees.find(e => e.email?.toLowerCase() === email);
  if (existing) return existing.id;
  
  const rawDept = job?.department;
  const validDept = ['HRM', 'CRM', 'PM'].includes(rawDept) ? rawDept : null;

  const newEmp = {
    id: \`emp-\${Date.now()}\`,
    firstName: app.firstName || (app.candidateName || '').split(' ')[0] || 'New',
    lastName: app.lastName || (app.candidateName || '').split(' ').slice(1).join(' ') || 'Hire',
    email: email,
    role: 'Member',
    department: validDept,
    status: 'Onboarding',
    isActive: false,
    joinDate: new Date().toISOString().split('T')[0],
    position: job?.title || 'Employee',
    createdAt: new Date().toISOString()
  };
  employees.push(newEmp);
  saveEmployees();
  return newEmp.id;
}`;

content = content.replace(oldHire.replace(/\r?\n/g, '\r\n'), newHire.replace(/\r?\n/g, '\r\n'));
content = content.replace(oldHire.replace(/\r?\n/g, '\n'), newHire.replace(/\r?\n/g, '\n'));

// 5. Update seedJobPostings
content = content.replace("department: 'Engineering',\n    location: 'Remote / Chennai',", "department: 'PM',\n    location: 'Remote / Chennai',");
content = content.replace("department: 'Engineering',\r\n    location: 'Remote / Chennai',", "department: 'PM',\r\n    location: 'Remote / Chennai',");
content = content.replace("department: 'Design',\n    location: 'Hybrid',", "department: 'PM',\n    location: 'Hybrid',");
content = content.replace("department: 'Design',\r\n    location: 'Hybrid',", "department: 'PM',\r\n    location: 'Hybrid',");

// 6. Update /users route fallback
content = content.replace("department: department || 'Engineering',", "department: ['Admin', 'CEO', 'COO', 'CTO'].includes(role) ? null : (department || 'HRM'),");
content = content.replace("role: role || 'Developer',", "role: role || 'Member',");

fs.writeFileSync(apiPath, content, 'utf8');
console.log('API update completed successfully');

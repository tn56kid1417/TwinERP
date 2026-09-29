export const ROLES = ['Admin', 'CEO', 'COO', 'CTO', 'TL', 'Member'] as const;
export type Role = typeof ROLES[number];

export const DEPARTMENTS = ['HRM', 'CRM', 'PM'] as const;
export type Department = typeof DEPARTMENTS[number];

export const EXECUTIVE_ROLES = ['CEO', 'COO', 'CTO'] as const;

export function isExecutive(role: string | undefined | null): boolean {
  if (!role) return false;
  return EXECUTIVE_ROLES.includes(role as any);
}

export function isAdmin(role: string | undefined | null): boolean {
  return role === 'Admin';
}

export function requiresDepartment(role: string | undefined | null): boolean {
  return role === 'TL' || role === 'Member';
}

// Capabilities
export const can = {
  approveLeave: (role: string | undefined, department: string | undefined) => {
    return isAdmin(role) || isExecutive(role) || (role === 'TL' && department === 'HRM');
  },
  assignTasks: (role: string | undefined, department: string | undefined) => {
    return isAdmin(role) || isExecutive(role) || role === 'TL';
  },
  manageEmployees: (role: string | undefined, department: string | undefined) => {
    return isAdmin(role) || isExecutive(role) || (department === 'HRM');
  },
  formTeams: (role: string | undefined, department: string | undefined) => {
    return isAdmin(role) || isExecutive(role) || (department === 'HRM') || (role === 'TL' && department === 'PM');
  },
  viewAllDepartments: (role: string | undefined, department: string | undefined) => {
    return isAdmin(role) || isExecutive(role) || department === 'HRM';
  },
  createProjects: (role: string | undefined, department: string | undefined) => {
    return isAdmin(role) || isExecutive(role) || department === 'HRM' || (role === 'TL' && department === 'PM');
  }
};


export function validateRoleDepartment(role: any, dept: any, isOnboarding: boolean = false): string | null {
  if (!role || !(ROLES as readonly string[]).includes(role)) return 'Invalid role';
  if (dept && !(DEPARTMENTS as readonly string[]).includes(dept)) return 'Invalid department';
  
  const isExecutiveRole = ['Admin', 'CEO', 'COO', 'CTO'].includes(role);
  if (isExecutiveRole && dept) {
    return 'Admin/CEO/COO/CTO cannot have a department';
  }
  
  if (['TL', 'Member'].includes(role)) {
    if (!dept && !isOnboarding) return 'TL and Member roles require a department';
  }
  
  return null;
}

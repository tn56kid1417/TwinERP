import type { User, Company, Lead, Note, Purchase, Customer } from '../types'

// Default Seed Data
const DEFAULT_COMPANIES: Company[] = [
  {
    id: 'company-1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1 (555) 019-8811',
    industry: 'Manufacturing',
    address: '123 Industrial Parkway',
    country: 'United States',
    state: 'California',
    city: 'Los Angeles',
    website: 'acme.com',
    workspaceName: 'acme',
    companySize: '11–50 Employees',
    createdDate: '2026-01-15T08:00:00Z',
    userCount: 3,
  },
  {
    id: 'company-2',
    name: 'Stark Industries',
    email: 'info@starkindustries.com',
    phone: '+1 (555) 888-0099',
    industry: 'Technology',
    address: '10880 Wilshire Blvd',
    country: 'United States',
    state: 'New York',
    city: 'New York',
    website: 'starkindustries.com',
    workspaceName: 'stark',
    companySize: '101–500 Employees',
    createdDate: '2026-03-10T09:30:00Z',
    userCount: 1,
  },
  {
    id: 'company-3',
    name: 'Wayne Enterprises',
    email: 'hq@waynecorp.com',
    phone: '+1 (555) 777-9911',
    industry: 'Aerospace',
    address: '1007 Mountain Drive',
    country: 'United States',
    state: 'New Jersey',
    city: 'Gotham',
    website: 'waynecorp.com',
    workspaceName: 'wayne',
    companySize: '500+ Employees',
    createdDate: '2026-05-22T14:15:00Z',
    userCount: 1,
  }
]

const DEFAULT_USERS: (User & { password?: string })[] = [
  {
    id: 'user-admin-acme',
    name: 'Sarah Connor',
    email: 'admin@acme.com',
    role: 'COMPANY_ADMIN',
    designation: 'Operations Director',
    mobile: '+1 (555) 019-9922',
    companyId: 'company-1',
    workspaceName: 'acme',
    password: 'password',
  },
  {
    id: 'user-sales-john',
    name: 'John Doe',
    email: 'john@acme.com',
    role: 'SALES_USER',
    designation: 'Senior Account Manager',
    mobile: '+1 (555) 019-2233',
    companyId: 'company-1',
    workspaceName: 'acme',
    teamId: 'team-alpha',
    password: 'password',
  },
  {
    id: 'user-sales-jane',
    name: 'Jane Smith',
    email: 'jane@acme.com',
    role: 'SALES_USER',
    designation: 'Sales Representative',
    mobile: '+1 (555) 019-4455',
    companyId: 'company-1',
    workspaceName: 'acme',
    teamId: 'team-alpha',
    password: 'password',
  },
  {
    id: 'user-leader-1',
    name: 'Michael Scott',
    email: 'michael@acme.com',
    role: 'SALES_LEADER',
    designation: 'Regional Manager',
    mobile: '+1 (555) 019-1111',
    companyId: 'company-1',
    workspaceName: 'acme',
    teamId: 'team-alpha',
    password: 'password',
  },
  {
    id: 'user-leader-2',
    name: 'Jim Halpert',
    email: 'jim@acme.com',
    role: 'SALES_LEADER',
    designation: 'Co-Manager',
    mobile: '+1 (555) 019-2222',
    companyId: 'company-1',
    workspaceName: 'acme',
    teamId: 'team-beta',
    password: 'password',
  },
  {
    id: 'user-sales-1',
    name: 'Dwight Schrute',
    email: 'dwight@acme.com',
    role: 'SALES_USER',
    designation: 'Assistant to the Regional Manager',
    mobile: '+1 (555) 019-3333',
    companyId: 'company-1',
    workspaceName: 'acme',
    teamId: 'team-alpha',
    password: 'password',
  },
  {
    id: 'user-sales-2',
    name: 'Stanley Hudson',
    email: 'stanley@acme.com',
    role: 'SALES_USER',
    designation: 'Sales Representative',
    mobile: '+1 (555) 019-4444',
    companyId: 'company-1',
    workspaceName: 'acme',
    teamId: 'team-alpha',
    password: 'password',
  },
  {
    id: 'user-sales-3',
    name: 'Phyllis Vance',
    email: 'phyllis@acme.com',
    role: 'SALES_USER',
    designation: 'Sales Representative',
    mobile: '+1 (555) 019-5555',
    companyId: 'company-1',
    workspaceName: 'acme',
    teamId: 'team-alpha',
    password: 'password',
  },
  {
    id: 'user-sales-4',
    name: 'Andy Bernard',
    email: 'andy@acme.com',
    role: 'SALES_USER',
    designation: 'Sales Representative',
    mobile: '+1 (555) 019-6666',
    companyId: 'company-1',
    workspaceName: 'acme',
    teamId: 'team-beta',
    password: 'password',
  },
  {
    id: 'user-sales-5',
    name: 'Ryan Howard',
    email: 'ryan@acme.com',
    role: 'SALES_USER',
    designation: 'Temp Sales',
    mobile: '+1 (555) 019-7777',
    companyId: 'company-1',
    workspaceName: 'acme',
    teamId: 'team-beta',
    password: 'password',
  },
  {
    id: 'user-sales-6',
    name: 'Pam Beesly',
    email: 'pam@acme.com',
    role: 'SALES_USER',
    designation: 'Sales Representative',
    mobile: '+1 (555) 019-8888',
    companyId: 'company-1',
    workspaceName: 'acme',
    teamId: 'team-beta',
    password: 'password',
  },
  {
    id: 'user-admin-stark',
    name: 'Pepper Potts',
    email: 'pepper@stark.com',
    role: 'COMPANY_ADMIN',
    designation: 'Chief Executive Officer',
    mobile: '+1 (555) 888-2233',
    companyId: 'company-2',
    workspaceName: 'stark',
    password: 'password',
  },
  {
    id: 'user-admin-wayne',
    name: 'Lucius Fox',
    email: 'lucius@wayne.com',
    role: 'COMPANY_ADMIN',
    designation: 'Business Manager',
    mobile: '+1 (555) 777-2233',
    companyId: 'company-3',
    workspaceName: 'wayne',
    password: 'password',
  }
]

const DEFAULT_LEADS: Lead[] = [
  // Acme Corp Leads
  {
    id: 'lead-1',
    name: 'Alice Vance',
    companyName: 'Tech Solutions Inc',
    email: 'alice@techsolutions.com',
    phone: '+1 (555) 019-2834',
    status: 'New',
    companyId: 'company-1',
    value: 12500,
    createdDate: '2026-07-20T10:00:00Z',
    updatedDate: '2026-07-20T10:00:00Z',
  },
  {
    id: 'lead-2',
    name: 'Bob Vance',
    companyName: 'Vance Refrigeration',
    email: 'bob@vancerefrig.com',
    phone: '+1 (555) 014-9988',
    status: 'Contacted',
    assignedUserId: 'user-sales-john',
    assignedUserName: 'John Doe',
    companyId: 'company-1',
    value: 5000,
    createdDate: '2026-07-18T11:30:00Z',
    updatedDate: '2026-07-22T09:00:00Z',
  },
  {
    id: 'lead-3',
    name: 'Charlie Kelly',
    companyName: "Paddy's Pub Logistics",
    email: 'charlie@paddyspub.com',
    phone: '+1 (555) 012-3456',
    status: 'Follow-up',
    assignedUserId: 'user-sales-john',
    assignedUserName: 'John Doe',
    companyId: 'company-1',
    value: 1800,
    createdDate: '2026-07-10T14:00:00Z',
    updatedDate: '2026-07-25T16:45:00Z',
  },
  {
    id: 'lead-4',
    name: 'Diana Prince',
    companyName: 'Themyscira Antiquities',
    email: 'diana@themyscira.org',
    phone: '+1 (555) 017-8899',
    status: 'Converted',
    assignedUserId: 'user-sales-jane',
    assignedUserName: 'Jane Smith',
    companyId: 'company-1',
    value: 48000,
    createdDate: '2026-07-02T09:00:00Z',
    updatedDate: '2026-07-15T15:30:00Z',
  },
  {
    id: 'lead-5',
    name: 'Edward Nigma',
    companyName: 'Riddle Cybersecurity',
    email: 'edward@riddles.com',
    phone: '+1 (555) 018-4433',
    status: 'Closed',
    assignedUserId: 'user-sales-jane',
    assignedUserName: 'Jane Smith',
    companyId: 'company-1',
    value: 9500,
    createdDate: '2026-06-25T13:00:00Z',
    updatedDate: '2026-07-12T11:00:00Z',
  },
  {
    id: 'lead-6',
    name: 'Fiona Gallagher',
    companyName: 'Southside Properties',
    email: 'fiona@southsideprop.com',
    phone: '+1 (555) 015-6677',
    status: 'New',
    companyId: 'company-1',
    value: 7200,
    createdDate: '2026-07-28T08:15:00Z',
    updatedDate: '2026-07-28T08:15:00Z',
  },
  {
    id: 'lead-7',
    name: 'Gregory House',
    companyName: 'Princeton Diagnostics Group',
    email: 'house@princetonmed.org',
    phone: '+1 (555) 011-2233',
    status: 'Contacted',
    assignedUserId: 'user-sales-john',
    assignedUserName: 'John Doe',
    companyId: 'company-1',
    value: 32000,
    createdDate: '2026-07-12T10:30:00Z',
    updatedDate: '2026-07-14T14:20:00Z',
  },
  {
    id: 'lead-8',
    name: 'Hal Jordan',
    companyName: 'Ferris Aircraft Corp',
    email: 'hal@ferrisair.com',
    phone: '+1 (555) 019-5555',
    status: 'Follow-up',
    assignedUserId: 'user-sales-jane',
    assignedUserName: 'Jane Smith',
    companyId: 'company-1',
    value: 15000,
    createdDate: '2026-07-05T11:00:00Z',
    updatedDate: '2026-07-26T10:00:00Z',
  },
  // Stark Industries Leads
  {
    id: 'lead-9',
    name: 'Bruce Banner',
    companyName: 'Gamma Lab Research',
    email: 'hulk@gammalabs.org',
    phone: '+1 (555) 010-0987',
    status: 'New',
    companyId: 'company-2',
    value: 85000,
    createdDate: '2026-07-24T15:00:00Z',
    updatedDate: '2026-07-24T15:00:00Z',
  },
  {
    id: 'lead-10',
    name: 'Peter Parker',
    companyName: 'Daily Bugle Tech',
    email: 'peter@bugle.com',
    phone: '+1 (555) 013-4455',
    status: 'Converted',
    companyId: 'company-2',
    value: 2500,
    createdDate: '2026-07-01T10:00:00Z',
    updatedDate: '2026-07-10T12:00:00Z',
  },
  // Wayne Enterprises Leads
  {
    id: 'lead-11',
    name: 'Harvey Dent',
    companyName: 'Gotham Legal Associates',
    email: 'hdent@gothamlegal.gov',
    phone: '+1 (555) 012-2222',
    status: 'Follow-up',
    companyId: 'company-3',
    value: 14000,
    createdDate: '2026-07-15T09:00:00Z',
    updatedDate: '2026-07-20T16:00:00Z',
  }
]

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Diana Prince',
    email: 'diana@themyscira.org',
    phone: '+1 (555) 017-8899',
    assignedUserId: 'user-sales-jane',
    assignedUserName: 'Jane Smith',
    companyId: 'company-1',
    createdDate: '2026-07-15T15:30:00Z',
  },
  {
    id: 'cust-2',
    name: 'Peter Parker',
    email: 'peter@bugle.com',
    phone: '+1 (555) 013-4455',
    assignedUserId: undefined,
    assignedUserName: undefined,
    companyId: 'company-2',
    createdDate: '2026-07-10T12:00:00Z',
  }
]

const DEFAULT_NOTES: Note[] = [
  {
    id: 'note-1',
    leadId: 'lead-2', // Bob Vance
    authorName: 'John Doe',
    text: 'Initial cold call completed. Bob expressed strong interest in commercial units.',
    timestamp: '2026-07-18T12:00:00Z',
  },
  {
    id: 'note-2',
    leadId: 'lead-2',
    authorName: 'John Doe',
    text: 'Sent product pricing brochures. Awaiting reply.',
    timestamp: '2026-07-20T15:30:00Z',
  },
  {
    id: 'note-3',
    leadId: 'cust-1', // Diana Prince
    authorName: 'Jane Smith',
    text: 'Contract signed! Diana approved the enterprise license. Set up onboarding session.',
    timestamp: '2026-07-15T15:30:00Z',
  }
]

const DEFAULT_PURCHASES: Purchase[] = [
  {
    id: 'purchase-1',
    leadId: 'cust-1', // Diana Prince
    product: 'Enterprise CRM Cloud Suite License (1-Year)',
    amount: 48000,
    date: '2026-07-15T16:00:00Z',
  },
  {
    id: 'purchase-2',
    leadId: 'cust-2', // Peter Parker
    product: 'Professional CRM Starter Package',
    amount: 2500,
    date: '2026-07-10T12:00:00Z',
  }
]

class MockDatabase {
  constructor() {
    this.init()
  }

  private init() {
    const storedUsers = localStorage.getItem('crm_users')
    if (storedUsers) {
      try {
        const parsed = JSON.parse(storedUsers)
        if (parsed.length > 0 && !parsed[0].workspaceName) {
          localStorage.removeItem('crm_companies')
          localStorage.removeItem('crm_users')
          localStorage.removeItem('crm_leads')
          localStorage.removeItem('crm_customers')
          localStorage.removeItem('crm_notes')
          localStorage.removeItem('crm_purchases')
        }
      } catch (e) {
        // ignore
      }
    }

    if (!localStorage.getItem('crm_companies')) {
      localStorage.setItem('crm_companies', JSON.stringify(DEFAULT_COMPANIES))
    }
    localStorage.removeItem('crm_users');
    if (!localStorage.getItem('crm_users')) {
      localStorage.setItem('crm_users', JSON.stringify(DEFAULT_USERS))
    }
    if (!localStorage.getItem('crm_leads')) {
      localStorage.setItem('crm_leads', JSON.stringify(DEFAULT_LEADS))
    }
    if (!localStorage.getItem('crm_customers')) {
      localStorage.setItem('crm_customers', JSON.stringify(DEFAULT_CUSTOMERS))
    }
    if (!localStorage.getItem('crm_notes')) {
      localStorage.setItem('crm_notes', JSON.stringify(DEFAULT_NOTES))
    }
    if (!localStorage.getItem('crm_purchases')) {
      localStorage.setItem('crm_purchases', JSON.stringify(DEFAULT_PURCHASES))
    }
  }

  private getTable<T>(key: string): T[] {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  }

  private saveTable<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data))
  }

  // COMPANY OPERATIONS
  getCompanies(): Company[] {
    return this.getTable<Company>('crm_companies')
  }

  saveCompanies(companies: Company[]): void {
    this.saveTable('crm_companies', companies)
  }

  // USER OPERATIONS
  getUsers(): (User & { password?: string })[] {
    return this.getTable<(User & { password?: string })>('crm_users')
  }

  saveUsers(users: (User & { password?: string })[]): void {
    this.saveTable('crm_users', users)
  }

  // LEAD OPERATIONS
  getLeads(): Lead[] {
    return this.getTable<Lead>('crm_leads')
  }

  saveLeads(leads: Lead[]): void {
    this.saveTable('crm_leads', leads)
  }

  // CUSTOMER OPERATIONS
  getCustomers(): Customer[] {
    return this.getTable<Customer>('crm_customers')
  }

  saveCustomers(customers: Customer[]): void {
    this.saveTable('crm_customers', customers)
  }

  // NOTE OPERATIONS
  getNotes(): Note[] {
    return this.getTable<Note>('crm_notes')
  }

  saveNotes(notes: Note[]): void {
    this.saveTable('crm_notes', notes)
  }

  // PURCHASE OPERATIONS
  getPurchases(): Purchase[] {
    return this.getTable<Purchase>('crm_purchases')
  }

  savePurchases(purchases: Purchase[]): void {
    this.saveTable('crm_purchases', purchases)
  }

  // CALL OPERATIONS
  getCalls(): any[] {
    return this.getTable<any>("crm_calls")
  }

  saveCalls(calls: any[]): void {
    this.saveTable("crm_calls", calls)
  }

  reset(): void {
    localStorage.removeItem('crm_companies')
    localStorage.removeItem('crm_users')
    localStorage.removeItem('crm_leads')
    localStorage.removeItem('crm_customers')
    localStorage.removeItem('crm_notes')
    localStorage.removeItem('crm_purchases')
    localStorage.removeItem('crm_calls')
    this.init()
  }
}

export const db = new MockDatabase()
export default db

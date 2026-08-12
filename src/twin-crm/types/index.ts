export type Role = 'COMPANY_ADMIN' | 'SALES_USER' | 'MARKETING' | 'SALES_LEADER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  designation?: string;
  mobile?: string;
  companyId?: string; // Present for COMPANY_ADMIN and SALES_USER
  workspaceName?: string;
  teamId?: string;
}

export type CompanySize = '1–10 Employees' | '11–50 Employees' | '51–100 Employees' | '101–500 Employees' | '500+ Employees';

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  industry: string;
  address: string;
  country: string;
  state: string;
  city: string;
  website?: string;
  workspaceName: string; // e.g. "abc" for abc.twincord.com
  companySize: CompanySize;
  createdDate: string;
  userCount: number;
}

export type LeadStatus = 'New' | 'Contacted' | 'Follow-up' | 'Closed' | 'Converted';

export interface Lead {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  status: LeadStatus;
  assignedUserId?: string; // ID of the SALES_USER
  assignedUserName?: string; // Name of the SALES_USER
  companyId: string; // Tenant company ID
  value: number; // Potential monetary value
  createdDate: string;
  updatedDate: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignedUserId?: string;
  assignedUserName?: string;
  companyId: string;
  createdDate: string;
}

export interface Note {
  id: string;
  leadId: string; // Matches Lead ID / Customer ID
  authorName: string;
  text: string;
  timestamp: string;
}

export interface Purchase {
  id: string;
  leadId: string; // Matches Lead ID / Customer ID
  product: string;
  amount: number;
  date: string;
  paymentStatus?: 'expired' | 'Paid' | 'Pending';
  paymentType?: 'Full' | 'Partial';
  soldPrice?: number;
  paymentLink?: string;
  createdBy?: string;
  approval?: 'Not Required' | 'Awaiting';
  approver?: string;
  expires?: string;
}

export type CallStatus = 'Answered' | 'Not Connected 1' | 'Not Connected 2' | 'Not Connected 3' | 'Not Connected 4' | 'Not Connected 5' | 'Busy' | 'Voicemail' | 'Wrong Number' | 'Follow Up';
export interface CallLog {
  id: string;
  leadId?: string;
  userId: string;
  userName: string;
  phoneNumber: string;
  startTime: string;
  durationSeconds: number;
  status: CallStatus;
  notes?: string;
  followUpTime?: string;
}

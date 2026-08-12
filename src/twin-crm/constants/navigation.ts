import { LayoutDashboard, Users, Target, Users2, FileText, Settings, UploadCloud } from 'lucide-react'

export interface NavItem {
  name: string
  href: string
  icon: any
  allowedRoles?: string[]
}

export const SIDEBAR_NAV: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Sales Reps',
    href: '/sales',
    icon: Users,
    allowedRoles: ['COMPANY_ADMIN'],
  },
  {
    name: 'Leads Board',
    href: '/leads',
    icon: Target,
  },
  {
    name: 'Upload Leads',
    href: '/upload-leads',
    icon: UploadCloud,
    allowedRoles: ['COMPANY_ADMIN', 'MARKETING'],
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Users2,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export default SIDEBAR_NAV

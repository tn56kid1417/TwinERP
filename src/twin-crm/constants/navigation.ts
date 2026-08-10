import { LayoutDashboard, Users, Target, Users2, FileText, Settings } from 'lucide-react'

export interface NavItem {
  name: string
  href: string
  icon: any
  adminOnly?: boolean // Hide from sales users
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
    adminOnly: true,
  },
  {
    name: 'Leads Board',
    href: '/leads',
    icon: Target,
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

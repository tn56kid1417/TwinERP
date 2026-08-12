import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Globe } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Sidebar from '../components/Sidebar'
import { Badge } from '../components/ui/Badge'

export const DashboardLayout: React.FC = () => {
  const { user } = useAuthStore()
  const location = useLocation()

  // Helper to format path name into readable breadcrumb title
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Dashboard Overview'
    if (path.startsWith('/sales')) return 'Sales Team Management'
    if (path.startsWith('/leads')) return 'Lead Board'
    if (path.startsWith('/customers')) {
      if (path.split('/').length > 2) return 'Customer Information'
      return 'Customer Management'
    }
    if (path.startsWith('/reports')) return 'Analytics Reports'
    if (path.startsWith('/settings')) return 'Workspace Settings'
    return 'Control Panel'
  }

  const workspaceUrl = user?.workspaceName ? `${user.workspaceName}.twincord.com` : 'workspace.twincord.com'

  return (
    <div className="flex h-screen w-full overflow-hidden text-slate-800 dark:text-slate-200 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Sticky Top Header */}
        <header className="flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-[#1A1D23]/60 backdrop-blur-md h-16 flex-shrink-0 z-20 transition-colors">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {getPageTitle()}
            </h2>
            <Badge variant="primary" className="hidden sm:inline-flex lowercase font-bold tracking-wide select-all items-center gap-1">
              <Globe size={10} /> {workspaceUrl}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {/* Calendar helper */}
            <div className="w-1.5 h-6 bg-slate-200 rounded-full hidden sm:block" />
            <span className="text-xs font-semibold text-slate-500 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Dashboard Pages Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-transparent relative z-10">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
export default DashboardLayout

import React, { Component, ReactNode } from 'react'
import { useAuthStore } from '../store/authStore'
import { CompanyAdminDashboard } from '../views/company-admin/Dashboard'
import { SalesUserDashboard } from '../views/sales-user/Dashboard'

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  public state = { hasError: false, error: null as Error | null };
  constructor(props: {children: ReactNode}) {
    super(props);
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 p-8 text-left bg-white font-mono"><h1>CRM Error</h1><pre>{this.state.error?.toString()}</pre><pre>{this.state.error?.stack}</pre></div>;
    }
    return (this as any).props.children;
  }
}

const DashboardContent: React.FC = () => {
  const { user } = useAuthStore()

  if (user?.role === 'COMPANY_ADMIN') {
    return <CompanyAdminDashboard />
  }

  return <SalesUserDashboard />
}

export const DashboardDispatcher: React.FC = () => {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  )
}

export default DashboardDispatcher

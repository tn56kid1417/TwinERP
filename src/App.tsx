/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';

// Lazy-load all pages — each is only downloaded when navigated to
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const EmployeeList     = lazy(() => import('./pages/EmployeeList'));
const LeaveRequests    = lazy(() => import('./pages/LeaveRequests'));
const LeaveBalance     = lazy(() => import('./pages/LeaveBalance'));
const Attendance       = lazy(() => import('./pages/Attendance'));
const Payslips         = lazy(() => import('./pages/Payslips'));
const Resignations     = lazy(() => import('./pages/Resignations'));
const Terminations     = lazy(() => import('./pages/Terminations'));
const Holidays         = lazy(() => import('./pages/Holidays'));
const Awards           = lazy(() => import('./pages/Awards'));
const Announcements    = lazy(() => import('./pages/Announcements'));
const Events           = lazy(() => import('./pages/Events'));
const LetterGenerator  = lazy(() => import('./pages/LetterGenerator'));
const Settings         = lazy(() => import('./pages/Settings'));
const HRMUserAnalytics = lazy(() => import('./pages/HRMUserAnalytics'));
const ProjectsDashboard= lazy(() => import('./pages/projects/ProjectsDashboard'));
const ProjectsList     = lazy(() => import('./pages/projects/ProjectsList'));
const ProjectKanban    = lazy(() => import('./pages/projects/ProjectKanban'));
const ClientsList      = lazy(() => import('./pages/projects/ClientsList'));
const CareersAdmin     = lazy(() => import('./pages/CareersAdmin'));
const JobApplications  = lazy(() => import('./pages/JobApplications'));
const DocumentsContracts = lazy(() => import('./pages/DocumentsContracts'));
const UserManagement   = lazy(() => import('./pages/UserManagement'));
const Lifecycle        = lazy(() => import('./pages/Lifecycle'));

// CRM module — lazy loaded as a group
const DashboardDispatcher = lazy(() => import('./twin-crm/router/DashboardDispatcher'));
const LeadsDispatcher     = lazy(() => import('./twin-crm/router/LeadsDispatcher'));
const UploadLeads         = lazy(() => import('./twin-crm/views/marketing/UploadLeads'));
const Customers           = lazy(() => import('./twin-crm/views/company-admin/Customers'));
const CustomerDetails     = lazy(() => import('./twin-crm/views/company-admin/CustomerDetails'));
const Reports             = lazy(() => import('./twin-crm/views/company-admin/Reports'));
const SalesUsers          = lazy(() => import('./twin-crm/views/company-admin/SalesUsers'));
const CRMSettings         = lazy(() => import('./twin-crm/views/shared/Settings'));
const CRMCalls            = lazy(() => import('./twin-crm/views/shared/Calls'));
const CRMPayments         = lazy(() => import('./twin-crm/views/shared/Payments'));
const DistributeLeads     = lazy(() => import('./twin-crm/views/sales-leader/DistributeLeads'));

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
  </div>
);

interface ErrorBoundaryProps { children: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: null };
  constructor(props: ErrorBoundaryProps) {
    super(props);
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0C10] flex flex-col items-center justify-center gap-4 p-8 text-slate-200">
          <div className="bg-[#1A1D23] border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-400 mb-6 font-mono text-left bg-slate-900/80 p-3 rounded-lg overflow-x-auto max-h-40 border border-slate-800">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
              >
                Clear Cache & Logout
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <ErrorBoundary>
      {!user ? (
        <Login />
      ) : (
        <Router>
          <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0A0C10] text-slate-700 dark:text-slate-300 font-sans relative z-0">
            <div className="bg-live-mesh fixed inset-0 pointer-events-none">
              <div className="blob blob-1"></div>
              <div className="blob blob-2"></div>
              <div className="blob blob-3"></div>
              <div className="grid-bg"></div>
            </div>
            
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden z-10 relative">
              <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
              <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
              <main className="flex-1 overflow-y-auto overflow-x-hidden">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/employees" element={<EmployeeList />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/leaves" element={<LeaveRequests />} />
                    <Route path="/leave-balance" element={<LeaveBalance />} />
                    <Route path="/payslips" element={<Payslips />} />
                    <Route path="/resignations" element={<Resignations />} />
                    <Route path="/terminations" element={<Terminations />} />
                    <Route path="/holidays" element={<Holidays />} />
                    <Route path="/awards" element={<Awards />} />
                    <Route path="/announcements" element={<Announcements />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/letters" element={<LetterGenerator />} />
                    <Route path="/analytics" element={<HRMUserAnalytics />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/careers" element={<CareersAdmin />} />
                    <Route path="/careers/:jobId/applications" element={<JobApplications />} />
                    <Route path="/documents" element={<DocumentsContracts />} />
                    <Route path="/user-management" element={<UserManagement />} />
                    <Route path="/lifecycle" element={<Lifecycle />} />

                    {/* CRM Module Routes */}
                    <Route path="/crm">
                      <Route index element={<div className="p-6"><DashboardDispatcher /></div>} />
                      <Route path="leads" element={<div className="p-6"><LeadsDispatcher /></div>} />
                      <Route path="upload-leads" element={<div className="p-6"><UploadLeads /></div>} />
                      <Route path="customers" element={<div className="p-6"><Customers /></div>} />
                      <Route path="customers/:id" element={<div className="p-6"><CustomerDetails /></div>} />
                      <Route path="reports" element={<div className="p-6"><Reports /></div>} />
                      <Route path="sales" element={<div className="p-6"><SalesUsers /></div>} />
                      <Route path="calls" element={<div className="p-6"><CRMCalls /></div>} />
                      <Route path="payments" element={<div className="p-6"><CRMPayments /></div>} />
                      <Route path="distribute-leads" element={<div className="p-6"><DistributeLeads /></div>} />
                      <Route path="settings" element={<div className="p-6"><CRMSettings /></div>} />
                    </Route>

                    {/* Projects Module Routes */}
                    <Route path="/projects" element={<ProjectsDashboard />} />
                    <Route path="/projects/all" element={<ProjectsList />} />
                    <Route path="/projects/:id/board" element={<ProjectKanban />} />
                    <Route path="/projects/clients" element={<ClientsList />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </div>
        </Router>
      )}
    </ErrorBoundary>
  );
}

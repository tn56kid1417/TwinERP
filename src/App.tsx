/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 dark:bg-[#0A0C10] text-slate-700 dark:text-slate-300 font-sans relative overflow-hidden z-0">
        <div className="bg-live-mesh">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
          <div className="grid-bg"></div>
        </div>
        
        <Sidebar />
        <main className="flex-1 overflow-auto z-10 relative flex flex-col">
          <Header />
          <div className="flex-1 overflow-auto">
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
          </div>

        </main>
      </div>
    </Router>
  );
}

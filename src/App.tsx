/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import LeaveRequests from './pages/LeaveRequests';
import LeaveBalance from './pages/LeaveBalance';
import Attendance from './pages/Attendance';
import Payslips from './pages/Payslips';
import Resignations from './pages/Resignations';
import Terminations from './pages/Terminations';
import Holidays from './pages/Holidays';
import Awards from './pages/Awards';
import Announcements from './pages/Announcements';
import Events from './pages/Events';
import LetterGenerator from './pages/LetterGenerator';
import Login from './pages/Login';
import Placeholder from './pages/Placeholder';
import Settings from './pages/Settings';
import DashboardDispatcher from './twin-crm/router/DashboardDispatcher';
import LeadsDispatcher from './twin-crm/router/LeadsDispatcher';
import UploadLeads from './twin-crm/views/marketing/UploadLeads';
import Customers from './twin-crm/views/company-admin/Customers';
import CustomerDetails from './twin-crm/views/company-admin/CustomerDetails';
import Reports from './twin-crm/views/company-admin/Reports';
import SalesUsers from './twin-crm/views/company-admin/SalesUsers';
import CRMSettings from './twin-crm/views/shared/Settings';
import CRMCalls from './twin-crm/views/shared/Calls';
import CRMPayments from './twin-crm/views/shared/Payments';

import HRMUserAnalytics from './pages/HRMUserAnalytics';
import ProjectsList from './pages/projects/ProjectsList';
import ProjectKanban from './pages/projects/ProjectKanban';
import ProjectsDashboard from './pages/projects/ProjectsDashboard';
import ClientsList from './pages/projects/ClientsList';
import { useAuth } from './context/AuthContext';

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

              <Route path="settings" element={<div className="p-6"><CRMSettings /></div>} />
            </Route>

            {/* Projects Module Routes */}
            <Route path="/projects" element={<ProjectsDashboard />} />
            <Route path="/projects/all" element={<ProjectsList />} />
            <Route path="/projects/:id/board" element={<ProjectKanban />} />
            <Route path="/projects/clients" element={<ClientsList />} />

            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

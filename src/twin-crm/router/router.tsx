import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'

// Layout wrappers
import AuthLayout from '../layouts/AuthLayout'
import DashboardLayout from '../layouts/DashboardLayout'

// Public views
import RegisterCompany from '../views/public/RegisterCompany'

// Login View
import Login from '../views/auth/Login'

// Dispatchers
import DashboardDispatcher from './DashboardDispatcher'
import LeadsDispatcher from './LeadsDispatcher'

// Protected Workspace Views
import SalesUsers from '../views/company-admin/SalesUsers'
import Customers from '../views/company-admin/Customers'
import CustomerDetails from '../views/company-admin/CustomerDetails'
import Reports from '../views/company-admin/Reports'
import Settings from '../views/shared/Settings'

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<RegisterCompany />} />

        {/* AUTH SHELL (Centered cards) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* PROTECTED WORKSPACE PORTAL (Sidebar layout) */}
        <Route element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN', 'SALES_USER']} />}>
          <Route element={<DashboardLayout />}>
            
            {/* Common routes for both admin & sales reps */}
            <Route path="/dashboard" element={<DashboardDispatcher />} />
            <Route path="/leads" element={<LeadsDispatcher />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetails />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />

            {/* Admin-only routes */}
            <Route element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN']} />}>
              <Route path="/sales" element={<SalesUsers />} />
            </Route>

          </Route>
        </Route>

        {/* FALLBACK REDIRECTS */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
export default AppRouter

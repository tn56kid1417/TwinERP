import React from 'react'
import UploadLeads from '../views/marketing/UploadLeads'
import { useAuthStore } from '../store/authStore'
import CompanyLeads from '../views/company-admin/Leads'
import SalesLeads from '../views/sales-user/Leads'

export const LeadsDispatcher: React.FC = () => {
 const { user } = useAuthStore()

 if (user?.role === 'MARKETING') {
 return <UploadLeads />
 }

 if (user?.role === 'COMPANY_ADMIN') {
 return <CompanyLeads />
 }

 return <SalesLeads />
}

export default LeadsDispatcher

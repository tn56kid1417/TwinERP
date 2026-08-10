import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Mail, Phone, Calendar } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useLeadStore } from '../../store/leadStore'
import { Table } from '../../components/ui/Table'
import type { Column } from '../../components/ui/Table'
import { formatDate } from '../../utils/formatters'
import type { Customer } from '../../types'

export const Customers: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { customers, fetchCustomers, isLoading } = useLeadStore()
  const [searchQuery, setSearchQuery] = useState('')

  const companyId = user?.companyId

  useEffect(() => {
    if (companyId) {
      // Filter customers by tenant company ID
      fetchCustomers({ companyId })
    }
  }, [companyId])

  // Filter list by name or email
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const columns: Column<Customer>[] = [
    {
      header: 'Customer',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
            {row.name.charAt(0)}
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-slate-800 leading-snug">{row.name}</h4>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Mail size={12} /> {row.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Phone Number',
      accessor: (row) => (
        <span className="text-slate-600 flex items-center gap-1.5">
          <Phone size={14} className="text-slate-400" /> {row.phone || '--'}
        </span>
      ),
    },
    {
      header: 'Assigned Sales Rep',
      accessor: (row) => (
        <span className="font-medium text-slate-700">
          {row.assignedUserName || <span className="text-slate-350 italic">Unassigned</span>}
        </span>
      ),
    },
    {
      header: 'Created On',
      accessor: (row) => (
        <span className="text-slate-500 flex items-center gap-1.5">
          <Calendar size={14} className="text-slate-400" /> {formatDate(row.createdDate)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Directory</h1>
          <p className="text-sm font-medium text-slate-500">
            View converted customer records, billing profiles, and communication logs.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center max-w-md bg-white border border-slate-200 rounded-xl shadow-sm px-3.5 gap-2.5">
        <Search size={18} className="text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email address..."
          className="w-full text-sm py-2.5 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
        />
      </div>

      {/* Main Customers Table */}
      <Table
        columns={columns}
        data={filteredCustomers}
        isLoading={isLoading}
        rowClick={(row) => navigate(`/customers/${row.id}`)}
        emptyMessage="No customers converted yet. Progress a lead to 'Converted' state to seed here."
      />
    </div>
  )
}
export default Customers

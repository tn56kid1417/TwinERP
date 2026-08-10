import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useLeadStore } from '../../store/leadStore'
import type { Lead, LeadStatus } from '../../types'
import { Table } from '../../components/ui/Table'
import type { Column } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { formatUSD, formatDate } from '../../utils/formatters'
import { cn } from '../../utils/cn'

export const Leads: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { leads, fetchLeads, isLoading } = useLeadStore()
  const [activeTab, setActiveTab] = useState<LeadStatus | 'ALL'>('ALL')

  useEffect(() => {
    if (user) {
      fetchLeads({ assignedUserId: user.id })
    }
  }, [user])

  if (!user) return null

  // Filters by tab
  const filteredLeads = activeTab === 'ALL'
    ? leads
    : leads.filter((l) => l.status === activeTab)

  const columns: Column<Lead>[] = [
    {
      header: 'Prospect Contact',
      accessor: (row) => (
        <div className="text-left">
          <h4 className="font-semibold text-slate-800 leading-snug">{row.name}</h4>
          <span className="text-xs text-slate-400 font-semibold">{row.companyName}</span>
        </div>
      ),
    },
    {
      header: 'Email Address',
      accessor: (row) => (
        <span className="text-slate-600 flex items-center gap-1">
          <Mail size={12} className="text-slate-450" /> {row.email}
        </span>
      ),
    },
    {
      header: 'Phone',
      accessor: (row) => (
        row.phone ? (
          <span className="text-slate-600 flex items-center gap-1">
            <Phone size={12} className="text-slate-450" /> {row.phone}
          </span>
        ) : (
          <span className="text-slate-350 italic">--</span>
        )
      ),
    },
    {
      header: 'Value',
      accessor: (row) => (
        <span className="font-semibold text-slate-700">{formatUSD(row.value)}</span>
      ),
    },
    {
      header: 'Pipeline State',
      accessor: (row) => {
        const variants: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'> = {
          'New': 'secondary',
          'Contacted': 'info',
          'Follow-up': 'warning',
          'Converted': 'success',
          'Closed': 'danger',
        }
        return <Badge variant={variants[row.status] || 'primary'}>{row.status}</Badge>
      },
    },
    {
      header: 'Last Action',
      accessor: (row) => formatDate(row.updatedDate),
    },
  ]

  const tabs: { label: string; value: LeadStatus | 'ALL'; count: number }[] = [
    { label: 'All Deals', value: 'ALL', count: leads.length },
    { label: 'New', value: 'New', count: leads.filter(l => l.status === 'New').length },
    { label: 'Contacted', value: 'Contacted', count: leads.filter(l => l.status === 'Contacted').length },
    { label: 'Follow Up', value: 'Follow-up', count: leads.filter(l => l.status === 'Follow-up').length },
    { label: 'Won', value: 'Converted', count: leads.filter(l => l.status === 'Converted').length },
    { label: 'Closed', value: 'Closed', count: leads.filter(l => l.status === 'Closed').length },
  ]

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col gap-1.5 text-left">
        <h1 className="text-2xl font-bold tracking-tight">Assigned Deals</h1>
        <p className="text-sm font-medium text-slate-500">
          Review stage progression, log client notes, and record purchase transactions.
        </p>
      </div>

      {/* Tabs Filter */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-1 scrollbar-thin">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2',
              activeTab === tab.value
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            )}
          >
            {tab.label}
            <Badge variant={activeTab === tab.value ? 'primary' : 'secondary'} className="px-1.5 py-0 text-[10px] font-bold">
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Table view */}
      <Table
        columns={columns}
        data={filteredLeads}
        isLoading={isLoading}
        rowClick={(row) => navigate(`/customers/${row.id}`)}
        emptyMessage="No allocated prospects match this criteria."
      />
    </div>
  )
}
export default Leads

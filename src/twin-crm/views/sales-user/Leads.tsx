import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useLeadStore } from '../../store/leadStore'
import type { Lead, LeadStatus } from '../../types'
import { Table } from '../../components/ui/Table'
import type { Column } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatUSD, formatDate } from '../../utils/formatters'
import { cn } from '../../utils/cn'
import { api } from '../../services/api'
import type { User } from '../../types'

export const Leads: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { leads, fetchLeads, isLoading } = useLeadStore()
  const [activeTab, setActiveTab] = useState<LeadStatus | 'ALL'>('ALL')
  const [isDistributing, setIsDistributing] = useState(false)
  
  const handleDistribute = async () => {
    if (!user) return
    setIsDistributing(true)
    try {
      // Fetch all users
      const res = await api.get('/users', { params: { companyId: user.companyId } })
      const allUsers = res.data as User[]
      const distributeToMembers = allUsers.filter(u => u.role === 'SALES_USER' && (!user.teamId || u.teamId === user.teamId))
      
      if (distributeToMembers.length === 0) {
        alert("No sales team members found to distribute leads to.")
        return
      }

      const unassignedLeads = leads.filter(l => l.status === 'New' && l.assignedUserId === user.id)
      if (unassignedLeads.length === 0) {
        alert("No 'New' leads assigned to you to distribute.")
        return
      }

      // Distribute evenly
      let memberIdx = 0
      for (const lead of unassignedLeads) {
        const assignedUser = distributeToMembers[memberIdx]
        await api.put(`/leads/${lead.id}`, { assignedUserId: assignedUser.id })
        memberIdx = (memberIdx + 1) % distributeToMembers.length
      }

      alert(`Successfully distributed ${unassignedLeads.length} leads to ${distributeToMembers.length} team members.`)
      // Refresh leads
      if (user.role === 'SALES_LEADER' || user.role === 'COMPANY_ADMIN') {
        fetchLeads({ companyId: user.companyId })
      } else {
        fetchLeads({ assignedUserId: user.id })
      }
    } catch (err) {
      console.error(err)
      alert("Failed to distribute leads.")
    } finally {
      setIsDistributing(false)
    }
  }

  useEffect(() => {
    if (user) {
      if (user.role === 'SALES_LEADER' || user.role === 'COMPANY_ADMIN') {
        fetchLeads({ companyId: user.companyId })
      } else {
        fetchLeads({ assignedUserId: user.id })
      }
    }
  }, [user])

  if (!user) return null

  const [teamMembers, setTeamMembers] = useState<User[]>([])

  useEffect(() => {
    if (user && (user.role === 'SALES_LEADER' || user.role === 'COMPANY_ADMIN')) {
      api.get('/users', { params: { companyId: user.companyId } }).then(res => {
        const allUsers = res.data as User[]
        setTeamMembers(allUsers.filter(u => 
          u.role === 'SALES_USER' || u.role === 'SALES_LEADER'
        ))
      })
    }
  }, [user])

  // Filters by tab and team
  const displayLeads = user?.role === 'SALES_LEADER' && user?.teamId
    ? leads.filter(l => l.assignedUserId === user.id || teamMembers.find(t => t.id === l.assignedUserId && t.teamId === user.teamId))
    : leads

  const filteredLeads = activeTab === 'ALL'
    ? displayLeads
    : displayLeads.filter((l) => l.status === activeTab)

  const columns: Column<Lead>[] = [
    {
      header: 'Prospect Contact',
      accessor: (row) => (
        <div className="text-left">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">{row.name}</h4>
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
    { label: 'All Deals', value: 'ALL', count: displayLeads.length },
    { label: 'New', value: 'New', count: displayLeads.filter(l => l.status === 'New').length },
    { label: 'Contacted', value: 'Contacted', count: displayLeads.filter(l => l.status === 'Contacted').length },
    { label: 'Follow Up', value: 'Follow-up', count: displayLeads.filter(l => l.status === 'Follow-up').length },
    { label: 'Won', value: 'Converted', count: displayLeads.filter(l => l.status === 'Converted').length },
    { label: 'Closed', value: 'Closed', count: displayLeads.filter(l => l.status === 'Closed').length },
  ]

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5 text-left">
          <h1 className="text-2xl font-bold tracking-tight">Assigned Deals</h1>
          <p className="text-sm font-medium text-slate-500">
            Review stage progression, log client notes, and record purchase transactions.
          </p>
        </div>
        {user?.role === 'SALES_LEADER' && (
          <Button 
            onClick={handleDistribute} 
            isLoading={isDistributing}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Distribute Leads
          </Button>
        )}
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
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-100 hover:bg-slate-100/50'
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

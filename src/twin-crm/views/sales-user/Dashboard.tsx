import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Award, DollarSign, CalendarCheck, Users, Building, Settings, Activity, Clock, MessageSquare, PhoneCall, Phone, PhoneForwarded, PhoneMissed } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useLeadStore } from '../../store/leadStore'
import { useCallStore } from '../../store/callStore'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import type { Column } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatUSD, formatDate } from '../../utils/formatters'
import type { Lead } from '../../types'

export const SalesUserDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { leads, fetchLeads, isLoading: leadsLoading } = useLeadStore()
  const { calls, fetchCalls, isLoading: callsLoading } = useCallStore()

  useEffect(() => {
    if (user) {
      fetchLeads({ assignedUserId: user.id })
      fetchCalls({ userId: user.id })
    }
  }, [user])

  if (!user) return <div style={{color:"red"}}>User is null in SalesUserDashboard!</div>

  // Calculate user-specific metrics
  const myLeads = leads
  const totalAssigned = myLeads.length
  const openLeads = myLeads.filter((l) => l.status !== 'Converted' && l.status !== 'Closed')
  const wonLeads = myLeads.filter((l) => l.status === 'Converted')
  const lostLeads = myLeads.filter((l) => l.status === 'Closed')

  const winRate = totalAssigned > 0 
    ? Math.round((wonLeads.length / (wonLeads.length + lostLeads.length || 1)) * 100) 
    : 0

  const closedWonRevenue = wonLeads.reduce((acc, l) => acc + l.value, 0)
  const openPipelineValue = openLeads.reduce((acc, l) => acc + l.value, 0)

  // Calculate call metrics
  const totalCallDurationSecs = calls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0)
  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    return `${m}m ${s}s`
  }
  
  const totalCalls = calls.length
  const answeredCalls = calls.filter(c => c.status === 'Answered').length
  const missedCalls = calls.filter(c => c.status === 'No Answer' || c.status === 'Voicemail' || c.status === 'Busy').length

  const stats = [
    {
      title: 'Assigned Deals',
      value: totalAssigned,
      description: `${openLeads.length} open prospects`,
      icon: ClipboardList,
      color: 'text-primary bg-primary/10 border-primary/20',
    },
    {
      title: 'Booked Sales',
      value: formatUSD(closedWonRevenue),
      description: `${wonLeads.length} won contracts`,
      icon: Award,
      color: 'text-success bg-success/10 border-success/20',
    },
    {
      title: 'Forecast Pipeline',
      value: formatUSD(openPipelineValue),
      description: 'Pending deal values',
      icon: DollarSign,
      color: 'text-secondary bg-secondary/10 border-secondary/20',
    },
    {
      title: 'Conversion Rate',
      value: `${winRate}%`,
      description: 'Wins vs outcomes',
      icon: CalendarCheck,
      color: 'text-info bg-info/10 border-info/20',
    },
    {
      title: 'Total Call Time',
      value: formatDuration(totalCallDurationSecs),
      description: `${totalCalls} calls logged`,
      icon: Clock,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20',
    },
    {
      title: 'Calls Answered',
      value: answeredCalls,
      description: `${missedCalls} missed/voicemail`,
      icon: PhoneCall,
      color: 'text-warning bg-warning/10 border-warning/20',
    },
  ]

  const columns: Column<Lead>[] = [
    {
      header: 'Prospect Contact',
      accessor: (row) => (
        <div className="text-left">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">{row.name}</h4>
          <span className="text-xs text-slate-400 font-semibold">{row.companyName}</span>
        </div>
      ),
    },
    {
      header: 'Value',
      accessor: (row) => formatUSD(row.value),
    },
    {
      header: 'Stage Status',
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
      header: 'Last Interaction',
      accessor: (row) => formatDate(row.updatedDate),
    },
  ]

  const crmModules = [
    { name: 'Leads', path: '/crm/leads', icon: Users, desc: 'My prospects' },
    { name: 'Customers', path: '/crm/customers', icon: Building, desc: 'My clients' },
    { name: 'Settings', path: '/settings', icon: Settings, desc: 'My preferences' },
  ]

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Dashboard</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Welcome back, {user.name}. Track your deals pipeline and record client interactions.
          </p>
        </div>
        <Button onClick={() => navigate('/crm/leads')} className="cursor-pointer shadow-sm">
          Launch Leads Panel
        </Button>
      </div>

      {/* Quick Modules */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {crmModules.map((mod) => (
          <Card key={mod.name} hoverEffect onClick={() => navigate(mod.path)} className="cursor-pointer border-slate-200 dark:border-slate-800/60 hover:border-primary/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className="p-2 bg-primary/5 text-primary rounded-xl">
                <mod.icon size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{mod.name}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{mod.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats widgets grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} hoverEffect>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`p-3 rounded-xl border flex items-center justify-center ${stat.color}`}>
                  <Icon size={22} />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">{stat.title}</span>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 block mt-0.5 tracking-tight">{stat.value}</span>
                  <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Actionable Followups & Open Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open leads column */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-lg font-bold text-left">My Active Leads</h3>
          <Table
            columns={columns}
            data={openLeads}
            isLoading={leadsLoading}
            rowClick={(row) => navigate(`/customers/${row.id}`)}
            emptyMessage="No pending leads currently allocated. Good job!"
          />
        </div>

        {/* Right column: Follow-ups & Activities */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Reminders calendar list */}
          <Card className="flex flex-col h-[350px]">
            <CardHeader>
              <CardTitle className="text-left flex items-center gap-2">
                <CalendarCheck size={18} className="text-warning" /> Follow Up Agenda
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {openLeads.filter(l => l.status === 'Follow-up').length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No scheduled follow-up agendas. Update a lead status to Follow-up to list here.
                  </div>
                ) : (
                  openLeads
                    .filter((l) => l.status === 'Follow-up')
                    .map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => navigate(`/customers/${lead.id}`)}
                        className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-left space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">{lead.name}</h4>
                          <Badge variant="warning" className="text-[9px] font-bold">Follow Up</Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{lead.companyName}</p>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                          Last edited: {formatDate(lead.updatedDate)}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities Feed */}
          <Card className="flex flex-col h-[350px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Activity size={18} className="text-primary" /> Live Feed</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-4 text-left">
                {[
                  { id: 1, type: 'status', text: 'Lead Status Changed', detail: 'Acme Corp is now Converted', time: '10 min ago', icon: Award, color: 'text-success bg-success/10' },
                  { id: 2, type: 'new', text: 'New Lead Assigned', detail: 'Global Tech Inc assigned to you', time: '1 hour ago', icon: Users, color: 'text-primary bg-primary/10' },
                  { id: 3, type: 'meeting', text: 'Meeting Scheduled', detail: 'Follow-up with Stark Industries', time: '2 hours ago', icon: Clock, color: 'text-warning bg-warning/10' },
                  { id: 4, type: 'note', text: 'Note Added', detail: 'Left voicemail for contact', time: 'Yesterday', icon: MessageSquare, color: 'text-info bg-info/10' }
                ].map(activity => (
                  <div key={activity.id} className="flex gap-3 items-start border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                    <div className={`p-2 rounded-lg mt-0.5 flex-shrink-0 ${activity.color}`}>
                      <activity.icon size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{activity.text}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{activity.detail}</p>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1.5">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
export default SalesUserDashboard

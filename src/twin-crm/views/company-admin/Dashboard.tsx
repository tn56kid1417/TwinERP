import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, Users, TrendingUp, Award, Clock, Building, UserPlus, BarChart2, Settings, ClipboardList, Activity } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useLeadStore } from '../../store/leadStore'
import { api } from '../../services/api'
import type { User, Lead } from '../../types'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import type { Column } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { formatUSD } from '../../utils/formatters'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { ActivityHeatmap } from '../../components/ActivityHeatmap'

export const CompanyAdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { leads, fetchLeads, isLoading: loadingLeads } = useLeadStore()
  
  const [salesReps, setSalesReps] = useState<User[]>([])
  const [loadingReps, setLoadingReps] = useState(false)

  const companyId = user?.companyId

  useEffect(() => {
    if (companyId) {
      fetchLeads({ companyId })
      
      setLoadingReps(true)
      api.get(`/users?companyId=${companyId}&role=SALES_USER`)
        .then((res) => setSalesReps(res.data))
        .catch(() => {})
        .finally(() => setLoadingReps(false))
    }
  }, [companyId, fetchLeads])

  if (!companyId) return null

  // Aggregated calculations
  const totalLeadsCount = leads.length
  const salesUsersCount = salesReps.length
  const convertedCustomersCount = leads.filter(l => l.status === 'Converted').length
  const pendingFollowupsCount = leads.filter(l => l.status === 'Follow-up').length
  const activeLeadsCount = leads.filter(l => l.status === 'New' || l.status === 'Contacted').length

  const stats = [
    {
      title: 'Total Sales Users',
      value: salesUsersCount,
      description: 'Active team agents',
      icon: Users,
      color: 'text-primary bg-primary/10 border-primary/20',
    },
    {
      title: 'Total Leads',
      value: totalLeadsCount,
      description: 'All prospects registered',
      icon: ShieldAlert,
      color: 'text-blue-500 bg-blue-50 border-blue-200',
    },
    {
      title: 'Converted Customers',
      value: convertedCustomersCount,
      description: 'Won deal accounts',
      icon: Award,
      color: 'text-success bg-success/10 border-success/20',
    },
    {
      title: 'Pending Follow-ups',
      value: pendingFollowupsCount,
      description: 'Awaiting actions',
      icon: Clock,
      color: 'text-warning bg-warning/10 border-warning/20',
    },
    {
      title: 'Active Leads',
      value: activeLeadsCount,
      description: 'In-progress funnel',
      icon: TrendingUp,
      color: 'text-slate-600 dark:text-slate-300 bg-slate-100 border-slate-200 dark:border-slate-800',
    },
  ]

  // Construct chart data: Leads per Sales Rep
  const chartData = salesReps.map((rep) => {
    const repLeads = leads.filter((l) => l.assignedUserId === rep.id)
    const wonCount = repLeads.filter((l) => l.status === 'Converted').length
    const openCount = repLeads.filter((l) => l.status !== 'Converted' && l.status !== 'Closed').length
    
    return {
      name: rep.name,
      'Open Leads': openCount,
      'Closed Won': wonCount,
    }
  })

  // Recent leads to list
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
    .slice(0, 5)

  const leadColumns: Column<Lead>[] = [
    {
      header: 'Prospect',
      accessor: (row) => (
        <div className="text-left">
          <h4 className="font-semibold text-slate-900 dark:text-white dark:text-slate-100 leading-snug">{row.name}</h4>
          <span className="text-xs text-slate-400 font-semibold">{row.companyName}</span>
        </div>
      ),
    },
    {
      header: 'Valuation',
      accessor: (row) => <span className="font-semibold text-slate-700 dark:text-slate-200">{formatUSD(row.value)}</span>,
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
      header: 'Assigned Representative',
      accessor: (row) => (
        <span className="font-medium text-slate-600 dark:text-slate-300">
          {row.assignedUserName || <span className="text-slate-350 italic">Unassigned</span>}
        </span>
      ),
    },
  ]

  const loading = loadingLeads || loadingReps

  const crmModules = [
    { name: 'Leads', path: '/crm/leads', icon: Users, desc: 'Manage prospects' },
    { name: 'Customers', path: '/crm/customers', icon: Building, desc: 'Client relations' },
    { name: 'Sales Team', path: '/crm/sales', icon: UserPlus, desc: 'Manage roster' },
    { name: 'Reports', path: '/crm/reports', icon: BarChart2, desc: 'Performance analytics' },
    { name: 'Settings', path: '/settings', icon: Settings, desc: 'Workspace settings' },
  ]

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col gap-1 text-left">
        <h1 className="text-2xl font-bold tracking-tight">Workspace Overview</h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Review critical workspace aggregates, deal distributions, and rep metrics.
        </p>
      </div>

      {/* Quick Modules */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {crmModules.map((mod) => (
          <Card key={mod.name} hoverEffect onClick={() => navigate(mod.path)} className="cursor-pointer border-slate-200 dark:border-slate-800/60 hover:border-primary/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className="p-2 bg-primary/5 text-primary rounded-xl">
                <mod.icon size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white dark:text-slate-100">{mod.name}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{mod.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} hoverEffect>
              <CardContent className="p-5 text-left space-y-2 relative">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  {stat.title}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white dark:text-slate-100 tracking-tight">{stat.value}</span>
                  <div className={`p-2 rounded-lg border ${stat.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={16} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold leading-none">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts & Lead details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Deal allocation by Sales Rep Chart */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-left">Activity Heatmap (Peak Call Volume)</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pt-0">
               <ActivityHeatmap />
            </CardContent>
          </Card>
          
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-left">Representative Lead Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-72">
              {loading ? (
                <div className="text-slate-400 text-xs flex flex-col items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Resolving charts...
                </div>
              ) : chartData.length === 0 ? (
                <div className="text-slate-400 text-sm">Add sales users to populate team reports.</div>
              ) : (
                <div className="w-full h-full pr-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                      <XAxis dataKey="name" className="text-[11px] fill-slate-500 font-medium" />
                      <YAxis className="text-[11px] fill-slate-500 font-medium" width={45} tickFormatter={(v: number) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--chart-tooltip-bg)',
                          borderColor: 'var(--chart-tooltip-border)',
                          borderRadius: '8px',
                          color: 'var(--chart-tooltip-text)',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="Open Leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Closed Won" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent prospects list */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Leads</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/crm/leads')} className="text-xs cursor-pointer">
                View All
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {recentLeads.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No leads created yet.
                  </div>
                ) : (
                  recentLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => navigate('/crm/leads')}
                      className="flex items-center justify-between p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer text-left"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 leading-snug">{lead.name}</h4>
                        <span className="text-xs text-slate-400">{lead.companyName}</span>
                      </div>
                      <Badge variant={lead.status === 'Converted' ? 'success' : 'secondary'} className="px-2 font-bold text-[10px]">
                        {lead.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roster grid view */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Roster Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/crm/sales')} className="text-xs cursor-pointer">
                Manage Team
              </Button>
            </CardHeader>
            <CardContent>
              <Table
                columns={leadColumns}
                data={recentLeads}
                isLoading={loadingLeads}
                rowClick={() => navigate('/crm/leads')}
                emptyMessage="No prospects to display."
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities Feed */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Activity size={18} className="text-primary" /> Live Feed</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {[
                  { id: 1, type: 'status', text: 'Lead Status Changed', detail: 'Acme Corp is now Converted', time: '10 min ago', icon: Award, color: 'text-success bg-success/10' },
                  { id: 2, type: 'new', text: 'New Lead Assigned', detail: 'Global Tech Inc assigned to team', time: '1 hour ago', icon: Users, color: 'text-primary bg-primary/10' },
                  { id: 3, type: 'meeting', text: 'Meeting Scheduled', detail: 'Follow-up with Stark Industries', time: '2 hours ago', icon: Clock, color: 'text-warning bg-warning/10' },
                  { id: 4, type: 'note', text: 'Note Added', detail: 'Left voicemail for contact', time: 'Yesterday', icon: ClipboardList, color: 'text-info bg-info/10' }
                ].map(activity => (
                  <div key={activity.id} className="flex gap-3 items-start border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                    <div className={`p-2 rounded-lg mt-0.5 flex-shrink-0 ${activity.color}`}>
                      <activity.icon size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white dark:text-slate-100">{activity.text}</h4>
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
export default CompanyAdminDashboard

import React, { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import type { Lead, User } from '../../types'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, Target, Activity } from 'lucide-react'
import { ActivityHeatmap } from '../../components/ActivityHeatmap'

export const SalesLeaderDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const [leads, setLeads] = useState<Lead[]>([])
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, usersRes] = await Promise.all([
          api.get('/leads', { params: { companyId: user?.companyId } }),
          api.get('/users', { params: { companyId: user?.companyId } })
        ])
        
        setLeads(leadsRes.data as Lead[])
        const allUsers = usersRes.data as User[]
        // If the leader has a teamId, filter by it, otherwise show all sales users
        setTeamMembers(allUsers.filter(u => (u.role === 'SALES_USER' || u.role === 'SALES_LEADER') && (!user?.teamId || u.teamId === user?.teamId)))
      } catch (err) {
        console.error('Failed to fetch data', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (user?.companyId) {
      fetchData()
    }
  }, [user])

  // Compute distribution
  // Chart data: for each sales user, count leads assigned to them.
  // Also count unassigned / pending (New status without assignee)
  
  const chartData = teamMembers.map(member => {
    const memberLeads = leads.filter(l => l.assignedUserId === member.id)
    const active = memberLeads.filter(l => l.status !== 'Closed' && l.status !== 'Converted' && l.status !== 'New').length
    const closed = memberLeads.filter(l => l.status === 'Closed' || l.status === 'Converted').length
    const newLeads = memberLeads.filter(l => l.status === 'New').length
    
    return {
      name: member.name,
      Active: active,
      Closed: closed,
      New: newLeads
    }
  })

  // Pending pool (leads not assigned or assigned to the leader themselves for distribution)
  const unassignedLeads = leads.filter(l => 
    !l.assignedUserId || 
    (l.status === 'New' && (!teamMembers.find(t => t.id === l.assignedUserId) || l.assignedUserId === user?.id))
  ).length

  const isExecutive = user?.role === 'COMPANY_ADMIN' || 
                      user?.designation?.toLowerCase()?.includes('ceo') || 
                      user?.designation?.toLowerCase()?.includes('cto') || 
                      user?.designation?.toLowerCase()?.includes('admin') || 
                      user?.designation?.toLowerCase()?.includes('chief executive')

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sales Leader Dashboard</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Overview of team performance and lead distribution.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card hoverEffect>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl border flex items-center justify-center text-primary bg-primary/10 border-primary/20">
              <Users size={22} />
            </div>
            <div className="flex-1 text-left">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Team Members</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white block mt-0.5 tracking-tight">{teamMembers.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card hoverEffect>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl border flex items-center justify-center text-warning bg-warning/10 border-warning/20">
              <Target size={22} />
            </div>
            <div className="flex-1 text-left">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Pending/Unassigned Leads</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white block mt-0.5 tracking-tight">{unassignedLeads}</span>
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl border flex items-center justify-center text-success bg-success/10 border-success/20">
              <Activity size={22} />
            </div>
            <div className="flex-1 text-left">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Total Leads</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white block mt-0.5 tracking-tight">{leads.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {isExecutive && (
        <Card className="flex flex-col h-[450px]">
          <CardHeader>
            <CardTitle className="text-left flex items-center gap-2">
               Activity Heatmap (Peak Call Volume)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden pt-0 flex justify-center items-center">
             <ActivityHeatmap />
          </CardContent>
        </Card>
      )}
      
      <Card className="flex flex-col h-[450px]">
        <CardHeader>
          <CardTitle className="text-left flex items-center gap-2">
             Lead Distribution per Team Member
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden pt-0">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fill: 'var(--chart-text)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--chart-cursor)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--chart-tooltip-bg)', 
                    borderColor: 'var(--chart-tooltip-border)',
                    color: 'var(--chart-tooltip-text)',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="New" stackId="a" fill="var(--color-primary)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Active" stackId="a" fill="var(--color-info)" />
                <Bar dataKey="Closed" stackId="a" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-slate-500">
              No team member data available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SalesLeaderDashboard

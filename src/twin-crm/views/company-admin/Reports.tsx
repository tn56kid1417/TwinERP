import React, { useEffect } from 'react'
import { FileText, TrendingUp, Sparkles } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useLeadStore } from '../../store/leadStore'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { formatUSD } from '../../utils/formatters'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie } from 'recharts'

export const Reports: React.FC = () => {
  const { user } = useAuthStore()
  const { leads, fetchLeads } = useLeadStore()

  const companyId = user?.companyId

  useEffect(() => {
    if (companyId) {
      fetchLeads({ companyId })
    }
  }, [companyId])

  if (!companyId) return null

  // Calculate statistics dynamically based on current leads state
  const totalLeads = leads.length
  const wonLeads = leads.filter((l) => l.status === 'Converted')
  const lostLeads = leads.filter((l) => l.status === 'Closed')
  const openLeads = leads.filter((l) => l.status !== 'Converted' && l.status !== 'Closed')

  const totalWonValue = wonLeads.reduce((acc, l) => acc + l.value, 0)
  const totalOpenValue = openLeads.reduce((acc, l) => acc + l.value, 0)

  // 1. Status Breakdown chart data
  const statusData = [
    { name: 'New Leads', value: leads.filter((l) => l.status === 'New').length, color: '#6b7280' },
    { name: 'Contacted', value: leads.filter((l) => l.status === 'Contacted').length, color: '#0ea5e9' },
    { name: 'Follow Up', value: leads.filter((l) => l.status === 'Follow-up').length, color: '#f59e0b' },
    { name: 'Converted', value: wonLeads.length, color: '#10b981' },
    { name: 'Closed', value: lostLeads.length, color: '#ef4444' },
  ].filter((item) => item.value > 0) // exclude empty values to avoid Recharts errors

  // 2. Representative revenue leaderboard chart data
  const repRevenueDataMap: Record<string, number> = {}
  leads.forEach((l) => {
    if (l.status === 'Converted' && l.assignedUserName) {
      repRevenueDataMap[l.assignedUserName] = (repRevenueDataMap[l.assignedUserName] || 0) + l.value
    }
  })

  const repRevenueData = Object.entries(repRevenueDataMap).map(([name, value]) => ({
    name,
    Revenue: value,
  })).sort((a, b) => b.Revenue - a.Revenue)

  // 3. Pipeline Forecast mapping values
  const pipelineValuationData = [
    { stage: 'Open Pipeline', value: totalOpenValue, color: '#3b82f6' },
    { stage: 'Revenue Closed', value: totalWonValue, color: '#10b981' },
    { stage: 'Total Pipeline Potential', value: totalWonValue + totalOpenValue, color: '#0ea5e9' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 text-left">
        <h1 className="text-2xl font-bold tracking-tight">Analytics Reports</h1>
        <p className="text-sm font-medium text-slate-500">
          Analyze sales pipelines, monitor lead distribution, and track closed won revenues.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card hoverEffect>
          <CardContent className="p-6 text-left space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Cumulative Closed Won
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-800">{formatUSD(totalWonValue)}</span>
              <Badge variant="success" className="font-bold flex items-center gap-0.5">
                <TrendingUp size={10} /> {wonLeads.length} Deals
              </Badge>
            </div>
            <p className="text-xs text-slate-400">Locked revenue booked to date.</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-6 text-left space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Open Forecast Funnel
            </span>
            <span className="text-3xl font-extrabold text-slate-800">{formatUSD(totalOpenValue)}</span>
            <p className="text-xs text-slate-400">Potential revenue across {openLeads.length} open deals.</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-6 text-left space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Win/Loss Ratio
            </span>
            <span className="text-3xl font-extrabold text-slate-800">
              {totalLeads > 0 
                ? `${Math.round((wonLeads.length / (wonLeads.length + lostLeads.length || 1)) * 100)}%` 
                : '0%'}
            </span>
            <p className="text-xs text-slate-400">
              Based on {wonLeads.length} converted and {lostLeads.length} closed deals.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Deal Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-left">Pipeline Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
            {statusData.length === 0 ? (
              <div className="text-slate-400 text-sm">No active deals found to distribute.</div>
            ) : (
              <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-6">
                {/* Pie Chart */}
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          borderColor: '#e2e8f0',
                          borderRadius: '8px',
                          color: '#1e293b',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend list */}
                <div className="space-y-2 text-left">
                  {statusData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm font-semibold">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-500">{item.name}:</span>
                      <span className="text-slate-800 font-bold">{item.value} deals</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rep Revenue Leaderboard Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-left">Closed Revenue by Representative</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[300px] flex items-center justify-center">
            {repRevenueData.length === 0 ? (
              <div className="text-slate-400 text-sm flex items-center gap-1">
                <Sparkles size={16} /> No revenue booked yet (mark deals to Converted status to view).
              </div>
            ) : (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={repRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis dataKey="name" className="text-[11px] fill-slate-500 font-medium" />
                    <YAxis className="text-[11px] fill-slate-500 font-medium" />
                    <Tooltip
                      formatter={(val) => formatUSD(Number(val))}
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderColor: '#e2e8f0',
                        borderRadius: '8px',
                        color: '#1e293b',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Forecast Potential Valuation Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left flex items-center gap-2">
            <FileText size={18} /> Financial Funnel Projections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pipelineValuationData}
                margin={{ top: 10, right: 30, left: 30, bottom: 0 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                <XAxis type="number" className="text-[11px] fill-slate-500 font-medium" tickFormatter={(v: number) => formatUSD(v)} />
                <YAxis dataKey="stage" type="category" className="text-[11px] fill-slate-500 font-medium" width={150} />
                <Tooltip
                  formatter={(val) => formatUSD(Number(val))}
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    color: '#1e293b',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" name="Valuation ($)" radius={[0, 4, 4, 0]}>
                  {pipelineValuationData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export default Reports

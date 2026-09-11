import React, { useEffect, useState, useRef, useMemo } from 'react'
import { PhoneCall, Phone, PhoneOff, Clock, User, CheckCircle, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useCallStore } from '../../store/callStore'
import { useLeadStore } from '../../store/leadStore'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Table, type Column } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import type { CallLog, Lead, CallStatus } from '../../types'
import { formatDate } from '../../utils/formatters'

export const Calls: React.FC = () => {
  const { user } = useAuthStore()
  const { calls, fetchCalls, addCall, isLoading: callsLoading } = useCallStore()
  const { leads, fetchLeads, isLoading: leadsLoading } = useLeadStore()

  const [activeCallLead, setActiveCallLead] = useState<Lead | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [isCalling, setIsCalling] = useState(false)
  const [showLogForm, setShowLogForm] = useState(false)
  const [callStatus, setCallStatus] = useState<CallStatus>('Answered')
  const [callNotes, setCallNotes] = useState('')
  const [followUpTime, setFollowUpTime] = useState('')
  const timerRef = useRef<number | null>(null)

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      data.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: d.toISOString().split('T')[0],
        duration: 0
      });
    }

    calls.forEach(call => {
      const callDate = new Date(call.startTime);
      const dateStr = callDate.toISOString().split('T')[0];
      const dayData = data.find(d => d.dateStr === dateStr);
      if (dayData) {
        dayData.duration += (call.durationSeconds / 60);
      }
    });
    
    data.forEach(d => {
      d.duration = Math.round(d.duration * 10) / 10;
    });

    return data;
  }, [calls]);

  useEffect(() => {
    if (user) {
      if (user.role === 'COMPANY_ADMIN') {
        fetchCalls()
        fetchLeads({ companyId: user.companyId })
      } else {
        fetchCalls({ userId: user.id })
        fetchLeads({ assignedUserId: user.id })
      }
    }
  }, [user])

  const startCall = (lead: Lead) => {
    setActiveCallLead(lead)
    setIsCalling(true)
    setShowLogForm(false)
    setCallDuration(0)
    timerRef.current = window.setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)
    
    window.location.href = `tel:${lead.phone}`
  }

  const endCall = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsCalling(false)
    setShowLogForm(true)
  }

  useEffect(() => {
    if (!isCalling) return;

    const handleReturn = () => {
      if (document.visibilityState === 'visible') {
        endCall();
      }
    };

    // Delay to allow the device to switch to the phone app
    const timeoutId = window.setTimeout(() => {
      document.addEventListener('visibilitychange', handleReturn);
      window.addEventListener('focus', handleReturn);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleReturn);
      window.removeEventListener('focus', handleReturn);
    };
  }, [isCalling]);

  const saveCallLog = async () => {
    if (!activeCallLead || !user) return
    await addCall({
      leadId: activeCallLead.id,
      userId: user.id,
      userName: user.name,
      phoneNumber: activeCallLead.phone,
      durationSeconds: callDuration,
      status: callStatus,
      notes: callNotes,
      followUpTime: callStatus === 'Follow Up' ? followUpTime : undefined,
    })
    setShowLogForm(false)
    setActiveCallLead(null)
    setCallNotes('')
    setCallDuration(0)
    setFollowUpTime('')
  }

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const columns: Column<CallLog>[] = [
    {
      header: 'Time',
      accessor: (row) => <span className="text-slate-600 dark:text-slate-400">{formatDate(row.startTime)}</span>,
    },
    {
      header: 'Representative',
      accessor: 'userName',
    },
    {
      header: 'Lead Phone',
      accessor: (row) => <a href={`tel:${row.phoneNumber}`} className="font-mono text-slate-700 dark:text-slate-300 hover:text-primary transition-colors">{row.phoneNumber}</a>,
    },
    {
      header: 'Duration',
      accessor: (row) => <span className="text-slate-600 dark:text-slate-400">{formatDuration(row.durationSeconds)}</span>,
    },
    {
      header: 'Status',
      accessor: (row) => {
        const variants: Record<string, string> = {
          'Answered': 'success',
          'Not Connected 1': 'warning',
          'Not Connected 2': 'warning',
          'Not Connected 3': 'warning',
          'Not Connected 4': 'warning',
          'Not Connected 5': 'warning',
          'Busy': 'danger',
          'Voicemail': 'secondary',
          'Wrong Number': 'danger',
          'Follow Up': 'info',
        }
        return <Badge variant={variants[row.status] as any || 'primary'}>{row.status}</Badge>
      },
    },
    {
      header: 'Notes',
      accessor: (row) => (
        <div className="flex flex-col gap-1">
          <span className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 max-w-xs">{row.notes || '-'}</span>
          {row.followUpTime && (
            <span className="text-xs font-semibold text-primary">Follow up: {formatDate(new Date(row.followUpTime))} {new Date(row.followUpTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white dark:text-white flex items-center gap-2">
            <PhoneCall className="text-primary" /> Call Dialer & Logs
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Dial leads and log call outcomes automatically.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart2 size={16} /> Call Duration (Minutes) - Last 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 pb-2">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={30} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }} 
                  contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', color: 'var(--chart-tooltip-text)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value} min`, 'Duration']}
                />
                <Bar dataKey="duration" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dialer Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-sm flex items-center gap-2">
                <Phone size={16} /> Dialer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isCalling && !showLogForm && (
                <div className="space-y-4">
                  <div className="max-h-[400px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <Table
                      columns={[
                        {
                          header: 'Lead Name',
                          accessor: (row) => (
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white dark:text-white">{row.name}</div>
                              <a href={`tel:${row.phone}`} className="text-xs text-slate-500 hover:text-primary transition-colors font-mono mt-0.5">{row.phone}</a>
                            </div>
                          ),
                        },
                        {
                          header: 'Action',
                          accessor: (row) => (
                            <Button 
                              size="sm"
                              className="w-full"
                              onClick={() => startCall(row)}
                            >
                              <Phone size={14} className="mr-1" /> Call
                            </Button>
                          ),
                        },
                      ]}
                      data={leads}
                      isLoading={leadsLoading}
                      emptyMessage="No leads available to call."
                    />
                  </div>
                </div>
              )}

              {isCalling && activeCallLead && (
                <div className="flex flex-col items-center justify-center py-8 space-y-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                        <Phone className="text-primary" size={32} />
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white dark:text-white">{activeCallLead.name}</h3>
                    <a href={`tel:${activeCallLead.phone}`} className="text-slate-500 hover:text-primary transition-colors font-mono mt-1 block">{activeCallLead.phone}</a>
                    <div className="text-2xl font-light text-slate-700 dark:text-slate-300 mt-4 font-mono">
                      {formatDuration(callDuration)}
                    </div>
                  </div>
                  <Button variant="danger" className="w-full h-12 rounded-full" onClick={endCall}>
                    <PhoneOff className="mr-2" /> End Call
                  </Button>
                </div>
              )}

              {showLogForm && activeCallLead && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="p-3 bg-secondary/20 dark:bg-slate-800 rounded-lg flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Duration:</span>
                    <span className="text-sm font-bold font-mono text-slate-900 dark:text-white dark:text-white">{formatDuration(callDuration)}</span>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                      Call Status
                    </label>
                    <select
                      className="w-full text-sm py-2.5 px-3.5 bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 shadow-inner"
                      value={callStatus}
                      onChange={(e) => setCallStatus(e.target.value as CallStatus)}
                    >
                      <option value="Answered" className="bg-[#0C1017] text-slate-100">Answered</option>
                      <option value="Not Connected 1" className="bg-[#0C1017] text-slate-100">Not Connected 1</option>
                      <option value="Not Connected 2" className="bg-[#0C1017] text-slate-100">Not Connected 2</option>
                      <option value="Not Connected 3" className="bg-[#0C1017] text-slate-100">Not Connected 3</option>
                      <option value="Not Connected 4" className="bg-[#0C1017] text-slate-100">Not Connected 4</option>
                      <option value="Not Connected 5" className="bg-[#0C1017] text-slate-100">Not Connected 5</option>
                      <option value="Busy" className="bg-[#0C1017] text-slate-100">Busy</option>
                      <option value="Voicemail" className="bg-[#0C1017] text-slate-100">Voicemail</option>
                      <option value="Wrong Number" className="bg-[#0C1017] text-slate-100">Wrong Number</option>
                      <option value="Follow Up" className="bg-[#0C1017] text-slate-100">Follow Up</option>
                    </select>
                  </div>
                  {callStatus === 'Follow Up' && (
                    <div className="animate-in fade-in duration-300">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                        Follow Up Time
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full text-sm py-2.5 px-3.5 bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 shadow-inner [color-scheme:dark]"
                        value={followUpTime}
                        onChange={(e) => setFollowUpTime(e.target.value)}
                      />
                    </div>
                  )}

                  {(() => {
                    const recentCalls = calls
                      .filter(c => c.leadId === activeCallLead.id || (activeCallLead.id === '' && c.phoneNumber === activeCallLead.phone))
                      .slice(0, 3)
                    
                    if (recentCalls.length === 0) return null
                    
                    return (
                      <div className="p-3.5 bg-slate-900/50 rounded-xl border border-slate-800 mt-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                          Recent Activity
                        </label>
                        <div className="space-y-2">
                          {recentCalls.map(c => (
                            <div key={c.id} className="flex justify-between items-center text-xs">
                              <span className="text-slate-400">{formatDate(c.startTime)} {new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="font-medium text-slate-200">{c.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                      Call Notes
                    </label>
                    <textarea
                      className="w-full text-sm py-2.5 px-3.5 bg-[#07090E]/90 border border-slate-700/60 text-slate-100 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 shadow-inner min-h-[100px] placeholder:text-slate-500"
                      placeholder="Add discussion notes..."
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                    />
                  </div>
                  <Button variant="primary" className="w-full" onClick={saveCallLog}>
                    <CheckCircle className="mr-2" size={16} /> Save Call Log
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Logs Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200 dark:border-slate-800 h-full">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock size={16} /> Recent Calls
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                columns={columns}
                data={calls}
                isLoading={callsLoading}
                emptyMessage="No calls logged yet."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Calls

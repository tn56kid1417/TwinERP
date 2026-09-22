import React, { useEffect, useState, useMemo } from 'react'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import type { Lead, User } from '../../types'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import {
 Shuffle,
 UserCheck,
 Users,
 Target,
 CheckSquare,
 Square,
 ChevronRight,
 Search,
 Zap,
 SlidersHorizontal,
 CheckCircle2,
 AlertCircle,
 X,
 RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../../utils/cn'
import { formatUSD } from '../../utils/formatters'

type Mode = 'equal' | 'manual'

// Pending assignment in manual mode: leadId -> userId
type PendingMap = Record<string, string>

const STATUS_COLORS: Record<string, string> = {
 New: 'bg-slate-100 text-slate-700',
 Contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
 'Follow-up': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
 Converted: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
 Closed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

// Helper: distribute leads round-robin across members
function distributeRoundRobin(leads: Lead[], members: User[]): PendingMap {
 const map: PendingMap = {}
 if (!members.length) return map
 leads.forEach((lead, i) => {
 map[lead.id] = members[i % members.length].id
 })
 return map
}

// ── Sub-component: LeadCard ───────────────────────────────────────────────────
interface LeadCardProps {
 lead: Lead
 isSelected: boolean
 pendingUserId?: string
 teamMembers: User[]
 onToggle: (id: string) => void
}
const LeadCard: React.FC<LeadCardProps> = ({ lead, isSelected, pendingUserId, teamMembers, onToggle }) => {
 const assignedMember = pendingUserId ? teamMembers.find((m) => m.id === pendingUserId) : null
 return (
 <div
 onClick={() => onToggle(lead.id)}
 className={cn(
 'group flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 text-left',
 isSelected
 ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
 : 'border-slate-200 hover:border-primary/40 hover:bg-slate-50'
 )}
 >
 <div className="mt-0.5 flex-shrink-0">
 {isSelected ? (
 <CheckSquare size={16} className="text-primary"/>
 ) : (
 <Square size={16} className="text-slate-300 group-hover:text-slate-400"/>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2 flex-wrap">
 <span className="text-sm font-semibold text-slate-800 truncate">{lead.name}</span>
 <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', STATUS_COLORS[lead.status])}>
 {lead.status}
 </span>
 </div>
 <span className="text-xs text-slate-400 truncate block">{lead.companyName}</span>
 <div className="flex items-center gap-3 mt-1">
 <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatUSD(lead.value)}</span>
 {assignedMember && (
 <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
 <UserCheck size={10} />
 {assignedMember.name}
 </span>
 )}
 </div>
 </div>
 </div>
 )
}

// ── Sub-component: MemberCard ─────────────────────────────────────────────────
interface MemberCardProps {
 member: User
 pendingCount: number
 existingCount: number
 isHighlighted: boolean
 onAssign: (userId: string) => void
 selectedCount: number
}
const MemberCard: React.FC<MemberCardProps> = ({
 member,
 pendingCount,
 existingCount,
 isHighlighted,
 onAssign,
 selectedCount,
}) => {
 return (
 <div
 className={cn(
 'rounded-xl border p-4 transition-all duration-200',
 isHighlighted
 ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/30'
 : 'border-slate-200 bg-white/40'
 )}
 >
 <div className="flex items-center gap-3 mb-3">
 <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 flex-shrink-0">
 {member.name.charAt(0).toUpperCase()}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-bold text-slate-800 truncate">{member.name}</p>
 <p className="text-xs text-slate-400 truncate">{member.designation || 'Sales Rep'}</p>
 </div>
 {pendingCount > 0 && (
 <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 animate-pulse">
 +{pendingCount}
 </span>
 )}
 </div>
 <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
 <span>
 Current: <strong className="text-slate-700">{existingCount}</strong> leads
 </span>
 <span>
 After: <strong className="text-primary">{existingCount + pendingCount}</strong> leads
 </span>
 </div>
 <Button
 size="sm"
 variant={selectedCount > 0 ? 'primary' : 'ghost'}
 className={cn(
 'w-full text-xs gap-1.5 cursor-pointer',
 selectedCount === 0 && 'opacity-50 cursor-not-allowed'
 )}
 onClick={() => selectedCount > 0 && onAssign(member.id)}
 disabled={selectedCount === 0}
 >
 <ChevronRight size={12} />
 Assign {selectedCount > 0 ? `${selectedCount} lead${selectedCount > 1 ? 's' : ''}` : 'leads'} here
 </Button>
 </div>
 )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export const DistributeLeads: React.FC = () => {
 const { user } = useAuthStore()
 const [mode, setMode] = useState<Mode>('equal')
 const [leads, setLeads] = useState<Lead[]>([])
 const [allLeads, setAllLeads] = useState<Lead[]>([])
 const [teamMembers, setTeamMembers] = useState<User[]>([])
 const [isLoading, setIsLoading] = useState(true)
 const [isDistributing, setIsDistributing] = useState(false)
 const [distribProgress, setDistribProgress] = useState(0)
 const [distribDone, setDistribDone] = useState(false)

 // Manual split state
 const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
 const [pendingAssignments, setPendingAssignments] = useState<PendingMap>({})
 const [searchQuery, setSearchQuery] = useState('')
 const [isConfirming, setIsConfirming] = useState(false)

 const companyId = user?.companyId

 const fetchData = async () => {
 if (!companyId) return
 setIsLoading(true)
 try {
 const [leadsRes, usersRes] = await Promise.all([
 api.get('/leads', { params: { companyId } }),
 api.get('/users', { params: { companyId } }),
 ])
 const allFetchedLeads = leadsRes.data as Lead[]
 const allUsers = usersRes.data as User[]

 setAllLeads(allFetchedLeads)

 // Unassigned pool: no assignedUserId OR assigned to the leader themselves
 const pool = allFetchedLeads.filter(
 (l) => !l.assignedUserId || l.assignedUserId === user?.id
 )
 setLeads(pool)

 // Team members: SALES_USER in the same team as this leader
 const members = allUsers.filter(
 (u) => u.role === 'SALES_USER' && (!user?.teamId || u.teamId === user?.teamId)
 )
 setTeamMembers(members)
 } catch (err) {
 console.error('Failed to fetch data', err)
 toast.error('Failed to load lead data.')
 } finally {
 setIsLoading(false)
 }
 }

 useEffect(() => {
 fetchData()
 }, [companyId])

 // Reset state when switching modes
 useEffect(() => {
 setDistribDone(false)
 setDistribProgress(0)
 setSelectedLeadIds(new Set())
 setPendingAssignments({})
 setSearchQuery('')
 }, [mode])

 // ── Equal Split ───────────────────────────────────────────────────────────
 const equalPreview = useMemo(() => {
 if (!teamMembers.length) return []
 return teamMembers.map((m, i) => {
 const count = Math.floor(leads.length / teamMembers.length) + (i < leads.length % teamMembers.length ? 1 : 0)
 return { member: m, count }
 })
 }, [leads, teamMembers])

 const handleEqualDistribute = async () => {
 if (!leads.length || !teamMembers.length) return
 setIsDistributing(true)
 setDistribProgress(0)
 setDistribDone(false)

 try {
 const assignments = distributeRoundRobin(leads, teamMembers)
 const assignmentArray = Object.entries(assignments).map(([leadId, userId]) => ({ leadId, userId }))

 const progressInterval = setInterval(() => {
 setDistribProgress((p) => {
 if (p >= 85) { clearInterval(progressInterval); return p }
 return p + Math.random() * 12
 })
 }, 120)

 await api.post('/leads/assign-bulk', { assignments: assignmentArray })

 clearInterval(progressInterval)
 setDistribProgress(100)
 setDistribDone(true)
 toast.success(`✅ ${assignmentArray.length} leads distributed across ${teamMembers.length} team members!`)
 await fetchData()
 } catch (err) {
 toast.error('Distribution failed. Please try again.')
 } finally {
 setIsDistributing(false)
 }
 }

 // ── Manual Split ──────────────────────────────────────────────────────────
 const filteredLeads = useMemo(() => {
 const q = searchQuery.toLowerCase()
 return leads.filter(
 (l) =>
 l.name.toLowerCase().includes(q) ||
 l.companyName.toLowerCase().includes(q) ||
 l.email.toLowerCase().includes(q)
 )
 }, [leads, searchQuery])

 const toggleLead = (id: string) => {
 setSelectedLeadIds((prev) => {
 const next = new Set(prev)
 if (next.has(id)) next.delete(id)
 else next.add(id)
 return next
 })
 }

 const toggleAll = () => {
 if (selectedLeadIds.size === filteredLeads.length) {
 setSelectedLeadIds(new Set())
 } else {
 setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)))
 }
 }

 const assignSelectedTo = (userId: string) => {
 if (!selectedLeadIds.size) return
 setPendingAssignments((prev) => {
 const next = { ...prev }
 selectedLeadIds.forEach((id) => { next[id] = userId })
 return next
 })
 setSelectedLeadIds(new Set())
 toast.success('Assignments staged — confirm when ready.')
 }

 const clearPendingForMember = (userId: string) => {
 setPendingAssignments((prev) => {
 const next = { ...prev }
 Object.keys(next).forEach((k) => { if (next[k] === userId) delete next[k] })
 return next
 })
 }

 const clearAllPending = () => {
 setPendingAssignments({})
 setSelectedLeadIds(new Set())
 }

 const handleConfirmManual = async () => {
 const entries = Object.entries(pendingAssignments)
 if (!entries.length) return
 setIsConfirming(true)
 try {
 const assignments = entries.map(([leadId, userId]) => ({ leadId, userId }))
 await api.post('/leads/assign-bulk', { assignments })
 toast.success(`✅ ${assignments.length} leads successfully assigned!`)
 setPendingAssignments({})
 setSelectedLeadIds(new Set())
 await fetchData()
 } catch (err) {
 toast.error('Failed to confirm assignments. Please try again.')
 } finally {
 setIsConfirming(false)
 }
 }

 const existingCounts = useMemo(() => {
 const counts: Record<string, number> = {}
 teamMembers.forEach((m) => {
 counts[m.id] = allLeads.filter((l) => l.assignedUserId === m.id).length
 })
 return counts
 }, [allLeads, teamMembers])

 const pendingCountForMember = (userId: string) =>
 Object.values(pendingAssignments).filter((v) => v === userId).length

 const totalPending = Object.keys(pendingAssignments).length

 // ── Guards ────────────────────────────────────────────────────────────────
 if (user?.role !== 'SALES_LEADER') {
 return (
 <div className="flex flex-col items-center justify-center h-64 gap-3">
 <AlertCircle className="text-danger"size={40} />
 <p className="text-lg font-semibold text-slate-700">Access Restricted</p>
 <p className="text-sm text-slate-400">This page is only available to Sales Leaders.</p>
 </div>
 )
 }

 if (isLoading) {
 return (
 <div className="flex items-center justify-center h-64 gap-3">
 <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/>
 <span className="text-slate-500 font-medium">Loading lead pool...</span>
 </div>
 )
 }

 return (
 <div className="space-y-6">
 {/* ── Page Header ── */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
 <div>
 <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
 <Shuffle size={24} className="text-primary"/>
 Lead Distribution
 </h1>
 <p className="text-sm font-medium text-slate-500 mt-0.5">
 Distribute unassigned leads to your team — equally or manually.
 </p>
 </div>

 {/* Mode Toggle Pill */}
 <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1 self-start sm:self-auto">
 <button
 onClick={() => setMode('equal')}
 className={cn(
 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer',
 mode === 'equal'
 ? 'bg-white text-primary shadow-sm'
 : 'text-slate-500 hover:text-slate-700'
 )}
 >
 <Zap size={14} />
 Equal Split
 </button>
 <button
 onClick={() => setMode('manual')}
 className={cn(
 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer',
 mode === 'manual'
 ? 'bg-white text-primary shadow-sm'
 : 'text-slate-500 hover:text-slate-700'
 )}
 >
 <SlidersHorizontal size={14} />
 Manual Split
 </button>
 </div>
 </div>

 {/* ── Summary Stats ── */}
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
 <Card hoverEffect>
 <CardContent className="flex items-center gap-3 p-4">
 <div className="p-2.5 rounded-xl bg-warning/10 border border-warning/20 text-warning">
 <Target size={18} />
 </div>
 <div className="text-left">
 <span className="text-xs font-semibold text-slate-400 block">Unassigned</span>
 <span className="text-xl font-extrabold text-slate-900">{leads.length}</span>
 </div>
 </CardContent>
 </Card>
 <Card hoverEffect>
 <CardContent className="flex items-center gap-3 p-4">
 <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
 <Users size={18} />
 </div>
 <div className="text-left">
 <span className="text-xs font-semibold text-slate-400 block">Team Members</span>
 <span className="text-xl font-extrabold text-slate-900">{teamMembers.length}</span>
 </div>
 </CardContent>
 </Card>
 <Card hoverEffect className="col-span-2 sm:col-span-1">
 <CardContent className="flex items-center gap-3 p-4">
 <div className="p-2.5 rounded-xl bg-success/10 border border-success/20 text-success">
 <CheckCircle2 size={18} />
 </div>
 <div className="text-left">
 <span className="text-xs font-semibold text-slate-400 block">
 {mode === 'equal' ? 'Leads / Member' : 'Staged'}
 </span>
 <span className="text-xl font-extrabold text-slate-900">
 {mode === 'equal'
 ? teamMembers.length > 0
 ? `~${Math.ceil(leads.length / teamMembers.length)}`
 : '—'
 : totalPending}
 </span>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* ═══════════ EQUAL SPLIT MODE ═══════════ */}
 {mode === 'equal' && (
 <div className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle className="text-left flex items-center gap-2 text-base">
 <Zap size={16} className="text-primary"/>
 Distribution Preview
 </CardTitle>
 </CardHeader>
 <CardContent className="pt-0">
 {teamMembers.length === 0 ? (
 <div className="text-center py-8 text-slate-400">
 <Users size={32} className="mx-auto mb-2 opacity-40"/>
 <p className="text-sm font-medium">No team members found on your team.</p>
 </div>
 ) : leads.length === 0 ? (
 <div className="text-center py-8">
 <CheckCircle2 size={32} className="mx-auto mb-2 opacity-60 text-success"/>
 <p className="text-sm font-semibold text-success">All leads are already assigned!</p>
 </div>
 ) : (
 <div className="space-y-2">
 {equalPreview.map(({ member, count }) => (
 <div
 key={member.id}
 className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
 >
 <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 flex-shrink-0">
 {member.name.charAt(0)}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-slate-800 truncate">{member.name}</p>
 <p className="text-xs text-slate-400">{member.designation || 'Sales Rep'}</p>
 </div>
 <div className="flex items-center gap-2 flex-shrink-0">
 <div className="text-right">
 <span className="text-xs text-slate-400 block">Currently</span>
 <span className="text-sm font-bold text-slate-600">
 {existingCounts[member.id] ?? 0}
 </span>
 </div>
 <ChevronRight size={14} className="text-slate-300"/>
 <div className="text-right">
 <span className="text-xs text-slate-400 block">After</span>
 <span className="text-sm font-bold text-primary">
 {(existingCounts[member.id] ?? 0) + count}
 </span>
 </div>
 <Badge variant="primary"className="ml-1 text-[11px] font-medium px-2 py-0.5">
 +{count}
 </Badge>
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 {/* Progress bar */}
 {(isDistributing || distribDone) && (
 <Card>
 <CardContent className="p-5">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm font-semibold text-slate-700">
 {distribDone ? 'Distribution Complete!' : 'Distributing leads...'}
 </span>
 <span className="text-sm font-bold text-primary">{Math.round(distribProgress)}%</span>
 </div>
 <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
 <div
 className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-300 ease-out"
 style={{ width: `${distribProgress}%` }}
 />
 </div>
 {distribDone && (
 <p className="mt-2 text-xs text-success font-semibold flex items-center gap-1">
 <CheckCircle2 size={12} />
 {leads.length} leads have been assigned to {teamMembers.length} team members.
 </p>
 )}
 </CardContent>
 </Card>
 )}

 <div className="flex justify-end gap-3">
 {distribDone && (
 <Button
 variant="ghost"
 onClick={() => { setDistribDone(false); setDistribProgress(0) }}
 className="gap-2 cursor-pointer"
 >
 <RotateCcw size={14} />
 Reset
 </Button>
 )}
 <Button
 onClick={handleEqualDistribute}
 isLoading={isDistributing}
 disabled={leads.length === 0 || teamMembers.length === 0 || isDistributing || distribDone}
 className="gap-2 cursor-pointer shadow-md"
 >
 <Zap size={16} />
 {distribDone
 ? 'Distribution Complete'
 : `Distribute ${leads.length} Lead${leads.length !== 1 ? 's' : ''} Equally`}
 </Button>
 </div>
 </div>
 )}

 {/* ═══════════ MANUAL SPLIT MODE ═══════════ */}
 {mode === 'manual' && (
 <div className="space-y-4">
 {/* Top action bar */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
 <p className="text-sm text-slate-500">
 Select leads from the pool, then click a team member to assign them.
 </p>
 <div className="flex items-center gap-2">
 {totalPending > 0 && (
 <Button
 variant="ghost"
 size="sm"
 onClick={clearAllPending}
 className="gap-1.5 text-danger hover:bg-danger/10 cursor-pointer"
 >
 <RotateCcw size={13} />
 Clear All
 </Button>
 )}
 <Button
 onClick={handleConfirmManual}
 isLoading={isConfirming}
 disabled={totalPending === 0 || isConfirming}
 className="gap-2 cursor-pointer shadow-md"
 >
 <CheckCircle2 size={15} />
 Confirm {totalPending > 0 ? `${totalPending} Assignment${totalPending > 1 ? 's' : ''}` : 'Assignments'}
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
 {/* ── LEFT: Lead Pool ── */}
 <div className="lg:col-span-3 space-y-3">
 <Card>
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <CardTitle className="text-left text-base flex items-center gap-2">
 <Target size={15} className="text-warning"/>
 Unassigned Lead Pool
 <Badge variant="warning"className="text-[10px] px-1.5 font-bold">
 {leads.length}
 </Badge>
 </CardTitle>
 {filteredLeads.length > 0 && (
 <button
 onClick={toggleAll}
 className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
 >
 {selectedLeadIds.size === filteredLeads.length ? (
 <><CheckSquare size={12} /> Deselect All</>
 ) : (
 <><Square size={12} /> Select All</>
 )}
 </button>
 )}
 </div>
 </CardHeader>
 <CardContent className="pt-0 space-y-3">
 {/* Search bar */}
 <div className="relative">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
 <input
 type="text"
 placeholder="Search by name, company or email..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-8 pr-4 py-2 text-sm border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
 />
 {searchQuery && (
 <button
 onClick={() => setSearchQuery('')}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
 >
 <X size={14} />
 </button>
 )}
 </div>

 {/* Selection status bar */}
 {selectedLeadIds.size > 0 && (
 <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
 <span className="text-xs font-semibold text-primary">
 {selectedLeadIds.size} lead{selectedLeadIds.size > 1 ? 's' : ''} selected — click a team member to assign
 </span>
 <button
 onClick={() => setSelectedLeadIds(new Set())}
 className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer flex items-center gap-1"
 >
 <X size={11} /> Clear
 </button>
 </div>
 )}

 {/* Leads list */}
 <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
 {filteredLeads.length === 0 ? (
 <div className="text-center py-12 text-slate-400">
 {leads.length === 0 ? (
 <>
 <CheckCircle2 size={28} className="mx-auto mb-2 text-success opacity-60"/>
 <p className="text-sm font-medium text-success">All leads are assigned!</p>
 </>
 ) : (
 <>
 <Search size={28} className="mx-auto mb-2 opacity-40"/>
 <p className="text-sm font-medium">No leads match your search.</p>
 </>
 )}
 </div>
 ) : (
 filteredLeads.map((lead) => (
 <LeadCard
 key={lead.id}
 lead={lead}
 isSelected={selectedLeadIds.has(lead.id)}
 pendingUserId={pendingAssignments[lead.id]}
 teamMembers={teamMembers}
 onToggle={toggleLead}
 />
 ))
 )}
 </div>
 </CardContent>
 </Card>
 </div>

 {/* ── RIGHT: Team Members ── */}
 <div className="lg:col-span-2 space-y-3">
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-left text-base flex items-center gap-2">
 <Users size={15} className="text-primary"/>
 Team Members
 <Badge variant="primary"className="text-[10px] px-1.5 font-bold">
 {teamMembers.length}
 </Badge>
 </CardTitle>
 </CardHeader>
 <CardContent className="pt-0 space-y-3 max-h-[580px] overflow-y-auto pr-1">
 {teamMembers.length === 0 ? (
 <div className="text-center py-10 text-slate-400">
 <Users size={28} className="mx-auto mb-2 opacity-40"/>
 <p className="text-sm font-medium">No team members found.</p>
 </div>
 ) : (
 teamMembers.map((member) => {
 const pCount = pendingCountForMember(member.id)
 return (
 <div key={member.id} className="relative">
 <MemberCard
 member={member}
 pendingCount={pCount}
 existingCount={existingCounts[member.id] ?? 0}
 isHighlighted={pCount > 0}
 onAssign={assignSelectedTo}
 selectedCount={selectedLeadIds.size}
 />
 {pCount > 0 && (
 <button
 onClick={() => clearPendingForMember(member.id)}
 className="absolute top-2 right-2 p-1 rounded-full text-slate-400 hover:text-danger hover:bg-danger/10 cursor-pointer transition-colors"
 title="Clear staged assignments for this member"
 >
 <X size={12} />
 </button>
 )}
 </div>
 )
 })
 )}
 </CardContent>
 </Card>

 {/* Staged summary panel */}
 {totalPending > 0 && (
 <Card className="border-primary/30 bg-primary/5">
 <CardContent className="p-4">
 <p className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
 <UserCheck size={15} />
 Staged Assignments
 </p>
 <div className="space-y-1.5">
 {teamMembers
 .filter((m) => pendingCountForMember(m.id) > 0)
 .map((m) => (
 <div key={m.id} className="flex items-center justify-between text-xs">
 <span className="text-slate-600 font-medium truncate">{m.name}</span>
 <Badge variant="primary"className="text-[10px] px-1.5 font-bold flex-shrink-0">
 +{pendingCountForMember(m.id)} leads
 </Badge>
 </div>
 ))}
 </div>
 <div className="border-t border-primary/20 mt-3 pt-3">
 <Button
 onClick={handleConfirmManual}
 isLoading={isConfirming}
 className="w-full gap-2 cursor-pointer text-sm"
 >
 <CheckCircle2 size={14} />
 Confirm All {totalPending} Assignment{totalPending > 1 ? 's' : ''}
 </Button>
 </div>
 </CardContent>
 </Card>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 )
}

export default DistributeLeads

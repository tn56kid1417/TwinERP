import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Users, Phone, Mail, DollarSign, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { useLeadStore } from '../../store/leadStore'
import { api } from '../../services/api'
import type { User, Lead, LeadStatus } from '../../types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Table } from '../../components/ui/Table'
import type { Column } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { formatUSD, formatDate } from '../../utils/formatters'
import { cn } from '../../utils/cn'

// Form validation schema
const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().optional(),
  value: z.number().min(0, 'Value must be positive'),
  status: z.enum(['New', 'Contacted', 'Follow-up', 'Closed', 'Converted']),
  assignedUserId: z.string().optional().or(z.literal('')),
})

type LeadFormValues = z.infer<typeof leadSchema>

export const Leads: React.FC = () => {
  const { user } = useAuthStore()
  const { leads, fetchLeads, createLead, updateLead, isLoading } = useLeadStore()
  const [salesReps, setSalesReps] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<LeadStatus | 'ALL'>('ALL')
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const companyId = user?.companyId

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      companyName: '',
      email: '',
      phone: '',
      value: 0,
      status: 'New',
      assignedUserId: '',
    },
  })

  useEffect(() => {
    if (companyId) {
      fetchLeads({ companyId })
      
      // Fetch available sales reps for dropdown selection
      api.get(`/users?companyId=${companyId}&role=SALES_USER`)
        .then((res) => setSalesReps(res.data))
        .catch(() => {})
    }
  }, [companyId])

  const openAddModal = () => {
    setSelectedLead(null)
    reset({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      value: 0,
      status: 'New',
      assignedUserId: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (lead: Lead) => {
    setSelectedLead(lead)
    reset({
      name: lead.name,
      companyName: lead.companyName,
      email: lead.email,
      phone: lead.phone || '',
      value: lead.value,
      status: lead.status,
      assignedUserId: lead.assignedUserId || '',
    })
    setIsModalOpen(true)
  }

  const onSubmit = async (data: LeadFormValues) => {
    if (!companyId) return
    setSubmitting(true)
    try {
      const assignedRep = salesReps.find((r) => r.id === data.assignedUserId)
      
      // If assignment dropdown has a rep selected but lead status is 'New', auto-promote to 'Contacted'
      let resolvedStatus = data.status
      if (data.assignedUserId && resolvedStatus === 'New') {
        resolvedStatus = 'Contacted'
      }

      const payload = {
        name: data.name,
        companyName: data.companyName,
        email: data.email,
        phone: data.phone || '',
        value: Number(data.value),
        status: resolvedStatus,
        assignedUserId: data.assignedUserId || undefined,
        assignedUserName: assignedRep ? assignedRep.name : undefined,
        companyId,
      }

      if (selectedLead) {
        await updateLead(selectedLead.id, payload)
        toast.success('Lead records updated successfully.')
      } else {
        await createLead(payload)
        toast.success('Successfully added new prospect!')
      }

      setIsModalOpen(false)
      // Refresh list to sync changes
      fetchLeads({ companyId })
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to submit form.')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter leads dynamically based on tab selection
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
      header: 'Lead Valuation',
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
      header: 'Assigned Agent',
      accessor: (row) => (
        <div className="flex items-center gap-1.5 text-left">
          {row.assignedUserName ? (
            <span className="text-sm text-slate-700 font-medium">{row.assignedUserName}</span>
          ) : (
            <span className="text-xs text-slate-400 italic flex items-center gap-1">
              <UserPlus size={12} /> Click row to assign
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Updated',
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Board</h1>
          <p className="text-sm font-medium text-slate-500">
            Allocate sales reps to incoming deals and monitor active conversions.
          </p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2 cursor-pointer w-full sm:w-auto shadow-sm">
          <Plus size={16} /> Create Prospect
        </Button>
      </div>

      {/* Tabs list filter */}
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

      {/* Leads listing table */}
      <Table
        columns={columns}
        data={filteredLeads}
        isLoading={isLoading}
        rowClick={openEditModal}
        emptyMessage="No prospects match the chosen status criteria."
      />

      {/* Add / Edit Lead details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedLead ? 'Edit Lead Parameters' : 'Create New Lead Record'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="text"
              label="Contact Name"
              placeholder="Alice Vance"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              type="text"
              label="Prospect Company"
              placeholder="Vance Refrigeration"
              error={errors.companyName?.message}
              {...register('companyName')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="alice@vance.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              type="text"
              label="Phone Number"
              placeholder="+1 (555) 019-2834"
              leftIcon={<Phone size={16} />}
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Pipeline Value ($)"
              placeholder="15000"
              leftIcon={<DollarSign size={16} />}
              error={errors.value?.message}
              {...register('value', { valueAsNumber: true })}
            />

            {/* Custom Select for Lead Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Lead Status
              </label>
              <select
                className="w-full text-sm py-2 px-3.5 bg-white border border-slate-200 text-slate-700 rounded-lg transition-all duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                {...register('status')}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Converted">Converted</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Allocation select box */}
          <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-4 mt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users size={16} /> Allocate Assigned Sales Representative
            </label>
            <select
              className="w-full text-sm py-2 px-3.5 bg-white border border-slate-200 text-slate-700 rounded-lg transition-all duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
              {...register('assignedUserId')}
            >
              <option value="">-- Leave Unassigned --</option>
              {salesReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name} ({rep.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={submitting}
              className="cursor-pointer"
            >
              {selectedLead ? 'Save Changes' : 'Enroll Lead'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
export default Leads

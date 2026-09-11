import React, { useEffect, useMemo, useState } from 'react'
import { DollarSign, Clock, CreditCard, User, Plus, Search, ChevronDown, ExternalLink, Copy, Eye, Edit2, Filter, Activity, AlertCircle, Download } from 'lucide-react'
import { usePurchaseStore } from '../../store/purchaseStore'
import { useLeadStore } from '../../store/leadStore'
import { useAuth } from '../../../context/AuthContext'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Table, type Column } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { formatDate } from '../../utils/formatters'
import type { Purchase, Lead } from '../../types'

export const Payments: React.FC = () => {
  const { purchases, fetchPurchases, addPurchase, updatePurchase, isLoading: purchasesLoading } = usePurchaseStore()
  const { leads, fetchLeads, isLoading: leadsLoading } = useLeadStore()
  const { user: mainUser } = useAuth()
  const { user: crmUser } = useAuthStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [newPayment, setNewPayment] = useState<{
    customerName: string;
    leadId: string;
    product: string;
    amount: string;
    paymentStatus: 'expired' | 'Paid' | 'Pending';
    paymentType: 'Full' | 'Partial';
    soldPrice: string;
    paymentLink: string;
    approver: string;
    expires: string;
  }>({
    customerName: '',
    leadId: '',
    product: '',
    amount: '',
    paymentStatus: 'Pending',
    paymentType: 'Full',
    soldPrice: '',
    paymentLink: '',
    approver: '',
    expires: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    fetchPurchases()
    fetchLeads()
  }, [fetchPurchases, fetchLeads])

  const filteredPurchases = useMemo(() => {
    if (!mainUser || !crmUser) return [];
    let result = purchases;
    
    const isLeader = mainUser.role === 'CEO' || mainUser.role === 'CTO' || mainUser.role === 'Admin' || mainUser.role === 'Sales Team Leader' || mainUser.role === 'Manager' || mainUser.department === 'HR';
    
    if (!isLeader) {
      // Sales employee can only view their own completed payments
      result = purchases.filter((purchase) => {
        const lead = leads.find((l) => l.id === purchase.leadId);
        return lead && lead.assignedUserId === crmUser.id;
      });
    }

    if (statusFilter !== 'All') {
      result = result.filter(p => p.paymentStatus === statusFilter || (statusFilter === 'Completed' && p.paymentStatus === 'Paid') || (statusFilter === 'Failed' && p.paymentStatus === 'expired'));
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p => {
        const lead = leads.find(l => l.id === p.leadId);
        const leadName = lead ? lead.name.toLowerCase() : (p.leadId || '').toLowerCase();
        const createdBy = (p.createdBy || '').toLowerCase();
        return leadName.includes(lowerQuery) || createdBy.includes(lowerQuery);
      });
    }

    return result;
  }, [purchases, leads, mainUser, crmUser, searchQuery, statusFilter])

  const getLeadName = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId)
    return lead ? lead.name : leadId || 'Unknown Customer'
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const customerInput = (newPayment.customerName || newPayment.leadId).trim()
    if (!customerInput || !newPayment.product || !newPayment.amount) return

    const matchedLead = leads.find(l => 
      l.name.toLowerCase() === customerInput.toLowerCase() || 
      l.id === customerInput
    )
    const targetLeadId = matchedLead ? matchedLead.id : customerInput

    setIsSubmitting(true)
    try {
      if (editingPaymentId) {
        await updatePurchase(editingPaymentId, {
          leadId: targetLeadId,
          product: newPayment.product,
          amount: Number(newPayment.amount),
          paymentStatus: newPayment.paymentStatus,
          paymentType: newPayment.paymentType,
          soldPrice: newPayment.soldPrice ? Number(newPayment.soldPrice) : Number(newPayment.amount),
          paymentLink: newPayment.paymentLink,
          approver: newPayment.approver,
          expires: newPayment.expires,
        })
      } else {
        await addPurchase({
          leadId: targetLeadId,
          product: newPayment.product,
          amount: Number(newPayment.amount),
          paymentStatus: newPayment.paymentStatus,
          paymentType: newPayment.paymentType,
          soldPrice: newPayment.soldPrice ? Number(newPayment.soldPrice) : Number(newPayment.amount),
          paymentLink: newPayment.paymentLink,
          approver: newPayment.approver,
          expires: newPayment.expires,
          createdBy: mainUser?.name || 'System'
        })
      }
      setIsModalOpen(false)
      setEditingPaymentId(null)
      setNewPayment({ 
        customerName: '',
        leadId: '', 
        product: '', 
        amount: '',
        paymentStatus: 'Pending',
        paymentType: 'Full',
        soldPrice: '',
        paymentLink: '',
        approver: '',
        expires: ''
      })
    } catch (error) {
      console.error('Failed to save payment', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPayment = (payment: Purchase) => {
    setEditingPaymentId(payment.id)
    const existingLeadName = getLeadName(payment.leadId)
    setNewPayment({
      customerName: existingLeadName,
      leadId: payment.leadId,
      product: payment.product,
      amount: String(payment.amount),
      paymentStatus: payment.paymentStatus || 'Pending',
      paymentType: payment.paymentType || 'Full',
      soldPrice: payment.soldPrice ? String(payment.soldPrice) : '',
      paymentLink: payment.paymentLink || '',
      approver: payment.approver || '',
      expires: payment.expires || ''
    })
    setIsModalOpen(true)
  }

  const handleOpenCreateModal = () => {
    setEditingPaymentId(null)
    setNewPayment({ 
      customerName: '',
      leadId: '', 
      product: '', 
      amount: '',
      paymentStatus: 'Pending',
      paymentType: 'Full',
      soldPrice: '',
      paymentLink: '',
      approver: '',
      expires: ''
    })
    setIsModalOpen(true)
  }

  const columns: Column<Purchase>[] = [
    {
      header: 'AMOUNT',
      accessor: (row) => (
        <span className="font-medium text-amber-500">
          ₹ {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'STATUS',
      accessor: (row) => {
        const status = row.paymentStatus || 'Pending';
        let variant: 'success' | 'warning' | 'danger' | 'secondary' = 'secondary';
        let icon = <Clock size={12} className="mr-1 inline-block" />;
        
        if (status === 'Paid') {
          variant = 'success';
          icon = <span className="mr-1 inline-block">✓</span>;
        } else if (status === 'Pending') {
          variant = 'warning';
        } else if (status === 'expired') {
          variant = 'secondary';
        }

        return (
          <Badge variant={variant} className="capitalize text-xs px-2 py-0.5 whitespace-nowrap">
            {icon}
            {status}
          </Badge>
        );
      },
    },
    {
      header: 'LEAD',
      accessor: (row) => (
        <span className="font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">{getLeadName(row.leadId)}</span>
      ),
    },
    {
      header: 'TYPE',
      accessor: (row) => {
        const type = row.paymentType || 'Full';
        return (
          <Badge variant="warning" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-xs px-2 py-0.5 whitespace-nowrap">
            {type}
          </Badge>
        );
      },
    },
    {
      header: 'SOLD PRICE',
      accessor: (row) => (
        <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap">
          ₹ {(row.soldPrice || row.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'PAYMENT LINK',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {row.paymentLink ? (
            <>
              <button className="text-amber-500 hover:text-amber-600 transition-colors">
                <ExternalLink size={16} />
              </button>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <Copy size={16} />
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-500 tracking-wider">NO LINK</span>
          )}
        </div>
      ),
    },
    {
      header: 'CREATED BY',
      accessor: (row) => (
        <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{row.createdBy || 'System'}</span>
      ),
    },
    {
      header: 'APPROVAL',
      accessor: (row) => {
        const approval = row.approval || 'Not Required';
        return (
          <Badge variant={approval === 'Awaiting' ? 'secondary' : 'secondary'} className="text-xs px-2 py-0.5 whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {approval === 'Awaiting' && <Clock size={12} className="mr-1 inline-block" />}
            {approval}
          </Badge>
        );
      },
    },
    {
      header: 'APPROVER',
      accessor: (row) => (
        <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{row.approver || '-'}</span>
      ),
    },
    {
      header: 'EXPIRES',
      accessor: (row) => {
        let isOverdue = false;
        if (row.paymentStatus === 'Pending' && row.expires) {
          const expiryDate = new Date(row.expires);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          isOverdue = expiryDate < today;
        }
        
        return (
          <div className="flex items-center gap-2">
            <span className={`text-xs whitespace-nowrap uppercase tracking-wider ${isOverdue ? 'text-red-500 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
              {row.expires || 'NO EXPIRY'}
            </span>
            {isOverdue && (
              <Badge variant="danger" className="text-[10px] px-1.5 py-0">Overdue</Badge>
            )}
          </div>
        );
      },
    },
    {
      header: 'DATE',
      accessor: (row) => (
        <span className="text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">{formatDate(row.date)}</span>
      ),
    },
    {
      header: 'ACTIONS',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <Eye size={16} />
          </button>
          <button 
            onClick={() => handleEditPayment(row)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-medium"
          >
            <Edit2 size={12} />
            Update
          </button>
        </div>
      ),
    },
  ]

  const totalRevenue = filteredPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const paidRevenue = filteredPurchases.filter(p => p.paymentStatus === 'Paid').reduce((sum, purchase) => sum + purchase.amount, 0);
  const pendingRevenue = filteredPurchases.filter(p => p.paymentStatus === 'Pending').reduce((sum, purchase) => sum + purchase.amount, 0);
  const totalTransactions = filteredPurchases.length;
  const paidTransactions = filteredPurchases.filter(p => p.paymentStatus === 'Paid').length;
  const successRate = totalTransactions > 0 ? Math.round((paidTransactions / totalTransactions) * 100) : 0;

  const overduePayments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return purchases.filter(p => {
      if (p.paymentStatus !== 'Pending' || !p.expires) return false;
      const expiryDate = new Date(p.expires);
      return expiryDate < today;
    });
  }, [purchases]);



  // Determine selectable leads based on role
  const selectableLeads = useMemo(() => {
    if (!mainUser || !crmUser) return [];
    const isLeader = mainUser.role === 'CEO' || mainUser.role === 'CTO' || mainUser.role === 'Admin' || mainUser.role === 'Sales Team Leader' || mainUser.role === 'Manager' || mainUser.department === 'HR';
    
    if (isLeader) return leads;
    return leads.filter(l => l.assignedUserId === crmUser.id);
  }, [leads, mainUser, crmUser]);


  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Amount', 'Status', 'Type', 'Lead Name', 'Sold Price', 'Expires'];
    const csvContent = [
      headers.join(','),
      ...filteredPurchases.map(p => {
        const leadName = leads.find(l => l.id === p.leadId)?.name || p.leadId;
        return [
          p.id,
          new Date(p.date).toLocaleDateString(),
          p.amount,
          p.paymentStatus || 'Pending',
          p.paymentType || 'Full',
          `"${leadName}"`,
          p.soldPrice || p.amount,
          p.expires || 'NO EXPIRY'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Payments
        </h1>
      </div>
      
      {overduePayments.length > 0 && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 dark:bg-red-500/20 p-2 rounded-full text-red-600 dark:text-red-500">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">Overdue Payments Detected</h3>
              <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">There {overduePayments.length === 1 ? 'is' : 'are'} {overduePayments.length} pending payment{overduePayments.length === 1 ? '' : 's'} past {overduePayments.length === 1 ? 'its' : 'their'} due date.</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => setStatusFilter('Pending')}
          >
            Review Pending
          </Button>
        </div>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverEffect>
          <CardContent className="p-5 text-left space-y-2 relative">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Revenue
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">₹ {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <DollarSign size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card hoverEffect>
          <CardContent className="p-5 text-left space-y-2 relative">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Paid Revenue
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-green-600 dark:text-green-500 tracking-tight">₹ {paidRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <div className="bg-green-500/10 p-2 rounded-lg text-green-500">
                <CreditCard size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card hoverEffect>
          <CardContent className="p-5 text-left space-y-2 relative">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Pending Revenue
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-500 tracking-tight">₹ {pendingRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
                <Clock size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card hoverEffect>
          <CardContent className="p-5 text-left space-y-2 relative">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Success Rate
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{successRate}%</span>
              <div className="bg-blue-500/10 p-2 rounded-lg text-blue-500">
                <Activity size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search by lead name or agent name" 
            className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-primary dark:focus:border-slate-700 w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <select
            className="appearance-none pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:border-primary dark:focus:border-slate-700 cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Completed (Paid)</option>
            <option value="expired">Failed (Expired)</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Filter size={14} className="text-slate-500" />
          Created Date
          <ChevronDown size={14} className="text-slate-500 ml-1" />
        </button>

        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Filter size={14} className="text-slate-500" />
          Newest First
          <ChevronDown size={14} className="text-slate-500 ml-1" />
        </button>

        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Download size={16} className="text-slate-500" />
            Export CSV
          </button>
          <Button onClick={handleOpenCreateModal} className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus size={18} />
            Create Payment
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-[500px]">
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            data={filteredPurchases}
            isLoading={purchasesLoading || leadsLoading}
            emptyMessage="No payments recorded yet."
          />
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPaymentId ? "Update Payment" : "Create Payment"}
        size="lg"
      >
        <form onSubmit={handleSavePayment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Customer"
                placeholder="Type customer name..."
                value={newPayment.customerName}
                onChange={(e) => {
                  const val = e.target.value
                  const matched = leads.find(l => l.name.toLowerCase() === val.trim().toLowerCase())
                  setNewPayment({
                    ...newPayment,
                    customerName: val,
                    leadId: matched ? matched.id : val
                  })
                }}
                leftIcon={<User size={16} />}
                list="customer-suggestions"
                required
              />
              <datalist id="customer-suggestions">
                {selectableLeads.map((lead) => (
                  <option key={lead.id} value={lead.name} />
                ))}
              </datalist>
            </div>
            
            <Input
              label="Product/Service"
              placeholder="e.g. Website Redesign"
              value={newPayment.product}
              onChange={(e) => setNewPayment({ ...newPayment, product: e.target.value })}
              required
            />

            <Input
              label="Amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              leftIcon={<DollarSign size={16} />}
              value={newPayment.amount}
              onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
              required
            />

            <Input
              label="Sold Price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              leftIcon={<DollarSign size={16} />}
              value={newPayment.soldPrice}
              onChange={(e) => setNewPayment({ ...newPayment, soldPrice: e.target.value })}
            />

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Type</label>
              <select
                className="w-full text-sm py-2.5 px-3.5 bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-xl transition-all duration-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer shadow-sm dark:shadow-inner"
                value={newPayment.paymentType}
                onChange={(e) => setNewPayment({ ...newPayment, paymentType: e.target.value as 'Full' | 'Partial' })}
                required
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.85rem center', backgroundSize: '1.1em' }}
              >
                <option value="Full" className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">Full</option>
                <option value="Partial" className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">Partial</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Status</label>
              <select
                className="w-full text-sm py-2.5 px-3.5 bg-white/90 dark:bg-[#07090E]/90 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-xl transition-all duration-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer shadow-sm dark:shadow-inner"
                value={newPayment.paymentStatus}
                onChange={(e) => setNewPayment({ ...newPayment, paymentStatus: e.target.value as 'Pending' | 'Paid' | 'expired' })}
                required
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.85rem center', backgroundSize: '1.1em' }}
              >
                <option value="Pending" className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">Pending</option>
                <option value="Paid" className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">Paid</option>
                <option value="expired" className="bg-white dark:bg-[#0C1017] text-slate-800 dark:text-slate-100">Expired</option>
              </select>
            </div>

            <Input
              label="Payment Link"
              placeholder="https://..."
              value={newPayment.paymentLink}
              onChange={(e) => setNewPayment({ ...newPayment, paymentLink: e.target.value })}
            />

            <Input
              label="Approver"
              placeholder="e.g. John Doe"
              value={newPayment.approver}
              onChange={(e) => setNewPayment({ ...newPayment, approver: e.target.value })}
            />

            <Input
              label="Expires"
              type="datetime-local"
              value={newPayment.expires}
              onChange={(e) => setNewPayment({ ...newPayment, expires: e.target.value })}
            />
          </div>

          <div className="flex justify-end items-center gap-3 mt-8 pt-4 border-t border-slate-800/80">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} variant="primary">
              {editingPaymentId ? "Update Payment" : "Create Payment"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Payments

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, DollarSign, Calendar, MessageSquare, History, Plus, ShoppingBag, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { useLeadStore } from '../../store/leadStore'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { formatUSD, formatDate, formatRelativeTime } from '../../utils/formatters'
import { cn } from '../../utils/cn'

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const {
    currentCustomer,
    fetchCustomerById,
    notes,
    fetchNotes,
    addNote,
    purchases,
    fetchPurchases,
    addPurchase,
    isLoading,
  } = useLeadStore()

  // Layout tabs
  const [activeRightTab, setActiveRightTab] = useState<'notes' | 'purchases'>('notes')
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  
  // Transaction logging modal
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [productName, setProductName] = useState('')
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [loggingPurchase, setLoggingPurchase] = useState(false)

  useEffect(() => {
    if (id) {
      fetchCustomerById(id)
      fetchNotes(id)
      fetchPurchases(id)
    }
  }, [id])

  if (isLoading || !currentCustomer) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center py-6 text-slate-400 text-sm flex flex-col items-center gap-2">
          <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Loading customer file...
        </div>
      </div>
    )
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteText.trim() || !user || !id) return
    setAddingNote(true)
    try {
      await addNote(id, user.name, noteText)
      setNoteText('')
      toast.success('Interaction note logged.')
    } catch {
      toast.error('Failed to log note.')
    } finally {
      setAddingNote(false)
    }
  }

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName.trim() || !purchaseAmount || !id) return
    setLoggingPurchase(true)
    try {
      const amountNum = Number(purchaseAmount)
      await addPurchase(id, productName, amountNum)
      
      // Auto-post note
      if (user) {
        await addNote(id, 'System Log', `Purchase transaction recorded: "${productName}" for ${formatUSD(amountNum)}`)
        fetchNotes(id)
      }

      setProductName('')
      setPurchaseAmount('')
      setIsPurchaseModalOpen(false)
      toast.success('Transaction logged successfully!')
    } catch {
      toast.error('Failed to save transaction.')
    } finally {
      setLoggingPurchase(false)
    }
  }

  const totalSpent = purchases.reduce((acc, p) => acc + p.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center gap-4 text-left">
        <Button variant="outline" size="sm" onClick={() => navigate('/crm/customers')} className="p-2 border rounded-xl hover:bg-slate-50 cursor-pointer">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">{currentCustomer.name}</h1>
            <Badge variant="success">Customer</Badge>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-0.5">Member since {formatDate(currentCustomer.createdDate)}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Profile Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={16} className="text-slate-400 flex-shrink-0" />
                <a href={`mailto:${currentCustomer.email}`} className="hover:text-primary transition-colors truncate">
                  {currentCustomer.email}
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone size={16} className="text-slate-400 flex-shrink-0" />
                <a href={`tel:${currentCustomer.phone}`} className="hover:text-primary transition-colors">
                  {currentCustomer.phone || <span className="italic text-slate-350">No phone recorded</span>}
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Award size={16} className="text-slate-400 flex-shrink-0" />
                <span>Total Booked Revenue: <strong className="text-slate-900">{formatUSD(totalSpent)}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar size={16} className="text-slate-400 flex-shrink-0" />
                <span>Assigned Agent: <strong>{currentCustomer.assignedUserName || 'Unassigned'}</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* Follow Up Agenda Log */}
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-500 text-xs leading-relaxed text-left">
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-success mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">Lead Converted</p>
                  <p>Client database profile provisioned automatically on deal closure.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="font-bold text-slate-800">Operational Onboarding</p>
                  <p>Arrange initial project setup demonstration with the assigned agent.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Interaction Logs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="flex flex-col min-h-[550px]">
            
            {/* Headers tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-4 h-14 flex-shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveRightTab('notes')}
                  className={cn(
                    'px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2',
                    activeRightTab === 'notes'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  )}
                >
                  <MessageSquare size={16} /> Notes Log ({notes.length})
                </button>
                <button
                  onClick={() => setActiveRightTab('purchases')}
                  className={cn(
                    'px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2',
                    activeRightTab === 'purchases'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  )}
                >
                  <ShoppingBag size={16} /> Purchases ({purchases.length})
                </button>
              </div>

              {activeRightTab === 'purchases' && (
                <Button size="sm" onClick={() => setIsPurchaseModalOpen(true)} className="flex items-center gap-1 cursor-pointer">
                  <Plus size={14} /> Log Purchase
                </Button>
              )}
            </div>

            <CardContent className="flex-1 overflow-y-auto p-6">
              
              {/* Notes Timeline */}
              {activeRightTab === 'notes' && (
                <div className="space-y-6">
                  <form onSubmit={handleAddNote} className="flex gap-3">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add follow-up details or notes..."
                      className="flex-1 text-sm py-2.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
                    />
                    <Button type="submit" isLoading={addingNote} className="cursor-pointer">
                      Save Note
                    </Button>
                  </form>

                  <div className="space-y-4">
                    {notes.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-sm">
                        No customer notes logged yet.
                      </div>
                    ) : (
                      notes.map((note) => {
                        const isSystem = note.authorName === 'System Log'
                        return (
                          <div
                            key={note.id}
                            className={cn(
                              'p-4 border rounded-xl text-left space-y-1',
                              isSystem
                                ? 'bg-slate-50 border-slate-200 text-slate-500'
                                : 'bg-white border-slate-200 shadow-sm'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className={cn('text-xs font-bold', isSystem ? 'text-primary' : 'text-slate-700')}>
                                {note.authorName}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <History size={10} /> {formatRelativeTime(note.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-650 leading-relaxed pt-1">
                              {note.text}
                            </p>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Purchase History */}
              {activeRightTab === 'purchases' && (
                <div className="space-y-4">
                  {purchases.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      No purchase history recorded. Click "Log Purchase" above to add.
                    </div>
                  ) : (
                    purchases.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-4 border border-slate-200 bg-white rounded-xl text-left hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-success/15 text-success rounded-lg flex items-center justify-center">
                            <ShoppingBag size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 leading-snug">{purchase.product}</h4>
                            <span className="text-xs text-slate-400">{formatDate(purchase.date)}</span>
                          </div>
                        </div>
                        <span className="text-base font-extrabold text-slate-800">{formatUSD(purchase.amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Log Purchase Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Log Customer Purchase"
        size="md"
      >
        <form onSubmit={handleAddPurchase} className="space-y-4 text-left">
          <Input
            type="text"
            label="Product Name"
            placeholder="Enterprise Suite License (1-Year)"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />

          <Input
            type="number"
            label="Transaction Value ($)"
            placeholder="48000"
            required
            leftIcon={<DollarSign size={16} />}
            value={purchaseAmount}
            onChange={(e) => setPurchaseAmount(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsPurchaseModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={loggingPurchase}
              className="cursor-pointer"
            >
              Log Purchase
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
export default CustomerDetails

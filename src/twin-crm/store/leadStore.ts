import { create } from 'zustand'
import type { Lead, Note, Purchase, LeadStatus, Customer } from '../types'
import { api } from '../services/api'

interface LeadState {
  leads: Lead[]
  currentLead: Lead | null
  customers: Customer[]
  currentCustomer: Customer | null
  notes: Note[]
  purchases: Purchase[]
  isLoading: boolean
  error: string | null
  
  fetchLeads: (params?: { companyId?: string; assignedUserId?: string; status?: LeadStatus }) => Promise<void>
  fetchLeadById: (id: string) => Promise<Lead>
  createLead: (leadData: Omit<Lead, 'id' | 'createdDate' | 'updatedDate'>) => Promise<Lead>
  updateLead: (id: string, leadData: Partial<Lead>) => Promise<Lead>
  assignLead: (leadId: string, userId: string | null) => Promise<Lead>
  updateLeadStatus: (leadId: string, status: LeadStatus) => Promise<Lead>
  
  fetchCustomers: (params?: { companyId?: string; assignedUserId?: string }) => Promise<void>
  fetchCustomerById: (id: string) => Promise<Customer>
  createCustomer: (customerData: Omit<Customer, 'id' | 'createdDate'>) => Promise<Customer>
  updateCustomer: (id: string, customerData: Partial<Customer>) => Promise<Customer>
  
  fetchNotes: (leadId: string) => Promise<void>
  addNote: (leadId: string, authorName: string, text: string) => Promise<Note>
  
  fetchPurchases: (leadId: string) => Promise<void>
  addPurchase: (leadId: string, product: string, amount: number) => Promise<Purchase>
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  currentLead: null,
  customers: [],
  currentCustomer: null,
  notes: [],
  purchases: [],
  isLoading: false,
  error: null,

  fetchLeads: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/leads', { params })
      set({ leads: response.data, isLoading: false })
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to fetch leads', isLoading: false })
    }
  },

  fetchLeadById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get(`/leads/${id}`)
      set({ currentLead: response.data, isLoading: false })
      return response.data
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to fetch lead details', isLoading: false })
      throw err
    }
  },

  createLead: async (leadData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/leads', leadData)
      const newLead = response.data
      set((state) => ({
        leads: [newLead, ...state.leads],
        isLoading: false,
      }))
      return newLead
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to create lead', isLoading: false })
      throw err
    }
  },

  updateLead: async (id, leadData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.put(`/leads/${id}`, leadData)
      const updatedLead = response.data
      set((state) => ({
        leads: state.leads.map((l) => (l.id === id ? updatedLead : l)),
        currentLead: state.currentLead?.id === id ? updatedLead : state.currentLead,
        isLoading: false,
      }))
      return updatedLead
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to update lead', isLoading: false })
      throw err
    }
  },

  assignLead: async (leadId, userId) => {
    return get().updateLead(leadId, {
      assignedUserId: userId || undefined,
    })
  },

  updateLeadStatus: async (leadId, status) => {
    return get().updateLead(leadId, { status })
  },

  // CUSTOMER ACTIONS
  fetchCustomers: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/customers', { params })
      set({ customers: response.data, isLoading: false })
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to fetch customers', isLoading: false })
    }
  },

  fetchCustomerById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get(`/customers/${id}`)
      set({ currentCustomer: response.data, isLoading: false })
      return response.data
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to fetch customer details', isLoading: false })
      throw err
    }
  },

  createCustomer: async (customerData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/customers', customerData)
      const newCustomer = response.data
      set((state) => ({
        customers: [newCustomer, ...state.customers],
        isLoading: false,
      }))
      return newCustomer
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to create customer', isLoading: false })
      throw err
    }
  },

  updateCustomer: async (id, customerData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.put(`/customers/${id}`, customerData)
      const updatedCustomer = response.data
      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? updatedCustomer : c)),
        currentCustomer: state.currentCustomer?.id === id ? updatedCustomer : state.currentCustomer,
        isLoading: false,
      }))
      return updatedCustomer
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to update customer', isLoading: false })
      throw err
    }
  },

  fetchNotes: async (leadId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/notes', { params: { leadId } })
      set({ notes: response.data, isLoading: false })
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to fetch notes', isLoading: false })
    }
  },

  addNote: async (leadId, authorName, text) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/notes', { leadId, authorName, text })
      const newNote = response.data
      set((state) => ({
        notes: [newNote, ...state.notes],
        isLoading: false,
      }))
      return newNote
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to add note', isLoading: false })
      throw err
    }
  },

  fetchPurchases: async (leadId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/purchases', { params: { leadId } })
      set({ purchases: response.data, isLoading: false })
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to fetch purchases', isLoading: false })
    }
  },

  addPurchase: async (leadId, product, amount) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/purchases', { leadId, product, amount })
      const newPurchase = response.data
      
      set((state) => ({
        purchases: [newPurchase, ...state.purchases],
        isLoading: false,
      }))

      // Refresh customers list or leads list to sync
      const customersResponse = await api.get('/customers')
      set({ customers: customersResponse.data })

      return newPurchase
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to record purchase', isLoading: false })
      throw err
    }
  },
}))

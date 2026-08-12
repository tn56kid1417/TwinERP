import { create } from 'zustand'
import { api } from '../services/api'
import type { Purchase } from '../types'

interface PurchaseState {
  purchases: Purchase[]
  isLoading: boolean
  error: string | null
  
  fetchPurchases: (params?: { leadId?: string }) => Promise<void>
  addPurchase: (purchaseData: Omit<Purchase, 'id' | 'date'>) => Promise<Purchase>
  updatePurchase: (id: string, purchaseData: Partial<Purchase>) => Promise<Purchase>
}

export const usePurchaseStore = create<PurchaseState>((set) => ({
  purchases: [],
  isLoading: false,
  error: null,

  fetchPurchases: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/purchases', { params })
      set({ purchases: response.data, isLoading: false })
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to fetch purchases', isLoading: false })
    }
  },

  addPurchase: async (purchaseData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/purchases', purchaseData)
      const newPurchase = response.data
      set((state) => ({
        purchases: [newPurchase, ...state.purchases],
        isLoading: false,
      }))
      return newPurchase
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to add purchase', isLoading: false })
      throw err
    }
  },

  updatePurchase: async (id, purchaseData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.put(`/purchases/${id}`, purchaseData)
      const updatedPurchase = response.data
      set((state) => ({
        purchases: state.purchases.map(p => p.id === id ? updatedPurchase : p),
        isLoading: false,
      }))
      return updatedPurchase
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to update purchase', isLoading: false })
      throw err
    }
  },
}))

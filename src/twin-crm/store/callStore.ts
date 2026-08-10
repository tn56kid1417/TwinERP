import { create } from 'zustand'
import { api } from '../services/api'
import type { CallLog, CallStatus } from '../types'

interface CallState {
  calls: CallLog[]
  isLoading: boolean
  error: string | null
  
  fetchCalls: (params?: { userId?: string; leadId?: string }) => Promise<void>
  addCall: (callData: Omit<CallLog, 'id' | 'startTime'>) => Promise<CallLog>
}

export const useCallStore = create<CallState>((set) => ({
  calls: [],
  isLoading: false,
  error: null,

  fetchCalls: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/calls', { params })
      set({ calls: response.data, isLoading: false })
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to fetch calls', isLoading: false })
    }
  },

  addCall: async (callData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/calls', callData)
      const newCall = response.data
      set((state) => ({
        calls: [newCall, ...state.calls],
        isLoading: false,
      }))
      return newCall
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to add call', isLoading: false })
      throw err
    }
  },
}))

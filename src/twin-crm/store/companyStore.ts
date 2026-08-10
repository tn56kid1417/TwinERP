import { create } from 'zustand'
import type { Company } from '../types'
import { api } from '../services/api'

interface CompanyState {
  companies: Company[]
  currentCompany: Company | null
  isLoading: boolean
  error: string | null
  fetchCompanies: () => Promise<void>
  fetchCompanyById: (id: string) => Promise<Company>
  createCompany: (name: string, domain: string) => Promise<Company>
  updateCompany: (id: string, companyData: Partial<Company>) => Promise<Company>
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  currentCompany: null,
  isLoading: false,
  error: null,

  fetchCompanies: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/companies')
      set({ companies: response.data, isLoading: false })
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to fetch companies', isLoading: false })
    }
  },

  fetchCompanyById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get(`/companies/${id}`)
      set({ currentCompany: response.data, isLoading: false })
      return response.data
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to fetch company details', isLoading: false })
      throw err
    }
  },

  createCompany: async (name, domain) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/companies', { name, domain })
      const newCompany = response.data
      set((state) => ({
        companies: [...state.companies, newCompany],
        isLoading: false,
      }))
      return newCompany
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to create company', isLoading: false })
      throw err
    }
  },

  updateCompany: async (id, companyData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.put(`/companies/${id}`, companyData)
      const updated = response.data
      set((state) => ({
        companies: state.companies.map((c) => (c.id === id ? updated : c)),
        currentCompany: state.currentCompany?.id === id ? updated : state.currentCompany,
        isLoading: false,
      }))
      return updated
    } catch (err: any) {
      set({ error: err.data?.message || 'Failed to update company', isLoading: false })
      throw err
    }
  },
}))

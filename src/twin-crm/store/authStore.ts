import type { User } from '../types'
import { useAuth } from '../../context/AuthContext'
import { useMemo } from 'react'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (workspaceName: string, email: string, password: string) => Promise<User>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = (): AuthState => {
  const { user: mainUser, logout } = useAuth()
  
  const mappedUser = useMemo<User | null>(() => {
    if (!mainUser) return null;
    return {
      id: (mainUser.department === "Marketing" || mainUser.role === "CEO" || mainUser.role === "Admin" || mainUser.department === "HR") ? mainUser.id : "user-sales-john",
      name: `${mainUser.firstName} ${mainUser.lastName}`,
      email: mainUser.email,
      role: (mainUser.department === "Marketing" || mainUser.role === "CEO" || mainUser.role === "Admin" || mainUser.department === "HR") ? "COMPANY_ADMIN" : "SALES_USER",
      designation: mainUser.role,
      workspaceName: "acme",
      companyId: "company-1"
    };
  }, [mainUser]);

  return {
    user: mappedUser,
    token: localStorage.getItem('token'),
    isAuthenticated: !!mappedUser,
    isLoading: false,
    error: null,
    login: async (workspaceName, email, password) => {
      return {} as User;
    },
    logout: () => {
      if (logout) logout()
    },
    clearError: () => {},
  }
}

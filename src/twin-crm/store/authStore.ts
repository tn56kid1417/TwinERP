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
    let mappedRole: any = 'SALES_USER';
    if (mainUser.department === "Marketing") mappedRole = 'MARKETING';
    else if (mainUser.role === "Manager" || mainUser.role === "Team Leader" || mainUser.role === "Sales Team Leader") mappedRole = 'SALES_LEADER';
    else if (mainUser.role === "CEO" || mainUser.role === "Admin" || mainUser.department === "HR") mappedRole = 'COMPANY_ADMIN';

    return {
      id: mainUser.id,
      name: `${mainUser.firstName} ${mainUser.lastName}`,
      email: mainUser.email,
      role: mappedRole,
      designation: mainUser.designation || mainUser.role,
      workspaceName: "acme",
      companyId: "company-1",
      teamId: mainUser.teamId
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

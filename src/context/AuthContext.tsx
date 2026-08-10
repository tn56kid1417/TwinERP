import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee } from '../types';

interface AuthContextType {
  user: Employee | null;
  token: string | null;
  isHR: boolean;
  isAdmin: boolean;
  canViewAll: boolean;
  canEdit: boolean;
  userRoleCategory: string;
  canApprove: (submittedByRole?: string) => boolean;
  login: (user: Employee, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  const login = (userData: Employee, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const isHR = user?.role === 'Manager' || user?.department === 'HR' || user?.role === 'CEO' || user?.role === 'CTO';
  const isAdmin = user?.role === 'Admin';
  const canViewAll = isHR || isAdmin;
  const canEdit = canViewAll && !isAdmin;
  
  let userRoleCategory = 'Employee';
  if (user?.role === 'CEO' || user?.role === 'CTO' || user?.role === 'Admin') {
    userRoleCategory = 'Executive';
  } else if (user?.department === 'HR' || user?.role === 'Manager') {
    userRoleCategory = 'HR';
  }
  
  const canApprove = (submittedByRole?: string) => {
    if (isAdmin) return false;
    if (userRoleCategory === 'Executive') return true; // Executives can approve everything
    if (userRoleCategory === 'HR' && submittedByRole !== 'HR' && submittedByRole !== 'Executive') return true; // HR can approve employee requests
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, token, isHR, isAdmin, canViewAll, canEdit, userRoleCategory, canApprove, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

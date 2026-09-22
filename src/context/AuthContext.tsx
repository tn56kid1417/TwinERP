import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Employee } from '../types';
import type { ModuleKey, PrivilegesMap, UserPrivileges } from '../types';

interface AuthContextType {
  user: Employee | null;
  token: string | null;
  isHR: boolean;
  isAdmin: boolean;
  canViewAll: boolean;
  canEdit: boolean;
  userRoleCategory: string;
  canApprove: (submittedByRole?: string) => boolean;
  /** Returns true if the current user has access to a given module key */
  hasModuleAccess: (moduleKey: ModuleKey) => boolean;
  /** Admin-only: full privileges map for all users */
  privilegesMap: PrivilegesMap;
  /** Admin-only: save updated privileges for a specific user */
  saveUserPrivileges: (privileges: UserPrivileges) => void;
  /** Admin-only: clear all admin-set privileges for a user (revert to role-based defaults) */
  clearUserPrivileges: (userId: string) => void;
  login: (user: Employee, token: string) => void;
  logout: () => void;
}

const PRIVILEGES_KEY = 'erp_privileges';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [privilegesMap, setPrivilegesMap] = useState<PrivilegesMap>({});

  // Load session + privileges from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as Employee;
        if (storedToken) {
          setUser(parsedUser);
          setToken(storedToken);
        } else {
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Failed to parse stored user session. Clearing invalid local session.', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    // Load privileges map
    try {
      const storedPrivileges = localStorage.getItem(PRIVILEGES_KEY);
      if (storedPrivileges) {
        setPrivilegesMap(JSON.parse(storedPrivileges) as PrivilegesMap);
      }
    } catch {
      console.warn('Failed to parse stored privileges. Resetting.');
      localStorage.removeItem(PRIVILEGES_KEY);
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

  /** Admin saves updated privileges for one user */
  const saveUserPrivileges = useCallback((privileges: UserPrivileges) => {
    setPrivilegesMap(prev => {
      const next = { ...prev, [privileges.userId]: privileges };
      localStorage.setItem(PRIVILEGES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /** Admin clears custom privileges for a user — reverts to role defaults */
  const clearUserPrivileges = useCallback((userId: string) => {
    setPrivilegesMap(prev => {
      const next = { ...prev };
      delete next[userId];
      localStorage.setItem(PRIVILEGES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isHR = user?.role === 'Manager' || user?.department === 'HR' || user?.role === 'CEO' || user?.role === 'CTO';
  const isAdmin = user?.role === 'Admin';
  const canViewAll = isHR || isAdmin;
  // Admin now has full canEdit (removed the previous !isAdmin restriction)
  const canEdit = canViewAll;

  let userRoleCategory = 'Employee';
  if (user?.role === 'CEO' || user?.role === 'CTO' || user?.role === 'Admin') {
    userRoleCategory = 'Executive';
  } else if (user?.department === 'HR' || user?.role === 'Manager') {
    userRoleCategory = 'HR';
  }

  const canApprove = (submittedByRole?: string) => {
    if (isAdmin) return true; // Admin can approve everything
    if (userRoleCategory === 'Executive') return true;
    if (userRoleCategory === 'HR' && submittedByRole !== 'HR' && submittedByRole !== 'Executive') return true;
    return false;
  };

  /**
   * Check if the current user has access to a specific module.
   * - Admin always has access to everything.
   * - If the Admin has set custom privileges for this user → use those.
   * - Otherwise → fall back to role-based defaults (canViewAll for hrOnly items).
   */
  const hasModuleAccess = useCallback((moduleKey: ModuleKey): boolean => {
    if (!user) return false;
    if (isAdmin) return true; // Admin sees everything

    const userPrivileges = privilegesMap[user.id];
    if (userPrivileges) {
      // Admin has set explicit privileges — use them
      return userPrivileges.allowedModules.includes(moduleKey);
    }

    // No admin override — fall back to role-based defaults
    // Modules that require elevated access (hrOnly in sidebar)
    const hrOnlyModules: ModuleKey[] = [
      'user-management', 'employees', 'attendance', 'holidays',
      'awards', 'letters', 'terminations',
    ];

    if (hrOnlyModules.includes(moduleKey)) {
      return canViewAll;
    }

    // All other modules are accessible to everyone
    return true;
  }, [user, isAdmin, privilegesMap, canViewAll]);

  return (
    <AuthContext.Provider value={{
      user, token, isHR, isAdmin, canViewAll, canEdit,
      userRoleCategory, canApprove, hasModuleAccess,
      privilegesMap, saveUserPrivileges, clearUserPrivileges,
      login, logout,
    }}>
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

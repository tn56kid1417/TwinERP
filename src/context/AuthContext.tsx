import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Employee } from '../types';
import type { ModuleKey, PrivilegesMap, UserPrivileges } from '../types';
import { getPrivilegesMap, getUserPrivileges, updateUserPrivileges, deleteUserPrivileges } from '../api';

interface AuthContextType {
  user: Employee | null;
  token: string | null;
  isHR: boolean;
  isAdmin: boolean;
  canViewAll: boolean;
  canEdit: boolean;
  userRoleCategory: string;
  canApprove: (submittedByRole?: string) => boolean;
  /** Whether this user has permission to assign tasks (COO/CTO/CEO/Admin default, or privilege override) */
  canAssignTasks: boolean;
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

  // Fetch privileges from backend server on mount / login
  const fetchPrivilegesFromServer = useCallback(async (currentUser: Employee | null) => {
    try {
      if (currentUser && ['Admin', 'HR', 'CEO', 'CTO'].includes(currentUser.role)) {
        const fullMap = await getPrivilegesMap();
        if (fullMap && typeof fullMap === 'object') {
          setPrivilegesMap(fullMap);
          localStorage.setItem(PRIVILEGES_KEY, JSON.stringify(fullMap));
        }
      } else if (currentUser?.id) {
        const singlePriv = await getUserPrivileges(currentUser.id);
        if (singlePriv && singlePriv.userId) {
          setPrivilegesMap(prev => {
            const next = { ...prev, [currentUser.id]: singlePriv as UserPrivileges };
            localStorage.setItem(PRIVILEGES_KEY, JSON.stringify(next));
            return next;
          });
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Could not sync privileges from server, using local cache:', err);
    }
  }, []);

  // Load session + privileges from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    let parsedUser: Employee | null = null;
    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser) as Employee;
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

    // Load local privileges cache initially
    try {
      const storedPrivileges = localStorage.getItem(PRIVILEGES_KEY);
      if (storedPrivileges) {
        setPrivilegesMap(JSON.parse(storedPrivileges) as PrivilegesMap);
      }
    } catch {
      localStorage.removeItem(PRIVILEGES_KEY);
    }

    // Fetch fresh source of truth from backend
    if (storedToken && parsedUser) {
      fetchPrivilegesFromServer(parsedUser);
    }
  }, [fetchPrivilegesFromServer]);

  const login = (userData: Employee, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    fetchPrivilegesFromServer(userData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  /** Admin saves updated privileges for one user */
  const saveUserPrivileges = useCallback(async (privileges: UserPrivileges) => {
    setPrivilegesMap(prev => {
      const next = { ...prev, [privileges.userId]: privileges };
      localStorage.setItem(PRIVILEGES_KEY, JSON.stringify(next));
      return next;
    });

    try {
      await updateUserPrivileges(privileges.userId, privileges);
    } catch (err) {
      console.error('Failed to persist user privileges to server:', err);
    }
  }, []);

  /** Admin clears custom privileges for a user — reverts to role defaults */
  const clearUserPrivileges = useCallback(async (userId: string) => {
    setPrivilegesMap(prev => {
      const next = { ...prev };
      delete next[userId];
      localStorage.setItem(PRIVILEGES_KEY, JSON.stringify(next));
      return next;
    });

    try {
      await deleteUserPrivileges(userId);
    } catch (err) {
      console.error('Failed to clear user privileges on server:', err);
    }
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

  // Task assignment permissions: COO, CTO, CEO, Admin can assign tasks by default.
  // Can also be explicitly overridden per user in Privileges.
  const userRoleNormalized = (user?.role || '').trim().toUpperCase();
  const isExecutiveAssigner = ['CEO', 'CTO', 'COO', 'ADMIN'].includes(userRoleNormalized);
  const userPrivilege = user ? privilegesMap[user.id] : undefined;
  const canAssignTasks = userPrivilege?.canAssignTasks !== undefined
    ? userPrivilege.canAssignTasks
    : (isAdmin || isExecutiveAssigner);

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
      userRoleCategory, canApprove, canAssignTasks, hasModuleAccess,
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

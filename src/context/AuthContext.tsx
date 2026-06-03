"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff';
  department: string;
  employee_id: string;
  annual_leave_balance: number;
}

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  switchUser: (userId: string) => void;
  logout: () => void;
  availableUsers: UserSession[];
}

const mockUsers: UserSession[] = [
  { id: 'usr-admin', email: 'admin@domus.com', name: 'Ahmad Admin', role: 'admin', department: 'HR & IT', employee_id: 'EMP-001', annual_leave_balance: 12 },
  { id: 'usr-manager', email: 'manager@domus.com', name: 'Budi Purnomo', role: 'manager', department: 'Pemasaran', employee_id: 'EMP-002', annual_leave_balance: 10 },
  { id: 'usr-finance', email: 'finance@domus.com', name: 'Chika Olivia', role: 'staff', department: 'Keuangan', employee_id: 'EMP-003', annual_leave_balance: 12 },
  { id: 'usr-sales', email: 'sales@domus.com', name: 'Rina Wijaya', role: 'staff', department: 'Pemasaran', employee_id: 'EMP-004', annual_leave_balance: 12 },
  { id: 'usr-staff', email: 'staff@domus.com', name: 'Dendi Pratama', role: 'staff', department: 'Umum', employee_id: 'EMP-005', annual_leave_balance: 12 }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read from localStorage to persist mock session
    const savedUserId = localStorage.getItem('domus_mock_user_id');
    const defaultUser = mockUsers.find(u => u.id === savedUserId) || mockUsers[3]; // Default to Rina Sales
    setUser(defaultUser);
    setIsLoading(false);
  }, []);

  const switchUser = (userId: string) => {
    const selected = mockUsers.find(u => u.id === userId);
    if (selected) {
      setUser(selected);
      localStorage.setItem('domus_mock_user_id', userId);
      // Optional: reload the page to clear states or let React handles state naturally
      window.location.reload();
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('domus_mock_user_id');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, switchUser, logout, availableUsers: mockUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

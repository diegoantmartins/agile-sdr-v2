import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface AuthUser {
  tenantId: string;
  email?: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (adminToken: string, tenantId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'admin_token';
const TENANT_KEY = 'tenant_id';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const tenantId = localStorage.getItem(TENANT_KEY);
    if (token && tenantId) {
      setUser({ tenantId });
    }
    setIsLoading(false);
  }, []);

  const login = async (adminToken: string, tenantId: string) => {
    localStorage.setItem(TOKEN_KEY, adminToken);
    localStorage.setItem(TENANT_KEY, tenantId);
    api.defaults.headers.common['x-admin-token'] = adminToken;
    api.defaults.headers.common['x-tenant-id'] = tenantId;
    setUser({ tenantId });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TENANT_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
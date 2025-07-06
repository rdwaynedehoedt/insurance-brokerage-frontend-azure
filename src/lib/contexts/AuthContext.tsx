'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService, User, LoginCredentials } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  userRole: string | null;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map roles to their dashboard paths
const roleDashboardMap = {
  'admin': '/admin/dashboard',
  'manager': '/manager-dashboard',
  'sales': '/sales-dashboard'
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    
    // Add a timeout to prevent infinite loading
    const timeoutPromise = new Promise<{timedOut: boolean}>((resolve) => {
      setTimeout(() => {
        resolve({ timedOut: true });
      }, 10000); // 10 seconds timeout
    });
    
    try {
      // Race between auth check and timeout
      const result = await Promise.race([
        authService.isAuthenticated() 
          ? authService.getCurrentUser().then(user => ({ user })).catch(() => ({ authError: true }))
          : Promise.resolve({ noAuth: true }),
        timeoutPromise
      ]);
      
      if ('timedOut' in result) {
        console.error('Authentication check timed out');
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      
      if ('noAuth' in result || 'authError' in result) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      
      if ('user' in result) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials, rememberMe = false) => {
    try {
      const { user } = await authService.login(credentials, rememberMe);
      setUser(user);
      setIsAuthenticated(true);
      
      // Redirect based on role
      redirectToDashboard(user.role);
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    }
  };

  const redirectToDashboard = (role: string) => {
    const dashboardPath = roleDashboardMap[role as keyof typeof roleDashboardMap];
    if (dashboardPath) {
      router.push(dashboardPath);
    } else {
      router.push('/');
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  const getToken = async (): Promise<string | null> => {
    return authService.getToken();
  };

  const userRole = user?.role || authService.getUserRole();

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated, 
        login, 
        logout,
        userRole,
        getToken
      }}
    >
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
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService, User, LoginCredentials } from '../services/auth';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  userRole: string | null;
  checkAuth: () => Promise<void>;
}

interface JWTPayload {
  userId: number;
  role: string;
  exp: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map roles to their dashboard paths
const roleDashboardMap = {
  'admin': '/admin/dashboard',
  'manager': '/manager-dashboard'
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Initial auth check - only runs once
  useEffect(() => {
    const initialAuthCheck = async () => {
      await checkAuth();
      setAuthChecked(true);
    };
    
    initialAuthCheck();
  }, []);
  
  // Handle routing based on auth state
  useEffect(() => {
    if (!authChecked) return; // Wait for initial auth check
    
    // If on a protected route but not authenticated, redirect to login
    if (!isPublicRoute(pathname) && !isAuthenticated) {
      console.log('[AuthContext] Not authenticated on protected route, redirecting to login');
      router.push('/login');
      return;
    }
    
    // If authenticated but on the wrong dashboard, redirect to correct one
    if (isAuthenticated && user && shouldRedirectToDashboard(pathname, user.role)) {
      console.log('[AuthContext] Redirecting to proper dashboard');
      redirectToDashboard(user.role);
    }
    
    // Setup periodic token validation
    const tokenCheckInterval = setInterval(() => {
      validateToken();
    }, 60000); // Check token every minute
    
    return () => clearInterval(tokenCheckInterval);
  }, [pathname, isAuthenticated, user, authChecked]);

  // Check if a route is public
  const isPublicRoute = (path: string | null): boolean => {
    if (!path) return true;
    return ['/login', '/forgot-password'].some(publicPath => path.startsWith(publicPath));
  };
  
  // Check if user should be redirected to their dashboard
  const shouldRedirectToDashboard = (path: string | null, role: string): boolean => {
    if (!path) return false;
    
    // If on login page, redirect to dashboard
    if (path === '/login' || path === '/') return true;
    
    // If admin trying to access manager dashboard or vice versa
    if (role === 'admin' && path.startsWith('/manager-dashboard')) return true;
    if (role === 'manager' && path.startsWith('/admin')) return true;
    
    return false;
  };
  
  // Validate the token is still valid
  const validateToken = () => {
    const token = Cookies.get('token');
    if (!token) {
      if (isAuthenticated) {
        console.log('[AuthContext] Token missing but state is authenticated, logging out');
        logout();
      }
      return;
    }
    
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // If token is expired or about to expire (within 5 minutes)
      if (decoded.exp < currentTime + 300) {
        console.log('[AuthContext] Token expired or about to expire, logging out');
        logout();
      }
    } catch (error) {
      console.error('[AuthContext] Token validation error:', error);
      logout();
    }
  };

  const checkAuth = async () => {
    setIsLoading(true);
    
    // Add a timeout to prevent infinite loading
    const timeoutPromise = new Promise<{timedOut: boolean}>((resolve) => {
      setTimeout(() => {
        resolve({ timedOut: true });
      }, 10000); // 10 seconds timeout
    });
    
    try {
      console.log('[AuthContext] Checking authentication status');
      
      // Check if we have a token first before making API calls
      if (!authService.isAuthenticated()) {
        console.log('[AuthContext] No valid token found, not authenticated');
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Race between auth check and timeout
      const result = await Promise.race([
        authService.getCurrentUser().then(user => ({ user })).catch(() => ({ authError: true })),
        timeoutPromise
      ]);
      
      if ('timedOut' in result) {
        console.error('[AuthContext] Authentication check timed out');
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      
      if ('authError' in result) {
        console.log('[AuthContext] Auth error occurred');
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      
      if ('user' in result) {
        console.log('[AuthContext] User authenticated:', result.user.email);
        setUser(result.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('[AuthContext] Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials, rememberMe = false) => {
    try {
      console.log('[AuthContext] Attempting login');
      const { user } = await authService.login(credentials, rememberMe);
      setUser(user);
      setIsAuthenticated(true);
      setAuthChecked(true);
      
      // Redirect based on role
      console.log(`[AuthContext] Login successful, redirecting to ${user.role} dashboard`);
      redirectToDashboard(user.role);
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
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
    console.log('[AuthContext] Logging out');
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
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
        checkAuth
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
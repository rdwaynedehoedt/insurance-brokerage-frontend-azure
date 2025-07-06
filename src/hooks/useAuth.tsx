'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// User interface
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Auth response interface
interface AuthResponse {
  success: boolean;
  user: User;
  token?: string;
  message?: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getToken: () => Promise<string | null>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Validate token with backend
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/validate-token`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          
          // Type assertion for response data
          const data = response.data as AuthResponse;
          
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            // Invalid token, remove it
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear invalid token
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        email,
        password
      });
      
      // Type assertion for response data
      const data = response.data as AuthResponse;
      
      if (data.token && data.user) {
        // Save token to localStorage
        localStorage.setItem('token', data.token);
        
        // Set user state
        setUser(data.user);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Get token function
  const getToken = async (): Promise<string | null> => {
    return localStorage.getItem('token');
  };

  // Context value
  const value = {
    user,
    isLoading,
    login,
    logout,
    getToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 
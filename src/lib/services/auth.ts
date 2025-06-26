'use client';

import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

// Use the new Choreo API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || '';
const TOKEN_COOKIE_NAME = 'token';
const USER_STORAGE_KEY = 'user_data';
const TOKEN_EXPIRY_DAYS = 7;
const CSRF_TOKEN_HEADER = 'X-CSRF-Token';
const API_TIMEOUT = 60000; 

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

interface JWTPayload {
  userId: number;
  role: string;
  exp: number;
}

// Helper function to ensure API endpoint has correct format
const formatApiUrl = (endpoint: string): string => {
  // If API_BASE already has /api
  if (API_BASE.endsWith('/api')) {
    return `${API_BASE}/${endpoint.replace(/^\//, '')}`;
  }
  
  // If endpoint already has /api
  if (endpoint.startsWith('/api/')) {
    return `${API_BASE}${endpoint}`;
  }
  
  // If neither has /api
  if (!endpoint.startsWith('/')) {
    return `${API_BASE}/api/${endpoint}`;
  }
  
  return `${API_BASE}/api${endpoint}`;
};

class AuthService {
  private csrfToken: string | null = null;

  constructor() {
    this.setupAxiosInterceptors();
    // Set the API token for Choreo deployment
    if (API_TOKEN && typeof window !== 'undefined') {
      axios.defaults.headers.common['Authorization'] = `Bearer ${API_TOKEN}`;
    }
  }

  private setupAxiosInterceptors() {
    // Add CSRF token to all requests
    axios.interceptors.request.use((config) => {
      if (this.csrfToken && config.headers) {
        config.headers[CSRF_TOKEN_HEADER] = this.csrfToken;
      }
      return config;
    });

    // Handle 401 (Unauthorized) responses globally
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // If 401 received, clear tokens and redirect to login
          this.clearAuthToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private setAuthToken(token: string, rememberMe: boolean): void {
    if (typeof window === 'undefined') return;
    
    // Set token in cookie with appropriate expiry
    const expires = rememberMe ? TOKEN_EXPIRY_DAYS : undefined;
    Cookies.set(TOKEN_COOKIE_NAME, token, { expires, secure: window.location.protocol === 'https:' });
    
    // Also store in localStorage as backup
    localStorage.setItem(TOKEN_COOKIE_NAME, token);
    
    // Set default Authorization header for all future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    console.log(`[Auth] Token set${rememberMe ? ' with remember me' : ''}`);
  }

  private clearAuthToken(): void {
    if (typeof window === 'undefined') return;
    
    // Clear from cookie
    Cookies.remove(TOKEN_COOKIE_NAME);
    
    // Clear from localStorage
    localStorage.removeItem(TOKEN_COOKIE_NAME);
    localStorage.removeItem(USER_STORAGE_KEY);
    
    // Remove Authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    console.log('[Auth] Token cleared');
  }

  logout(): void {
    this.clearAuthToken();
  }

  async login(credentials: LoginCredentials, rememberMe = false): Promise<AuthResponse> {
    try {
      // Check if credentials are in the URL, which is a security risk
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (url.searchParams.has('email') || url.searchParams.has('password')) {
          // Remove credentials from URL
          url.searchParams.delete('email');
          url.searchParams.delete('password');
          window.history.replaceState({}, document.title, url.toString());
        }
      }

      // Format the login endpoint properly
      const loginEndpoint = formatApiUrl('/auth/login');
      console.log(`[Auth] Attempting login to: ${loginEndpoint}`);

      const response = await axios.post<AuthResponse>(
        loginEndpoint, 
        credentials,
        { timeout: API_TIMEOUT }
      );
      
      const { token, user } = response.data;
      
      this.setAuthToken(token, rememberMe);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('[Auth] Login error:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const status = error.response.status;
        const message = error.response.data?.message || 'Unknown error';
        
        if (status === 401) {
          throw new Error('Invalid credentials. Please check your email and password.');
        } else if (status === 403) {
          throw new Error('Your account is not active. Please contact administrator.');
        } else {
          throw new Error(`Login failed (${status}): ${message}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error('Login failed. Please try again later.');
      }
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      // Initialize authorization header with token
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Format the me endpoint properly
      const meEndpoint = formatApiUrl('/auth/me');
      console.log(`[Auth] Fetching current user from: ${meEndpoint}`);
      
      const response = await axios.get<User>(
        meEndpoint,
        { timeout: API_TIMEOUT }
      );
      
      const user = response.data;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }
      
      return user;
    } catch (error: any) {
      console.error('[Auth] Get current user error:', error);
      
      // If 401, clear token
      if (error.response && error.response.status === 401) {
        this.clearAuthToken();
      }
      
      throw new Error('Failed to fetch user data');
    }
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (decoded.exp < currentTime) {
        console.log('[Auth] Token expired during validation');
        this.clearAuthToken();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[Auth] Token validation error:', error);
      this.clearAuthToken();
      return false;
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Try to get token from cookie first
    const tokenFromCookie = Cookies.get(TOKEN_COOKIE_NAME);
    if (tokenFromCookie) return tokenFromCookie;
    
    // Fall back to localStorage if cookie is not available
    return localStorage.getItem(TOKEN_COOKIE_NAME);
  }

  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem(USER_STORAGE_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      return decoded.role;
    } catch {
      return null;
    }
  }

  // Get dashboard path for the current user's role
  getDashboardPath(): string {
    const role = this.getUserRole();
    switch (role) {
      case 'admin': return '/admin/dashboard';
      case 'manager': return '/manager-dashboard';
      default: return '/';
    }
  }
}

export const authService = new AuthService(); 
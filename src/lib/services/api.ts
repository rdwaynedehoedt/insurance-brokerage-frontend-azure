import axios from 'axios';
import Cookies from 'js-cookie';

// Extract the API base URL with better handling for Choreo deployment
const getApiBaseUrl = () => {
  const configuredBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';
  
  // For Choreo deployment, ensure the URL has the correct format
  if (configuredBase.includes('choreoapis.dev') && !configuredBase.endsWith('/api')) {
    // Add /api if it's missing for Choreo deployments
    return `${configuredBase}/api`;
  }
  
  return configuredBase;
};

const baseURL = getApiBaseUrl();
const API_TIMEOUT = 15000; // 15 seconds timeout
const TOKEN_COOKIE_NAME = 'token';

console.log('API Client initialized with baseURL:', baseURL);

// Helper function to ensure API endpoint has correct format
export const formatApiUrl = (endpoint: string): string => {
  // If baseURL already has /api
  if (baseURL.endsWith('/api')) {
    return `${baseURL}/${endpoint.replace(/^\//, '')}`;
  }
  
  // If endpoint already has /api
  if (endpoint.startsWith('/api/')) {
    return `${baseURL}${endpoint}`;
  }
  
  // If neither has /api
  if (!endpoint.startsWith('/')) {
    return `${baseURL}/api/${endpoint}`;
  }
  
  return `${baseURL}/api${endpoint}`;
};

// Debug function to log API configuration
export const debugApiConfig = () => {
  return {
    baseURL,
    formattedTestUrl: formatApiUrl('/auth/me'),
    configuredBase: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api',
    isProduction: process.env.NODE_ENV === 'production',
    isBrowser: typeof window !== 'undefined',
    hasToken: !!Cookies.get(TOKEN_COOKIE_NAME) || (typeof window !== 'undefined' && !!localStorage.getItem(TOKEN_COOKIE_NAME))
  };
};

const apiClient = axios.create({
  baseURL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in requests
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Get token from cookies
    let token = Cookies.get(TOKEN_COOKIE_NAME);
    
    // If token not in cookies, try localStorage as fallback
    if (!token && typeof window !== 'undefined') {
      const localToken = localStorage.getItem(TOKEN_COOKIE_NAME);
      if (localToken) {
        token = localToken;
      }
    }
    
    // If token exists, add to headers
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding auth token to request');
    } else {
      console.warn('No auth token found for request');
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response: ${response.status} ${response.statusText} for ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Log detailed error information
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      console.error(`Response error: ${error.response.status} ${error.response.statusText} for ${error.config.method?.toUpperCase()} ${error.config.url}`, {
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Handle authorization errors (401, 403)
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('Authentication error:', error.response.data);
        
        // Clear token if unauthorized
        Cookies.remove(TOKEN_COOKIE_NAME);
        localStorage.removeItem(TOKEN_COOKIE_NAME);
        
        // Only redirect in browser environment and not already on login page
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          console.log('Redirecting to login due to auth error');
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 
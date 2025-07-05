import axios from 'axios';
import Cookies from 'js-cookie';

const baseURL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';
const API_TIMEOUT = 80000; // 8 seconds timeout
const TOKEN_COOKIE_NAME = 'token';

console.log('API Client initialized with baseURL:', baseURL);

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
        
        // You can dispatch an action to clear auth state here if using a state management solution
        // Or redirect to login
        if (typeof window !== 'undefined') {
          // Only redirect in browser environment
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
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

export { apiClient }; 
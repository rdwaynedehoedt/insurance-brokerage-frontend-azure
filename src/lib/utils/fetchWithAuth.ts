/**
 * Utility function for making authenticated API requests
 */

import axios from 'axios';

// Define AxiosRequestConfig type manually
interface AxiosRequestConfig {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  params?: any;
  data?: any;
  timeout?: number;
  withCredentials?: boolean;
}

/**
 * Makes an authenticated API request
 * @param url The URL to fetch
 * @param options Additional fetch options
 * @returns The response data
 */
export const fetchWithAuth = async (url: string, options: AxiosRequestConfig = {}): Promise<any> => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Add authorization header
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`
    };
    
    // Make the request
    const response = await axios({
      url,
      ...options,
      headers
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error in fetchWithAuth:', error);
    
    // Handle token expiration or authentication errors
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Redirect to login page if token is invalid or expired
      window.location.href = '/login';
    }
    
    throw error;
  }
}; 
/**
 * Application configuration
 */

// API URLs
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const SALES_API_URL = process.env.NEXT_PUBLIC_SALES_API_URL || 'http://localhost:5001';

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_URL}/api/auth/login`,
  VALIDATE_TOKEN: `${API_URL}/api/auth/validate-token`,
  LOGOUT: `${API_URL}/api/auth/logout`,
};

// Sales microservice endpoints
export const SALES_ENDPOINTS = {
  CREATE_CLIENT: `${SALES_API_URL}/api/sales/clients`,
  GET_RECENT_CLIENTS: `${SALES_API_URL}/api/sales/clients/recent`,
  GET_ALL_CLIENTS: `${SALES_API_URL}/api/sales/clients`,
};

// Default pagination
export const DEFAULT_PAGE_SIZE = 10; 
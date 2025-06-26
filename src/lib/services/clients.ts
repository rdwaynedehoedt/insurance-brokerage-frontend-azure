import axios from 'axios';
import { authService } from './auth';

// Use the new Choreo API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || '';
const API_TIMEOUT = 8000; // 8 seconds timeout

export interface Client {
  id?: string;
  introducer_code?: string;
  customer_type: string;
  product: string;
  policy_?: string;
  insurance_provider: string;
  branch?: string;
  client_name: string;
  street1?: string;
  street2?: string;
  city?: string;
  district?: string;
  province?: string;
  telephone?: string;
  mobile_no: string;
  contact_person?: string;
  email?: string;
  social_media?: string;
  nic_proof?: string;
  dob_proof?: string;
  business_registration?: string;
  svat_proof?: string;
  vat_proof?: string;
  coverage_proof?: string;
  sum_insured_proof?: string;
  policy_fee_invoice?: string;
  vat_fee_debit_note?: string;
  payment_receipt_proof?: string;
  policy_type?: string;
  policy_no?: string;
  policy_period_from?: string;
  policy_period_to?: string;
  coverage?: string;
  sum_insured?: number;
  basic_premium?: number;
  srcc_premium?: number;
  tc_premium?: number;
  net_premium?: number;
  stamp_duty?: number;
  admin_fees?: number;
  road_safety_fee?: number;
  policy_fee?: number;
  vat_fee?: number;
  total_invoice?: number;
  debit_note?: string;
  payment_receipt?: string;
  commission_type?: string;
  commission_basic?: number;
  commission_srcc?: number;
  commission_tc?: number;
  sales_rep_id?: number;
  salesRep?: string;
  policies?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Added interface for paginated client response
export interface PaginatedClientsResponse {
  clients: Client[];
  totalCount: number;
}

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    // First try to use user token
    const token = authService.getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    } 
    // If no user token, use API token if available (for Choreo)
    else if (API_TOKEN) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${API_TOKEN}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const clientService = {
  async getAllClients(limit?: number, offset?: number, search?: string): Promise<PaginatedClientsResponse> {
    try {
      let url = '/clients';
      const params: Record<string, string> = {};
      
      if (limit !== undefined) {
        params.limit = limit.toString();
      }
      
      if (offset !== undefined) {
        params.offset = offset.toString();
      }
      
      if (search && search.trim() !== '') {
        params.search = search.trim();
      }
      
      const response = await apiClient.get<ApiResponse<Client[]>>(url, { params });
      
      // For backward compatibility, if the backend doesn't provide total count yet
      // We'll just use the length of the returned array
      return {
        clients: response.data.data,
        totalCount: (response.data as any).totalCount || response.data.data.length
      };
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },

  async getClientById(id: string): Promise<Client> {
    try {
      const response = await apiClient.get<ApiResponse<Client>>(`/clients/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching client ${id}:`, error);
      throw error;
    }
  },

  async createClient(clientData: Client): Promise<string> {
    try {
      console.log('Creating client with data:', JSON.stringify(clientData, null, 2));
      
      // Create a clean copy of the data
      const cleanedData = { ...clientData };
      
      // Remove salesRep and sales_rep_id fields - no longer needed
      delete cleanedData.salesRep;
      delete cleanedData.sales_rep_id;
      
      // Ensure we're not sending an empty ID
      if (!cleanedData.id || cleanedData.id === '') {
        delete cleanedData.id;
      }
      
      // Convert any null values to empty strings to prevent issues
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key as keyof typeof cleanedData] === null) {
          // @ts-ignore - This is safe because we've verified the key exists
          cleanedData[key] = '';
        }
      });
      
      const response = await apiClient.post<ApiResponse<{id: string}>>('/clients', cleanedData);
      console.log('Create client response:', JSON.stringify(response.data, null, 2));
      return response.data.data.id;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },

  async updateClient(id: string, clientData: Partial<Client>): Promise<void> {
    try {
      console.log(`Updating client ${id} with data:`, JSON.stringify(clientData, null, 2));
      
      // Create a clean copy of the data
      const cleanedData = { ...clientData };
      
      // Remove salesRep and sales_rep_id fields - no longer needed
      delete cleanedData.salesRep;
      delete cleanedData.sales_rep_id;
      
      // Remove the id field from the update data (we're using it in the URL)
      delete cleanedData.id;
      
      // Remove timestamp fields - these should be handled by the server
      delete (cleanedData as any).created_at;
      delete (cleanedData as any).updated_at;
      
      // Convert any null values to empty strings for string fields
      // and to 0 for number fields to prevent issues
      Object.keys(cleanedData).forEach(key => {
        const value = cleanedData[key as keyof typeof cleanedData];
        if (value === null) {
          // Check if it should be a number
          const numericFields = [
            'sum_insured', 'basic_premium', 'srcc_premium', 'tc_premium', 
            'net_premium', 'stamp_duty', 'admin_fees', 'road_safety_fee', 
            'policy_fee', 'vat_fee', 'total_invoice', 'commission_basic',
            'commission_srcc', 'commission_tc', 'policies'
          ];
          
          // @ts-ignore - This is safe because we've verified the key exists
          cleanedData[key] = numericFields.includes(key) ? 0 : '';
        }
        
        // Ensure numeric fields are actually numbers
        if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
          const numericFields = [
            'sum_insured', 'basic_premium', 'srcc_premium', 'tc_premium', 
            'net_premium', 'stamp_duty', 'admin_fees', 'road_safety_fee', 
            'policy_fee', 'vat_fee', 'total_invoice', 'commission_basic',
            'commission_srcc', 'commission_tc', 'policies'
          ];
          
          if (numericFields.includes(key)) {
            // @ts-ignore - This is safe because we're ensuring it's a number
            cleanedData[key] = Number(value);
          }
        }
      });
      
      // Remove any potentially problematic fields that could cause SQL issues
      const problematicKeys = ['__v', '_id', 'createdAt', 'updatedAt'];
      problematicKeys.forEach(key => {
        if (key in cleanedData) {
          delete cleanedData[key as keyof typeof cleanedData];
        }
      });
      
      // Log what we're sending to the API
      console.log(`Sending sanitized data for client ${id}:`, JSON.stringify(cleanedData, null, 2));
      
      // Set a timeout for the request and include better error handling
      try {
        const response = await apiClient.put(`/clients/${id}`, cleanedData, {
          timeout: 15000, // 15 seconds timeout
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Update response:', response.status, response.data);
        return;
      } catch (apiError: any) {
        // Handle specific API errors
        console.error(`API Error updating client ${id}:`, apiError);
        
        // Get detailed error information from the response if available
        if (apiError.response) {
          console.error('Error status:', apiError.response.status);
          console.error('Error details:', apiError.response.data);
          
          const serverMessage = apiError.response.data.message || 'Unknown server error';
          const serverErrorDetails = apiError.response.data.error;
          
          throw new Error(`Server error: ${serverMessage}${serverErrorDetails ? ` - ${serverErrorDetails}` : ''}`);
        } else if (apiError.request) {
          // Request was made but no response received (network issue)
          throw new Error('Network error: No response received from server. Please check your connection.');
        } else {
          // Error in setting up the request
          throw apiError;
        }
      }
    } catch (error: any) {
      console.error(`Error updating client ${id}:`, error);
      // Error was already handled in the inner try-catch
      throw error;
    }
  },

  async deleteClient(id: string): Promise<void> {
    try {
      await apiClient.delete(`/clients/${id}`);
    } catch (error) {
      console.error(`Error deleting client ${id}:`, error);
      throw error;
    }
  },

  async searchClients(criteria: Partial<Client>): Promise<Client[]> {
    try {
      const response = await apiClient.post<ApiResponse<Client[]>>('/clients/search', criteria);
      return response.data.data;
    } catch (error) {
      console.error('Error searching clients:', error);
      throw error;
    }
  },

  async getClientsBySalesRep(salesRepId: number): Promise<Client[]> {
    try {
      const response = await apiClient.get<ApiResponse<Client[]>>(`/clients/sales/${salesRepId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching clients for sales rep ${salesRepId}:`, error);
      throw error;
    }
  },

  async importClientsFromCsv(file: File): Promise<{ count: number, ids: string[] }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Return a promise that will resolve with the final result
      return new Promise((resolve, reject) => {
        // Create a new XMLHttpRequest for streaming support
        const xhr = new XMLHttpRequest();
        
        // Store chunks of data as they arrive
        let receivedText = '';
        
        // Set up event handlers
        xhr.onprogress = (event) => {
          if (event.target && (event.target as XMLHttpRequest).responseText) {
            // Get the new chunk of text
            const newText = (event.target as XMLHttpRequest).responseText.substring(receivedText.length);
            receivedText += newText;
            
            try {
              // Try to parse the latest chunk as JSON
              // The server might be sending multiple JSON objects in the stream
              const latestChunk = newText.trim();
              if (latestChunk) {
                const progressData = JSON.parse(latestChunk);
                
                // Dispatch a custom event with the progress data
                const progressEvent = new CustomEvent('clientImportProgress', { 
                  detail: progressData 
                });
                window.dispatchEvent(progressEvent);
              }
            } catch (e) {
              // If we can't parse the JSON, it might be an incomplete chunk
              console.warn('Could not parse progress update chunk', e);
            }
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              // Get the last JSON object from the response which should contain the final result
              const responseLines = receivedText.split('}{');
              let finalResponseText = responseLines[responseLines.length - 1];
              
              // Add back the brackets if they were split
              if (responseLines.length > 1 && !finalResponseText.startsWith('{')) {
                finalResponseText = '{' + finalResponseText;
              }
              if (responseLines.length > 1 && !finalResponseText.endsWith('}')) {
                finalResponseText = finalResponseText + '}';
              }
              
              const result = JSON.parse(finalResponseText);
              resolve({
                count: result.count || 0,
                ids: result.ids || []
              });
            } catch (e) {
              console.error('Error parsing final response', e);
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`HTTP error ${xhr.status}: ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error occurred'));
        };
        
        xhr.ontimeout = () => {
          reject(new Error('Request timed out'));
        };
        
        // Set up the request
        xhr.open('POST', `${API_BASE}/clients/import-csv`, true);
        
        // Add authentication headers
        const token = authService.getToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        // Send the request
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error importing clients from CSV:', error);
      throw error;
    }
  },
  
  // Method to get CSV template
  getCsvTemplate(): string {
    const headers = [
      // Basic Information
      "customer_type", "product", "insurance_provider", "client_name", "introducer_code", "branch",
      
      // Contact Information
      "mobile_no", "telephone", "email", "contact_person", "social_media",
      
      // Address
      "street1", "street2", "city", "district", "province",
      
      // Policy Information
      "policy_type", "policy_no", "policy_period_from", "policy_period_to", "coverage",
      
      // Financial Information
      "sum_insured", "basic_premium", "srcc_premium", "tc_premium", "net_premium", 
      "stamp_duty", "admin_fees", "road_safety_fee", "policy_fee", "vat_fee", "total_invoice",
      
      // Commission Information
      "commission_type", "commission_basic", "commission_srcc", "commission_tc"
    ].join(",");
    
    // Sample data for example
    const example = [
      // Basic Information
      "Individual", "Motor Insurance", "ABC Insurance", "John Doe", "INT123", "Colombo",
      
      // Contact Information
      "0777123456", "0112345678", "john@example.com", "John Doe", "@johndoe",
      
      // Address
      "123 Main St", "Apt 4B", "Colombo", "Colombo", "Western",
      
      // Policy Information
      "Comprehensive", "POL123456", "2023-01-01", "2024-01-01", "Full Coverage",
      
      // Financial Information
      "1000000", "25000", "5000", "2500", "32500", 
      "200", "1500", "1000", "5000", "3250", "43450",
      
      // Commission Information
      "Standard", "2500", "500", "250"
    ].join(",");
    
    return `${headers}\n${example}`;
  }
}; 
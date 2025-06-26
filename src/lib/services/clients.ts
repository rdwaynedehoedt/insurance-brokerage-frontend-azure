import axios from 'axios';
import { authService } from './auth';
import apiClient, { formatApiUrl } from './api';

// API timeout for longer operations
const API_TIMEOUT = 30000; // 30 seconds timeout

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

export interface ClientsResponse {
  success: boolean;
  data: Client[];
  totalCount: number;
}

export interface ClientResponse {
  success: boolean;
  data: Client;
}

export interface CreateClientResponse {
  success: boolean;
  data: {
    id: string;
  };
}

export interface UpdateDeleteResponse {
  success: boolean;
  message: string;
}

class ClientService {
  async getClients(limit = 100, offset = 0, search?: string): Promise<ClientsResponse> {
    try {
      let url = formatApiUrl(`/clients?limit=${limit}&offset=${offset}`);
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const response = await apiClient.get<ClientsResponse>(url);
      return response.data;
    } catch (error) {
      console.error('[Clients] Error fetching clients:', error);
      throw error;
    }
  }

  async getClient(id: string): Promise<Client> {
    try {
      const response = await apiClient.get<ClientResponse>(formatApiUrl(`/clients/${id}`));
      return response.data.data;
    } catch (error) {
      console.error(`[Clients] Error fetching client ${id}:`, error);
      throw error;
    }
  }

  async createClient(client: Client): Promise<{ id: string }> {
    try {
      const response = await apiClient.post<CreateClientResponse>(formatApiUrl('/clients'), client, {
        timeout: API_TIMEOUT
      });
      return response.data.data;
    } catch (error) {
      console.error('[Clients] Error creating client:', error);
      throw error;
    }
  }

  async updateClient(id: string, client: Client): Promise<UpdateDeleteResponse> {
    try {
      const response = await apiClient.put<UpdateDeleteResponse>(formatApiUrl(`/clients/${id}`), client, {
        timeout: API_TIMEOUT
      });
      return response.data;
    } catch (error) {
      console.error(`[Clients] Error updating client ${id}:`, error);
      throw error;
    }
  }

  async deleteClient(id: string): Promise<UpdateDeleteResponse> {
    try {
      const response = await apiClient.delete<UpdateDeleteResponse>(formatApiUrl(`/clients/${id}`));
      return response.data;
    } catch (error) {
      console.error(`[Clients] Error deleting client ${id}:`, error);
      throw error;
    }
  }

  async searchClients(criteria: Partial<Client>, limit = 100, offset = 0): Promise<ClientsResponse> {
    try {
      const response = await apiClient.post<ClientsResponse>(
        formatApiUrl(`/clients/search?limit=${limit}&offset=${offset}`),
        criteria
      );
      return response.data;
    } catch (error) {
      console.error('[Clients] Error searching clients:', error);
      throw error;
    }
  }
}

export const clientService = new ClientService(); 
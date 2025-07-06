'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, LogOut, RefreshCw, X } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import axios from 'axios';
import Link from 'next/link';
import { SALES_ENDPOINTS, DEFAULT_PAGE_SIZE } from '@/lib/config';

// Define client interface
interface Client {
  id: string;
  client_name: string;
  mobile_no: string;
  email: string | null;
  product: string;
  policy_no: string | null;
  customer_type?: string;
  insurance_provider?: string;
  branch?: string;
  street1?: string;
  street2?: string;
  city?: string;
  district?: string;
  province?: string;
  telephone?: string;
  contact_person?: string;
  social_media?: string;
  policy_type?: string;
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
  created_at?: string;
}

// Define pagination interface
interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Define API response interface
interface ApiResponse {
  success: boolean;
  data: Client[];
  pagination: Pagination;
  message?: string;
}

// Client Details Modal Component
function ClientDetailsModal({ isOpen, onClose, client }: { isOpen: boolean; onClose: () => void; client: Client | null }) {
  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">{client.client_name} - Details</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Client Name:</p>
              <p className="text-sm font-medium">{client.client_name}</p>
              
              <p className="text-sm text-gray-600">Customer Type:</p>
              <p className="text-sm font-medium">{client.customer_type || '-'}</p>
              
              <p className="text-sm text-gray-600">Product:</p>
              <p className="text-sm font-medium">{client.product}</p>
              
              <p className="text-sm text-gray-600">Insurance Provider:</p>
              <p className="text-sm font-medium">{client.insurance_provider || '-'}</p>
              
              <p className="text-sm text-gray-600">Branch:</p>
              <p className="text-sm font-medium">{client.branch || '-'}</p>
              
              <p className="text-sm text-gray-600">Policy Number:</p>
              <p className="text-sm font-medium">{client.policy_no || '-'}</p>
              
              <p className="text-sm text-gray-600">Policy Type:</p>
              <p className="text-sm font-medium">{client.policy_type || '-'}</p>
              
              <p className="text-sm text-gray-600">Created Date:</p>
              <p className="text-sm font-medium">
                {client.created_at ? new Date(client.created_at).toLocaleDateString() : '-'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Contact Information</h3>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Mobile:</p>
              <p className="text-sm font-medium">{client.mobile_no}</p>
              
              <p className="text-sm text-gray-600">Telephone:</p>
              <p className="text-sm font-medium">{client.telephone || '-'}</p>
              
              <p className="text-sm text-gray-600">Email:</p>
              <p className="text-sm font-medium">{client.email || '-'}</p>
              
              <p className="text-sm text-gray-600">Contact Person:</p>
              <p className="text-sm font-medium">{client.contact_person || '-'}</p>
              
              <p className="text-sm text-gray-600">Social Media:</p>
              <p className="text-sm font-medium">{client.social_media || '-'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Address</h3>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Street 1:</p>
              <p className="text-sm font-medium">{client.street1 || '-'}</p>
              
              <p className="text-sm text-gray-600">Street 2:</p>
              <p className="text-sm font-medium">{client.street2 || '-'}</p>
              
              <p className="text-sm text-gray-600">City:</p>
              <p className="text-sm font-medium">{client.city || '-'}</p>
              
              <p className="text-sm text-gray-600">District:</p>
              <p className="text-sm font-medium">{client.district || '-'}</p>
              
              <p className="text-sm text-gray-600">Province:</p>
              <p className="text-sm font-medium">{client.province || '-'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Policy Information</h3>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-600">Policy Period From:</p>
              <p className="text-sm font-medium">{client.policy_period_from || '-'}</p>
              
              <p className="text-sm text-gray-600">Policy Period To:</p>
              <p className="text-sm font-medium">{client.policy_period_to || '-'}</p>
              
              <p className="text-sm text-gray-600">Coverage:</p>
              <p className="text-sm font-medium">{client.coverage || '-'}</p>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Financial Information</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Sum Insured</p>
                <p className="text-sm font-medium">{client.sum_insured?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Basic Premium</p>
                <p className="text-sm font-medium">{client.basic_premium?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">SRCC Premium</p>
                <p className="text-sm font-medium">{client.srcc_premium?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">TC Premium</p>
                <p className="text-sm font-medium">{client.tc_premium?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Premium</p>
                <p className="text-sm font-medium">{client.net_premium?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stamp Duty</p>
                <p className="text-sm font-medium">{client.stamp_duty?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Admin Fees</p>
                <p className="text-sm font-medium">{client.admin_fees?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Road Safety Fee</p>
                <p className="text-sm font-medium">{client.road_safety_fee?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Policy Fee</p>
                <p className="text-sm font-medium">{client.policy_fee?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">VAT Fee</p>
                <p className="text-sm font-medium">{client.vat_fee?.toLocaleString() || '0'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600 font-bold">Total Invoice</p>
                <p className="text-sm font-bold">{client.total_invoice?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesDashboard() {
  const { logout, user, getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewTable, setViewTable] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // Client details modal state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Function to fetch clients with retry logic
  const fetchClients = useCallback(async (page: number = 1, search: string = '', retry: boolean = false) => {
    if (retry) {
      setRetrying(true);
      setRetryCount(prev => prev + 1);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Construct the URL with query parameters
      const url = new URL(SALES_ENDPOINTS.GET_ALL_CLIENTS);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('pageSize', DEFAULT_PAGE_SIZE.toString());
      if (search) {
        url.searchParams.append('search', search);
      }
      
      // Make the API request with timeout
      const response = await axios.get<ApiResponse>(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (response.data.success) {
        setClients(response.data.data);
        setPagination(response.data.pagination);
        setRetryCount(0); // Reset retry count on success
      } else {
        throw new Error(response.data.message || 'Failed to fetch clients');
      }
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      
      // Handle network errors specifically
      if (err.message === 'Network Error' || err.code === 'ECONNABORTED') {
        setError('Cannot connect to sales service. Please check if the service is running.');
      } else {
        setError(err.message || 'Failed to load clients');
      }
      
      setClients([]);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [getToken]);

  // Handle search
  const handleSearch = () => {
    fetchClients(1, searchTerm);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchClients(newPage, searchTerm);
  };

  // Handle retry
  const handleRetry = () => {
    fetchClients(pagination.page, searchTerm, true);
  };
  
  // Handle view client details
  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsModalOpen(true);
  };

  // Fetch clients on component mount with auto-retry
  useEffect(() => {
    // Initial fetch
    fetchClients();
    
    // Auto-retry logic for initial load
    // Only retry 3 times with increasing delay
    if (error && retryCount < 3) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 8000); // Exponential backoff
      const timer = setTimeout(() => {
        fetchClients(pagination.page, searchTerm, true);
      }, retryDelay);
      
      return () => clearTimeout(timer);
    }
  }, [fetchClients, error, retryCount, pagination.page, searchTerm]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Main Content */}
      <main className="w-full">
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Sales Dashboard</h2>
              <p className="text-gray-600 mt-1">Welcome back, {user?.firstName || 'Sales Agent'}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
                Sales
              </span>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-orange-700 font-semibold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0) || 'S'}
                </span>
              </div>
              <button 
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search 
                className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 cursor-pointer" 
                onClick={handleSearch}
              />
            </div>
                
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/sales-dashboard/add-client"
                className="flex items-center gap-1 px-4 py-2 bg-orange-700 text-white rounded-lg hover:bg-orange-800"
              >
                <Plus className="w-4 h-4" />
                Add Client
              </Link>
              <button
                onClick={() => setViewTable(!viewTable)}
                className="flex items-center gap-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Eye className="w-4 h-4" />
                {viewTable ? 'Hide Table' : 'View Table'}
              </button>
            </div>
          </div>

          {/* Clients Table - Only show when viewTable is true */}
          {viewTable && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                {loading || retrying ? (
                  <div className="p-8 text-center">
                    <p>{retrying ? 'Retrying connection...' : 'Loading clients...'}</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button 
                      onClick={handleRetry}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry Connection
                    </button>
                  </div>
                ) : clients.length === 0 ? (
                  <div className="p-8 text-center">
                    <p>No clients found. Add your first client to get started.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy #</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{client.client_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{client.mobile_no}</div>
                            <div className="text-sm text-gray-500">{client.email || 'No email'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.product}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.policy_no || 'No policy number'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleViewClient(client)}
                                className="text-blue-600 hover:text-blue-900 flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && !error && clients.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                </span> of{' '}
                <span className="font-medium">{pagination.total}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  disabled={!pagination.hasNextPage}
                  onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
          )}
          
          {/* Client Details Modal */}
          <ClientDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            client={selectedClient}
          />
        </div>
      </main>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Users, Home, LogOut, Search, Plus, Eye, X, Trash, FileText, Edit, RefreshCw, Download, Upload, ChevronLeft, ChevronRight, FileImage } from 'lucide-react';
import ClientModal from './components/ClientModal';
import ReportGenerator from './components/ReportGenerator';
import { clientService, Client, PaginatedClientsResponse } from '@/lib/services/clients';
import { Toaster, toast } from 'react-hot-toast';
import DocumentViewer from '@/components/DocumentViewer';
import LoadingOverlay from '@/components/LoadingOverlay';
import Image from 'next/image';

// Client Delete Confirmation Modal
function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  client, 
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  client: Client | null;
  onConfirm: () => void;
}) {
  if (!isOpen || !client) return null;
  
  const [confirmText, setConfirmText] = useState('');
  const isConfirmEnabled = confirmText === 'DELETE';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Delete Client</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <Trash className="h-5 w-5" />
            <p className="font-medium">Are you sure you want to delete this client?</p>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            This action cannot be undone. This will permanently delete the client
            <strong> {client.client_name}</strong> and all associated data.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type DELETE to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="DELETE"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!isConfirmEnabled}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                isConfirmEnabled
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-red-300 cursor-not-allowed'
              }`}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// New ClientDetailsModal component
function ClientDetailsModal({ isOpen, onClose, client }: { isOpen: boolean; onClose: () => void; client: Client | null }) {
  if (!isOpen || !client) return null;

  // Prepare document list for the DocumentViewer
  const documents = [
    { type: 'nic_proof', url: client.nic_proof || null, label: 'NIC Proof' },
    { type: 'dob_proof', url: client.dob_proof || null, label: 'Date of Birth Proof' },
    { type: 'business_registration', url: client.business_registration || null, label: 'Business Registration' },
    { type: 'svat_proof', url: client.svat_proof || null, label: 'SVAT Proof' },
    { type: 'vat_proof', url: client.vat_proof || null, label: 'VAT Proof' },
    { type: 'coverage_proof', url: client.coverage_proof || null, label: 'Coverage Proof' },
    { type: 'sum_insured_proof', url: client.sum_insured_proof || null, label: 'Sum Insured Proof' },
    { type: 'policy_fee_invoice', url: client.policy_fee_invoice || null, label: 'Policy Fee Invoice' },
    { type: 'vat_fee_debit_note', url: client.vat_fee_debit_note || null, label: 'VAT Debit Note' },
    { type: 'payment_receipt_proof', url: client.payment_receipt_proof || null, label: 'Payment Receipt' },
    // New document fields
    { type: 'policyholder_doc', url: client.policyholder_doc || null, label: 'Policyholder' },
    { type: 'vehicle_number_doc', url: client.vehicle_number_doc || null, label: 'Vehicle Number' },
    { type: 'proposal_form_doc', url: client.proposal_form_doc || null, label: 'Proposal Form' },
    { type: 'quotation_doc', url: client.quotation_doc || null, label: 'Quotation' },
    { type: 'cr_copy_doc', url: client.cr_copy_doc || null, label: 'CR Copy' },
    { type: 'schedule_doc', url: client.schedule_doc || null, label: 'Schedule' },
    { type: 'invoice_debit_note_doc', url: client.invoice_debit_note_doc || null, label: 'Invoice/Debit Note' },
    { type: 'payment_receipt_doc', url: client.payment_receipt_doc || null, label: 'Payment Receipt' },
    { type: 'nic_br_doc', url: client.nic_br_doc || null, label: 'NIC/BR' },
  ];

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
              <p className="text-sm font-medium">{client.customer_type}</p>
              
              <p className="text-sm text-gray-600">Introducer Code:</p>
              <p className="text-sm font-medium">{client.introducer_code || '-'}</p>
              
              <p className="text-sm text-gray-600">Product:</p>
              <p className="text-sm font-medium">{client.product}</p>
              
              <p className="text-sm text-gray-600">Insurance Provider:</p>
              <p className="text-sm font-medium">{client.insurance_provider}</p>
              
              <p className="text-sm text-gray-600">Branch:</p>
              <p className="text-sm font-medium">{client.branch || '-'}</p>
              
              {/* New text-only fields */}
              <p className="text-sm text-gray-600">Ceilao IB File No:</p>
              <p className="text-sm font-medium">{client.ceilao_ib_file_no || '-'}</p>
              
              <p className="text-sm text-gray-600">Main Class:</p>
              <p className="text-sm font-medium">{client.main_class || '-'}</p>
              
              <p className="text-sm text-gray-600">Insurer:</p>
              <p className="text-sm font-medium">{client.insurer || '-'}</p>
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
              <p className="text-sm text-gray-600">Policy Type:</p>
              <p className="text-sm font-medium">{client.policy_type || '-'}</p>
              
              <p className="text-sm text-gray-600">Policy Number:</p>
              <p className="text-sm font-medium">{client.policy_no || '-'}</p>
              
              <p className="text-sm text-gray-600">Policy Period:</p>
              <p className="text-sm font-medium">
                {client.policy_period_from ? new Date(client.policy_period_from).toLocaleDateString() : '-'} to {client.policy_period_to ? new Date(client.policy_period_to).toLocaleDateString() : '-'}
              </p>
              
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

          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Commission Information</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Commission Type</p>
                <p className="text-sm font-medium">{client.commission_type || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Basic Commission</p>
                <p className="text-sm font-medium">{client.commission_basic?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">SRCC Commission</p>
                <p className="text-sm font-medium">{client.commission_srcc?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">TC Commission</p>
                <p className="text-sm font-medium">{client.commission_tc?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </div>
          
          {/* New document+text fields section */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Additional Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {client.policyholder_text && (
                <>
                  <p className="text-sm text-gray-600">Policyholder:</p>
                  <p className="text-sm font-medium">{client.policyholder_text || '-'}</p>
                </>
              )}
              
              {client.vehicle_number_text && (
                <>
                  <p className="text-sm text-gray-600">Vehicle Number:</p>
                  <p className="text-sm font-medium">{client.vehicle_number_text || '-'}</p>
                </>
              )}
              
              {client.proposal_form_text && (
                <>
                  <p className="text-sm text-gray-600">Proposal Form:</p>
                  <p className="text-sm font-medium">{client.proposal_form_text || '-'}</p>
                </>
              )}
              
              {client.quotation_text && (
                <>
                  <p className="text-sm text-gray-600">Quotation:</p>
                  <p className="text-sm font-medium">{client.quotation_text || '-'}</p>
                </>
              )}
              
              {client.cr_copy_text && (
                <>
                  <p className="text-sm text-gray-600">CR Copy:</p>
                  <p className="text-sm font-medium">{client.cr_copy_text || '-'}</p>
                </>
              )}
              
              {client.schedule_text && (
                <>
                  <p className="text-sm text-gray-600">Schedule:</p>
                  <p className="text-sm font-medium">{client.schedule_text || '-'}</p>
                </>
              )}
              
              {client.invoice_debit_note_text && (
                <>
                  <p className="text-sm text-gray-600">Invoice/Debit Note:</p>
                  <p className="text-sm font-medium">{client.invoice_debit_note_text || '-'}</p>
                </>
              )}
              
              {client.payment_receipt_text && (
                <>
                  <p className="text-sm text-gray-600">Payment Receipt:</p>
                  <p className="text-sm font-medium">{client.payment_receipt_text || '-'}</p>
                </>
              )}
              
              {client.nic_br_text && (
                <>
                  <p className="text-sm text-gray-600">NIC/BR:</p>
                  <p className="text-sm font-medium">{client.nic_br_text || '-'}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Add DocumentViewer section */}
        <div className="p-6 border-t border-gray-200">
          <DocumentViewer clientId={client.id || ''} documents={documents} />
        </div>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const { user, logout, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [totalClientCount, setTotalClientCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [clientToView, setClientToView] = useState<Client | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [viewTable, setViewTable] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalImported, setTotalImported] = useState(0);
  const [totalToImport, setTotalToImport] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default 10 items per page

  // Define different menu items based on role
  const managerMenuItems = [
    // { id: 'overview', label: 'Overview', icon: Home }, // Commented out as requested
    { id: 'clients', label: 'Underwriters', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];
  
  const employeeMenuItems = [
    { id: 'clients', label: 'Clients', icon: Users },
  ];
  
  // Use the appropriate menu items based on role
  const menuItems = userRole === 'employee' ? employeeMenuItems : managerMenuItems;

  // Load clients on initial render to fix the "0 Total Clients" issue
  useEffect(() => {
    fetchClients();
    
    // Set up event listener for import progress
    const handleImportProgress = (event: Event) => {
      const progressData = (event as CustomEvent).detail;
      if (progressData) {
        setImportProgress(progressData.progress || 0);
        setImportStatus(progressData.message || '');
        setShowProgress(true);
        
        // Update counts for detailed progress information
        if (progressData.totalCount) {
          setTotalToImport(progressData.totalCount);
        }
        if (progressData.processedCount !== undefined) {
          setTotalImported(progressData.processedCount);
        }
        
        // Show progress notification as toast
        if (progressData.progress > 0 && progressData.progress < 100) {
          toast.dismiss(); // Remove previous progress toast
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex flex-col`}>
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">
                  {progressData.message || 'Importing clients...'}
                </p>
              </div>
              <div className="px-4 py-2">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-500">
                    {progressData.processedCount || 0} of {progressData.totalCount || 0} records
                  </span>
                  <span className="text-xs font-medium text-gray-700">
                    {progressData.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-in-out" 
                    style={{ width: `${progressData.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ), { duration: 2000 });
        }
      }
    };
    
    window.addEventListener('clientImportProgress', handleImportProgress);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('clientImportProgress', handleImportProgress);
    };
  }, []);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Also load clients when changing tabs if needed
  useEffect(() => {
    if (activeTab === 'clients' || activeTab === 'reports') {
      fetchClients();
    }
  }, [activeTab]);

  // Fetch clients with pagination
  useEffect(() => {
    fetchClientsPage();
  }, [currentPage, itemsPerPage, searchTerm]);
  
  const fetchClients = async () => {
    setIsLoading(true);
    try {
      // Fetch all clients
      const response = await clientService.getAllClients();
      setClients(response.clients);
      setTotalClientCount(response.totalCount);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchClientsPage = async () => {
    setIsLoading(true);
    try {
      // Calculate offset for the API
      const offset = (currentPage - 1) * itemsPerPage;
      
      // Fetch just the current page of clients from the server
      const response = await clientService.getAllClients(itemsPerPage, offset, searchTerm);
      setClients(response.clients);
      setTotalClientCount(response.totalCount);
    } catch (error) {
      console.error('Error fetching clients page:', error);
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    // The AuthContext's logout function will redirect to login page
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setIsClientModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };

  const handleClientSaved = async () => {
    await fetchClients();
  };

  const handleViewClientDetails = (client: Client) => {
    setClientToView(client);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete || !clientToDelete.id) return;
    
    try {
      setIsLoading(true);
      await clientService.deleteClient(clientToDelete.id);
      toast.success(`${clientToDelete.client_name} deleted successfully`);
      setIsDeleteModalOpen(false);
      await fetchClients(); // Ensure we reload the client list after deletion
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    } finally {
      setIsLoading(false);
    }
  };

  // For pagination, calculate total pages
  const totalPages = Math.ceil(totalClientCount / itemsPerPage);
    
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // fetchClientsPage will be triggered by useEffect
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  const handleOpenReportModal = () => {
    if (clients.length === 0) {
      fetchClients().then(() => {
        setIsReportModalOpen(true);
      });
    } else {
      setIsReportModalOpen(true);
    }
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setShowProgress(true);
    setImportProgress(0);
    setImportStatus('Preparing to import...');
    setTotalImported(0);
    setTotalToImport(0);
    
    // Show initial toast notification
    toast.loading('Starting import...', { duration: 2000 });
    
    clientService.importClientsFromCsv(file)
      .then(async (data) => {
        // Show completion toast with detailed information
        toast.success(
          <div>
            <p className="font-medium">Import completed!</p>
            <p className="text-sm">Successfully imported {data.count} clients</p>
          </div>, 
          { duration: 5000 }
        );
        
        setImportProgress(100);
        setImportStatus(`Completed! Imported ${data.count} clients.`);
        
        // Refresh the client list
        await fetchClients();
        
        // Hide progress bar after a delay
        setTimeout(() => {
          setShowProgress(false);
        }, 3000);
      })
      .catch(error => {
        console.error('Error importing CSV:', error);
        toast.error(
          <div>
            <p className="font-medium">Import failed</p>
            <p className="text-sm">{error.message || 'Failed to import CSV file'}</p>
          </div>,
          { duration: 5000 }
        );
        setImportStatus('Import failed');
        
        // Hide progress bar after a delay
        setTimeout(() => {
          setShowProgress(false);
        }, 3000);
      })
      .finally(() => {
        setIsUploading(false);
        // Reset the file input
        if (e.target) e.target.value = '';
      });
  };

  const downloadCsvTemplate = () => {
    const csvContent = clientService.getCsvTemplate();
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'client_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenPdfGenerator = () => {
    window.open('https://ceilao-pdf-gen.vercel.app/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <LoadingOverlay isLoading={isLoading} message="Processing data..." />
      
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: 'green',
            },
          },
          error: {
            style: {
              background: 'red',
            },
          },
        }}
      />
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full">
        <div className="p-6">
          <div className="flex flex-col items-center mb-4">
            <Image 
              src="/images/CIB-Logo.png" 
              alt="Ceilao Insurance Brokerage" 
              width={120} 
              height={60} 
              priority
              className="mb-2"
            />
            <h1 className="text-xl font-bold text-orange-700">Ceilao Insurance</h1>
            <p className="text-sm text-gray-600">{userRole === 'employee' ? 'Employee Portal' : 'Manager Portal'}</p>
          </div>
        </div>
        
        <nav className="mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
                  activeTab === item.id
                    ? 'bg-orange-50 text-orange-700 border-r-4 border-orange-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {activeTab === 'clients' 
                  ? userRole === 'employee' ? 'Clients' : 'Underwriters'
                  : menuItems.find(item => item.id === activeTab)?.label || ''}
              </h2>
              <p className="text-gray-600 mt-1">Welcome back, {userRole === 'employee' ? 'Employee' : 'Manager'}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
                {userRole === 'employee' ? 'Employee' : 'Manager'}
              </span>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-700" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Comment out the Overview section but keep it in the code */}
          {/* {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-orange-50 rounded-lg mr-4">
                      <Users className="w-6 h-6 text-orange-700" />
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Total Clients</span>
                      <div className="text-2xl font-bold text-gray-900">
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="h-5 w-5 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin mr-2"></div>
                            <span className="text-gray-500 text-lg">Loading...</span>
                          </div>
                        ) : (
                          clients.length
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )} */}

          {/* All Clients Tab */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder={userRole === 'employee' ? "Search clients..." : "Search Client..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
                    
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <button
                    onClick={handleAddClient}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {userRole === 'employee' ? 'Add Client' : 'Add Client'}
                  </button>

                  {/* PDF Generator Button - Available to both employees and managers */}
                  <button
                    onClick={handleOpenPdfGenerator}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center"
                    title="Generate and compress PDF files from multiple images"
                  >
                    <FileImage className="w-5 h-5 mr-2" />
                    PDF Generator
                  </button>

                  {userRole !== 'employee' && (
                    <>
                      <button
                        onClick={handleOpenReportModal}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        Generate Report
                      </button>
                      
                      <button
                        onClick={downloadCsvTemplate}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download Template
                      </button>
                      
                      <div className="relative">
                        <button
                          onClick={() => document.getElementById('csvImport')?.click()}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md flex items-center"
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          Import CSV
                        </button>
                        <input
                          type="file"
                          id="csvImport"
                          accept=".csv"
                          onChange={handleCsvImport}
                          className="hidden"
                        />
                      </div>
                    </>
                  )}
                  
                  <button
                    onClick={() => setViewTable(!viewTable)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center"
                    disabled={isUploading}
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    {viewTable ? 'Hide Table' : 'View Table'}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {showProgress && (
                <div className="mb-4 px-6">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{importStatus}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {totalImported} of {totalToImport} records ({importProgress}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                  {importProgress < 100 && importProgress > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Please wait while clients are being imported. The table will automatically refresh when complete.
                    </p>
                  )}
                  {importProgress === 100 && (
                    <p className="text-xs text-green-600 mt-1">
                      Import completed successfully! {totalImported} clients have been added to the database.
                    </p>
                  )}
                </div>
              )}

              {/* Clients Table - Only show when viewTable is true */}
              {viewTable && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <div className="p-8 text-center">
                        <p>Loading clients...</p>
                      </div>
                    ) : clients.length === 0 ? (
                      <div className="p-8 text-center">
                        <p>No clients found.</p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {userRole === 'employee' ? 'Client Name' : 'Underwriter Name'}
                            </th>
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
                                <div className="text-sm font-medium text-gray-900">{client.client_name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{client.mobile_no}</div>
                                <div className="text-sm text-gray-500">{client.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{client.product}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{client.policy_no}</div>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleViewClientDetails(client)}
                                    className="p-1 rounded-full hover:bg-gray-100"
                                    title="View Details"
                                  >
                                    <Eye className="h-5 w-5 text-blue-500" />
                                  </button>
                                  
                                  {userRole !== 'employee' && (
                                    <>
                                      <button
                                        onClick={() => handleEditClient(client)}
                                        className="p-1 rounded-full hover:bg-gray-100"
                                        title="Edit Client"
                                      >
                                        <Edit className="h-5 w-5 text-green-500" />
                                      </button>
                                      
                                      <button
                                        onClick={() => handleDeleteClient(client)}
                                        className="p-1 rounded-full hover:bg-gray-100"
                                        title="Delete Client"
                                      >
                                        <Trash className="h-5 w-5 text-red-500" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  
                  {/* Pagination Controls */}
                  {clients.length > 0 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalClientCount)}</span> to{' '}
                          <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalClientCount)}</span> of{' '}
                          <span className="font-medium">{totalClientCount}</span> {userRole === 'employee' ? 'clients' : 'underwriters'}
                        </p>
                        
                        <div className="flex items-center space-x-1">
                          <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
                            Show
                          </label>
                          <select
                            id="itemsPerPage"
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            className="text-sm border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="500">500</option>
                            <option value="1000">1000</option>
                          </select>
                          <span className="text-sm text-gray-600">per page</span>
                        </div>
                      </div>
                      
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-end">
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                currentPage === 1
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              <span className="sr-only">Previous</span>
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            
                            {/* Page Numbers */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              // Calculate which page numbers to show
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === pageNum
                                      ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            
                            <button
                              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                currentPage === totalPages
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              <span className="sr-only">Next</span>
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </nav>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Reports</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Generate customized reports based on client data. You can filter by date range and choose the type of report that best suits your needs.
                </p>
                
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-blue-100 rounded-md mr-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <h4 className="font-medium">Client List</h4>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Comprehensive list of all clients with their basic information and contact details.
                    </p>
                    <button 
                      onClick={handleOpenReportModal}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Generate Report →
                    </button>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-green-100 rounded-md mr-3">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <h4 className="font-medium">Financial Summary</h4>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Summary of financial data including premiums, commissions and total invoices.
                    </p>
                    <button 
                      onClick={handleOpenReportModal}
                      className="text-sm text-green-600 hover:text-green-800"
                    >
                      Generate Report →
                    </button>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-red-100 rounded-md mr-3">
                        <FileText className="h-5 w-5 text-red-600" />
                      </div>
                      <h4 className="font-medium">Policy Expiry</h4>
                </div>
                    <p className="text-sm text-gray-500 mb-4">
                      List of policies with their expiration dates sorted by days remaining.
                    </p>
                    <button 
                      onClick={handleOpenReportModal}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Generate Report →
                    </button>
                </div>
                </div>
              </div>
            </div>
          )}

      {/* Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        client={selectedClient}
            onClientSaved={handleClientSaved}
          />

          {/* Client Details Modal */}
          <ClientDetailsModal 
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            client={clientToView}
          />

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            client={clientToDelete}
            onConfirm={confirmDeleteClient}
          />

          {/* Report Generator Modal */}
          <ReportGenerator
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            clients={clients}
          />
        </div>
      </main>
    </div>
  );
} 
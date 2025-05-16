'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { clientService, Client as ClientType } from '@/lib/services/clients';
import { toast } from 'react-hot-toast';
import DocumentUpload from '@/components/DocumentUpload';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientType | null;
  onClientSaved?: () => void;
}

interface ClientErrors {
  client_name?: string;
  introducer_code?: string;
  customer_type?: string;
  product?: string;
  policy_?: string;
  insurance_provider?: string;
  mobile_no?: string;
  email?: string;
  policy_no?: string;
  policy_period_from?: string;
  policy_period_to?: string;
}

// Default empty client state to use for resetting
const defaultClientState: Partial<ClientType> = {
    id: '',
    introducer_code: '',
    customer_type: '',
    product: '',
    policy_: '',
    insurance_provider: '',
    branch: '',
    client_name: '',
    street1: '',
    street2: '',
    city: '',
    district: '',
    province: '',
    telephone: '',
    mobile_no: '',
    contact_person: '',
    email: '',
    social_media: '',
    nic_proof: '',
    dob_proof: '',
    business_registration: '',
    svat_proof: '',
    vat_proof: '',
  coverage_proof: '',
  sum_insured_proof: '',
  policy_fee_invoice: '',
  vat_fee_debit_note: '',
  payment_receipt_proof: '',
    policy_type: '',
    policy_no: '',
    policy_period_from: '',
    policy_period_to: '',
    coverage: '',
    sum_insured: 0,
    basic_premium: 0,
    srcc_premium: 0,
    tc_premium: 0,
    net_premium: 0,
    stamp_duty: 0,
    admin_fees: 0,
    road_safety_fee: 0,
    policy_fee: 0,
    vat_fee: 0,
    total_invoice: 0,
    debit_note: '',
    payment_receipt: '',
    commission_type: '',
    commission_basic: 0,
    commission_srcc: 0,
    commission_tc: 0,
    policies: 0
};

export default function ClientModal({ isOpen, onClose, client, onClientSaved }: ClientModalProps) {
  const [formData, setFormData] = useState<Partial<ClientType>>({ ...defaultClientState });
  const [errors, setErrors] = useState<ClientErrors>({});

  useEffect(() => {
    if (client) {
      // Convert any null values to empty strings to avoid React controlled component errors
      const safeClient = Object.fromEntries(
        Object.entries(client).map(([key, value]) => [key, value === null ? '' : value])
      );
      setFormData(safeClient);
    } else {
      // Reset to empty state when adding a new client
      setFormData({ ...defaultClientState });
    }
  }, [client, isOpen]);

  const validateForm = () => {
    const newErrors: ClientErrors = {};
    
    if (!formData.client_name?.trim()) {
      newErrors.client_name = 'Client name is required';
    }
    
    if (!formData.mobile_no?.trim()) {
      newErrors.mobile_no = 'Mobile number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.mobile_no)) {
      newErrors.mobile_no = 'Invalid mobile number';
    }
    
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.customer_type) {
      newErrors.customer_type = 'Customer type is required';
    }
    
    if (!formData.product) {
      newErrors.product = 'Product is required';
    }
    
    if (!formData.insurance_provider) {
      newErrors.insurance_provider = 'Insurance provider is required';
    }
    
    if (!formData.policy_no?.trim()) {
      newErrors.policy_no = 'Policy number is required';
    }
    
    if (!formData.policy_period_from) {
      newErrors.policy_period_from = 'Policy start date is required';
    }
    
    if (!formData.policy_period_to) {
      newErrors.policy_period_to = 'Policy end date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle document URL updates
  const handleDocumentUpload = (documentType: keyof ClientType, url: string) => {
    // Ensure URL doesn't have trailing or leading whitespace
    const trimmedUrl = url.trim();
    
    // Check if the URL is a long Azure Blob Storage URL with SAS token
    // These can cause issues when sent in requests due to their length
    if (trimmedUrl.includes('blob.core.windows.net') && trimmedUrl.length > 200) {
      console.log(`Truncating long Azure URL for ${documentType}`);
      
      // Just store the URL without the SAS token for database storage
      // The secure document endpoint will handle token generation when needed
      const urlParts = trimmedUrl.split('?');
      const baseUrl = urlParts[0];
      
      setFormData({ ...formData, [documentType]: baseUrl });
    } else {
      setFormData({ ...formData, [documentType]: trimmedUrl });
    }
  };

  // Modified to ensure form is reset when closed
  const handleClose = () => {
    setFormData({ ...defaultClientState });
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        // Create a copy of formData without any modifications
        const clientData = { ...formData };
        
        // Make sure to remove the id field for new clients
        if (!client && clientData.id === '') {
          delete clientData.id;
        }
        
        // Trim all string fields to prevent issues with whitespace
        Object.keys(clientData).forEach(key => {
          const value = clientData[key as keyof typeof clientData];
          if (typeof value === 'string') {
            // @ts-ignore - This is safe because we've verified the value is a string
            clientData[key] = value.trim();
          }
        });
        
        if (client) {
          // Update existing client
          await clientService.updateClient(client.id as string, clientData);
          toast.success('Client updated successfully', {
            duration: 4000,
            position: 'top-center',
          });
        } else {
          // Create new client
          const newClientId = await clientService.createClient(clientData as ClientType);
          toast.success(`Client added successfully`, {
            duration: 4000,
            position: 'top-center',
          });
        }
        
        // Reset form data after successful submission
        setFormData({ ...defaultClientState });
        setErrors({});
        
        // Call the callback function if provided
        if (onClientSaved) {
          onClientSaved();
        }
        
        // Close the modal
        onClose();
      } catch (error: any) {
        console.error('Error saving client:', error);
        
        // Extract error message from response if available
        let errorMessage = 'Failed to save client';
        let actionRequired = '';
        
        // Check for specific database error patterns
        if (error.message) {
          // Clean up complex SQL error messages to make them more user-friendly
          if (error.message.includes('Database error') || error.message.includes('SQL')) {
            errorMessage = 'Database error occurred while saving client';
            
            // Check for common issues
            if (error.message.includes('duplicate')) {
              errorMessage = 'This client already exists in the database';
              actionRequired = 'Please check the client ID or details.';
            } else if (error.message.includes('updated_at')) {
              errorMessage = 'Error with date fields';
              actionRequired = 'Please try again or contact support.';
            } else if (error.message.includes('violates') || error.message.includes('constraint')) {
              errorMessage = 'Invalid data provided for this client';
              actionRequired = 'Please check all required fields.';
            }
          } else if (error.message.includes('Network error')) {
            errorMessage = 'Connection issue with the server';
            actionRequired = 'Please check your internet connection and try again.';
          } else {
            // Use the original error message
            errorMessage = error.message;
          }
        }
        
        // Add action required if available
        if (actionRequired) {
          errorMessage = `${errorMessage}. ${actionRequired}`;
        }
        
        toast.error(errorMessage, {
          duration: 6000, // Show longer for errors
          position: 'top-center',
        });
      }
    } else {
      toast.error('Please fix the form errors before submitting', {
        duration: 4000,
        position: 'top-center',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white rounded-lg w-full max-w-5xl mx-4 my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <h3 className="font-medium text-lg text-gray-700 border-b pb-2">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={!!client}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Introducer Code
              </label>
              <input
                type="text"
                value={formData.introducer_code}
                onChange={(e) => setFormData({ ...formData, introducer_code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Type *
              </label>
              <select
                value={formData.customer_type}
                onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.customer_type ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">Select Customer Type</option>
                <option value="Individual">Individual</option>
                <option value="Corporate">Corporate</option>
                <option value="SME">SME</option>
              </select>
              {errors.customer_type && (
                <p className="mt-1 text-sm text-red-600">{errors.customer_type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product *
              </label>
              <select
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.product ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">Select Product</option>
                <option value="Motor">Motor</option>
                <option value="Fire">Fire</option>
                <option value="Marine">Marine</option>
                <option value="Health">Health</option>
                <option value="Life">Life</option>
              </select>
              {errors.product && (
                <p className="mt-1 text-sm text-red-600">{errors.product}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy
              </label>
              <input
                type="text"
                value={formData.policy_}
                onChange={(e) => setFormData({ ...formData, policy_: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.policy_ ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.policy_ && (
                <p className="mt-1 text-sm text-red-600">{errors.policy_}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insurance Provider *
              </label>
              <select
                value={formData.insurance_provider}
                onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.insurance_provider ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">Select Insurance Provider</option>
                <option value="AIA">AIA</option>
                <option value="Allianz">Allianz</option>
                <option value="Ceylinco">Ceylinco</option>
                <option value="Union Assurance">Union Assurance</option>
                <option value="Sri Lanka Insurance">Sri Lanka Insurance</option>
              </select>
              {errors.insurance_provider && (
                <p className="mt-1 text-sm text-red-600">{errors.insurance_provider}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.client_name ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.client_name && (
                <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>
              )}
            </div>
          </div>

          <h3 className="font-medium text-lg text-gray-700 border-b pb-2 mt-8">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street 1
              </label>
              <input
                type="text"
                value={formData.street1}
                onChange={(e) => setFormData({ ...formData, street1: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street 2
              </label>
              <input
                type="text"
                value={formData.street2}
                onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Province
              </label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <h3 className="font-medium text-lg text-gray-700 border-b pb-2 mt-8">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telephone
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number *
              </label>
              <input
                type="tel"
                value={formData.mobile_no}
                onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.mobile_no ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.mobile_no && (
                <p className="mt-1 text-sm text-red-600">{errors.mobile_no}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Social Media
              </label>
              <input
                type="text"
                value={formData.social_media}
                onChange={(e) => setFormData({ ...formData, social_media: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <h3 className="font-medium text-lg text-gray-700 border-b pb-2 mt-8">Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DocumentUpload
              clientId={formData.id || client?.id || 'new-client'}
              documentType="nic_proof"
              label="NIC Proof"
              existingUrl={formData.nic_proof as string}
              onUploadSuccess={(url) => handleDocumentUpload('nic_proof', url)}
              onDelete={() => setFormData({ ...formData, nic_proof: '' })}
              readOnly={!!client && !!formData.nic_proof}
            />

            <DocumentUpload
              clientId={formData.id || client?.id || 'new-client'}
              documentType="dob_proof"
              label="DOB Proof"
              existingUrl={formData.dob_proof as string}
              onUploadSuccess={(url) => handleDocumentUpload('dob_proof', url)}
              onDelete={() => setFormData({ ...formData, dob_proof: '' })}
              readOnly={!!client && !!formData.dob_proof}
            />

            <DocumentUpload
              clientId={formData.id || client?.id || 'new-client'}
              documentType="business_registration"
              label="Business Registration"
              existingUrl={formData.business_registration as string}
              onUploadSuccess={(url) => handleDocumentUpload('business_registration', url)}
              onDelete={() => setFormData({ ...formData, business_registration: '' })}
              readOnly={!!client && !!formData.business_registration}
            />

            <DocumentUpload
              clientId={formData.id || client?.id || 'new-client'}
              documentType="svat_proof"
              label="SVAT Proof"
              existingUrl={formData.svat_proof as string}
              onUploadSuccess={(url) => handleDocumentUpload('svat_proof', url)}
              onDelete={() => setFormData({ ...formData, svat_proof: '' })}
              readOnly={!!client && !!formData.svat_proof}
            />

            <DocumentUpload
              clientId={formData.id || client?.id || 'new-client'}
              documentType="vat_proof"
              label="VAT Proof"
              existingUrl={formData.vat_proof as string}
              onUploadSuccess={(url) => handleDocumentUpload('vat_proof', url)}
              onDelete={() => setFormData({ ...formData, vat_proof: '' })}
              readOnly={!!client && !!formData.vat_proof}
            />
            
            <DocumentUpload
              clientId={formData.id || client?.id || 'new-client'}
              documentType="coverage_proof"
              label="Coverage Proof"
              existingUrl={formData.coverage_proof as string}
              onUploadSuccess={(url) => handleDocumentUpload('coverage_proof', url)}
              onDelete={() => setFormData({ ...formData, coverage_proof: '' })}
              readOnly={!!client && !!formData.coverage_proof}
            />
            
            <DocumentUpload
              clientId={formData.id || client?.id || 'new-client'}
              documentType="sum_insured_proof"
              label="Sum Insured Proof"
              existingUrl={formData.sum_insured_proof as string}
              onUploadSuccess={(url) => handleDocumentUpload('sum_insured_proof', url)}
              onDelete={() => setFormData({ ...formData, sum_insured_proof: '' })}
              readOnly={!!client && !!formData.sum_insured_proof}
            />
            
            <DocumentUpload
              clientId={formData.id || client?.id || 'new-client'}
              documentType="policy_fee_invoice"
              label="Policy Fee Invoice"
              existingUrl={formData.policy_fee_invoice as string}
              onUploadSuccess={(url) => handleDocumentUpload('policy_fee_invoice', url)}
              onDelete={() => setFormData({ ...formData, policy_fee_invoice: '' })}
              readOnly={!!client && !!formData.policy_fee_invoice}
            />
            
            <DocumentUpload
              clientId={formData.id || client?.id || 'new-client'}
              documentType="vat_fee_debit_note"
              label="VAT Debit Note"
              existingUrl={formData.vat_fee_debit_note as string}
              onUploadSuccess={(url) => handleDocumentUpload('vat_fee_debit_note', url)}
              onDelete={() => setFormData({ ...formData, vat_fee_debit_note: '' })}
              readOnly={!!client && !!formData.vat_fee_debit_note}
            />
            
            <DocumentUpload
              clientId={formData.id || client?.id || 'new-client'}
              documentType="payment_receipt_proof"
              label="Payment Receipt"
              existingUrl={formData.payment_receipt_proof as string}
              onUploadSuccess={(url) => handleDocumentUpload('payment_receipt_proof', url)}
              onDelete={() => setFormData({ ...formData, payment_receipt_proof: '' })}
              readOnly={!!client && !!formData.payment_receipt_proof}
            />
          </div>

          <h3 className="font-medium text-lg text-gray-700 border-b pb-2 mt-8">Policy Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Type
              </label>
              <input
                type="text"
                value={formData.policy_type}
                onChange={(e) => setFormData({ ...formData, policy_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Number *
              </label>
              <input
                type="text"
                value={formData.policy_no}
                onChange={(e) => setFormData({ ...formData, policy_no: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.policy_no ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.policy_no && (
                <p className="mt-1 text-sm text-red-600">{errors.policy_no}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Period From *
              </label>
              <input
                type="date"
                value={formData.policy_period_from}
                onChange={(e) => setFormData({ ...formData, policy_period_from: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.policy_period_from ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.policy_period_from && (
                <p className="mt-1 text-sm text-red-600">{errors.policy_period_from}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Period To *
              </label>
              <input
                type="date"
                value={formData.policy_period_to}
                onChange={(e) => setFormData({ ...formData, policy_period_to: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.policy_period_to ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.policy_period_to && (
                <p className="mt-1 text-sm text-red-600">{errors.policy_period_to}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coverage
              </label>
              <input
                type="text"
                value={formData.coverage}
                onChange={(e) => setFormData({ ...formData, coverage: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sum Insured
              </label>
              <input
                type="number"
                value={formData.sum_insured}
                onChange={(e) => setFormData({ ...formData, sum_insured: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <h3 className="font-medium text-lg text-gray-700 border-b pb-2 mt-8">Premium Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Basic Premium
              </label>
              <input
                type="number"
                value={formData.basic_premium}
                onChange={(e) => setFormData({ ...formData, basic_premium: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SRCC Premium
              </label>
              <input
                type="number"
                value={formData.srcc_premium}
                onChange={(e) => setFormData({ ...formData, srcc_premium: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TC Premium
              </label>
              <input
                type="number"
                value={formData.tc_premium}
                onChange={(e) => setFormData({ ...formData, tc_premium: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Net Premium
              </label>
              <input
                type="number"
                value={formData.net_premium}
                onChange={(e) => setFormData({ ...formData, net_premium: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stamp Duty
              </label>
              <input
                type="number"
                value={formData.stamp_duty}
                onChange={(e) => setFormData({ ...formData, stamp_duty: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Fees
              </label>
              <input
                type="number"
                value={formData.admin_fees}
                onChange={(e) => setFormData({ ...formData, admin_fees: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Road Safety Fee
              </label>
              <input
                type="number"
                value={formData.road_safety_fee}
                onChange={(e) => setFormData({ ...formData, road_safety_fee: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Fee
              </label>
              <input
                type="number"
                value={formData.policy_fee}
                onChange={(e) => setFormData({ ...formData, policy_fee: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VAT Fee
              </label>
              <input
                type="number"
                value={formData.vat_fee}
                onChange={(e) => setFormData({ ...formData, vat_fee: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Invoice
              </label>
              <input
                type="number"
                value={formData.total_invoice}
                onChange={(e) => setFormData({ ...formData, total_invoice: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <h3 className="font-medium text-lg text-gray-700 border-b pb-2 mt-8">Payment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Debit Note
              </label>
              <input
                type="text"
                value={formData.debit_note}
                onChange={(e) => setFormData({ ...formData, debit_note: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Receipt
              </label>
              <input
                type="text"
                value={formData.payment_receipt}
                onChange={(e) => setFormData({ ...formData, payment_receipt: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <h3 className="font-medium text-lg text-gray-700 border-b pb-2 mt-8">Commission Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission Type
              </label>
              <select
                value={formData.commission_type}
                onChange={(e) => setFormData({ ...formData, commission_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select Commission Type</option>
                <option value="Percentage">Percentage</option>
                <option value="Fixed">Fixed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission Basic
              </label>
              <input
                type="number"
                value={formData.commission_basic}
                onChange={(e) => setFormData({ ...formData, commission_basic: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission SRCC
              </label>
              <input
                type="number"
                value={formData.commission_srcc}
                onChange={(e) => setFormData({ ...formData, commission_srcc: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission TC
              </label>
              <input
                type="number"
                value={formData.commission_tc}
                onChange={(e) => setFormData({ ...formData, commission_tc: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-orange-700 text-white rounded-lg hover:bg-orange-800"
            >
              {client ? 'Update Client' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Client } from '@/lib/services/clients';

interface ClientErrors {
  customer_type?: string;
  product?: string;
  insurance_provider?: string;
  client_name?: string;
  mobile_no?: string;
  email?: string;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (client: Client) => void;
  client?: Client;
  mode: 'add' | 'edit';
}

// Default empty client state
const defaultClientState: Client = {
  customer_type: '',
  product: '',
  insurance_provider: '',
  client_name: '',
  mobile_no: '',
  email: '',
  street1: '',
  street2: '',
  city: '',
  district: '',
  province: ''
};

export default function ClientModal({ isOpen, onClose, onSubmit, client, mode }: ClientModalProps) {
  const [formData, setFormData] = useState<Client>({...defaultClientState});
  const [errors, setErrors] = useState<ClientErrors>({});

  useEffect(() => {
    if (client && mode === 'edit') {
      setFormData(client);
    } else if (mode === 'add') {
      // Reset to default state when adding a new client
      setFormData({...defaultClientState});
    }
  }, [client, mode, isOpen]);

  const validateForm = () => {
    const newErrors: ClientErrors = {};
    
    if (!formData.customer_type) {
      newErrors.customer_type = 'Customer type is required';
    }
    
    if (!formData.product) {
      newErrors.product = 'Product is required';
    }
    
    if (!formData.insurance_provider) {
      newErrors.insurance_provider = 'Insurance provider is required';
    }
    
    if (!formData.client_name) {
      newErrors.client_name = 'Client name is required';
    }
    
    if (!formData.mobile_no) {
      newErrors.mobile_no = 'Mobile number is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle clean-up when modal is closed
  const handleClose = () => {
    setErrors({});
    setFormData({...defaultClientState});
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setFormData({...defaultClientState});
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {mode === 'add' ? 'Add New Client' : 'Edit Client'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Type*
                </label>
                <select
                  value={formData.customer_type}
                  onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.customer_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Type</option>
                  <option value="Individual">Individual</option>
                  <option value="Corporate">Corporate</option>
                </select>
                {errors.customer_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.customer_type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product*
                </label>
                <select
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.product ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Product</option>
                  <option value="Motor Insurance">Motor Insurance</option>
                  <option value="Health Insurance">Health Insurance</option>
                  <option value="Life Insurance">Life Insurance</option>
                  <option value="Property Insurance">Property Insurance</option>
                  <option value="Travel Insurance">Travel Insurance</option>
                </select>
                {errors.product && (
                  <p className="mt-1 text-sm text-red-600">{errors.product}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Provider*
                </label>
                <select
                  value={formData.insurance_provider}
                  onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.insurance_provider ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Provider</option>
                  <option value="ABC Insurance">ABC Insurance</option>
                  <option value="XYZ Insurance">XYZ Insurance</option>
                  <option value="Global Insurance">Global Insurance</option>
                </select>
                {errors.insurance_provider && (
                  <p className="mt-1 text-sm text-red-600">{errors.insurance_provider}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name*
              </label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.client_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.client_name && (
                <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number*
                </label>
                <input
                  type="tel"
                  value={formData.mobile_no}
                  onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.mobile_no ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.mobile_no && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobile_no}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address Line 1
                </label>
                <input
                  type="text"
                  value={formData.street1 || ''}
                  onChange={(e) => setFormData({ ...formData, street1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address Line 2
                </label>
                <input
                  type="text"
                  value={formData.street2 || ''}
                  onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District
                </label>
                <input
                  type="text"
                  value={formData.district || ''}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Province
                </label>
                <input
                  type="text"
                  value={formData.province || ''}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-700 text-white rounded-lg hover:bg-orange-800"
            >
              {mode === 'add' ? 'Add Client' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
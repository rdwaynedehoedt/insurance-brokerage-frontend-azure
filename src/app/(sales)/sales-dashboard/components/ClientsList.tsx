'use client';

import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Plus, Upload, Download } from 'lucide-react';
import ClientModal from './ClientModal';
import { clientService, Client } from '@/lib/services/clients';
import { toast } from 'react-hot-toast';

export default function ClientsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load clients when component mounts
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await clientService.getAllClients();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.mobile_no && client.mobile_no.includes(searchTerm))
  );

  const handleAddClient = async (newClient: Client) => {
    try {
      await clientService.createClient(newClient);
      toast.success('Client added successfully');
      loadClients(); // Refresh the client list
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Failed to add client');
    }
  };

  const handleEditClient = async (updatedClient: Client) => {
    if (!updatedClient.id) return;
    
    try {
      await clientService.updateClient(updatedClient.id, updatedClient);
      toast.success('Client updated successfully');
      loadClients(); // Refresh the client list
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    
    try {
      await clientService.deleteClient(clientId);
      toast.success('Client deleted successfully');
      loadClients(); // Refresh the client list
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    clientService.importClientsFromCsv(file)
      .then(data => {
        toast.success(`Successfully imported ${data.count} clients`);
        loadClients(); // Refresh the client list
      })
      .catch(error => {
        console.error('Error importing CSV:', error);
        toast.error('Failed to import CSV file');
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

  return (
    <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">My Clients</h2>
          <div className="flex space-x-3">
            {/* CSV Template Download Button */}
            <button
              onClick={downloadCsvTemplate}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Download CSV Template"
            >
              <Download className="w-5 h-5 mr-2" />
              CSV Template
            </button>
            
            {/* CSV Import Button */}
            <label className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors ${isUploading ? 'opacity-50' : ''}`}>
              <Upload className="w-5 h-5 mr-2" />
              Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvImport}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            
            {/* Existing Add Client Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-orange-700 text-white rounded-lg hover:bg-orange-800 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Client
            </button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-4">Loading clients...</div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No clients found</div>
        ) : (
          <table className="w-full table-auto">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Contact Info</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Product</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{client.client_name}</div>
                    <div className="text-sm text-gray-500">{client.policy_no}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.mobile_no}</div>
                    <div className="text-sm text-gray-500">{client.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.customer_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.product}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddClient}
        mode="add"
      />

      <ClientModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedClient(null);
        }}
        onSubmit={handleEditClient}
        client={selectedClient as Client | undefined}
        mode="edit"
      />
    </section>
  );
} 
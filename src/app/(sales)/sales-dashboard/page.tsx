'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Users, FileText, Home, Download, LogOut, Plus, Search, Eye, X, Trash, Edit } from 'lucide-react';
import StatsCards from './components/StatsCards';
import ClientsList from './components/ClientsList';
import ClientModal from './components/ClientModal';
import { clientService, Client } from '@/lib/services/clients';
import { Toaster, toast } from 'react-hot-toast';
import LoadingOverlay from '@/components/LoadingOverlay';
import Image from 'next/image';

export default function SalesDashboard() {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [clientToView, setClientToView] = useState<Client | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'clients', label: 'My Clients', icon: Users },
    { id: 'policies', label: 'Policies', icon: FileText },
    { id: 'downloads', label: 'Downloads', icon: Download },
  ];

  const handleLogout = () => {
    logout();
    // The AuthContext's logout function will redirect to login page
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
            <p className="text-sm text-gray-600">Sales Portal</p>
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
                {menuItems.find(item => item.id === activeTab)?.label}
              </h2>
              <p className="text-gray-600 mt-1">Welcome back, Salesperson!</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
                Salesperson
              </span>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-700" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <>
              <StatsCards />
              <div className="mt-8">
                <ClientsList />
              </div>
            </>
          )}
          {activeTab === 'clients' && (
            <div className="max-w-7xl mx-auto">
              <ClientsList />
            </div>
          )}
          {activeTab === 'policies' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Available Policies</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Life Insurance Policy</h4>
                      <p className="text-sm text-gray-600">Comprehensive life coverage with flexible terms</p>
                    </div>
                    <button className="px-4 py-2 bg-orange-700 text-white rounded-lg hover:bg-orange-800">
                      Download
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Health Insurance Policy</h4>
                      <p className="text-sm text-gray-600">Complete health coverage for individuals and families</p>
                    </div>
                    <button className="px-4 py-2 bg-orange-700 text-white rounded-lg hover:bg-orange-800">
                      Download
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Vehicle Insurance Policy</h4>
                      <p className="text-sm text-gray-600">Comprehensive vehicle coverage with roadside assistance</p>
                    </div>
                    <button className="px-4 py-2 bg-orange-700 text-white rounded-lg hover:bg-orange-800">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'downloads' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Downloadable Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Sales Guide</h4>
                    <p className="text-sm text-gray-600 mb-4">Complete guide for insurance sales professionals</p>
                    <button className="flex items-center text-orange-700 hover:text-orange-800">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </button>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Product Brochures</h4>
                    <p className="text-sm text-gray-600 mb-4">Detailed product information and benefits</p>
                    <button className="flex items-center text-orange-700 hover:text-orange-800">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </button>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Claim Forms</h4>
                    <p className="text-sm text-gray-600 mb-4">All necessary claim documentation forms</p>
                    <button className="flex items-center text-orange-700 hover:text-orange-800">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </button>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Training Materials</h4>
                    <p className="text-sm text-gray-600 mb-4">Sales training and product knowledge resources</p>
                    <button className="flex items-center text-orange-700 hover:text-orange-800">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 
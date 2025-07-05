'use client';

import { useState } from 'react';
import MultiDocumentUpload from '@/components/MultiDocumentUpload';

export default function ParallelUploadDemo() {
  const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({});
  const [clientId, setClientId] = useState<string>('demo-client');
  const [maxConcurrentUploads, setMaxConcurrentUploads] = useState<number>(3);
  
  // Handle successful uploads
  const handleUploadSuccess = (documentUrls: Record<string, string>) => {
    setUploadedUrls(prev => ({ ...prev, ...documentUrls }));
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Parallel Upload Demo</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter client ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Concurrent Uploads
            </label>
            <input
              type="number"
              value={maxConcurrentUploads}
              onChange={(e) => setMaxConcurrentUploads(parseInt(e.target.value) || 1)}
              min={1}
              max={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select multiple files to upload in parallel. Images will be automatically compressed before upload.
        </p>
        
        <MultiDocumentUpload
          clientId={clientId}
          onUploadSuccess={handleUploadSuccess}
          maxConcurrentUploads={maxConcurrentUploads}
        />
      </div>
      
      {Object.keys(uploadedUrls).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Uploaded Documents</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(uploadedUrls).map(([docType, url]) => (
                  <tr key={docType}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {docType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-md">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {url}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-500">
        <h3 className="font-medium mb-2">Implementation Details:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Client-side image compression using browser-image-compression</li>
          <li>Parallel document uploads with concurrency control</li>
          <li>Progress tracking for each individual upload</li>
          <li>Automatic retry mechanism for failed uploads</li>
        </ul>
      </div>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { documentService } from '@/lib/services/documents';

interface ImageTesterProps {
  imageUrl: string;
  clientId: string;
  documentType: string;
}

export default function ImageTester({ imageUrl, clientId, documentType }: ImageTesterProps) {
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const log = (message: string) => {
    console.log(message);
    setTestResults(prev => [...prev, message]);
  };
  
  const runTest = async () => {
    setTestResults([]);
    
    try {
      log(`Testing image: ${imageUrl}`);
      
      // Extract filename
      const fileName = imageUrl.split('/').pop()?.split('?')[0] || '';
      log(`Extracted filename: ${fileName}`);
      
      // Get secure URL
      log('Generating secure URL...');
      const secureUrl = await documentService.getSecureDocumentUrl(clientId, documentType, fileName);
      log(`Generated secure URL: ${secureUrl}`);
      
      // Test secure URL with fetch
      log('Testing URL with fetch...');
      try {
        const response = await fetch(secureUrl, { method: 'HEAD' });
        log(`Fetch response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          log('✅ URL is accessible');
          window.open(secureUrl, '_blank');
        } else {
          log('❌ URL is not accessible');
        }
      } catch (error) {
        log(`❌ Error fetching URL: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      log(`Error running test: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return (
    <div className="border rounded-lg p-6 bg-gray-50 my-4">
      <h2 className="text-xl font-semibold mb-4">Document URL Tester</h2>
      
      <div className="mb-4">
        <h3 className="font-medium mb-2">Document Details:</h3>
        <p><strong>URL:</strong> {imageUrl}</p>
        <p><strong>Client ID:</strong> {clientId}</p>
        <p><strong>Document Type:</strong> {documentType}</p>
      </div>
      
      <button 
        onClick={runTest}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Test & Open Document
      </button>
      
      {testResults.length > 0 && (
        <div className="mb-4">
          <h3 className="font-medium mb-2">Test Results:</h3>
          <div className="bg-gray-100 p-3 rounded max-h-60 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className={`py-1 ${result.includes('❌') ? 'text-red-500' : result.includes('✅') ? 'text-green-500' : ''}`}>
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <a 
          onClick={async (e) => {
            e.preventDefault();
            const secureUrl = await documentService.getSecureDocumentUrl(
              clientId,
              documentType,
              imageUrl.split('/').pop()?.split('?')[0] || ''
            );
            window.open(secureUrl, '_blank');
          }}
          href="#"
          className="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Open Document Directly
        </a>
      </div>
    </div>
  );
} 

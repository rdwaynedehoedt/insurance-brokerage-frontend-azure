'use client';

import { useState } from 'react';
import { File, Eye } from 'lucide-react';
import { documentService } from '@/lib/services/documents';

interface Document {
  type: string;
  url: string | null;
  label: string;
}

interface DocumentViewerProps {
  clientId: string;
  documents: Document[];
}

export default function DocumentViewer({ clientId, documents }: DocumentViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredDocuments = documents.filter(doc => doc.url);

  // Extract filename from URL
  const getFileName = (url: string): string => {
    // Parse the URL to get just the filename without query parameters
    const urlParts = url.split('/');
    const fileNameWithParams = urlParts[urlParts.length - 1];
    return fileNameWithParams.split('?')[0]; // Remove query parameters
  };

  // Get secure document URL through our API proxy
  const getSecureDocumentUrl = (document: Document): string => {
    if (!document.url) return '';
    const fileName = getFileName(document.url);
    return documentService.getSecureDocumentUrl(clientId, document.type, fileName);
  };

  const viewDocument = async (document: Document) => {
    if (!document.url) return;
    
    setSelectedDoc(document);
    setIsLoading(true);
    setError(null);
    
    try {
      // The document will be loaded in the modal when it appears
      setIsLoading(false);
    } catch (err) {
      console.error('Error viewing document:', err);
      setError('Failed to load document');
      setIsLoading(false);
    }
  };

  const isImage = (url: string): boolean => {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.jpg') || 
           lowerUrl.endsWith('.jpeg') || 
           lowerUrl.endsWith('.png') || 
           lowerUrl.endsWith('.gif') ||
           lowerUrl.endsWith('.webp');
  };

  const isPdf = (url: string): boolean => {
    return url.toLowerCase().endsWith('.pdf');
  };

  return (
    <div>
      <h3 className="text-md font-semibold text-gray-700 border-b pb-2 mb-4">Documents</h3>
      
      {filteredDocuments.length === 0 ? (
        <p className="text-sm text-gray-500">No documents available for this client.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredDocuments.map((doc, index) => (
            <div key={index} className="border rounded-lg p-4 flex flex-col items-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                <File className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-sm font-medium text-center">{doc.label}</p>
              <div className="mt-3">
                <button
                  onClick={() => viewDocument(doc)}
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedDoc && selectedDoc.url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{selectedDoc.label}</h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <p>Loading document...</p>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-full text-red-500">
                  {error}
                </div>
              ) : (
                <div className="flex justify-center">
                  {isImage(selectedDoc.url) ? (
                    <img 
                      src={getSecureDocumentUrl(selectedDoc)} 
                      alt={selectedDoc.label} 
                      className="max-w-full max-h-[70vh] object-contain"
                    />
                  ) : isPdf(selectedDoc.url) ? (
                    <iframe
                      src={getSecureDocumentUrl(selectedDoc)}
                      className="w-full h-[70vh]"
                      title={selectedDoc.label}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <File className="w-20 h-20 text-gray-400 mb-4" />
                      <p className="text-gray-600">This document type cannot be previewed directly.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
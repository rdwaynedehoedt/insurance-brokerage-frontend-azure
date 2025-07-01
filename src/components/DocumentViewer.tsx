'use client';

import { useState } from 'react';
import { File, ExternalLink } from 'lucide-react';
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
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
  
  const filteredDocuments = documents.filter(doc => doc.url);

  // Extract filename from URL
  const getFileName = (url: string): string => {
    try {
      const urlParts = url.split('/');
      const fileNameWithParams = urlParts[urlParts.length - 1];
      return fileNameWithParams.split('?')[0]; // Remove query parameters
    } catch (error) {
      console.error('Error parsing URL:', error);
      return url;
    }
  };

  // Get secure document URL through our API proxy
  const openDocument = async (document: Document) => {
    if (!document.url) return;
    
    try {
      // Show loading state
      setLoadingDoc(document.url);
      
      // Get the filename
      const fileName = getFileName(document.url);
      
      // Get cached URL if available
      if (documentUrls[document.url]) {
        window.open(documentUrls[document.url], '_blank');
        setLoadingDoc(null);
        return;
      }
      
      // Generate secure URL
      let urlToUse: string;
      
      if (document.url.includes('blob.core.windows.net')) {
        // Extract information from Azure URL
        const urlParts = document.url.split('/');
        const containerPos = document.url.indexOf('customer-documents');
        
        if (containerPos > -1 && urlParts.length >= containerPos + 4) {
          const urlClientId = urlParts[urlParts.length - 3]; 
          const urlDocType = urlParts[urlParts.length - 2];
          
          // Get URL using extracted values
          urlToUse = await documentService.getSecureDocumentUrl(
            urlClientId, urlDocType, fileName
          );
        } else {
          // Fallback
          urlToUse = await documentService.getSecureDocumentUrl(
            clientId, document.type, fileName
          );
        }
      } else {
        // Regular URL
        urlToUse = await documentService.getSecureDocumentUrl(
          clientId, document.type, fileName
        );
      }
      
      // Cache the URL
      setDocumentUrls(prev => ({
        ...prev,
        [document.url as string]: urlToUse
      }));
      
      // Open in new tab
      window.open(urlToUse, '_blank');
    } catch (error) {
      console.error('Error opening document:', error);
      
      // Try to open the original URL as a fallback
      try {
        if (document.url.includes('blob.core.windows.net')) {
          // For Azure URLs, try to open directly
          window.open(document.url, '_blank');
        } else {
          alert('Failed to generate document URL. Please try again.');
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        alert('Failed to open document. Please try again.');
      }
    } finally {
      setLoadingDoc(null);
    }
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
                  onClick={() => openDocument(doc)}
                  disabled={loadingDoc === doc.url}
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm disabled:text-blue-300"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  {loadingDoc === doc.url ? 'Opening...' : 'Open Document'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
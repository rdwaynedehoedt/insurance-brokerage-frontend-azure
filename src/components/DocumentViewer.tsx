'use client';

import { useState } from 'react';
import { FileText, Download, ExternalLink, Loader2 } from 'lucide-react';
import { documentService } from '@/lib/services/documents';
import { toast } from 'react-hot-toast';

interface DocumentViewerProps {
  clientId: string;
  documents: {
    type: string;
    url: string | null;
    label: string;
  }[];
}

const DocumentViewer = ({ clientId, documents }: DocumentViewerProps) => {
  const [loadingDocuments, setLoadingDocuments] = useState<Record<string, boolean>>({});

  const handleViewDocument = async (documentType: string, url: string | null) => {
    if (!url) {
      toast.error('No document available');
      return;
    }

    try {
      setLoadingDocuments(prev => ({ ...prev, [documentType]: true }));
      const sasUrl = await documentService.getDocumentUrl(clientId, documentType, url);
      window.open(sasUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to retrieve document');
    } finally {
      setLoadingDocuments(prev => ({ ...prev, [documentType]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-md font-semibold text-gray-700 border-b pb-2">Documents</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div 
            key={doc.type}
            className="border border-gray-200 rounded-lg p-3 flex items-center justify-between"
          >
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm font-medium">{doc.label}</p>
                <p className="text-xs text-gray-500">
                  {doc.url ? 'Document available' : 'No document'}
                </p>
              </div>
            </div>
            
            {doc.url && (
              <button
                onClick={() => handleViewDocument(doc.type, doc.url)}
                disabled={loadingDocuments[doc.type]}
                className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-md text-blue-600 transition-colors"
                title="View Document"
              >
                {loadingDocuments[doc.type] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {documents.every(doc => !doc.url) && (
        <p className="text-center text-gray-500 py-4">No documents have been uploaded for this client.</p>
      )}
    </div>
  );
};

export default DocumentViewer; 
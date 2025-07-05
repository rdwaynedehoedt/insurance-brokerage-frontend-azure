'use client';

import { useState, useCallback } from 'react';
import { Upload, X, FileText, Image, Check, Loader2 } from 'lucide-react';
import { documentService } from '@/lib/services/documents';
import { processFileForUpload } from '@/lib/utils/imageCompression';
import { toast } from 'react-hot-toast';

interface DocumentToUpload {
  documentType: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  url?: string;
  error?: string;
}

interface MultiDocumentUploadProps {
  clientId: string;
  onUploadSuccess: (documentUrls: Record<string, string>) => void;
  maxConcurrentUploads?: number;
  readOnly?: boolean;
}

const MultiDocumentUpload = ({
  clientId,
  onUploadSuccess,
  maxConcurrentUploads = 3,
  readOnly = false,
}: MultiDocumentUploadProps) => {
  const [documents, setDocuments] = useState<DocumentToUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles: DocumentToUpload[] = [];
    
    // Convert FileList to array and create document objects
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      const documentType = `document_${Date.now()}_${i}`; // Generate unique document type
      
      newFiles.push({
        documentType,
        file,
        progress: 0,
        status: 'pending'
      });
    }
    
    setDocuments([...documents, ...newFiles]);
    
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };
  
  // Remove a document from the list
  const removeDocument = (index: number) => {
    if (isUploading) return; // Don't allow removal during upload
    
    const newDocuments = [...documents];
    newDocuments.splice(index, 1);
    setDocuments(newDocuments);
  };
  
  // Process and upload all documents in parallel
  const uploadAllDocuments = async () => {
    if (documents.length === 0 || isUploading || !clientId) return;
    
    try {
      setIsUploading(true);
      
      // First, process all files (compress images)
      const processPromises = documents.map(async (doc, index) => {
        try {
          const processedFile = await processFileForUpload(doc.file);
          
          // Update the document with the processed file
          setDocuments(prev => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              file: processedFile
            };
            return updated;
          });
          
          return processedFile;
        } catch (error) {
          console.error(`Error processing file ${doc.file.name}:`, error);
          // Keep the original file if processing fails
          return doc.file;
        }
      });
      
      // Wait for all files to be processed
      await Promise.all(processPromises);
      
      // Create a map of document types to files for parallel upload
      const filesMap = new Map<string, File>();
      documents.forEach(doc => {
        filesMap.set(doc.documentType, doc.file);
        
        // Update document status to uploading
        setDocuments(prev => {
          return prev.map(d => {
            if (d.documentType === doc.documentType) {
              return { ...d, status: 'uploading' };
            }
            return d;
          });
        });
      });
      
      // Upload all documents in parallel
      const results = await documentService.uploadMultipleDocuments(
        clientId,
        filesMap,
        (documentType, progress) => {
          // Update progress for this document
          setDocuments(prev => {
            return prev.map(d => {
              if (d.documentType === documentType) {
                return { ...d, progress };
              }
              return d;
            });
          });
        },
        maxConcurrentUploads
      );
      
      // Update document statuses and URLs
      setDocuments(prev => {
        return prev.map(d => {
          const url = results[d.documentType];
          return {
            ...d,
            status: url ? 'complete' : 'error',
            url: url || undefined,
            error: url ? undefined : 'Failed to upload'
          };
        });
      });
      
      // Notify parent of successful uploads
      onUploadSuccess(results);
      
      toast.success(`Successfully uploaded ${Object.keys(results).length} documents`);
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload some documents');
      
      // Mark all pending/uploading documents as error
      setDocuments(prev => {
        return prev.map(d => {
          if (d.status === 'pending' || d.status === 'uploading') {
            return { ...d, status: 'error', error: 'Upload failed' };
          }
          return d;
        });
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Get file type icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    return <FileText className="w-5 h-5 text-blue-500" />;
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Upload Multiple Documents</p>
        
        {/* File input */}
        {!readOnly && (
          <label className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-sm text-gray-500">
                {documents.length === 0 
                  ? 'Click to select multiple files' 
                  : 'Add more files'}
              </span>
            </div>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading || readOnly}
            />
          </label>
        )}
      </div>
      
      {/* Document list */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Selected Documents</div>
          
          <div className="border rounded-lg divide-y">
            {documents.map((doc, index) => (
              <div key={doc.documentType} className="flex items-center p-3">
                <div className="mr-3">
                  {getFileIcon(doc.file)}
                </div>
                
                <div className="flex-1">
                  <div className="text-sm font-medium truncate">
                    {doc.file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(doc.file.size / 1024).toFixed(2)} KB
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {doc.status === 'uploading' && (
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-500" />
                      <span className="text-xs text-blue-500">{doc.progress}%</span>
                    </div>
                  )}
                  
                  {doc.status === 'complete' && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                  
                  {doc.status === 'error' && (
                    <span className="text-xs text-red-500">{doc.error}</span>
                  )}
                  
                  {!isUploading && doc.status !== 'complete' && (
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Upload button */}
      {documents.length > 0 && !readOnly && (
        <button
          type="button"
          onClick={uploadAllDocuments}
          disabled={isUploading || documents.length === 0 || documents.every(d => d.status === 'complete')}
          className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
            isUploading || documents.length === 0 || documents.every(d => d.status === 'complete')
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isUploading ? (
            <span className="flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </span>
          ) : (
            `Upload ${documents.length} Document${documents.length !== 1 ? 's' : ''}`
          )}
        </button>
      )}
    </div>
  );
};

export default MultiDocumentUpload; 
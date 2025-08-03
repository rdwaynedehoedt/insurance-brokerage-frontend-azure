'use client';

import { useState } from 'react';
import { Upload, X, FileText, Image, Check, Loader2 } from 'lucide-react';
import { documentService } from '@/lib/services/documents';
import { toast } from 'react-hot-toast';
import { processFileForUpload } from '@/lib/utils/imageCompression';

interface DocumentUploadProps {
  clientId: string;
  documentType: string;
  label: string;
  existingUrl?: string;
  onUploadSuccess: (documentUrl: string) => void;
  onDelete?: () => void;
  onFileSelected?: (documentType: string, file: File) => void;
  readOnly?: boolean;
}

const DocumentUpload = ({
  clientId,
  documentType,
  label,
  existingUrl,
  onUploadSuccess,
  onDelete,
  onFileSelected,
  readOnly = false,
}: DocumentUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // Determine file type from URL extension
  const getFileTypeFromUrl = (url: string): 'image' | 'pdf' | 'other' => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || 
        lowerUrl.endsWith('.png') || lowerUrl.endsWith('.gif') || 
        lowerUrl.endsWith('.webp')) {
      return 'image';
    } else if (lowerUrl.endsWith('.pdf')) {
      return 'pdf';
    } else {
      return 'other';
    }
  };
  
  // Get document preview if URL exists
  const viewDocument = async () => {
    if (existingUrl) {
      try {
        setIsLoading(true);
        
        console.log('Viewing document with URL:', existingUrl);
        
        // Set document URL directly if it's a direct Azure URL
        if (existingUrl.includes('blob.core.windows.net')) {
          console.log('Using direct Azure blob URL');
          setDocumentUrl(existingUrl);
          setFileType(getFileTypeFromUrl(existingUrl) as 'image' | 'pdf' | null);
          setIsViewModalOpen(true);
          setIsLoading(false);
          return;
        }
        
        // Extract the filename from the URL
        const fileName = existingUrl.split('/').pop()?.split('?')[0] || '';
        console.log('Extracted filename:', fileName);
        
        // Get a secure URL to the document
        const secureUrl = await documentService.getSecureDocumentUrl(clientId, documentType, fileName);
        console.log('Generated secure URL:', secureUrl);
        
        // Set document URL and determine file type
        setDocumentUrl(secureUrl);
        setFileType(getFileTypeFromUrl(existingUrl) as 'image' | 'pdf' | null);
        
        // Open the modal
        setIsViewModalOpen(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error viewing document:', error);
        toast.error('Failed to retrieve document');
        setIsLoading(false);
      }
    }
  };
  
  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
        setFileType(file.type.includes('image') ? 'image' : 'pdf');
      };
      reader.readAsDataURL(file);
      
      // Process file (compress if it's an image)
      console.log('Processing file for upload:', file.name);
      const processedFile = await processFileForUpload(file);
      console.log(`File processed: ${file.name} - Original size: ${(file.size / 1024).toFixed(2)}KB, Processed size: ${(processedFile.size / 1024).toFixed(2)}KB`);
      
      // Store the processed file
      setSelectedFile(processedFile);
      
      // If we have a client ID, upload immediately
      // Otherwise, store the file for later upload
      if (clientId) {
        console.log(`DocumentUpload: Uploading file for clientId=${clientId}`);
        
        // Upload to server with progress tracking
        const result = await documentService.uploadDocument(
          clientId, 
          documentType, 
          processedFile,
          (progress) => {
            setUploadProgress(progress);
            console.log(`Upload progress: ${progress}%`);
          }
        );
        
        console.log(`DocumentUpload: Upload successful, URL=${result.url}`);
        
        const documentUrl = result.url;
        onUploadSuccess(documentUrl);
        toast.success('Document uploaded successfully');
      } else {
        // For new clients, just store the file and notify parent
        if (onFileSelected) {
          onFileSelected(documentType, processedFile);
          toast.success('File selected and ready for upload');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
      setPreviewUrl(null);
      setFileType(null);
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Handle document deletion
  const handleDelete = async () => {
    if (readOnly) return;
    
    try {
      setIsUploading(true);
      
      // Case 1: Document is already uploaded (existingUrl exists)
      if (existingUrl && clientId) {
        await documentService.deleteDocument(clientId, documentType, existingUrl);
        toast.success('Document deleted successfully');
      }
      
      // Case 2: Document is selected but not uploaded yet (for new clients)
      // We don't need to call any API, just clear the local state and notify parent
      
      // Clear preview and file type in both cases
      setPreviewUrl(null);
      setFileType(null);
      setSelectedFile(null);
      
      // Notify parent component in both cases
      if (onDelete) {
        onDelete();
      }
      
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <>
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        
        {(existingUrl || previewUrl) ? (
          <div className="flex items-center border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex-1 flex items-center">
              {fileType === 'image' ? (
                <Image className="w-5 h-5 text-blue-500 mr-2" />
              ) : (
                <FileText className="w-5 h-5 text-blue-500 mr-2" />
              )}
              <span className="text-sm text-gray-700 truncate">
                {existingUrl ? 'Document uploaded' : 'New document ready to save'}
              </span>
              {existingUrl && (
                <Check className="w-4 h-4 text-green-500 ml-2" />
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {isUploading && (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-500" />
                  <span className="text-xs text-blue-500">{uploadProgress}%</span>
                </div>
              )}
              
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isUploading}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <label className={`flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 ${!readOnly ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors duration-150`}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,application/pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading || readOnly}
            />
            
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="mt-2 text-sm text-gray-500">Uploading...</span>
              </div>
            ) : readOnly ? (
              <div className="flex flex-col items-center">
                <FileText className="w-6 h-6 text-gray-400" />
                <span className="mt-2 text-sm text-gray-500">
                  No document uploaded
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="mt-2 text-sm text-gray-500">
                  Click to upload {label}
                </span>
                <span className="mt-1 text-xs text-gray-400">
                  JPG, PNG, GIF or PDF (max 5MB)
                </span>
              </div>
            )}
          </label>
        )}
      </div>
      
      {/* Document View Modal */}
      {isViewModalOpen && documentUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{label}</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-2" />
                  <p>Loading document...</p>
                </div>
              ) : (
                <div className="flex justify-center">
                  {fileType === 'image' ? (
                    <img 
                      src={documentUrl}
                      alt={label}
                      className="max-w-full max-h-[70vh] object-contain"
                      onError={(e) => {
                        console.error('Error loading image');
                        
                        // Try direct URL as fallback if not already using it
                        if (existingUrl && !e.currentTarget.src.includes('broken-image') && 
                            e.currentTarget.src !== existingUrl) {
                          console.log('Trying direct URL as fallback');
                          e.currentTarget.src = existingUrl;
                          return;
                        }
                        
                        toast.error('Failed to load image');
                        // Display broken image placeholder
                        e.currentTarget.src = '/images/broken-image.png';
                      }}
                    />
                  ) : fileType === 'pdf' ? (
                    <iframe
                      src={documentUrl}
                      className="w-full h-[70vh]"
                      onError={() => {
                        console.error('Error loading PDF');
                        toast.error('Failed to load PDF');
                        
                        // Show download link instead
                        if (existingUrl) {
                          window.open(existingUrl, '_blank');
                        }
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-20 h-20 text-gray-400 mb-4" />
                      <p className="text-gray-600">This document type cannot be previewed directly.</p>
                      <a 
                        href={documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-4 text-blue-500 hover:text-blue-700"
                      >
                        Download Document
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentUpload; 

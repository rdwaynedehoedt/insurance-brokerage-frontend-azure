'use client';

import { useState } from 'react';
import { Upload, X, FileText, Image, Check, Loader2 } from 'lucide-react';
import { documentService } from '@/lib/services/documents';
import { toast } from 'react-hot-toast';

interface DocumentUploadProps {
  clientId: string;
  documentType: string;
  label: string;
  existingUrl?: string;
  onUploadSuccess: (documentUrl: string) => void;
  onDelete?: () => void;
}

const DocumentUpload = ({
  clientId,
  documentType,
  label,
  existingUrl,
  onUploadSuccess,
  onDelete,
}: DocumentUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
  
  // Get document preview if URL exists
  const viewDocument = async () => {
    if (existingUrl) {
      try {
        const sasUrl = await documentService.getDocumentUrl(clientId, documentType, existingUrl);
        window.open(sasUrl, '_blank');
      } catch (error) {
        console.error('Error viewing document:', error);
        toast.error('Failed to retrieve document');
      }
    }
  };
  
  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
        setFileType(file.type.includes('image') ? 'image' : 'pdf');
      };
      reader.readAsDataURL(file);
      
      // Upload to server
      const documentUrl = await documentService.uploadDocument(clientId, documentType, file);
      
      onUploadSuccess(documentUrl);
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
      setPreviewUrl(null);
      setFileType(null);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle document deletion
  const handleDelete = async () => {
    if (!existingUrl) return;
    
    try {
      setIsUploading(true);
      await documentService.deleteDocument(clientId, documentType, existingUrl);
      
      if (onDelete) {
        onDelete();
      }
      
      setPreviewUrl(null);
      setFileType(null);
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
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
            {existingUrl && (
              <button
                type="button"
                onClick={viewDocument}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View
              </button>
            )}
            
            <button
              type="button"
              onClick={handleDelete}
              disabled={isUploading}
              className="text-sm text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <label className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="mt-2 text-sm text-gray-500">Uploading...</span>
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
  );
};

export default DocumentUpload; 
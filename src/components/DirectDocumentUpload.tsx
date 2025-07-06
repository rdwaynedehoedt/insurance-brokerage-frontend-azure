'use client';

import { useState, useCallback } from 'react';
import { Upload, X, FileText, Image, Check, Loader2 } from 'lucide-react';
import { documentService } from '@/lib/services/documents';
import { toast } from 'react-hot-toast';
import { processFileForUpload } from '@/lib/utils/imageCompression';

interface DirectDocumentUploadProps {
  clientId: string;
  documentType: string;
  label: string;
  existingUrl?: string;
  onUploadSuccess: (documentUrl: string) => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

const DirectDocumentUpload = ({
  clientId,
  documentType,
  label,
  existingUrl,
  onUploadSuccess,
  onDelete,
  readOnly = false,
}: DirectDocumentUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatus('Preparing file...');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
        setFileType(file.type.includes('image') ? 'image' : 'pdf');
      };
      reader.readAsDataURL(file);
      
      // Process file (compress if it's an image)
      console.log('Processing file for upload:', file.name);
      
      // Notify user if file is large and will be compressed
      if (file.size > 50 * 1024) {
        toast.loading(`Optimizing ${file.name} for faster upload...`, { duration: 2000 });
      }
      
      setUploadStatus('Compressing file...');
      const processedFile = await processFileForUpload(file, { targetSizeKB: 50 });
      console.log(`File processed: ${file.name} - Original size: ${(file.size / 1024).toFixed(2)}KB, Processed size: ${(processedFile.size / 1024).toFixed(2)}KB`);
      
      // Show compression results to user
      if (file.size > processedFile.size && file.size > 50 * 1024) {
        const reductionPercent = ((1 - processedFile.size / file.size) * 100).toFixed(0);
        if (parseInt(reductionPercent) > 20) {
          toast.success(`File optimized! Reduced by ${reductionPercent}%`);
        }
      }
      
      // Show warning if file is still large
      if (processedFile.size > 100 * 1024) {
        console.warn(`File is still large (${(processedFile.size / 1024).toFixed(2)}KB) after compression. This may cause slow uploads.`);
      }
      
      setUploadStatus('Getting upload token...');
      
      // Get a SAS token for direct upload
      const uploadToken = await documentService.getUploadToken(clientId, documentType, file.name);
      console.log('Upload token received:', uploadToken.sasUrl);
      
      setUploadStatus('Uploading directly to Azure...');
      
      // Upload directly to Azure Blob Storage with progress tracking
      await uploadFileDirectly(
        processedFile, 
        uploadToken.sasUrl, 
        (progress) => {
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress}%`);
        }
      );
      
      setUploadStatus('Confirming upload...');
      
      // Confirm upload with backend
      const confirmResult = await documentService.confirmUpload(clientId, documentType, {
        blobName: uploadToken.blobName,
        blobUrl: uploadToken.blobUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: processedFile.size
      });
      
      console.log('Upload confirmed:', confirmResult);
      
      // Call onUploadSuccess with the blob URL
      onUploadSuccess(uploadToken.blobUrl);
      toast.success('Document uploaded successfully');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
      setPreviewUrl(null);
      setFileType(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };
  
  // Upload file directly to Azure Blob Storage using the SAS URL
  const uploadFileDirectly = async (
    file: File, 
    sasUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
      
      // Handle completion
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };
      
      // Handle errors
      xhr.onerror = () => {
        reject(new Error('Network error occurred during upload'));
      };
      
      // Open connection and set headers
      xhr.open('PUT', sasUrl, true);
      xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
      xhr.setRequestHeader('Content-Type', file.type);
      
      // Send the file
      xhr.send(file);
    });
  };
  
  // Handle document deletion
  const handleDelete = async () => {
    if (readOnly) return;
    
    try {
      setIsUploading(true);
      
      // Delete document if it exists
      if (existingUrl && clientId) {
        await documentService.deleteDocument(clientId, documentType, existingUrl);
        toast.success('Document deleted successfully');
      }
      
      // Clear preview and file type
      setPreviewUrl(null);
      setFileType(null);
      
      // Notify parent component
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
              <div className="flex flex-col items-center">
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-500" />
                  <span className="text-xs text-blue-500">{uploadProgress}%</span>
                </div>
                {uploadStatus && (
                  <span className="text-xs text-gray-500">{uploadStatus}</span>
                )}
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
              <span className="mt-2 text-sm text-gray-500">Uploading... {uploadProgress}%</span>
              {uploadStatus && (
                <span className="text-xs text-gray-500">{uploadStatus}</span>
              )}
            </div>
          ) : readOnly ? (
            <div className="flex flex-col items-center">
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="mt-2 text-sm text-gray-500">No document uploaded</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-6 h-6 text-blue-500" />
              <span className="mt-2 text-sm text-gray-500">Click to upload document</span>
              <span className="text-xs text-gray-400 mt-1">JPG, PNG, GIF or PDF</span>
            </div>
          )}
        </label>
      )}
    </div>
  );
};

export default DirectDocumentUpload; 
'use client';

import { apiClient } from './api';
import axios from 'axios';

export interface UploadDocumentResponse {
  fileName: string;
  url: string;
}

export interface UploadProgressCallback {
  (progress: number, file: File): void;
}

export const documentService = {
  /**
   * Upload a document for a client
   */
  async uploadDocument(
    clientId: string,
    documentType: string,
    file: File,
    onProgress?: UploadProgressCallback
  ): Promise<UploadDocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const config: any = {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };
    
    if (onProgress) {
      config.onUploadProgress = (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
        onProgress(percentCompleted, file);
      };
    }
    
    const response = await apiClient.post<UploadDocumentResponse>(
      `/documents/upload/${clientId}/${documentType}`,
      formData,
      config
    );
    
    return response.data;
  },
  
  /**
   * Upload multiple documents in parallel
   * @param clientId The client ID
   * @param files Map of document types to files
   * @param onProgress Optional callback for progress updates
   * @param concurrencyLimit Maximum number of concurrent uploads (default: 3)
   */
  async uploadMultipleDocuments(
    clientId: string,
    files: Map<string, File>,
    onProgress?: (documentType: string, progress: number) => void,
    concurrencyLimit: number = 3
  ): Promise<Record<string, string>> {
    // Convert map to array of upload tasks
    const uploadTasks = Array.from(files.entries()).map(([documentType, file]) => ({
      documentType,
      file,
      status: 'pending' as 'pending' | 'uploading' | 'complete' | 'error',
      result: null as UploadDocumentResponse | null,
      error: null as Error | null
    }));
    
    const results: Record<string, string> = {};
    const activeUploads = new Set<number>();
    
    return new Promise((resolve, reject) => {
      const processQueue = async () => {
        // Find next pending task
        const nextTaskIndex = uploadTasks.findIndex(task => task.status === 'pending');
        
        // If no more pending tasks and no active uploads, we're done
        if (nextTaskIndex === -1 && activeUploads.size === 0) {
          resolve(results);
          return;
        }
        
        // If we have capacity and pending tasks, start a new upload
        if (activeUploads.size < concurrencyLimit && nextTaskIndex !== -1) {
          const task = uploadTasks[nextTaskIndex];
          task.status = 'uploading';
          activeUploads.add(nextTaskIndex);
          
          try {
            // Upload the document
            const result = await this.uploadDocument(
              clientId,
              task.documentType,
              task.file,
              (progress) => {
                if (onProgress) {
                  onProgress(task.documentType, progress);
                }
              }
            );
            
            // Update task status and store result
            task.status = 'complete';
            task.result = result;
            results[task.documentType] = result.url;
          } catch (error) {
            task.status = 'error';
            task.error = error as Error;
            console.error(`Error uploading ${task.documentType}:`, error);
          } finally {
            activeUploads.delete(nextTaskIndex);
            // Continue processing the queue
            processQueue();
          }
        }
        
        // If we have capacity, process more tasks
        if (activeUploads.size < concurrencyLimit) {
          processQueue();
        }
      };
      
      // Start processing the queue
      for (let i = 0; i < Math.min(concurrencyLimit, uploadTasks.length); i++) {
        processQueue();
      }
    });
  },
  
  /**
   * Get a secure URL for a document
   * Updated to use token-based public access
   */
  async getSecureDocumentUrl(
    clientId: string,
    documentType: string,
    fileName: string
  ): Promise<string> {
    try {
      // Extract just the filename without path or query parameters
      const baseFileName = fileName.split('/').pop()?.split('?')[0] || fileName;
      
      // Get a public token for accessing the document
      const response = await apiClient.get<{ token: string, url: string, expires: string }>(
        `/documents/token/${clientId}/${documentType}/${baseFileName}`
      );
      
      // Return the public URL with token
      return response.data.url;
    } catch (error) {
      console.error('Error getting secure document URL:', error);
      // Fallback - might not work without authentication
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';
      return `${apiBase}/documents/secure/${clientId}/${documentType}/${fileName}`;
    }
  },
  
  /**
   * Delete a document
   */
  async deleteDocument(
    clientId: string,
    documentType: string,
    fileName: string
  ): Promise<void> {
    try {
      // Extract just the filename without path or query parameters
      // First, handle both Azure URLs and local file paths correctly
      let baseFileName = fileName;
      
      // For Azure blob URLs (contains blob.core.windows.net)
      if (fileName.includes('blob.core.windows.net')) {
        baseFileName = fileName.split('/').pop()?.split('?')[0] || fileName;
      } 
      // For local storage paths (might contain 'uploads/' or full windows path)
      else if (fileName.includes('/') || fileName.includes('\\')) {
        // Extract just the filename at the end of the path
        baseFileName = fileName.split(/[\/\\]/).pop() || fileName;
      }
      
      console.log(`Attempting to delete document:`, {
        clientId,
        documentType,
        originalFileName: fileName,
        baseFileName
      });
      
      // Make sure we're only using the actual filename for the delete request
      const endpoint = `documents/${clientId}/${documentType}?blobUrl=${encodeURIComponent(fileName)}`;
      
      console.log(`DELETE request to endpoint: ${endpoint}`);
      
      // Make the request with debug logging
      try {
        const response = await apiClient.delete(endpoint);
        console.log('Document deleted successfully:', response.data);
      } catch (apiError: any) {
        console.error('API error details:', apiError.response?.data || {});
        throw apiError;
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  /**
   * Migrate documents from temporary folders to the actual client ID
   * This is used when a new client is created and documents were uploaded before the client was saved
   */
  async migrateDocuments(
    newClientId: string,
    documentUrls: Record<string, string>
  ): Promise<Record<string, string>> {
    try {
      // Filter out document URLs that don't contain temporary IDs
      const documentsToMigrate = Object.entries(documentUrls)
        .filter(([_, url]) => url && typeof url === 'string' && url.includes('/temp-'))
        .reduce((acc, [key, url]) => {
          acc[key] = url;
          return acc;
        }, {} as Record<string, string>);
      
      if (Object.keys(documentsToMigrate).length === 0) {
        console.log('No documents to migrate');
        return documentUrls; // Return original URLs if nothing to migrate
      }
      
      console.log('Migrating documents:', documentsToMigrate);
      
      // Extract the temporary ID from the first URL
      const firstUrl = Object.values(documentsToMigrate)[0];
      const tempIdMatch = firstUrl.match(/\/temp-[^\/]+/);
      const tempId = tempIdMatch ? tempIdMatch[0].substring(1) : 'temp-unknown';
      
      console.log(`Using temporary ID for migration: ${tempId}`);
      
      // Call the backend API to migrate documents
      const response = await apiClient.post<{ updatedUrls: Record<string, string> }>(
        `/documents/migrate/${tempId}/${newClientId}`,
        { documentUrls: documentsToMigrate }
      );
      
      // Merge the updated URLs with the original document URLs
      const updatedDocumentUrls = { ...documentUrls, ...response.data.updatedUrls };
      console.log('Documents migrated successfully:', updatedDocumentUrls);
      
      return updatedDocumentUrls;
    } catch (error) {
      console.error('Error migrating documents:', error);
      // Return original URLs if migration fails
      return documentUrls;
    }
  },

  /**
   * Get an upload token for direct upload to Azure Blob Storage
   */
  async getUploadToken(
    clientId: string,
    documentType: string,
    fileName?: string
  ): Promise<{
    sasUrl: string;
    sasToken: string;
    blobUrl: string;
    blobName: string;
    containerName: string;
  }> {
    try {
      const queryParams = fileName ? `?fileName=${encodeURIComponent(fileName)}` : '';
      const response = await apiClient.get<{
        sasUrl: string;
        sasToken: string;
        blobUrl: string;
        blobName: string;
        containerName: string;
      }>(
        `/documents/upload-token/${clientId}/${documentType}${queryParams}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting upload token:', error);
      throw error;
    }
  },

  /**
   * Confirm a direct upload to Azure Blob Storage
   */
  async confirmUpload(
    clientId: string,
    documentType: string,
    uploadInfo: {
      blobName: string;
      blobUrl: string;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
    }
  ): Promise<{
    message: string;
    blobUrl: string;
    fileName: string;
    contentType: string;
    contentLength: number;
    createdOn: string;
  }> {
    try {
      const response = await apiClient.post<{
        message: string;
        blobUrl: string;
        fileName: string;
        contentType: string;
        contentLength: number;
        createdOn: string;
      }>(
        `/documents/confirm-upload/${clientId}/${documentType}`,
        uploadInfo
      );
      return response.data;
    } catch (error) {
      console.error('Error confirming upload:', error);
      throw error;
    }
  }
}; 
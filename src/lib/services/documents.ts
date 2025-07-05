'use client';

import { apiClient } from './api';

export interface UploadDocumentResponse {
  fileName: string;
  url: string;
}

export const documentService = {
  /**
   * Upload a document for a client
   */
  async uploadDocument(
    clientId: string,
    documentType: string,
    file: File
  ): Promise<UploadDocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<UploadDocumentResponse>(
      `/documents/upload/${clientId}/${documentType}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
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
   * Migrate documents from 'new-client' to the actual client ID
   * This is used when a new client is created and documents were uploaded before the client was saved
   */
  async migrateDocuments(
    newClientId: string,
    documentUrls: Record<string, string>
  ): Promise<Record<string, string>> {
    try {
      // Filter out document URLs that don't contain 'new-client' or 'temp-'
      const documentsToMigrate = Object.entries(documentUrls)
        .filter(([_, url]) => url && typeof url === 'string' && 
          (url.includes('new-client') || url.includes('/temp-')))
        .reduce((acc, [key, url]) => {
          acc[key] = url;
          return acc;
        }, {} as Record<string, string>);
      
      if (Object.keys(documentsToMigrate).length === 0) {
        console.log('No documents to migrate');
        return documentUrls; // Return original URLs if nothing to migrate
      }
      
      console.log('Migrating documents:', documentsToMigrate);
      
      // Call the backend API to migrate documents
      const response = await apiClient.post<{ updatedUrls: Record<string, string> }>(
        `/documents/migrate/new-client/${newClientId}`,
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
  }
}; 
'use client';

import apiClient, { formatApiUrl } from './api';

export interface UploadDocumentResponse {
  fileName: string;
  url: string;
  message: string;
}

export interface TokenResponse {
  token: string;
  url: string;
  expires: string;
}

export interface DeleteDocumentResponse {
  message: string;
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
      formatApiUrl(`/documents/upload/${clientId}/${documentType}`),
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
      
      console.log(`Getting token for document: ${clientId}/${documentType}/${baseFileName}`);
      
      // Get a public token for accessing the document
      const response = await apiClient.get<TokenResponse>(
        formatApiUrl(`/documents/token/${clientId}/${documentType}/${baseFileName}`)
      );
      
      console.log(`Token received successfully, URL: ${response.data.url}`);
      
      // Return the public URL with token
      return response.data.url;
    } catch (error: any) {
      console.error('Error getting secure document URL:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config?.url
      });
      
      // Generate a timestamp-based token for the fallback URL
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fallbackToken = `${timestamp}_${randomString}`;
      
      // Use the public endpoint as fallback instead of secure
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';
      const fallbackUrl = `${apiBase}/documents/public/${fallbackToken}/${clientId}/${documentType}/${fileName}`;
      
      console.log(`Using fallback URL: ${fallbackUrl}`);
      return fallbackUrl;
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
      const endpoint = formatApiUrl(`/documents/delete/${clientId}/${documentType}/${baseFileName}`);
      
      console.log(`DELETE request to endpoint: ${endpoint}`);
      
      // Make the request with debug logging
      try {
        const response = await apiClient.delete<DeleteDocumentResponse>(endpoint);
        console.log('Document deleted successfully:', response.data);
      } catch (apiError: any) {
        console.error('API error details:', {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          headers: apiError.response?.headers,
          config: apiError.config
        });
        throw apiError;
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
}; 
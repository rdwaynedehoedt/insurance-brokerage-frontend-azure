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
   * Note: This is now handled directly through the proxy endpoint,
   * so there's no need to request a special URL
   */
  getSecureDocumentUrl(
    clientId: string,
    documentType: string,
    fileName: string
  ): string {
    // Extract just the filename without path or query parameters
    const baseFileName = fileName.split('/').pop()?.split('?')[0] || fileName;
    
    // Return the secure endpoint URL
    return `${process.env.NEXT_PUBLIC_API_BASE}/documents/secure/${clientId}/${documentType}/${baseFileName}`;
  },
  
  /**
   * Delete a document
   */
  async deleteDocument(
    clientId: string,
    documentType: string,
    fileName: string
  ): Promise<void> {
    // Extract just the filename without path or query parameters
    const baseFileName = fileName.split('/').pop()?.split('?')[0] || fileName;
    
    await apiClient.delete(`/documents/delete/${clientId}/${documentType}/${baseFileName}`);
  }
}; 
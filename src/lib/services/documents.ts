import { apiClient } from './api';

// Define response types
interface UploadDocumentResponse {
  documentUrl: string;
  message: string;
  documentType: string;
  clientId: string;
}

interface GetDocumentUrlResponse {
  sasUrl: string;
  expiresIn: string;
}

interface DeleteDocumentResponse {
  message: string;
}

/**
 * Document service for handling document uploads and retrieval
 */
export const documentService = {
  /**
   * Upload a document for a client
   * @param clientId The client ID
   * @param documentType The type of document (nic_proof, dob_proof, etc.)
   * @param file The file to upload
   * @returns The document URL
   */
  async uploadDocument(clientId: string, documentType: string, file: File): Promise<string> {
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
    
    return response.data.documentUrl;
  },
  
  /**
   * Get a temporary URL for accessing a document
   * @param clientId The client ID
   * @param documentType The type of document
   * @param blobUrl The blob URL from the database
   * @returns A temporary SAS URL for accessing the document
   */
  async getDocumentUrl(clientId: string, documentType: string, blobUrl: string): Promise<string> {
    const response = await apiClient.get<GetDocumentUrlResponse>(`/documents/${clientId}/${documentType}/url`, {
      params: { blobUrl },
    });
    
    return response.data.sasUrl;
  },
  
  /**
   * Delete a document
   * @param clientId The client ID
   * @param documentType The type of document
   * @param blobUrl The blob URL to delete
   */
  async deleteDocument(clientId: string, documentType: string, blobUrl: string): Promise<void> {
    await apiClient.delete<DeleteDocumentResponse>(`/documents/${clientId}/${documentType}`, {
      params: { blobUrl },
    });
  },
}; 
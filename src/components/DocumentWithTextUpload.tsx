'use client';

import { useState } from 'react';
import DirectDocumentUpload from './DirectDocumentUpload';

interface DocumentWithTextUploadProps {
  clientId: string;
  documentType: string;
  label: string;
  existingDocUrl?: string;
  existingText?: string;
  onDocUploadSuccess: (documentUrl: string) => void;
  onTextChange: (text: string) => void;
  onFileSelected?: (documentType: string, file: File) => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

const DocumentWithTextUpload = ({
  clientId,
  documentType,
  label,
  existingDocUrl,
  existingText,
  onDocUploadSuccess,
  onTextChange,
  onFileSelected,
  onDelete,
  readOnly = false,
}: DocumentWithTextUploadProps) => {
  return (
    <div className="space-y-3">
      <DirectDocumentUpload
        clientId={clientId}
        documentType={documentType}
        label={`${label} Document`}
        existingUrl={existingDocUrl}
        onUploadSuccess={onDocUploadSuccess}
        onDelete={onDelete}
        readOnly={readOnly}
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} Text
        </label>
        <textarea
          value={existingText || ''}
          onChange={(e) => onTextChange(e.target.value)}
          disabled={readOnly}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
          placeholder={`Enter ${label} details here...`}
        />
      </div>
    </div>
  );
};

export default DocumentWithTextUpload; 

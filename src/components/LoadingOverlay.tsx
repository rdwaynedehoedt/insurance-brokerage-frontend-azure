'use client';

import React, { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  timeout?: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  message = 'Loading...', 
  timeout = 15000
}) => {
  const [showFallback, setShowFallback] = useState(false);
  const [forceDismiss, setForceDismiss] = useState(false);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLoading) {
      timer = setTimeout(() => {
        setShowFallback(true);
      }, timeout);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, timeout]);
  
  if (!isLoading || forceDismiss) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="text-3xl font-bold text-blue-700 mb-4">InsureMe Insurance</div>
      <div className="relative mb-4">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <p className="text-gray-600">{message}</p>
      
      {showFallback && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100 max-w-md">
          <p className="text-yellow-700 mb-2">This is taking longer than expected.</p>
          <p className="text-yellow-600 text-sm mb-3">There might be a connection issue with the server.</p>
          <button 
            onClick={() => setForceDismiss(true)}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded transition-colors"
          >
            Dismiss and continue
          </button>
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay; 

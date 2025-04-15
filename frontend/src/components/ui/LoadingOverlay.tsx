'use client';

import React from 'react';
import { Spinner } from './Spinner';

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50"
      role="alert"
      aria-busy="true"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 text-center">
        <Spinner size="lg" className="text-indigo-600 mb-4" />
        <p className="text-gray-900 font-medium">{message}</p>
      </div>
    </div>
  );
}; 
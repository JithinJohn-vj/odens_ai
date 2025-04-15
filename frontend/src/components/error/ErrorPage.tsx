'use client';

import React from 'react';
import { Button } from '@/components/ui';

export interface ErrorPageProps {
  title: string;
  message: string;
  showBack?: boolean;
  showDashboard?: boolean;
  onRefresh?: () => void;
}

export function ErrorPage({
  title,
  message,
  showBack = false,
  showDashboard = false,
  onRefresh,
}: ErrorPageProps) {
  const handleBack = () => {
    window.history.back();
  };

  const handleDashboard = () => {
    window.location.href = '/';
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center p-6 max-w-sm mx-auto">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{message}</p>
        <div className="space-x-4">
          {showBack && (
            <Button onClick={handleBack} variant="secondary">
              Go Back
            </Button>
          )}
          {showDashboard && (
            <Button onClick={handleDashboard}>Go to Dashboard</Button>
          )}
          <Button onClick={handleRefresh} variant="secondary">
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
} 
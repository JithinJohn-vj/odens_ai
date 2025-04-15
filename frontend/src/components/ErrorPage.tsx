import React from 'react';
import { Button } from './ui/Button';
import Link from 'next/link';

interface ErrorPageProps {
  title: string;
  message: string;
  statusCode?: number;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  title,
  message,
  statusCode,
}) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        {statusCode && (
          <h1 className="text-6xl font-bold text-primary">{statusCode}</h1>
        )}
        <h2 className="mt-4 text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-gray-600">{message}</p>
        <div className="mt-6">
          <Link href="/">
            <Button variant="primary">Go back home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}; 
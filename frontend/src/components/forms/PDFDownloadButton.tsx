'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { Quote } from '@/types';
import { quotesService } from '@/lib/services';
import { useToast } from '@/hooks/useToast';

interface PDFDownloadButtonProps {
  quote: Quote;
  className?: string;
}

export const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  quote,
  className = '',
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { showToast } = useToast();

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      console.log(`Requesting PDF for quote ID: ${quote.id}`);
      const blob = await quotesService.getQuotePDF(quote.id);

      if (!blob || blob.size === 0) {
          throw new Error('Received empty PDF data from server.');
      }

      console.log(`Received PDF blob, size: ${blob.size}`);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `quote-${quote.title || quote.id}.pdf`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log(`PDF download triggered for: ${filename}`);
      showToast('PDF download started.', 'success');

    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      showToast(error.message || 'Failed to download PDF.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      className={`flex items-center gap-2 ${className}`}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <>
         <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Downloading...
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Download PDF
        </>
      )}
    </Button>
  );
}; 
'use client';

import React, { useEffect, useState } from 'react';
import { QuoteGenerationForm } from '@/components/quote/QuoteGenerationForm';
import { quotesService, fileService } from '@/lib/services/quotes.service';
import { customersService } from '@/lib/services/customers.service';
import { Customer } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

// Define a type for the result passed back to the form
interface FileProcessResult {
  tempId: number; // Add temporary ID for correlation
  filePath: string;
  context?: Record<string, any>;
  error?: string;
  isLoading: boolean;
}

export default function CreateQuotePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        console.log('Fetching customers in useEffect...');
        setIsLoading(true);
        const data = await customersService.getAllCustomers();
        console.log('Fetched customers:', data);
        setCustomers(Array.isArray(data) ? data : []);
        setError(null); // Clear previous errors
      } catch (err) {
        console.error('Error in fetchCustomers:', err);
        setError('Failed to load customers. Please try again later.');
        setCustomers([]); // Ensure customers is an empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleSubmit = async (data: { customerId: number; quoteId: string }) => {
    // No longer navigates immediately.
    // The QuoteGenerationForm will handle UI changes.
    console.log(`Quote generation process completed in form for quote ${data.quoteId}`);
    // Optionally, you could add logic here if the parent page needs to react,
    // but for now, we let the form handle the button changes.
  };

  // Update function signature to accept File instead of FormData
  const handleFileUploadAndProcess = async (
    file: File,
    tempId: number,
    updateFileInfo: (result: FileProcessResult) => void
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('product_specs', JSON.stringify({})); // Empty specs for now
    
    let uploadPath = file.name;

    try {
      console.log(`Attempting to upload file: ${file.name} (Temp ID: ${tempId})`);

      const uploadResponse = await fileService.uploadQuoteFile(file);
      console.log('File upload response:', uploadResponse);

      if (uploadResponse.status === 'success' && uploadResponse.file_path) {
        uploadPath = uploadResponse.file_path;
        console.log(`Attempting to process file: ${uploadPath} (Temp ID: ${tempId})`);
        const processResponse = await fileService.processQuoteFile(uploadPath, {});
        console.log('File process response:', processResponse);

        updateFileInfo({
          tempId: tempId,
          filePath: uploadPath,
          context: processResponse.extracted_context,
          error: processResponse.error,
          isLoading: false,
        });
      } else {
        let uploadErrorMsg = 'File upload failed with unknown status';
        if (uploadResponse && typeof uploadResponse.status === 'string') {
          uploadErrorMsg = `File upload failed with status: ${uploadResponse.status}`;
        }
        if (uploadResponse && typeof uploadResponse.file_path === 'string') {
          uploadErrorMsg += ` (Path: ${uploadResponse.file_path})`;
        }
        throw new Error(uploadErrorMsg);
      }
    } catch (err: any) {
      console.error('Detailed file upload/process error:', err);
      updateFileInfo({
        tempId: tempId,
        filePath: uploadPath,
        error: err.message || 'Failed to upload or process file.',
        isLoading: false,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Create New Quote</h1>
            <p className="text-lg text-foreground/80">
              Generate a new quote using AI
            </p>
          </div>
          <Link href="/">
            <Button variant="secondary">Home</Button>
          </Link>
        </div>
      </header>

      {error && !isLoading && ( // Only show top-level error if not loading customers
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-foreground/70">Loading customers...</p>
        </div>
      ) : !customers || customers.length === 0 ? (
        <div className="text-center py-8 bg-yellow-50 p-4 rounded-md">
          <p className="text-yellow-700 font-medium">No customers found.</p>
          <p className="text-yellow-600 text-sm">Please add customers before creating a quote.</p>
          {/* Optional: Add a button to navigate to customer creation */}
          {/* <Button onClick={() => router.push('/customers')} variant="secondary" className="mt-4">Add Customer</Button> */}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <QuoteGenerationForm
            onSubmit={handleSubmit}
            customers={customers}
            // Pass the updated handler
            onFileUploadAndProcess={handleFileUploadAndProcess}
          />
        </div>
      )}
    </div>
  );
} 
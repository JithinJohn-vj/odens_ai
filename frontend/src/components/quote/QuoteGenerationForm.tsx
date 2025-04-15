'use client';

import React, { useState, useRef } from 'react';
import { ProductSpecificationForm, ProductSpecificationFormRef } from '@/components/forms';
import { Button, FileUpload } from '@/components/ui';
import { Customer } from '@/types';
import { quotesService } from '@/lib/services';
import type { ProductSpecification, CommunicationContext, CreateQuoteDto } from '@/lib/services/quotes.service';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { PDFDownloadButton } from '@/components/forms/PDFDownloadButton';
import { Quote } from '@/types';

interface FileProcessResult {
  tempId: number;
  filePath: string;
  context?: Record<string, any>;
  error?: string;
  isLoading: boolean;
}

interface QuoteGenerationFormProps {
  onSubmit: (data: { customerId: number; quoteId: string }) => Promise<void>;
  onCancel?: () => void;
  customers: Customer[];
  isLoading?: boolean;
  onFileUploadAndProcess: (file: File, tempId: number, updateFileInfo: (result: FileProcessResult) => void) => Promise<void>;
}

export function QuoteGenerationForm({
  onSubmit,
  onCancel,
  customers,
  isLoading: parentIsLoading = false,
  onFileUploadAndProcess,
}: QuoteGenerationFormProps) {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [uploadedFilesInfo, setUploadedFilesInfo] = useState<FileProcessResult[]>([]);
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const { showToast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);

  const defaultProductSpec: Omit<ProductSpecification, 'id' | 'quote_id'> = {
    description: '-',
    profile_type: '-',
    alloy: '6060',
    weight_per_meter: 0,
    total_length: 0,
    surface_treatment: 'raw',
    machining_complexity: 'low',
  };

  const defaultCommContext: Omit<CommunicationContext, 'id' | 'quote_id'> = {
    context_text: '-',
    extracted_urgency: 'Normal',
    custom_requests: '-',
    past_agreements: '-',
  };

  const productSpecFormRef = useRef<ProductSpecificationFormRef>(null);

  const updateFileInfo = (result: FileProcessResult) => {
    setUploadedFilesInfo(prev => {
      const existingIndex = prev.findIndex(info => info.tempId === result.tempId);
      let newState = prev;
      if (existingIndex > -1) {
        newState = [...prev];
        newState[existingIndex] = result;
      } else if (result.isLoading) {
        newState = [...prev, result];
      }
      
      setIsFileProcessing(newState.some(info => info.isLoading));
      
      return newState;
    });
  };

  const handleCustomerSelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCustomerId = parseInt(event.target.value);
    const customer = customers.find(c => c.id === selectedCustomerId) || null;
    setSelectedCustomer(customer);

    setQuoteId(null);
    setQuote(null);
    setUploadedFilesInfo([]);
    setIsGenerationComplete(false);
    setError(null);
    setIsLoading(false);
    setIsFileProcessing(false);
  };

  const handleFileUpload = async (file: File): Promise<void> => {
    if (!file) {
      setError('No file selected');
      return Promise.reject(new Error('No file selected'));
    }

    // Get current form data
    const productSpecDataFromForm = await productSpecFormRef.current?.getFormData();
    if (!productSpecDataFromForm) {
      setError('Please fill in the product specifications first');
      return Promise.reject(new Error('Product specifications required'));
    }

    const tempId = Date.now();
    updateFileInfo({ tempId: tempId, filePath: file.name, isLoading: true, error: undefined, context: undefined });

    try {
      // Pass the file directly instead of FormData
      await onFileUploadAndProcess(file, tempId, updateFileInfo);
    } catch (e) {
      console.log("Error during file upload/process handled by parent.");
    }
  };

  const handleGenerateQuote = async () => {
    // 1. Validate customer
    if (!selectedCustomer) {
      setError('Please select a customer.');
      return;
    }

    // 2. Trigger validation and get product spec data via ref
    const productSpecDataFromForm = await productSpecFormRef.current?.getFormData();

    // 3. Validate spec data
    if (!productSpecDataFromForm) {
      setError('Please correct errors in the Product Specifications form.');
      // Optionally scroll to the form
      return;
    }

    // 4. Extract communication context (same as before)
    const latestFileInfoWithContext = [...uploadedFilesInfo].reverse().find(info => !info.isLoading && !info.error && info.context);
    const communicationContextData: Omit<CommunicationContext, 'id' | 'quote_id'> = latestFileInfoWithContext?.context
      ? {
          context_text: latestFileInfoWithContext.context.context_text || 'Extracted from file',
          extracted_urgency: latestFileInfoWithContext.context.extracted_urgency || 'Normal',
          custom_requests: latestFileInfoWithContext.context.custom_requests || 'None',
          past_agreements: latestFileInfoWithContext.context.past_agreements || 'None',
        }
      : defaultCommContext; // Use default if none extracted

    // 5. Start processing
    setIsLoading(true);
    setError(null);
    setIsGenerationComplete(false);

    try {
      // 6. Prepare the full quote data for creation
      const quoteToCreate: CreateQuoteDto = {
        title: `Quote for ${selectedCustomer.company_name}`,
        reference_number: `REF-${Date.now()}`,
        validity_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: selectedCustomer.id,
        predicted_price: null,
        final_price: null,
        status: 'pending',
        product_specs: productSpecDataFromForm, // Use data from ref
        communication_context: communicationContextData,
      };

      console.log("Creating quote with data:", quoteToCreate);

      // 7. Call createQuote service
      const createdQuote = await quotesService.createQuote(quoteToCreate);

      if (!createdQuote?.id) {
        throw new Error('Failed to create quote in database.');
      }

      // 8. Update state on success
      setQuote(createdQuote);
      setQuoteId(createdQuote.id.toString());
      console.log('Quote created successfully:', createdQuote);
      showToast('Quote created and processed successfully!', 'success');
      setIsGenerationComplete(true);

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create quote.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      console.error('Error creating quote:', err);
      setIsGenerationComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedCustomer(null);
    setQuoteId(null);
    setQuote(null);
    setUploadedFilesInfo([]);
    setError(null);
    setIsGenerationComplete(false);
    setIsFileProcessing(false);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const selectElement = document.querySelector('select');
    if (selectElement) {
      selectElement.value = '';
    }
  };

  if (parentIsLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 my-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {!parentIsLoading && (
        <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-white">
          <h3 className="text-lg font-medium">1. Select Customer</h3>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedCustomer?.id || ''}
            onChange={handleCustomerSelect}
            disabled={isLoading || isGenerationComplete}
          >
            <option value="">Select a customer to start quote draft</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.company_name} - {customer.contact_person}
              </option>
            ))}
          </select>
          {isLoading && !quoteId && (
             <p className="text-sm text-gray-500 italic mt-2">Creating quote draft...</p>
          )}
        </div>
      )}

      {selectedCustomer && (
        <>
          <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium">2. Product Specification</h3>
            <ProductSpecificationForm
              ref={productSpecFormRef}
              initialData={defaultProductSpec}
              isProcessingFile={isLoading || isGenerationComplete}
            />
          </div>

          <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-medium">3. Upload Related Files (Optional)</h3>
            <FileUpload onUpload={handleFileUpload} disabled={isFileProcessing || isLoading || isGenerationComplete} />
            {uploadedFilesInfo.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadedFilesInfo.map((info) => (
                  <div key={info.tempId} className="p-3 border rounded-md bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{info.filePath}</span>
                      {info.isLoading && <span className="text-sm text-gray-500">Processing...</span>}
                    </div>
                    {info.error && (
                      <p className="text-sm text-red-600 mt-1">{info.error}</p>
                    )}
                    {info.context && !info.error && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Context extracted successfully</p>
                        <div className="mt-2 p-2 bg-gray-100 rounded">
                          <p className="font-medium">Urgency: {info.context.extracted_urgency}</p>
                          <p className="mt-1">Custom Requests: {info.context.custom_requests}</p>
                          <p className="mt-1">Past Agreements: {info.context.past_agreements}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            {!isGenerationComplete ? (
              <Button
                onClick={handleGenerateQuote}
                disabled={isLoading || isFileProcessing}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {isLoading ? 'Generating...' : 'Generate Quote'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleCreateNew}
                  variant="secondary"
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Create New Quote
                </Button>
                {quote && (
                  <PDFDownloadButton
                    quote={quote}
                    className="bg-green-600 text-white hover:bg-green-700"
                  />
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
} 
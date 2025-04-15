'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { quotesService } from '@/lib/services/quotes.service';
import { Quote } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';
import { CardSkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { PDFDownloadButton } from '@/components/forms/PDFDownloadButton';

export default function QuoteDetailPage() {
  const params = useParams();
  const quoteId = params.quoteId as string;
  const { showToast } = useToast();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quoteId) {
      setError('Quote ID not found in URL.');
      setIsLoading(false);
      return;
    }

    const fetchQuote = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log(`Fetching quote with ID: ${quoteId}`);
        const data = await quotesService.getQuoteById(quoteId);
        console.log('Fetched quote data:', data);
        setQuote(data);
      } catch (err: any) {
        console.error('Error fetching quote:', err);
        const errorMsg = err.response?.data?.detail || err.message || 'Failed to load quote details.';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        setQuote(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuote();
  }, [quoteId, showToast]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Quote Details</h1>
        <div className="flex space-x-2">
          {quote && <PDFDownloadButton quote={quote} />}
          <Link href="/quotes">
             <Button variant="secondary">Back to Quotes</Button>
          </Link>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          Error: {error}
        </div>
      ) : quote ? (
        <div className="space-y-6">
          {/* Basic Quote Info */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {quote.title || `Quote #${quote.id}`}
              </h3>
              <p className={`mt-1 text-sm font-medium ${quote.status === 'pending' ? 'text-yellow-600' : quote.status === 'draft' ? 'text-gray-500' : 'text-green-600'}`}>
                Status: {quote.status}
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Quote Number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{quote.reference_number || 'N/A'}</dd>
                </div>
                <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                   <dt className="text-sm font-medium text-gray-500">Customer</dt>
                   <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                     {quote.customer ? `${quote.customer.company_name} (${quote.customer.contact_person})` : 'N/A'}
                   </dd>
                 </div>
                <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Date Created</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(quote.created_at)}</dd>
                </div>
                <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Valid Until</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(quote.validity_date)}</dd>
                </div>
                 <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                   <dt className="text-sm font-medium text-gray-500">Predicted Price</dt>
                   <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{quote.predicted_price != null ? `$${quote.predicted_price.toFixed(2)}` : 'Pending'}</dd>
                 </div>
                 <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                   <dt className="text-sm font-medium text-gray-500">Final Price</dt>
                   <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{quote.final_price != null ? `$${quote.final_price.toFixed(2)}` : 'Pending'}</dd>
                 </div>
              </dl>
            </div>
          </div>

          {/* Product Specifications */}
          {quote.product_specs && quote.product_specs.length > 0 && (
             <div className="bg-white shadow rounded-lg overflow-hidden">
               <div className="px-4 py-5 sm:px-6">
                 <h3 className="text-lg leading-6 font-medium text-gray-900">Product Specifications</h3>
               </div>
               {quote.product_specs.map((spec, index) => (
                  <div key={spec.id || index} className={`border-t border-gray-200 px-4 py-5 sm:p-0 ${index > 0 ? 'mt-4' : ''}`}>
                     <dl className="sm:divide-y sm:divide-gray-200">
                        <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                           <dt className="text-sm font-medium text-gray-500">Description</dt>
                           <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{spec.description}</dd>
                        </div>
                        <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                           <dt className="text-sm font-medium text-gray-500">Profile Type</dt>
                           <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{spec.profile_type}</dd>
                        </div>
                         <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                           <dt className="text-sm font-medium text-gray-500">Alloy</dt>
                           <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{spec.alloy}</dd>
                        </div>
                         <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                           <dt className="text-sm font-medium text-gray-500">Weight/Meter</dt>
                           <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{spec.weight_per_meter} kg</dd>
                        </div>
                         <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                           <dt className="text-sm font-medium text-gray-500">Total Length</dt>
                           <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{spec.total_length} mm</dd>
                        </div>
                        <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                           <dt className="text-sm font-medium text-gray-500">Surface Treatment</dt>
                           <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">{spec.surface_treatment}</dd>
                        </div>
                         <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                           <dt className="text-sm font-medium text-gray-500">Machining Complexity</dt>
                           <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">{spec.machining_complexity}</dd>
                        </div>
                     </dl>
                  </div>
               ))}
             </div>
          )}

          {/* Communication Context */}
           {quote.communication_contexts && quote.communication_contexts.length > 0 && (
             <div className="bg-white shadow rounded-lg overflow-hidden">
               <div className="px-4 py-5 sm:px-6">
                 <h3 className="text-lg leading-6 font-medium text-gray-900">Communication Context</h3>
               </div>
               {quote.communication_contexts.map((comm, index) => (
                  <div key={comm.id || index} className={`border-t border-gray-200 px-4 py-5 sm:p-0 ${index > 0 ? 'mt-4' : ''}`}>
                     <dl className="sm:divide-y sm:divide-gray-200">
                        <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                           <dt className="text-sm font-medium text-gray-500">Context Text</dt>
                           <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{comm.context_text || 'N/A'}</dd>
                        </div>
                         <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                           <dt className="text-sm font-medium text-gray-500">Extracted Urgency</dt>
                           <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{comm.extracted_urgency || 'N/A'}</dd>
                        </div>
                         <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                           <dt className="text-sm font-medium text-gray-500">Custom Requests</dt>
                           <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{comm.custom_requests || 'N/A'}</dd>
                        </div>
                         <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                           <dt className="text-sm font-medium text-gray-500">Past Agreements</dt>
                           <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{comm.past_agreements || 'N/A'}</dd>
                        </div>
                     </dl>
                  </div>
               ))}
             </div>
           )}

        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-foreground/70">Quote not found.</p>
        </div>
      )}
    </div>
  );
} 
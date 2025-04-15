'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { QuoteCard } from '@/components/quote/QuoteCard';
import { quotesService } from '@/lib/services/quotes.service';
import { Quote, ApiQuote } from '@/types';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export default function Home() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchQuotes = useCallback(async (retryCount = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await quotesService.getAllQuotes();
      // The API returns an array directly
      if (Array.isArray(response)) {
        // Transform the service response to match our Quote type
        const transformedQuotes: Quote[] = response.map((quote: any) => ({
          id: quote.id,
          title: quote.title,
          status: quote.status,
          final_price: quote.final_price,
          predicted_price: quote.predicted_price,
          created_at: quote.created_at,
          updated_at: quote.updated_at,
          customer_id: quote.customer_id,
          reference_number: quote.reference_number,
          validity_date: quote.validity_date,
          product_specs: quote.product_specs || [],
          communication_contexts: quote.communication_contexts || [],
          customer: quote.customer
        }));
        setQuotes(transformedQuotes);
      } else {
        setQuotes([]);
        setError('Invalid response format from server');
        showToast('Failed to load quotes: Invalid response format');
      }
    } catch (err: any) {
      console.error('Error fetching quotes:', err);
      
      // Check if it's a rate limit error
      if (err.message?.includes('Rate limit exceeded') && retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        setTimeout(() => fetchQuotes(retryCount + 1), delay);
        return;
      }

      setQuotes([]);
      setError('Failed to load quotes');
      showToast('Failed to load quotes. Please try again later.');
    } finally {
      if (retryCount === 0) {
        setIsLoading(false);
      }
    }
  }, []); // Empty dependency array since we don't need any dependencies

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]); // Only depends on the stable fetchQuotes function

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground/70">Loading quotes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quotes</h1>
        <div className="flex gap-4">
          <Button variant="secondary">
            <Link href="/customers">View Customers</Link>
          </Button>
          <Button>
            <Link href="/quotes/create">Create New Quote</Link>
          </Button>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-foreground/70">No quotes found. Create your first quote!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quotes.map((quote) => (
            <QuoteCard 
              key={quote.id} 
              quote={quote}
              onViewDetails={() => window.location.href = `/quotes/${quote.id}`}
              onDelete={async () => {
                try {
                  await quotesService.deleteQuote(quote.id);
                  setQuotes(quotes.filter(q => q.id !== quote.id));
                  showToast('Quote deleted successfully');
                } catch (err) {
                  showToast('Failed to delete quote');
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

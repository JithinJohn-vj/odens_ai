'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layouts';
import { QuotePreview, PDFDownloadButton } from '@/components/forms';
import { QuoteCard } from '@/components/quote/QuoteCard';

export default function PreviewQuotesPage() {
  const handleViewDetails = (id: string) => {
    // TODO: Implement view details
  };

  const handleEdit = (id: string) => {
    // TODO: Implement edit
  };

  const handleDelete = (id: string) => {
    // TODO: Implement delete
  };

  const mockQuote = {
    id: "1",
    title: "Sample Quote",
    status: "draft",
    totalAmount: 0,
    createdAt: new Date().toISOString(),
    items: [],
    customer: {
      id: 1,
      companyName: "Sample Company",
      contactName: "Sample Contact",
      email: "sample@example.com",
      phone: "123-456-7890"
    },
    quoteNumber: "Q-2024-001",
    date: new Date().toISOString(),
    productSpecifications: [],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    communicationContext: []
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Preview Quotes</h1>
        <p className="text-lg text-foreground/80">
          View and manage your generated quotes
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* TODO: Add quote list from API */}
        <QuoteCard
          quote={mockQuote}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
} 
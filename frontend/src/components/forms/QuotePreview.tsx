'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { Quote } from '@/types';

interface QuotePreviewProps {
  quote: Quote;
  className?: string;
}

export const QuotePreview: React.FC<QuotePreviewProps> = ({
  quote,
  className = '',
}) => {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold">Quote Preview</h2>
          <p className="text-gray-500">Review your quote before finalizing</p>
        </div>

        {/* Customer Information */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Company Name</p>
              <p className="font-medium">{quote.customer.companyName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact Person</p>
              <p className="font-medium">{quote.customer.contactName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{quote.customer.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{quote.customer.phone}</p>
            </div>
          </div>
        </div>

        {/* Quote Details */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Quote Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Quote Number</p>
              <p className="font-medium">{quote.quoteNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{new Date(quote.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Valid Until</p>
              <p className="font-medium">{new Date(quote.validUntil).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">{quote.status}</p>
            </div>
          </div>
        </div>

        {/* Product Specifications */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Product Specifications</h3>
          <div className="space-y-4">
            {quote.productSpecifications.map((spec, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{spec.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Profile Type</p>
                    <p className="font-medium">{spec.profile_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Alloy</p>
                    <p className="font-medium">{spec.alloy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Weight per Meter</p>
                    <p className="font-medium">{spec.weight_per_meter} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Length</p>
                    <p className="font-medium">{spec.total_length} m</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Surface Treatment</p>
                    <p className="font-medium">{spec.surface_treatment}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Machining Complexity</p>
                    <p className="font-medium">{spec.machining_complexity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Communication Context */}
        {quote.communicationContext.map((context, index) => (
          <div key={index} className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Communication Context {index + 1}</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-gray-500">Context</p>
                <p className="font-medium whitespace-pre-wrap">{context.context_text}</p>
              </div>
              {context.extracted_urgency && (
                <div>
                  <p className="text-sm text-gray-500">Urgency</p>
                  <p className="font-medium">{context.extracted_urgency}</p>
                </div>
              )}
              {context.custom_requests && (
                <div>
                  <p className="text-sm text-gray-500">Custom Requests</p>
                  <p className="font-medium">{context.custom_requests}</p>
                </div>
              )}
              {context.past_agreements && (
                <div>
                  <p className="text-sm text-gray-500">Past Agreements</p>
                  <p className="font-medium">{context.past_agreements}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Total */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total Amount</span>
            <span className="text-2xl font-bold">
              ${quote.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}; 
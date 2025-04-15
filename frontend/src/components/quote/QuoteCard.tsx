import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { Quote } from '@/types';

interface QuoteCardProps {
  quote: Quote;
  onViewDetails: (quoteId: string) => void;
  onDelete: (quoteId: string) => void;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  onViewDetails,
  onDelete,
}) => {
  return (
    <div
      data-testid="quote-card"
      className="rounded-lg border bg-card text-card-foreground shadow-sm w-full max-w-md hover:shadow-lg transition-shadow"
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">{quote.title}</h3>
          <Badge variant={quote.status === 'approved' ? 'success' : 'default'}>
            {quote.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Amount:</span>
            <span className="font-medium">{formatCurrency(quote.final_price || quote.predicted_price || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Created:</span>
            <span className="text-sm">
              {new Date(quote.created_at).toLocaleDateString()}
            </span>
          </div>
          {quote.validity_date && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valid Until:</span>
              <span className="text-sm">
                {new Date(quote.validity_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onViewDetails(quote.id)}
        >
          View Details
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(quote.id)}
        >
          Delete
        </Button>
      </CardFooter>
    </div>
  );
}; 
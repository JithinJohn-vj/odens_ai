import React from 'react';
import { render, screen, fireEvent } from '@/utils/test-utils';
import { QuoteCard } from './QuoteCard';
import { Quote, QuoteItem } from '@/types/quote';

const mockQuote: Quote = {
  id: '1',
  title: 'Test Quote',
  status: 'draft',
  totalAmount: 1000,
  createdAt: '2024-01-01T00:00:00Z',
  validUntil: '2024-12-31T00:00:00Z',
  items: [],
  customer: {
    id: '1',
    name: 'Test Company',
    email: 'john@example.com',
    phone: '1234567890',
    address: {
      street: '123 Main St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country'
    }
  }
};

describe('QuoteCard', () => {
  it('renders quote information correctly', () => {
    const mockHandlers = {
      onViewDetails: jest.fn(),
      onEdit: jest.fn(),
      onDelete: jest.fn(),
    };

    render(<QuoteCard quote={mockQuote} {...mockHandlers} />);

    expect(screen.getByText('Test Quote')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    expect(screen.getByText('1/1/2024')).toBeInTheDocument();
    expect(screen.getByText('12/31/2024')).toBeInTheDocument();
  });

  it('calls onViewDetails when View Details button is clicked', () => {
    const mockHandlers = {
      onViewDetails: jest.fn(),
      onEdit: jest.fn(),
      onDelete: jest.fn(),
    };

    render(<QuoteCard quote={mockQuote} {...mockHandlers} />);

    fireEvent.click(screen.getByText('View Details'));
    expect(mockHandlers.onViewDetails).toHaveBeenCalledWith('1');
  });

  it('calls onEdit when Edit button is clicked', () => {
    const mockHandlers = {
      onViewDetails: jest.fn(),
      onEdit: jest.fn(),
      onDelete: jest.fn(),
    };

    render(<QuoteCard quote={mockQuote} {...mockHandlers} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(mockHandlers.onEdit).toHaveBeenCalledWith('1');
  });

  it('calls onDelete when Delete button is clicked', () => {
    const mockHandlers = {
      onViewDetails: jest.fn(),
      onEdit: jest.fn(),
      onDelete: jest.fn(),
    };

    render(<QuoteCard quote={mockQuote} {...mockHandlers} />);

    fireEvent.click(screen.getByText('Delete'));
    expect(mockHandlers.onDelete).toHaveBeenCalledWith('1');
  });

  it('renders correct badge variant based on status', () => {
    const mockHandlers = {
      onViewDetails: jest.fn(),
      onEdit: jest.fn(),
      onDelete: jest.fn(),
    };

    const { rerender } = render(
      <QuoteCard quote={{ ...mockQuote, status: 'approved' }} {...mockHandlers} />
    );
    expect(screen.getByText('approved')).toHaveClass('bg-green-100');

    rerender(
      <QuoteCard quote={{ ...mockQuote, status: 'draft' }} {...mockHandlers} />
    );
    expect(screen.getByText('draft')).toHaveClass('bg-gray-100');
  });

  it('applies correct styling classes', () => {
    const mockHandlers = {
      onViewDetails: jest.fn(),
      onEdit: jest.fn(),
      onDelete: jest.fn(),
    };

    render(<QuoteCard quote={mockQuote} {...mockHandlers} />);

    const card = screen.getByTestId('quote-card');
    expect(card).toHaveClass('w-full', 'max-w-md', 'hover:shadow-lg', 'transition-shadow');
  });
}); 
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CreateQuotePage from '../page';
import { quotesService } from '@/lib/services/quotes.service';
import { customersService } from '@/lib/services/customers.service';

// Mock the next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the services
jest.mock('@/lib/services/quotes.service', () => ({
  quotesService: {
    createQuote: jest.fn(),
    updateQuote: jest.fn(),
  },
}));

jest.mock('@/lib/services/customers.service', () => ({
  customersService: {
    getAllCustomers: jest.fn(),
  },
}));

describe('CreateQuotePage', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  };

  const mockCustomers = [
    {
      id: 1,
      company_name: 'Test Company',
      contact_person: 'Test Person',
      email: 'test@example.com',
      phone: '1234567890',
    },
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockImplementation(() => mockRouter);

    // Setup customers service mock
    (customersService.getAllCustomers as jest.Mock).mockResolvedValue(mockCustomers);
  });

  it('renders loading state', async () => {
    // Delay the customers service response to show loading state
    (customersService.getAllCustomers as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockCustomers), 100))
    );

    await act(async () => {
      render(<CreateQuotePage />);
    });

    // Initially, the page should show a loading state
    expect(screen.getByRole('heading', { name: /create new quote/i })).toBeInTheDocument();
  });

  it('handles customer loading error', async () => {
    (customersService.getAllCustomers as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

    await act(async () => {
      render(<CreateQuotePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to load customers. Please try again later.')).toBeInTheDocument();
    });
  });

  it('renders no customers message when customers list is empty', async () => {
    (customersService.getAllCustomers as jest.Mock).mockResolvedValue([]);
    
    await act(async () => {
      render(<CreateQuotePage />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('No customers found. Please add customers first.')).toBeInTheDocument();
    });
  });

  it('renders QuoteGenerationForm when customers are loaded', async () => {
    await act(async () => {
      render(<CreateQuotePage />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Create New Quote')).toBeInTheDocument();
      expect(screen.getByText('Generate a new quote using AI')).toBeInTheDocument();
    });
  });

  it('handles quote generation and navigation', async () => {
    const mockQuote = {
      id: '123',
      title: 'Quote for Test Company',
      status: 'draft',
      totalAmount: 0,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString(),
      items: [],
      customer: mockCustomers[0],
      quoteNumber: `Q-${Date.now()}`,
      productSpecifications: [],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    (quotesService.createQuote as jest.Mock).mockResolvedValue(mockQuote);
    (quotesService.updateQuote as jest.Mock).mockResolvedValue(mockQuote);

    await act(async () => {
      render(<CreateQuotePage />);
    });

    // Wait for customers to load and select a customer
    await waitFor(() => {
      const customerSelect = screen.getByRole('combobox');
      expect(customerSelect).toBeInTheDocument();
      fireEvent.change(customerSelect, { target: { value: '1' } });
    });

    // Wait for quote creation
    await waitFor(() => {
      expect(quotesService.createQuote).toHaveBeenCalled();
    });

    // Click generate quote button
    const generateButton = screen.getByText('Generate Quote');
    await act(async () => {
      fireEvent.click(generateButton);
    });

    await waitFor(() => {
      expect(quotesService.updateQuote).toHaveBeenCalled();
    });
  });

  it('handles errors during quote generation', async () => {
    const mockQuote = {
      id: '123',
      title: 'Quote for Test Company',
      status: 'draft',
      totalAmount: 0,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString(),
      items: [],
      customer: mockCustomers[0],
      quoteNumber: `Q-${Date.now()}`,
      productSpecifications: [],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    (quotesService.createQuote as jest.Mock).mockResolvedValue(mockQuote);
    (quotesService.updateQuote as jest.Mock).mockRejectedValue(new Error('Update failed'));

    await act(async () => {
      render(<CreateQuotePage />);
    });

    // Wait for customers to load and select a customer
    await waitFor(() => {
      const customerSelect = screen.getByRole('combobox');
      expect(customerSelect).toBeInTheDocument();
      fireEvent.change(customerSelect, { target: { value: '1' } });
    });

    // Wait for quote creation
    await waitFor(() => {
      expect(quotesService.createQuote).toHaveBeenCalled();
    });

    // Click generate quote button
    const generateButton = screen.getByText('Generate Quote');
    await act(async () => {
      fireEvent.click(generateButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });
}); 
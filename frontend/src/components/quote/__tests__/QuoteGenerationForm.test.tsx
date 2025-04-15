import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { QuoteGenerationForm } from '../QuoteGenerationForm';
import { quotesService, fileService } from '@/lib/services';
import { Customer } from '@/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';

// Mock the services
jest.mock('@/lib/services', () => ({
  quotesService: {
    createQuote: jest.fn(),
    updateQuote: jest.fn(),
  },
  fileService: {
    uploadQuoteFile: jest.fn(),
    processQuoteFile: jest.fn(),
  },
}));

// Mock the useToast hook
jest.mock('@/hooks/useToast', () => ({
  useToast: jest.fn(),
}));

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('QuoteGenerationForm', () => {
  const mockCustomers: Customer[] = [
    {
      id: 1,
      company_name: 'Test Company 1',
      contact_person: 'John Doe',
      email: 'test1@example.com',
      phone: '1234567890',
      address: '123 Test St',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      company_name: 'Test Company 2',
      contact_person: 'Jane Smith',
      email: 'test2@example.com',
      phone: '0987654321',
      address: '456 Test St',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnFileUploadAndProcess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ showToast: jest.fn() });
    (quotesService.createQuote as jest.Mock).mockResolvedValue({ id: 'test-quote-id' });
  });

  it('renders customer selection dropdown', () => {
    render(
      <QuoteGenerationForm
        customers={mockCustomers}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onFileUploadAndProcess={mockOnFileUploadAndProcess}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Select a customer')).toBeInTheDocument();
  });

  it('handles customer selection', async () => {
    render(
      <QuoteGenerationForm
        customers={mockCustomers}
        onSubmit={mockOnSubmit}
        onFileUploadAndProcess={mockOnFileUploadAndProcess}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    await waitFor(() => {
      expect(quotesService.createQuote).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: 1,
          product_specs: expect.objectContaining({
            description: "Test Product",
            profile_type: "Custom",
            alloy: "6060",
          }),
        })
      );
    });
  });

  it('handles file upload', async () => {
    // Mock the process step as well for this test
    (fileService.processQuoteFile as jest.Mock).mockResolvedValue({ extracted_context: { test: 'data' } });

    render(
      <QuoteGenerationForm
        customers={mockCustomers}
        onSubmit={mockOnSubmit}
        onFileUploadAndProcess={mockOnFileUploadAndProcess}
      />
    );

    // Select a customer first
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    // Wait for quote creation
    await waitFor(() => {
      expect(quotesService.createQuote).toHaveBeenCalled();
    });

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    // Wait for the file input to be present
    const fileInput = await waitFor(() => screen.getByTestId('file-input'));
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnFileUploadAndProcess).toHaveBeenCalledWith(file, expect.any(Function));
    });
  });

  it('handles quote generation', async () => {
    (quotesService.updateQuote as jest.Mock).mockResolvedValue({ id: 'test-quote-id' });

    render(
      <QuoteGenerationForm
        customers={mockCustomers}
        onSubmit={mockOnSubmit}
        onFileUploadAndProcess={mockOnFileUploadAndProcess}
      />
    );

    // Select a customer first
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    // Wait for quote creation
    await waitFor(() => {
      expect(quotesService.createQuote).toHaveBeenCalled();
    });

    // Click generate quote button
    const generateButton = screen.getByText(/Generate Quote/i);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(quotesService.updateQuote).toHaveBeenCalledWith(
        'test-quote-id',
        expect.objectContaining({
          status: 'pending',
          productSpecifications: expect.arrayContaining([
            expect.objectContaining({
              description: 'Test Product',
              profile_type: 'Custom',
              alloy: '6060',
              weight_per_meter: 0,
              total_length: 0,
              surface_treatment: 'raw',
              machining_complexity: 'low'
            })
          ]),
          communicationContext: expect.arrayContaining([
            expect.objectContaining({
              context_text: '-',
              extracted_urgency: 'Normal',
              custom_requests: '-',
              past_agreements: '-'
            })
          ])
        })
      );
      expect(mockOnSubmit).toHaveBeenCalledWith({
        customerId: 1,
        quoteId: 'test-quote-id',
      });
    });
  });

  it('handles errors during quote generation', async () => {
    (quotesService.updateQuote as jest.Mock).mockRejectedValue(new Error('Update failed'));

    render(
      <QuoteGenerationForm
        customers={mockCustomers}
        onSubmit={mockOnSubmit}
        onFileUploadAndProcess={mockOnFileUploadAndProcess}
      />
    );

    // Select a customer first
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    // Wait for quote creation
    await waitFor(() => {
      expect(quotesService.createQuote).toHaveBeenCalled();
    });

    // Click generate quote button
    const generateButton = screen.getByText(/Generate Quote/i);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });
}); 
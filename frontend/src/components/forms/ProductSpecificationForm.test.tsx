import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductSpecificationForm } from './ProductSpecificationForm';

// Mock the products service
jest.mock('@/lib/services/products.service', () => ({
  productsService: {
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
  },
}));

describe('ProductSpecificationForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<ProductSpecificationForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/profile type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/alloy/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/weight per meter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total length/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/surface treatment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/machining complexity/i)).toBeInTheDocument();
  });

  it('submits form data', async () => {
    render(<ProductSpecificationForm onSubmit={mockOnSubmit} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test Description' },
    });
    fireEvent.change(screen.getByLabelText(/profile type/i), {
      target: { value: 'Test Profile' },
    });
    fireEvent.change(screen.getByLabelText(/alloy/i), {
      target: { value: '6060' },
    });
    fireEvent.change(screen.getByLabelText(/weight per meter/i), {
      target: { value: '2.5' },
    });
    fireEvent.change(screen.getByLabelText(/total length/i), {
      target: { value: '1000' },
    });
    fireEvent.change(screen.getByLabelText(/surface treatment/i), {
      target: { value: 'anodized' },
    });
    fireEvent.change(screen.getByLabelText(/machining complexity/i), {
      target: { value: 'medium' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save specification details/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        description: 'Test Description',
        profile_type: 'Test Profile',
        alloy: '6060',
        weight_per_meter: 2.5,
        total_length: 1000,
        surface_treatment: 'anodized',
        machining_complexity: 'medium',
      });
    });
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<ProductSpecificationForm onSubmit={mockOnSubmit} />);

    // Submit empty form
    const submitButton = screen.getByRole('button', { name: /save specification details/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/profile type is required/i)).toBeInTheDocument();
      expect(screen.getByText(/alloy is required/i)).toBeInTheDocument();
      expect(screen.getByText(/weight per meter is required/i)).toBeInTheDocument();
      expect(screen.getByText(/total length is required/i)).toBeInTheDocument();
      expect(screen.getByText(/surface treatment is required/i)).toBeInTheDocument();
      expect(screen.getByText(/machining complexity is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
}); 
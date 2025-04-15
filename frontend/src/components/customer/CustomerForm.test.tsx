import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerForm } from './CustomerForm';

describe('CustomerForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<CustomerForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add customer/i })).toBeInTheDocument();
  });

  it('updates form state when input values change', async () => {
    render(<CustomerForm onSubmit={mockOnSubmit} />);

    const companyInput = screen.getByLabelText('Company Name');
    const contactInput = screen.getByLabelText('Contact Person');
    const emailInput = screen.getByLabelText('Email');
    const phoneInput = screen.getByLabelText('Phone');
    const addressInput = screen.getByLabelText('Address');

    fireEvent.change(companyInput, { target: { value: 'Test Company' } });
    fireEvent.change(contactInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(addressInput, { target: { value: '123 Test St' } });

    await waitFor(() => {
      expect(companyInput).toHaveValue('Test Company');
      expect(contactInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('john@example.com');
      expect(phoneInput).toHaveValue('1234567890');
      expect(addressInput).toHaveValue('123 Test St');
    });
  });

  it('calls onSubmit with form data when submitted', async () => {
    render(<CustomerForm onSubmit={mockOnSubmit} />);

    const companyInput = screen.getByLabelText('Company Name');
    const contactInput = screen.getByLabelText('Contact Person');
    const emailInput = screen.getByLabelText('Email');
    const phoneInput = screen.getByLabelText('Phone');
    const addressInput = screen.getByLabelText('Address');

    fireEvent.change(companyInput, { target: { value: 'Test Company' } });
    fireEvent.change(contactInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(addressInput, { target: { value: '123 Test St' } });

    fireEvent.click(screen.getByText('Add Customer'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        company_name: 'Test Company',
        contact_person: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        address: '123 Test St',
      });
    });
  });

  it('resets form after submission', async () => {
    render(<CustomerForm onSubmit={mockOnSubmit} />);

    const companyInput = screen.getByLabelText('Company Name');
    const contactInput = screen.getByLabelText('Contact Person');
    const emailInput = screen.getByLabelText('Email');
    const phoneInput = screen.getByLabelText('Phone');
    const addressInput = screen.getByLabelText('Address');

    fireEvent.change(companyInput, { target: { value: 'Test Company' } });
    fireEvent.change(contactInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(addressInput, { target: { value: '123 Test St' } });

    fireEvent.click(screen.getByText('Add Customer'));

    await waitFor(() => {
      expect(companyInput).toHaveValue('');
      expect(contactInput).toHaveValue('');
      expect(emailInput).toHaveValue('');
      expect(phoneInput).toHaveValue('');
      expect(addressInput).toHaveValue('');
    });
  });

  it('validates required fields', () => {
    render(<CustomerForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /add customer/i });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', () => {
    render(<CustomerForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { name: 'email', value: 'invalid-email' } });

    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('validates phone format', () => {
    render(<CustomerForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByLabelText(/phone/i);
    expect(phoneInput).toHaveAttribute('type', 'tel');
  });
}); 
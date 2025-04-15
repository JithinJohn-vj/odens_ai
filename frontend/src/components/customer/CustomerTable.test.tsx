import React from 'react';
import { render, screen } from '@/utils/test-utils';
import { CustomerTable } from './CustomerTable';
import { Customer } from '@/types';

describe('CustomerTable', () => {
  const mockCustomers: Customer[] = [
    {
      id: 1,
      companyName: 'Test Company 1',
      contactName: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890'
    },
    {
      id: 2,
      companyName: 'Test Company 2',
      contactName: 'Jane Smith',
      email: 'jane@example.com',
      phone: '0987654321'
    }
  ];

  it('renders table with correct headers', () => {
    render(<CustomerTable customers={mockCustomers} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders customer data correctly', () => {
    render(<CustomerTable customers={mockCustomers} />);

    // Check first customer
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('Test Company 1')).toBeInTheDocument();

    // Check second customer
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('0987654321')).toBeInTheDocument();
    expect(screen.getByText('Test Company 2')).toBeInTheDocument();
  });

  it('renders view links for each customer', () => {
    render(<CustomerTable customers={mockCustomers} />);

    const viewLinks = screen.getAllByText('View');
    expect(viewLinks).toHaveLength(2);

    // Check that links have correct href attributes
    expect(viewLinks[0]).toHaveAttribute('href', '/customers/1');
    expect(viewLinks[1]).toHaveAttribute('href', '/customers/2');
  });

  it('handles empty customers array', () => {
    render(<CustomerTable customers={[]} />);

    // Table headers should still be present
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // No customer rows should be present
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<CustomerTable customers={mockCustomers} />);

    const table = screen.getByRole('table');
    expect(table).toHaveClass('min-w-full', 'divide-y', 'divide-gray-200');

    const rowgroups = screen.getAllByRole('rowgroup');
    expect(rowgroups[0]).toHaveClass('bg-gray-50'); // thead
    expect(rowgroups[1]).toHaveClass('bg-white', 'divide-y', 'divide-gray-200'); // tbody
  });

  it('renders table within a scrollable container', () => {
    render(<CustomerTable customers={mockCustomers} />);

    const container = screen.getByTestId('customer-table-container');
    expect(container).toHaveClass('overflow-x-auto');
  });
}); 
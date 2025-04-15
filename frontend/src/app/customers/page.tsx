'use client';

import React, { useEffect, useState } from 'react';
import { CustomerForm } from '@/components/customer/CustomerForm';
import { CustomerTable } from '@/components/customer/CustomerTable';
import { customersService, transformCustomerToApiCustomer } from '@/lib/services/customers.service';
import { Customer, CustomerDto } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customersService.getAllCustomers();
      setCustomers(data);
    } catch (error) {
      showToast('Failed to load customers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = async (formData: CustomerDto) => {
    try {
      console.log('Form data:', formData);
      const customerData = transformCustomerToApiCustomer(formData);
      console.log('Transformed customer data:', customerData);
      const newCustomer = await customersService.createCustomer(customerData);
      console.log('Created customer:', newCustomer);
      setCustomers(prev => [...prev, newCustomer]);
      showToast('Customer added successfully', 'success');
    } catch (err) {
      console.error('Error in handleAddCustomer:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add customer';
      showToast(errorMessage, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex gap-4">
          <Link href="/">
            <Button variant="secondary">Home</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Add New Customer</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <CustomerForm onSubmit={handleAddCustomer} />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-foreground/70">Loading customers...</p>
        </div>
      ) : !customers || customers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-foreground/70">No customers found</p>
        </div>
      ) : (
        <CustomerTable customers={customers} />
      )}
    </div>
  );
} 
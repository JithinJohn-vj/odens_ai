'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { customersService } from '@/lib/services/customers.service';
import { Customer } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';
import { CardSkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui';

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.customerId as string;
  const { showToast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) {
      setError('Customer ID not found in URL.');
      setIsLoading(false);
      return;
    }

    const fetchCustomer = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await customersService.getCustomerById(parseInt(customerId));
        setCustomer(data);
      } catch (err: any) {
        console.error('Error fetching customer:', err);
        const errorMsg = err.response?.data?.detail || err.message || 'Failed to load customer details.';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        setCustomer(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId, showToast]);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Customer Details</h1>
        <div className="flex space-x-2">
          <Link href="/customers">
            <Button variant="secondary">Back to Customers</Button>
          </Link>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          Error: {error}
        </div>
      ) : customer ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {customer.company_name}
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{customer.contact_person}</dd>
              </div>
              <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{customer.email}</dd>
              </div>
              <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{customer.phone || 'N/A'}</dd>
              </div>
              {customer.address && (
                <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{customer.address}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
} 
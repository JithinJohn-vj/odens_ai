'use client';

import React, { useState } from 'react';
import { Input, TextArea, Button } from '@/components/ui';
import { useAppDispatch } from '@/store';
import { setError } from '@/store/quotesSlice';
import { Customer } from '@/types';

interface QuoteFormProps {
  customer: Customer;
  onSubmit: (data: {
    specifications: string;
    context: string;
  }) => Promise<void>;
  initialData?: {
    specifications: string;
    context: string;
  };
}

export const QuoteForm: React.FC<QuoteFormProps> = ({
  customer,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    specifications: initialData?.specifications || '',
    context: initialData?.context || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useAppDispatch();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.specifications) {
      newErrors.specifications = 'Product specifications are required';
    }
    if (!formData.context) {
      newErrors.context = 'Communication context is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await onSubmit(formData);
    } catch (error) {
      dispatch(setError('Failed to save quote details'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-gray-500">Customer</h3>
        <div className="mt-1">
          <div className="font-medium">{customer.companyName}</div>
          <div className="text-sm text-gray-600">{customer.contactName}</div>
          <div className="text-sm text-gray-600">{customer.email}</div>
          {customer.phone && (
            <div className="text-sm text-gray-500">{customer.phone}</div>
          )}
        </div>
      </div>

      <TextArea
        label="Product Specifications"
        name="specifications"
        value={formData.specifications}
        onChange={handleInputChange}
        error={errors.specifications}
        placeholder="Enter detailed product specifications..."
        rows={6}
        required
      />

      <TextArea
        label="Communication Context"
        name="context"
        value={formData.context}
        onChange={handleInputChange}
        error={errors.context}
        placeholder="Enter any relevant communication context..."
        rows={4}
        required
      />

      <div className="flex justify-end">
        <Button
          type="submit"
          isLoading={isLoading}
        >
          {initialData ? 'Update Quote' : 'Create Quote'}
        </Button>
      </div>
    </form>
  );
}; 
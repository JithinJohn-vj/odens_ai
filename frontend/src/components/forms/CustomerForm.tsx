'use client';

import React, { useState, useEffect } from 'react';
import { Input, Button } from '@/components/ui';
import { customersService } from '@/lib/services';
import { Customer } from '@/types';
import { useAppDispatch } from '@/store';
import { setError } from '@/store/quotesSlice';

interface CustomerFormProps {
  onCustomerSelect: (customer: Customer) => void;
  selectedCustomer?: Customer;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  onCustomerSelect,
  selectedCustomer,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useAppDispatch();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customersService.getAllCustomers();
      setCustomers(data);
    } catch (error) {
      dispatch(setError('Failed to fetch customers'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.company_name) newErrors.company_name = 'Company name is required';
    if (!formData.contact_person) newErrors.contact_person = 'Contact person is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const newCustomer = await customersService.createCustomer(formData);
      onCustomerSelect(newCustomer);
      setCustomers(prev => [...prev, newCustomer]);
      setIsCreating(false);
      setFormData({ company_name: '', contact_person: '', email: '', phone: '', address: '' });
    } catch (error) {
      dispatch(setError('Failed to create customer'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isCreating ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Select Customer</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCreating(true)}
            >
              Create New Customer
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-4">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No customers found. Create a new one.
            </div>
          ) : (
            <div className="grid gap-2">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    selectedCustomer?.id === customer.id ? 'border-primary' : 'border-gray-200'
                  }`}
                  onClick={() => onCustomerSelect(customer)}
                >
                  <h4 className="font-medium">{customer.companyName}</h4>
                  <p className="text-sm text-gray-600">{customer.contactName}</p>
                  <p className="text-sm text-gray-600">{customer.email}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <h3 className="text-lg font-medium">Create New Customer</h3>
          
          <Input
            label="Company Name"
            name="company_name"
            value={formData.company_name}
            onChange={handleInputChange}
            error={errors.company_name}
            required
          />
          
          <Input
            label="Contact Person"
            name="contact_person"
            value={formData.contact_person}
            onChange={handleInputChange}
            error={errors.contact_person}
            required
          />
          
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            required
          />
          
          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
          
          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
          />
          
          <div className="flex gap-2">
            <Button
              type="submit"
              isLoading={isLoading}
            >
              Create Customer
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}; 
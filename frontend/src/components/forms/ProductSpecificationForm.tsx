'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import { useForm, UseFormTrigger, UseFormGetValues } from 'react-hook-form';
import { Input, Select, Button } from '@/components/ui';
import { ProductSpecification } from '@/types';
import { FormError } from '../ui/FormError';
// Remove unused quotesService import
// import { quotesService } from '../../lib/services';

// Define the shape of the data expected by the parent (no longer has onSubmit prop)
interface ProductSpecificationFormProps {
  initialData?: Partial<ProductSpecification>;
  isProcessingFile?: boolean;
}

// Define the functions we want to expose via the ref
export interface ProductSpecificationFormRef {
  getFormData: () => Promise<Omit<ProductSpecification, 'id' | 'quote_id'> | null>;
}

// Use the type defined in quotes.service.ts if it matches, otherwise keep local
// Assuming ProductSpecification type from service matches required fields

// Adjust FormData if ProductSpecification from service is different
interface FormData extends Omit<ProductSpecification, 'id' | 'quote_id'> {}

// Wrap component with forwardRef
export const ProductSpecificationForm = forwardRef<ProductSpecificationFormRef, ProductSpecificationFormProps>((
  { initialData, isProcessingFile = false },
  ref // Receive ref from parent
) => {
  const {
    register,
    handleSubmit, // We don't use handleSubmit directly for form onSubmit anymore
    formState: { errors },
    reset,
    trigger, // Function to trigger validation
    getValues, // Function to get form values
  } = useForm<FormData>({
    defaultValues: initialData,
    mode: 'onChange', // Validate on change to provide better feedback
  });

  // Expose the getFormData function via ref
  useImperativeHandle(ref, () => ({
    getFormData: async () => {
      console.log("Triggering spec form validation...");
      const isValid = await trigger(); // Validate all fields
      if (isValid) {
        console.log("Spec form is valid, getting values.");
        const data = getValues();
         // Ensure numbers are correctly formatted
        return {
          ...data,
          weight_per_meter: Number(data.weight_per_meter),
          total_length: Number(data.total_length),
        };
      } else {
        console.log("Spec form validation failed.");
        // Optionally show a general validation error message near the form?
        return null; // Indicate validation failure
      }
    }
  }));

  // The form tag no longer needs onSubmit
  return (
    <form className="space-y-4">
      <div className="w-full">
        <label
          className="block text-sm font-medium text-gray-700 mb-1"
          htmlFor="description"
        >
          Description
        </label>
        <Input
          id="description"
          {...register('description', { required: 'Description is required' })}
          error={errors.description?.message}
           disabled={isProcessingFile} // Disable field if processing
        />
        {errors.description && <FormError error={errors.description.message} />}
      </div>

       <div className="w-full">
        <label
          className="block text-sm font-medium text-gray-700 mb-1"
          htmlFor="profile_type"
        >
          Profile Type
        </label>
        <Input
          id="profile_type"
          {...register('profile_type', { required: 'Profile Type is required' })}
          error={errors.profile_type?.message}
           disabled={isProcessingFile}
        />
         {errors.profile_type && <FormError error={errors.profile_type.message} />}
      </div>

      <div className="w-full">
        <label
          className="block text-sm font-medium text-gray-700 mb-1"
          htmlFor="alloy"
        >
          Alloy
        </label>
        <Select
          id="alloy"
          {...register('alloy', { required: 'Alloy is required' })}
          error={errors.alloy?.message}
           disabled={isProcessingFile}
        >
          <option value="">Select Alloy</option>
          <option value="6060">6060</option>
          <option value="6063">6063</option>
          <option value="6082">6082</option>
        </Select>
         {errors.alloy && <FormError error={errors.alloy.message} />}
      </div>

      <div className="w-full">
        <label
          className="block text-sm font-medium text-gray-700 mb-1"
          htmlFor="weight_per_meter"
        >
          Weight per Meter (kg)
        </label>
        <Input
          id="weight_per_meter"
          type="number"
          step="0.01"
          {...register('weight_per_meter', { required: 'Weight per Meter is required', valueAsNumber: true, min: { value: 0.01, message: 'Must be positive' } })}
          error={errors.weight_per_meter?.message}
           disabled={isProcessingFile}
        />
         {errors.weight_per_meter && <FormError error={errors.weight_per_meter.message} />}
      </div>

      <div className="w-full">
        <label htmlFor="total_length" className="block text-sm font-medium text-gray-700 mb-1">
          Total Length (mm)
        </label>
        <Input
          id="total_length"
          type="number"
          {...register('total_length', { required: 'Total Length is required', valueAsNumber: true, min: { value: 1, message: 'Must be positive' } })}
          error={errors.total_length?.message}
           disabled={isProcessingFile}
        />
         {errors.total_length && <FormError error={errors.total_length.message} />}
      </div>

      <div className="space-y-1">
        <label htmlFor="surface_treatment" className="block text-sm font-medium text-gray-700">
          Surface Treatment
        </label>
        <Select
          id="surface_treatment"
          {...register('surface_treatment', { required: 'Surface Treatment is required' })}
          error={errors.surface_treatment?.message}
           disabled={isProcessingFile}
        >
          <option value="">Select Surface Treatment</option>
          <option value="anodized">Anodized</option>
          <option value="painted">Painted</option>
          <option value="raw">Raw</option>
        </Select>
         {errors.surface_treatment && <FormError error={errors.surface_treatment.message} />}
      </div>

      <div className="space-y-1">
        <label htmlFor="machining_complexity" className="block text-sm font-medium text-gray-700">
          Machining Complexity
        </label>
        <Select
          id="machining_complexity"
          {...register('machining_complexity', { required: 'Machining Complexity is required' })}
          error={errors.machining_complexity?.message}
           disabled={isProcessingFile}
        >
          <option value="">Select Complexity</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
         {errors.machining_complexity && <FormError error={errors.machining_complexity.message} />}
      </div>

      {/* NO SUBMIT BUTTON HERE */}
    </form>
  );
});

// Add display name for React DevTools
ProductSpecificationForm.displayName = 'ProductSpecificationForm'; 
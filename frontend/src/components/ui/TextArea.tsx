'use client';

import React, { forwardRef } from 'react';
import { FormError } from './FormError';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 
            ring-inset ${error ? 'ring-red-300' : 'ring-gray-300'} 
            placeholder:text-gray-400 
            focus:ring-2 focus:ring-inset ${
              error ? 'focus:ring-red-500' : 'focus:ring-indigo-600'
            }
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        <FormError error={error} />
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea'; 
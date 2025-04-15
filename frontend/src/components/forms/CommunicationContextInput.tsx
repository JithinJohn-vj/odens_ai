'use client';

import React, { useState } from 'react';
import { TextArea, Button } from '@/components/ui';

interface CommunicationContextInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  error?: string;
  id?: string;
}

const SUGGESTIONS = [
  'Previous communication history',
  'Customer preferences',
  'Budget constraints',
  'Timeline requirements',
  'Special requirements',
  'Competitor information',
  'Market conditions',
  'Technical specifications',
  'Formal business communication',
];

export const CommunicationContextInput: React.FC<CommunicationContextInputProps> = ({
  value,
  onChange,
  className = '',
  error,
  id,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSuggestionClick = (suggestion: string) => {
    const currentValue = value || '';
    const newValue = currentValue ? `${currentValue}\n• ${suggestion}\n` : `• ${suggestion}\n`;
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onChange(value + '\n• ');
      } else {
        onChange(value + '\n');
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`} data-testid="communication-context-input">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Communication Context
        </label>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowSuggestions(!showSuggestions)}
        >
          {showSuggestions ? 'Hide Suggestions' : 'Show Suggestions'}
        </Button>
      </div>

      {showSuggestions && (
        <div className="grid grid-cols-2 gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <Button
              key={suggestion}
              variant="secondary"
              size="sm"
              className="text-left"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <div className="w-full">
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`
              block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1
              ring-inset ring-gray-300
              placeholder:text-gray-400
              focus:ring-2 focus:ring-inset focus:ring-indigo-600
              font-mono
            `}
            placeholder="Enter communication context...
Press Enter to start a new line
Press Shift+Enter to add a new context point"
            rows={8}
            aria-invalid={!!error}
            aria-errormessage={error ? `${id}-error` : undefined}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="text-sm text-gray-500">
        <p>Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Use bullet points or numbered lists for clarity</li>
          <li>Include relevant dates, names, and specific requirements</li>
          <li>Mention any previous quotes or discussions</li>
          <li>Note any special conditions or constraints</li>
        </ul>
      </div>
    </div>
  );
}; 
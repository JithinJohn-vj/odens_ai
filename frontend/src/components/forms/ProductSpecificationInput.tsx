'use client';

import React, { useState } from 'react';
import { Input, Button, TextArea } from '@/components/ui';
import { useAppDispatch } from '@/store';
import { setError } from '@/store/quotesSlice';
import { ProductSpecification } from '@/types';

interface ProductSpecificationInputProps {
  value: string;
  onChange: (value: string) => void;
  onFileUpload?: (file: File) => Promise<void>;
}

type SpecificationData = Partial<ProductSpecification> & {
  [key: string]: string | number | undefined;
};

export const ProductSpecificationInput: React.FC<ProductSpecificationInputProps> = ({
  value,
  onChange,
  onFileUpload,
}) => {
  const [specifications, setSpecifications] = useState<SpecificationData>(() => {
    try {
      return value ? JSON.parse(value) : {};
    } catch {
      return {};
    }
  });
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();

  const handleAddSpecification = () => {
    if (!newKey.trim() || !newValue.trim()) return;

    const updatedSpecifications = {
      ...specifications,
      [newKey.trim()]: newValue.trim()
    };
    setSpecifications(updatedSpecifications);
    onChange(JSON.stringify(updatedSpecifications));
    setNewKey('');
    setNewValue('');
  };

  const handleRemoveSpecification = (key: string) => {
    const updatedSpecifications = { ...specifications };
    delete updatedSpecifications[key];
    setSpecifications(updatedSpecifications);
    onChange(JSON.stringify(updatedSpecifications));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onFileUpload) return;

    try {
      setIsLoading(true);
      await onFileUpload(file);
    } catch (error) {
      dispatch(setError('Failed to upload specification file'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {Object.entries(specifications).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 p-2 rounded-md">
              <span className="font-medium">{key}:</span> {value}
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleRemoveSpecification(key)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Specification key"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="Specification value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={handleAddSpecification}
          disabled={!newKey.trim() || !newValue.trim()}
        >
          Add
        </Button>
      </div>

      {onFileUpload && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Detailed Specifications
          </label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {isLoading && (
              <div className="text-sm text-gray-500">Uploading...</div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4">
        <TextArea
          label="Raw Specifications (JSON)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or enter specifications as JSON..."
          rows={4}
        />
      </div>
    </div>
  );
}; 
'use client';

import React, { useState, useRef } from 'react';
import { Button } from './Button';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number; // in bytes
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onUpload,
  accept = '*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  label = 'Upload File',
  className = '',
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeMB = maxSize / (1024 * 1024);

  const validateFile = (file: File): string | null => {
    if (!file) return 'No file selected';
    if (file.size > maxSize) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }
    if (accept !== '*' && !accept.split(',').some(type => {
      const fileType = file.type || file.name.split('.').pop()?.toLowerCase();
      return fileType && type.trim().toLowerCase() === fileType;
    })) {
      return 'Invalid file type';
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setError(null);
    setSelectedFile(file);
    await uploadFile(file);
    if (fileInputRef.current) {
       fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setError(null);
      setIsUploading(true);
      setProgress(0);

      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onUpload(file);
      setProgress(100);
      clearInterval(interval);
      setSelectedFile(null);
    } catch (err) {
      setError('Failed to upload file');
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (!disabled) {
        fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700" htmlFor="file-input">
          {label}
        </label>
      )}

      <div
        data-testid="drop-zone"
        className={`
          border-2 border-dashed rounded-lg p-6 text-center
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${error ? 'border-red-500 bg-red-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          id="file-input"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
          data-testid="file-input"
          disabled={disabled}
        />

        {isUploading ? (
          <div className="space-y-2">
            <div 
              className="w-full bg-gray-200 rounded-full h-2.5"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-gray-500">
              Uploading... {progress}%
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedFile ? (
              <div className="text-gray-600">
                {selectedFile.name}
              </div>
            ) : (
              <div className="text-gray-600">
                Drag and drop your file here, or
              </div>
            )}
            <Button
              variant="secondary"
              onClick={triggerFileInput}
              disabled={disabled}
            >
              Browse Files
            </Button>
            <div className="text-xs text-gray-500">
              Max file size: {maxSizeMB}MB
              {accept !== '*' && ` • Accepted formats: ${accept}`}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-2 text-sm text-red-500" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 
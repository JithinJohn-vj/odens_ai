import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
};

const typeIcons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

export function Toast({
  message,
  type = 'info',
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!message) {
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, message, onClose]);

  if (!isVisible || !message) return null;

  const toastType = type || 'info';
  const style = typeStyles[toastType] || typeStyles.info;
  const icon = typeIcons[toastType] || typeIcons.info;

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50
        flex items-center gap-2
        px-4 py-3 rounded-lg border
        shadow-lg animate-fade-in
        ${style}
      `}
    >
      <span className="font-medium">{icon}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className="
          p-1 rounded-full
          hover:bg-white/50
          transition-colors
        "
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
} 
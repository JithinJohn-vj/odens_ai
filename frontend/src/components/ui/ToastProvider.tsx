import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Toast, ToastType } from './Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const defaultContext: ToastContextType = {
  showToast: () => {
    console.warn('Toast context not initialized');
  },
};

const ToastContext = createContext<ToastContextType>(defaultContext);

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 5000) => {
      if (!message) return;
      
      const id = Math.random().toString(36).substr(2, 9);
      const toastItem: ToastItem = {
        id,
        message,
        type: type || 'info',
        duration,
      };
      
      setToasts((prev) => [...prev, toastItem]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const contextValue = useMemo(() => ({
    showToast,
  }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    console.warn('useToast must be used within a ToastProvider');
    return defaultContext;
  }
  return context;
} 
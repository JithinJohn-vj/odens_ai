'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Notification } from '@/components/ui';

interface NotificationState {
  type: 'success' | 'error';
  message: string;
  show: boolean;
}

interface NotificationContextType {
  showNotification: (type: 'success' | 'error', message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationState>({
    type: 'success',
    message: '',
    show: false,
  });

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message, show: true });
  }, []);

  const handleClose = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={handleClose}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}; 
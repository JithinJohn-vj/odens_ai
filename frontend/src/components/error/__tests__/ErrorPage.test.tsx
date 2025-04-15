import React from 'react';
import { render, screen, fireEvent } from '@/utils/test-utils';
import { ErrorPage } from '../ErrorPage';
import '@testing-library/jest-dom';

// Mock window.location
const mockLocation = {
  href: '',
  reload: jest.fn(),
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('ErrorPage', () => {
  const defaultProps = {
    title: 'Something went wrong',
    message: 'Test error message',
    showBack: true,
    showDashboard: false,
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockLocation.href = '';
  });

  it('renders with default props', () => {
    render(<ErrorPage {...defaultProps} />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
  });

  it('renders without back button when showBack is false', () => {
    render(<ErrorPage {...defaultProps} showBack={false} />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /go back/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
  });

  it('renders with dashboard button when showDashboard is true', () => {
    render(<ErrorPage {...defaultProps} showDashboard={true} />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
  });

  it('handles back button click', () => {
    const mockBack = jest.spyOn(window.history, 'back');
    render(<ErrorPage {...defaultProps} />);
    
    const backButton = screen.getByRole('button', { name: /go back/i });
    fireEvent.click(backButton);
    
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('handles dashboard button click', () => {
    render(<ErrorPage {...defaultProps} showDashboard={true} />);
    
    const dashboardButton = screen.getByRole('button', { name: /go to dashboard/i });
    fireEvent.click(dashboardButton);
    
    expect(mockLocation.href).toBe('/');
  });

  it('handles refresh button click', () => {
    render(<ErrorPage {...defaultProps} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh page/i });
    fireEvent.click(refreshButton);
    
    expect(mockLocation.reload).toHaveBeenCalledTimes(1);
  });
}); 
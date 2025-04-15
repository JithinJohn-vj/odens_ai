import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import quotesReducer from '@/store/quotesSlice';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { QuotesState } from '@/store/quotesSlice';

// Create a custom render function that includes the Redux store and ToastProvider
function render(ui: React.ReactElement, { ...renderOptions } = {}) {
  const store = configureStore({
    reducer: {
      quotes: quotesReducer,
    },
    preloadedState: {
      quotes: {
        quotes: [],
        loading: false,
        error: null,
      } as QuotesState,
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </Provider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// re-export everything
export * from '@testing-library/react';

// override render method
export { render }; 
'use client';

import React from 'react';
import StoreProvider from '../store/StoreProvider';
import { AuthProvider } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';
import { ToastContainer } from '../components/ui/Toast';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AuthProvider>
        <DataProvider>
          {children}
          <ToastContainer />
        </DataProvider>
      </AuthProvider>
    </StoreProvider>
  );
}

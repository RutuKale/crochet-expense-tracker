import React from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { BusinessProvider } from './context/BusinessContext.jsx';
import AppLayout from './components/layout/AppLayout.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <AppLayout />
      </BusinessProvider>
    </AuthProvider>
  );
}

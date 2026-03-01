/**
 * @file Toaster Provider
 * @module ToasterProvider
 */

'use client';

import { Toaster } from 'react-hot-toast';

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1e293b',
          color: '#e2e8f0',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
          padding: '12px 16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        },
        success: {
          iconTheme: { primary: '#088395', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
        },
      }}
    />
  );
}

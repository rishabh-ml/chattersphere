// This file enables the Supabase mock implementation by default in development
// It's imported by the app layout to ensure it runs on every page

'use client';

import { useEffect } from 'react';

export default function EnableMock() {
  useEffect(() => {
    // Only run in development and in the browser
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // Check if we can connect to Supabase
      fetch(process.env.NEXT_PUBLIC_SUPABASE_URL || '', { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store'
      })
        .then(() => {
          console.log('Supabase connection available');
          localStorage.removeItem('USE_SUPABASE_MOCK');
        })
        .catch(() => {
          console.log('Supabase connection not available, enabling mock implementation');
          localStorage.setItem('USE_SUPABASE_MOCK', 'true');
        });
    }
  }, []);

  // This component doesn't render anything
  return null;
}

import { SWRConfig } from 'swr';
import React from 'react';

/**
 * Default fetcher for SWR
 * @param {string} url URL to fetch
 * @returns {Promise<any>} Parsed JSON response
 */
export const fetcher = async (url) => {
  const res = await fetch(url);
  
  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Add extra info to the error object
    const data = await res.json().catch(() => ({}));
    error.info = data;
    error.status = res.status;
    throw error;
  }
  
  return res.json();
};

/**
 * SWR Provider with global configuration
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components
 * @returns {JSX.Element} SWR Provider component
 */
export function SWRProvider({ children }) {
  const handleError = (error, key) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`SWR Error for ${key}:`, error);
    }
    
    // Report to Sentry or other error tracking service
    if (process.env.NODE_ENV === 'production' && window.Sentry) {
      window.Sentry.captureException(error);
    }
  };

  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: process.env.NODE_ENV === 'production',
        revalidateOnReconnect: true,
        revalidateIfStale: true,
        shouldRetryOnError: true,
        errorRetryCount: 3,
        dedupingInterval: 5000, // 5 seconds
        focusThrottleInterval: 5000, // 5 seconds
        loadingTimeout: 3000, // 3 seconds
        suspense: false, // Set to true to use React Suspense
        onError: handleError
      }}
    >
      {children}
    </SWRConfig>
  );
}

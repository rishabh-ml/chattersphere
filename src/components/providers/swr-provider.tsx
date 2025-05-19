'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

interface SWRProviderProps {
  children: ReactNode;
}

/**
 * Default fetcher function for SWR
 * @param url URL to fetch
 * @returns Parsed JSON response
 */
const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.info = await response.json();
    error.status = response.status;
    throw error;
  }
  
  return response.json();
};

/**
 * SWR Provider component
 * Provides global SWR configuration for the application
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 5000, // 5 seconds
        errorRetryCount: 3,
        errorRetryInterval: 5000, // 5 seconds
        suspense: false,
        onError: (error, key) => {
          if (error.status !== 403 && error.status !== 404) {
            console.error(`SWR Error for ${key}:`, error);
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}

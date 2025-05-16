"use client";

import { useState, useEffect, useCallback } from "react";

interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for optimized data fetching with retries and caching
 */
export function useFetch<T>(url: string, options: FetchOptions = {}) {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options;
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  // Memoize fetch options to prevent unnecessary re-renders
  const memoizedFetchOptions = useCallback(() => fetchOptions, [JSON.stringify(fetchOptions)]);

  const fetchData = useCallback(async () => {
    // Skip if URL is empty
    if (!url) return;

    setState(prev => ({ ...prev, loading: true }));

    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < retries) {
      try {
        const response = await fetch(url, memoizedFetchOptions());

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setState({ data, loading: false, error: null });
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempts++;

        if (attempts < retries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
        }
      }
    }

    setState({ data: null, loading: false, error: lastError });
  }, [url, memoizedFetchOptions, retries, retryDelay]);

  useEffect(() => {
    if (url) {
      fetchData();
    }
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch };
}

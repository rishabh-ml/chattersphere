/**
 * SWR Utilities
 *
 * This file contains utilities for efficient data fetching and caching
 * using SWR (stale-while-revalidate).
 */

import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import useSWRInfinite, { SWRInfiniteConfiguration, SWRInfiniteResponse } from "swr/infinite";
import useSWRMutation, { SWRMutationConfiguration, SWRMutationResponse } from "swr/mutation";
import { useState } from "react";

// Default fetcher function
const defaultFetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error("An error occurred while fetching the data.") as any;
    error.info = await response.json();
    error.status = response.status;
    throw error;
  }

  return response.json();
};

// Default SWR configuration
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  dedupingInterval: 5000, // 5 seconds
};

/**
 * Custom hook for data fetching with SWR
 * @param url API URL to fetch data from
 * @param config SWR configuration
 * @returns SWR response
 */
export function useData<Data = any, Error = any>(
  url: string | null,
  config: SWRConfiguration = {}
): SWRResponse<Data, Error> {
  return useSWR<Data, Error>(url, defaultFetcher, { ...defaultConfig, ...config });
}

/**
 * Custom hook for paginated data fetching with SWR
 * @param getKey Function to get the key for each page
 * @param config SWR configuration
 * @returns SWR infinite response
 */
export function usePaginatedData<Data = any, Error = any>(
  getKey: (pageIndex: number, previousPageData: Data | null) => string | null,
  config: SWRInfiniteConfiguration = {}
): SWRInfiniteResponse<Data, Error> {
  return useSWRInfinite<Data, Error>(getKey, defaultFetcher, { ...defaultConfig, ...config });
}

/**
 * Custom hook for data mutation with SWR
 * @param url API URL to mutate data
 * @param config SWR mutation configuration
 * @returns SWR mutation response
 */
export function useDataMutation<Data = any, Error = any, Variables = any>(
  url: string | null,
  config: any = {}
): any {
  return useSWRMutation(
    url,
    async (url, { arg }: { arg: Variables }) => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(arg),
      });
      if (!response.ok) {
        const error = new Error("An error occurred while mutating the data.") as any;
        error.info = await response.json();
        error.status = response.status;
        throw error;
      }

      return response.json();
    },
    config
  );
}

/**
 * Custom hook for infinite scrolling with SWR
 * @param getKey Function to get the key for each page
 * @param config SWR configuration
 * @returns Infinite scrolling utilities
 */
export function useInfiniteScroll<Data = any, Error = any>(
  getKey: (pageIndex: number, previousPageData: Data | null) => string | null,
  config: SWRInfiniteConfiguration = {}
) {
  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite<Data, Error>(
    getKey,
    defaultFetcher,
    { ...defaultConfig, ...config }
  );

  const [isReachingEnd, setIsReachingEnd] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Check if we've reached the end of the data
  const isEmpty = (data?.[0] as any)?.length === 0;
  const isLoadingInitialData = !data && !error;
  const isLoadingMore =
    isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === "undefined");

  // Function to load more data
  const loadMore = async () => {
    if (isReachingEnd || isLoadingMore) return;

    try {
      await setSize(size + 1);
      // Check if we've reached the end
      if (data && (data[data.length - 1] as any)?.length === 0) {
        setIsReachingEnd(true);
      }
    } catch (error) {
      console.error("Error loading more data:", error);
    }
  };

  // Function to refresh the data
  const refresh = async () => {
    setIsRefreshing(true);

    try {
      await mutate();
      setIsReachingEnd(false);
      setSize(1);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    data,
    error,
    size,
    setSize,
    isValidating,
    mutate,
    isEmpty,
    isLoadingInitialData,
    isLoadingMore,
    isReachingEnd,
    isRefreshing,
    loadMore,
    refresh,
  };
}

/**
 * Custom hook for prefetching data with SWR
 * @param urls URLs to prefetch
 */
export function usePrefetch(urls: string[]) {
  urls.forEach((url) => {
    // Prefetch the data
    fetch(url)
      .then((res) => res.json())
      .catch(() => {});
  });
}

/**
 * Custom hook for optimistic updates with SWR
 * @param key SWR key
 * @param updateFn Function to update the data optimistically
 * @param rollbackFn Function to rollback the update if it fails
 * @returns Optimistic update function
 */
export function useOptimisticUpdate<Data = any, Error = any, Variables = any>(
  key: string,
  updateFn: (data: Data, variables: Variables) => Data,
  rollbackFn?: (data: Data, variables: Variables) => Data
) {
  const { mutate } = useSWR<Data, Error>(key);

  return async (variables: Variables, callback: (variables: Variables) => Promise<any>) => {
    // Get the current data
    const currentData = await mutate((data) => updateFn(data as Data, variables), false);

    try {
      // Call the callback function
      await callback(variables);

      // Revalidate the data
      await mutate();
    } catch (error) {
      // Rollback the update if it fails
      if (rollbackFn && currentData) {
        await mutate(rollbackFn(currentData as Data, variables), false);
      }

      throw error;
    }
  };
}

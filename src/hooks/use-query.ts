/**
 * Custom Query Hook
 *
 * Provides consistent data fetching with loading states, error handling,
 * and automatic refetching capabilities.
 *
 * Similar to React Query but simpler for our use case.
 */

import { useState, useEffect, useCallback } from 'react';

interface UseQueryOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void; // Optimistic update
}

/**
 * Custom hook for consistent data fetching
 *
 * @example
 * ```typescript
 * const { data, loading, error, refetch } = useQuery<Driver[]>('/api/drivers');
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * return <DriverList drivers={data} />;
 * ```
 */
export function useQuery<T = any>(
  endpoint: string,
  options: UseQueryOptions = {}
): UseQueryResult<T> {
  const {
    enabled = true,
    refetchOnMount = true,
    refetchInterval,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed');
      }

      const result = await response.json();
      setData(result);

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);

      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled, onSuccess, onError]);

  // Optimistic update
  const mutate = useCallback((newData: T) => {
    setData(newData);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (enabled && refetchOnMount) {
      fetchData();
    }
  }, [enabled, refetchOnMount, fetchData]);

  // Interval refetch
  useEffect(() => {
    if (!enabled || !refetchInterval) return;

    const interval = setInterval(() => {
      fetchData();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [enabled, refetchInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    mutate,
  };
}

/**
 * Custom Mutation Hook
 *
 * Provides consistent API for creating, updating, and deleting data
 * with loading states and error handling.
 */

import { useState, useCallback } from 'react';

interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | undefined>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  loading: boolean;
  error: Error | null;
  data: TData | null;
  reset: () => void;
}

/**
 * Custom hook for mutations (POST, PUT, DELETE)
 *
 * @example
 * ```typescript
 * const createDriver = useMutation<Driver, CreateDriverDTO>(
 *   '/api/drivers',
 *   'POST',
 *   {
 *     onSuccess: (driver) => {
 *       toast.success(`Driver ${driver.fullName} created!`);
 *       refetchDrivers();
 *     },
 *     onError: (error) => {
 *       toast.error(error.message);
 *     }
 *   }
 * );
 *
 * // Use it
 * await createDriver.mutate(formData);
 * ```
 */
export function useMutation<TData = any, TVariables = any>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST',
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const { onSuccess, onError, onSettled } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(variables),
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

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);

        if (onError) {
          onError(error);
        }

        throw error;
      } finally {
        setLoading(false);

        if (onSettled) {
          onSettled();
        }
      }
    },
    [endpoint, method, onSuccess, onError, onSettled]
  );

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | undefined> => {
      try {
        return await mutateAsync(variables);
      } catch (err) {
        // Error already handled in mutateAsync
        return undefined;
      }
    },
    [mutateAsync]
  );

  return {
    mutate,
    mutateAsync,
    loading,
    error,
    data,
    reset,
  };
}

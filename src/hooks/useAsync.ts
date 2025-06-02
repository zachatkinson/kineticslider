/**
 * Async Data Hook
 * 
 * Centralized hook for managing asynchronous data fetching with loading states,
 * error handling, and automatic cleanup. Consolidates async patterns used across
 * multiple hooks in the codebase.
 * 
 * @module useAsync
 * @version 1.0.0
 * 
 * @example
 * ```tsx
 * // Basic async data fetching
 * const { data, loading, error } = useAsync(() => fetchUserData(userId), [userId]);
 * ```
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { AsyncState, UseAsyncOptions } from '../types/hooks';

/**
 * Hook for managing asynchronous data fetching
 * 
 * Provides a consistent interface for async operations with proper loading states,
 * error handling, and cleanup. Includes debouncing and manual control options.
 * 
 * @param fetchFn - Function that returns a promise with data
 *
 * @param deps - Dependencies that, when changed, trigger refetch
 *
 * @param options - Configuration options
 *
 * @returns Object containing data, loading state, error, and control functions
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const { data, loading, error, reload } = useAsync(
 *   () => api.fetchUserData(userId),
 *   [userId]
 * );
 * 
 * // With options
 * const { data, loading, error, reset } = useAsync(
 *   () => api.fetchPosts(),
 *   [],
 *   {
 *     immediate: false,
 *     onError: (error) => toast.error(error.message),
 *     onSuccess: (data) => analytics.track('data_loaded', { count: data.length })
 *   }
 * );
 * ```
 */
export function useAsync<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseAsyncOptions = {}
): AsyncState<T> {
  const {
    immediate = true,
    resetErrorOnFetch = true,
    onError,
    onSuccess,
    debounceMs = 0
  } = options;

  const [state, setState] = useState<Omit<AsyncState<T>, 'reload' | 'reset'>>({
    data: null,
    loading: false,
    error: null,
  });

  // Use refs to track mounted state and debounce timer
  const isMountedRef = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const fetchData = useCallback((): void => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const executeFetch = async (): Promise<void> => {
      if (!isMountedRef.current) return;

      setState(prev => ({
        ...prev,
        loading: true,
        ...(resetErrorOnFetch && { error: null })
      }));

      try {
        const data = await fetchFn();
        
        if (!isMountedRef.current) return;

        setState(prev => ({
          ...prev,
          data,
          loading: false,
          error: null
        }));

        onSuccess?.(data);
      } catch (error) {
        if (!isMountedRef.current) return;

        const errorObj = error instanceof Error ? error : new Error(String(error));
        
        setState(prev => ({
          ...prev,
          error: errorObj,
          loading: false,
        }));

        onError?.(errorObj);
      }
    };

    if (debounceMs > 0) {
      debounceTimerRef.current = setTimeout(() => {
        void executeFetch();
      }, debounceMs);
    } else {
      void executeFetch();
    }
  }, [fetchFn, resetErrorOnFetch, onError, onSuccess, debounceMs]);

  // Reset function to clear all state
  const reset = useCallback((): void => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  // Reload function (alias for fetchData for better API)
  const reload = useCallback((): void => {
    fetchData();
  }, [fetchData]);

  // Memoize dependencies to avoid unnecessary re-renders
  const memoizedDeps = useMemo(() => deps, [deps]);

  // Auto-fetch on dependency changes
  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [memoizedDeps, fetchData, immediate]);

  return {
    ...state,
    reload,
    reset,
  };
}

/**
 * Specialized hook for fetching data with automatic retries
 * 
 * @param fetchFn - Function that returns a promise with data
 *
 * @param deps - Dependencies that trigger refetch
 *
 * @param options - Configuration options including retry settings
 *
 * @returns Async state with retry functionality
 * 
 * @example
 * ```tsx
 * const { data, loading, error, retryCount } = useAsyncWithRetry(
 *   () => api.fetchData(),
 *   [],
 *   { maxRetries: 3, retryDelay: 1000 }
 * );
 * ```
 */
export function useAsyncWithRetry<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseAsyncOptions & {
    maxRetries?: number;
    retryDelay?: number;
    retryBackoff?: boolean;
  } = {}
): AsyncState<T> & { retryCount: number } {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryBackoff = true,
    ...asyncOptions
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const retryableFetchFn = useCallback(async (): Promise<T> => {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fetchFn();
        setRetryCount(0); // Reset retry count on success
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        setRetryCount(attempt + 1);
        
        if (attempt < maxRetries) {
          const delay = retryBackoff ? retryDelay * Math.pow(2, attempt) : retryDelay;
          await new Promise(resolve => {
            retryTimeoutRef.current = setTimeout(resolve, delay);
          });
        }
      }
    }
    
    throw lastError;
  }, [fetchFn, maxRetries, retryDelay, retryBackoff]);

  const asyncState = useAsync(retryableFetchFn, deps, asyncOptions);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...asyncState,
    retryCount,
  };
}

/**
 * Hook for managing multiple async operations
 * 
 * @param fetchFns - Object with named fetch functions
 *
 * @param deps - Dependencies that trigger refetch
 *
 * @param options - Configuration options
 *
 * @returns Object with async states for each fetch function
 * 
 * @example
 * ```tsx
 * const { users, posts, loading, hasErrors } = useMultipleAsync({
 *   users: () => api.fetchUsers(),
 *   posts: () => api.fetchPosts()
 * });
 * ```
 */
export function useMultipleAsync<T extends Record<string, () => Promise<unknown>>>(
  fetchFns: T,
  deps: React.DependencyList = [],
  options: UseAsyncOptions = {}
): {
  [K in keyof T]: AsyncState<Awaited<ReturnType<T[K]>>>;
} & {
  loading: boolean;
  hasErrors: boolean;
  reloadAll: () => void;
  resetAll: () => void;
} {
  // Pre-compute the results to avoid hooks being called conditionally
  const entries = useMemo(() => Object.entries(fetchFns), [fetchFns]);
  
  const results = {} as Record<string, AsyncState<unknown>>;
  const loadingStates: boolean[] = [];
  const hasErrorStates: boolean[] = [];
  const reloadFunctionsRef = useRef<(() => void)[]>([]);
  const resetFunctionsRef = useRef<(() => void)[]>([]);

  // Reset the refs
  reloadFunctionsRef.current = [];
  resetFunctionsRef.current = [];

  // Create async state for each fetch function
  entries.forEach(([key, fetchFn]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const asyncState = useAsync(fetchFn, deps, options);
    results[key] = asyncState;
    loadingStates.push(asyncState.loading);
    hasErrorStates.push(asyncState.error !== null);
    reloadFunctionsRef.current.push(asyncState.reload);
    resetFunctionsRef.current.push(asyncState.reset);
  });

  const reloadAll = useCallback((): void => {
    reloadFunctionsRef.current.forEach(reload => reload());
  }, []);

  const resetAll = useCallback((): void => {
    resetFunctionsRef.current.forEach(reset => reset());
  }, []);

  return {
    ...results,
    loading: loadingStates.some(Boolean),
    hasErrors: hasErrorStates.some(Boolean),
    reloadAll,
    resetAll,
  } as {
    [K in keyof T]: AsyncState<Awaited<ReturnType<T[K]>>>;
  } & {
    loading: boolean;
    hasErrors: boolean;
    reloadAll: () => void;
    resetAll: () => void;
  };
} 
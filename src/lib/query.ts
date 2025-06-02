import { QueryClient } from "@tanstack/react-query";

/**
 * Default query configuration for React Query
 * Centralized configuration to ensure consistency across the application
 */
export const defaultQueryConfig = {
  queries: {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  mutations: {
    retry: 1,
  },
} as const;

/**
 * Pre-configured QueryClient instance with optimized defaults
 * Uses the centralized configuration to avoid duplication
 */
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryConfig,
});

// Legacy exports for backward compatibility
export const _queryClient = queryClient;
export const _defaultQueryConfig = defaultQueryConfig;

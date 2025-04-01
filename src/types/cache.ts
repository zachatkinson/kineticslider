/**
 * Type definitions for cache utilities and classes
 */

import type { ValidationResult } from './validation';

/**
 * Cache entry with value and timestamp
 */
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

/**
 * Cache entry options configuration
 */
export interface CacheOptions {
  /** Time-to-live in milliseconds */
  ttl?: number;
  /** Maximum number of entries in the cache */
  maxSize?: number;
}

/**
 * Type definition for cache validation
 */
export interface CacheValidationOptions extends CacheOptions {
  /** Whether to enable validation caching */
  enableCache?: boolean;
  /** Cache key prefix for validation results */
  cacheKeyPrefix?: string;
} 
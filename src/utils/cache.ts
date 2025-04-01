/**
 * Cache utility functions and classes
 * 
 * Provides caching functionality with TTL and size limits
 */

import type { ValidationResult } from '../types/validation';
import type { CacheOptions, CacheEntry } from '../types/cache';

// export interface CacheOptions {
//   ttl?: number;
//   maxSize?: number;
// }

/**
 * Generic cache implementation with TTL and size limits
 */
export class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private options: CacheOptions = {
    ttl: 5 * 60 * 1000, // 5 minutes default
    maxSize: 1000, // 1000 entries default
  };

  constructor(options?: CacheOptions) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if entry has expired
    if (this.options.ttl && Date.now() - entry.timestamp > this.options.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    // Check if cache is at max size and remove oldest entry
    if (this.options.maxSize && this.cache.size >= this.options.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    // Ensure key is a string to avoid type errors
    const safeKey = key || '';

    this.cache.set(safeKey, {
      value,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Validation-specific cache implementation
 */
export class ValidationCache extends Cache<ValidationResult> {
  constructor(options?: CacheOptions) {
    super(options);
  }
}

// Global validation cache with default options
export const globalValidationCache = new ValidationCache(); 
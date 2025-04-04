/**
 * Cache utility functions and classes
 * 
 * Provides caching functionality with TTL and size limits
 */

import type { ValidationResult as _ValidationResult } from '../types/validation';
import type { CacheOptions as _CacheOptions, CacheEntry as _CacheEntry } from '../types/cache';

// export interface CacheOptions {
//   ttl?: number;
//   maxSize?: number;
// }

/**
 * Simple in-memory cache implementation
 * @template T The type of values stored in the cache
 * @example
 * ```typescript
 * // Create a cache for storing user data
 * const userCache = new Cache<{ id: string, name: string }>({ checkInterval: 60000 });
 * 
 * // Add items to the cache with different TTLs
 * userCache.set('user1', { id: 'user1', name: 'John Doe' }, 300000); // 5 minute TTL
 * userCache.set('user2', { id: 'user2', name: 'Jane Smith' }); // No expiration
 * 
 * // Retrieve an item
 * const user = userCache.get('user1');
 * 
 * // Check if an item exists
 * if (userCache.has('user2')) {
 *   console.warn('User found in cache');
 * }
 * 
 * // Get cache size
 * const cacheSize = userCache.size();
 * 
 * // Remove an item
 * userCache.delete('user1');
 * 
 * // Clear the entire cache
 * userCache.clear();
 * ```
 */
export class Cache<T> {
  private cache: Map<string, { value: T; timestamp: number; ttl: number }>;
  private expiryCheckIntervalId: number | null = null;
  
  /**
   * Creates a new cache instance
   * @param options - Optional configuration for the cache
   * @param options.checkInterval - Interval in ms to check for expired items
   * @returns {Cache<T>} A new cache instance
   */
  constructor(private options: { checkInterval?: number } = {}) {
    this.cache = new Map();
    
    if (options.checkInterval) {
      this.startExpiryCheck(options.checkInterval);
    }
  }
  
  /**
   * Set a value in the cache
   * @param key - The key to store the value under
   * @param value - The value to store
   * @param _ttl - Optional TTL in milliseconds
   * @returns {void}
   */
  set(key: string, value: T, _ttl?: number): void {
    const timestamp = Date.now();
    this.cache.set(key, {
      value,
      timestamp,
      ttl: _ttl || 0,
    });
  }
  
  /**
   * Get a value from the cache
   * @param key - The key to retrieve
   * @returns {T | undefined} The cached value or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    if (item.ttl && Date.now() > item.timestamp + item.ttl) {
      this.delete(key);
      return undefined;
    }
    
    return item.value;
  }
  
  /**
   * Check if a key exists in the cache
   * @param key - The key to check
   * @returns {boolean} True if the key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    if (item.ttl && Date.now() > item.timestamp + item.ttl) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Delete a key from the cache
   * @param key - The key to delete
   * @returns {boolean} True if the key was deleted, false if it didn't exist
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Get the number of items in the cache
   * @returns {number} The number of items in the cache
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Clear all items from the cache
   * @returns {void}
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Start the automatic expiry check
   * @param interval - The interval in milliseconds
   * @returns {void} 
   */
  private startExpiryCheck(interval: number): void {
    this.expiryCheckIntervalId = window.setInterval(() => {
      this.checkExpiredItems();
    }, interval);
  }
  
  /**
   * Stop the automatic expiry check
   * @returns {void}
   */
  stopExpiryCheck(): void {
    if (this.expiryCheckIntervalId !== null) {
      window.clearInterval(this.expiryCheckIntervalId);
      this.expiryCheckIntervalId = null;
    }
  }
  
  /**
   * Check and remove expired items
   * @returns {void}
   */
  private checkExpiredItems(): void {
    const now = Date.now();
    
    this.cache.forEach((item, key) => {
      if (item.ttl && now > item.timestamp + item.ttl) {
        this.delete(key);
      }
    });
  }
}

/**
 * Validation-specific cache implementation
 * @example Example usage
 */
export class ValidationCache extends Cache<_ValidationResult> {
  /**
   *
   */
  constructor(options?: { checkInterval?: number }) {
    super(options);
  }
}

// Global validation cache with default options
export const _globalValidationCache = new ValidationCache(); 
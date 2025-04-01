/**
 * Common utility functions that can be used across the application
 */

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per every wait milliseconds
 * 
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to wait between invocations
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, wait);
    }
  };
}

/**
 * Creates a function that memoizes the result of func
 * 
 * @param func - The function to memoize
 * @returns A memoized function that caches results
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  return function(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Safely parses JSON without throwing exceptions
 * 
 * @param value - The string to parse
 * @param fallback - Optional fallback value if parsing fails
 * @returns The parsed object or fallback value
 */
export function safeJsonParse<T>(value: string, fallback: T): T;
export function safeJsonParse<T>(value: string): T | null;
export function safeJsonParse<T>(value: string, fallback?: T): T | null {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return fallback !== undefined ? fallback : null;
  }
}

/**
 * Sleeps for the specified number of milliseconds
 * 
 * @param ms - The number of milliseconds to sleep
 * @returns A promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a random ID with an optional prefix
 * 
 * @param prefix - Optional prefix for the ID
 * @returns A random ID string
 */
export function createRandomId(prefix: string = ''): string {
  return `${prefix}${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Performs a deep clone of the provided object
 * 
 * @param obj - The object to clone
 * @returns A deep clone of the object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Performs a shallow merge of objects
 * 
 * @param target - The target object
 * @param sources - The source objects
 * @returns The merged object
 */
export function shallowMerge<T>(target: T, ...sources: Partial<T>[]): T {
  return Object.assign({}, target, ...sources);
}

/**
 * Gets a value from a nested object safely without throwing errors
 * 
 * @param obj - The object to get the value from
 * @param path - The path to the value (e.g. 'user.address.city')
 * @param defaultValue - The default value to return if the path doesn't exist
 * @returns The value at the path or the default value
 */
export function getNestedValue<T, D = undefined>(
  obj: any,
  path: string,
  defaultValue?: D
): T | D {
  const keys = path.split('.');
  let result: any = obj;
  
  for (const key of keys) {
    if (result === undefined || result === null) {
      return defaultValue as D;
    }
    result = result[key];
  }
  
  return (result === undefined) ? (defaultValue as D) : result;
} 
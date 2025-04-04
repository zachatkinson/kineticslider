/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last time it was invoked.
 * 
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns A debounced version of the original function
 * 
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query) => {
 *   fetchSearchResults(query);
 * }, 300);
 * 
 * // Call it multiple times, but the function will only execute once after 300ms
 * debouncedSearch('test');
 * debouncedSearch('test1');
 * debouncedSearch('test2'); // Only this call will be executed after the delay
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function (...args: Parameters<T>): void {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Creates a throttled function that only invokes the provided function 
 * at most once per the specified wait time.
 * 
 * @param func The function to throttle
 * @param wait The number of milliseconds to throttle invocations to
 * @returns A throttled version of the original function
 * 
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => {
 *   trackScrollPosition();
 * }, 100);
 * 
 * // Attach to scroll event, but it will only run at most once every 100ms
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return function (...args: Parameters<T>): void {
    const now = Date.now();
    
    if (now - lastCall >= wait) {
      func(...args);
      lastCall = now;
    }
  };
} 
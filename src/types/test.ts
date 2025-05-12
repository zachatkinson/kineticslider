/**
 * Types for test utilities
 */

/**
 * Mock function type for testing
 *
 * @example Example usage
 */
export interface MockFunction<T extends (...args: any[]) => any> {
  /**
   * The mocked function
   */
  (...args: Parameters<T>): ReturnType<T>;

  /**
   * Mocks the _implementation of the function
   */
  mockImplementation: (_implementation: T) => MockFunction<T>;

  /**
   * Mocks the return value of the function
   */
  mockReturnValue: (value: ReturnType<T>) => MockFunction<T>;

  /**
   * Clears all information stored about function calls
   */
  mockClear: () => MockFunction<T>;

  /**
   * Resets the function to its initial state
   */
  mockReset: () => MockFunction<T>;

  /**
   * Information about calls to the function
   */
  mock: {
    /**
     * Number of times the function was called
     */
    calls: Parameters<T>[][];

    /**
     * Return values from function calls
     */
    results: Array<{ type: "return" | "throw"; value: ReturnType<T> | Error }>;

    /**
     * Function instances
     */
    instances: unknown[];

    /**
     * Last call arguments
     */
    lastCall?: Parameters<T>[];
  };
}

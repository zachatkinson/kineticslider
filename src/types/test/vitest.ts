/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

/**
 * Custom test matchers for Vitest
 * @description * @example Example usage
 * @example
 * ```typescript
 * // Adding a custom matcher
 * expect.extend({
 *   toHaveBeenCalledWithDirection(received, direction) {
 *     const calls = received.mock.calls;
 *     const pass = calls.some(call => call[0]?.direction === direction);
 *     return {
 *       pass,
 *       message: () => `Expected mock ${pass ? 'not ' : ''}to have been called with direction: ${direction}`
 *     };
 *   }
 * });
 * 
 * // Using the custom matcher
 * expect(mockGestureHandler).toHaveBeenCalledWithDirection('left');
 * ```
 */
export interface CustomMatchers<R = unknown> {
  toHaveBeenCalledWithDirection(direction: string): R;
}

/**
 * Extended assertion interface with custom matchers
 * @description * @example Example usage
 * @example
 * ```typescript
 * // Creating a typed extended expect
 * const customExpect = (value: unknown): ExtendedAssertion => {
 *   return expect(value) as ExtendedAssertion;
 * };
 * 
 * // Using the extended assertion
 * customExpect(mockGestureHandler).toHaveBeenCalledWithDirection('right');
 * customExpect(value).toBe(expectedValue);
 * ```
 */
export interface ExtendedAssertion<T = unknown> extends CustomMatchers<T> {
  toBe(expected: unknown): void;
}

/**
 * Extended asymmetric matchers interface
 * @description * @example Example usage
 * @example
 * ```typescript
 * // Creating an asymmetric matcher
 * const hasDirection = (direction: string) => ({
 *   asymmetricMatch: (actual: unknown) => {
 *     return actual.direction === direction;
 *   },
 *   toString: () => `HasDirection(${direction})`,
 *   toJSON: () => `HasDirection(${direction})`
 * });
 * 
 * // Using the asymmetric matcher
 * expect({ direction: 'left', distance: 100 }).toEqual(expect.objectContaining({
 *   direction: hasDirection('left')
 * }));
 * ```
 */
export interface ExtendedAsymmetricMatchers extends CustomMatchers {
  toBe(expected: unknown): void;
}

/**
 * Extended mock interface for testing
 * @description * @example Example usage
 * @example
 * ```typescript
 * // Creating a typed mock function
 * const mockHandler: ExtendedMock = vi.fn()
 *   .mockImplementation((event) => {
 *     return event.type === 'swipe' ? true : false;
 *   });
 * 
 * // Using the mock
 * mockHandler({ type: 'swipe', direction: 'left' });
 * expect(mockHandler).toHaveBeenCalled();
 * expect(mockHandler.mock.calls[0][0]).toEqual({ type: 'swipe', direction: 'left' });
 * ```
 */
export interface ExtendedMock<_T = unknown> {
  (...args: unknown[]): unknown;
  mockImplementation(_fn: (...args: unknown[]) => unknown): this;
  mockReturnThis(): this;
  mockReturnValue(value: unknown): this;
  mockResolvedValue(value: unknown): this;
  mockRejectedValue(value: unknown): this;
  getMockName(): string;
  mock: {
    calls: unknown[][];
    instances: unknown[];
    invocationCallOrder: number[];
    results: { type: string; value: unknown }[];
  };
} 
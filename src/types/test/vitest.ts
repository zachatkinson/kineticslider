/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

/**
 * Custom test matchers for Vitest
 * @internal
 */
export interface CustomMatchers<R = unknown> {
  toHaveBeenCalledWithDirection(direction: string): R;
}

/**
 * Extended assertion interface with custom matchers
 * @internal
 */
export interface ExtendedAssertion<T = unknown> extends CustomMatchers<T> {
  toBe(expected: unknown): void;
}

/**
 * Extended asymmetric matchers interface
 * @internal
 */
export interface ExtendedAsymmetricMatchers extends CustomMatchers {
  toBe(expected: unknown): void;
}

/**
 * Extended mock interface for testing
 * @internal
 */
export interface ExtendedMock<_T = unknown> {
  (...args: unknown[]): unknown;
  mockImplementation(fn: (...args: unknown[]) => unknown): this;
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
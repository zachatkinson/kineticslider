/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

interface CustomMatchers<R = unknown> {
  toHaveBeenCalledWithDirection(direction: string): R;
}

declare module 'vitest' {
  interface Assertion<T = unknown> extends CustomMatchers<T> {
    toBe(expected: unknown): void;
  }
  interface AsymmetricMatchersContaining extends CustomMatchers {
    toBe(expected: unknown): void;
  }

  export const describe: typeof import('vitest').describe;
  export const it: typeof import('vitest').it;
  export const test: typeof import('vitest').test;
  export const expect: typeof import('vitest').expect;
  export const beforeAll: typeof import('vitest').beforeAll;
  export const afterAll: typeof import('vitest').afterAll;
  export const beforeEach: typeof import('vitest').beforeEach;
  export const afterEach: typeof import('vitest').afterEach;
  export const vi: typeof import('vitest').vi;

  export interface Mock<_T = unknown> {
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
}

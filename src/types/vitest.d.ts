/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { CustomMatchers as _CustomMatchers, ExtendedAssertion, ExtendedAsymmetricMatchers, ExtendedMock } from './test/vitest';

/**
 * Type declaration augmentations for Vitest
 * This file provides augmentations to the global vitest module
 * using types defined in src/types/test/vitest.ts
 */
declare module 'vitest' {
  interface Assertion<T = unknown> extends ExtendedAssertion<T> {}
  
  interface AsymmetricMatchersContaining extends ExtendedAsymmetricMatchers {}

  // Re-export the standard vitest exports
  export const describe: typeof import('vitest').describe;
  export const it: typeof import('vitest').it;
  export const test: typeof import('vitest').test;
  export const expect: typeof import('vitest').expect;
  export const beforeAll: typeof import('vitest').beforeAll;
  export const afterAll: typeof import('vitest').afterAll;
  export const beforeEach: typeof import('vitest').beforeEach;
  export const afterEach: typeof import('vitest').afterEach;
  export const vi: typeof import('vitest').vi;

  // Augment the Mock interface
  export interface Mock<T = unknown> extends ExtendedMock<T> {}
}

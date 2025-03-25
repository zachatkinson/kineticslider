/**
 * Mock version of environment.ts for tests
 * Always returns true for isDevelopment() since we want debug features enabled in tests
 */
export const isDevelopment = (): boolean => {
  return true;
};

/**
 * Centralized timeout configuration for E2E tests
 * Provides environment and browser-specific timeout values
 */

export interface TimeoutConfig {
  navigation: number;
  selector: number;
  animation: number;
  stateSync: number;
  verification: number;
  shortPause: number;
  mediumPause: number;
  longPause: number;
  maxRetries: number;
}

/**
 * Get optimized timeout configuration based on environment and browser
 */
export function getTimeoutConfig(
  browserName: string = 'chromium',
  isCI: boolean = process.env.CI === 'true'
): TimeoutConfig {
  const baseConfig: TimeoutConfig = {
    navigation: 5000,
    selector: 3000,
    animation: 1000,
    stateSync: 2000,
    verification: 3000,
    shortPause: 100,
    mediumPause: 500,
    longPause: 1000,
    maxRetries: 3,
  };

  // CI environment adjustments (increased for slower CI runners)
  if (isCI) {
    return {
      ...baseConfig,
      navigation: 10000, // Increased from 8000
      selector: 7000, // Increased from 5000
      animation: 3000, // Increased from 2000
      stateSync: 5000, // Increased from 3000
      verification: 6000, // Increased from 4000
      shortPause: 300, // Increased from 200
      mediumPause: 1000, // Increased from 800
      longPause: 2000, // Increased from 1500
      maxRetries: 5,
    };
  }

  // Browser-specific adjustments
  const browserAdjustments: Record<string, Partial<TimeoutConfig>> = {
    webkit: {
      navigation: 6000,
      stateSync: 2500,
      verification: 3500,
    },
    firefox: {
      navigation: 7000,
      animation: 1500,
      stateSync: 3000,
    },
    'Mobile Chrome': {
      navigation: 10000,
      selector: 6000,
      stateSync: 4000,
      verification: 5000,
    },
  };

  const adjustments = browserAdjustments[browserName] || {};

  return {
    ...baseConfig,
    ...adjustments,
  };
}

/**
 * Calculate cumulative timeout for complex operations
 */
export function getCumulativeTimeout(
  config: TimeoutConfig,
  operations: (keyof TimeoutConfig)[]
): number {
  return operations.reduce((total, op) => {
    const value = config[op];
    return total + (typeof value === 'number' ? value : 0);
  }, 0);
}

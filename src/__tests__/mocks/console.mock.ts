/**
 * Mock implementations for console utilities
 */
import { vi } from "vitest";

/**
 * Creates console spies with optional mock implementations
 *
 * @returns Object with console spies and utility functions
 *
 */
export const createConsoleMocks = (): {
  spies: {
    error: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    log: ReturnType<typeof vi.spyOn>;
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
  };
  restore: () => void;
  reset: () => void;
} => {
  const consoleSpies = {
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  };

  return {
    spies: consoleSpies,
    restore: (): void => {
      Object.values(consoleSpies).forEach(spy => spy.mockRestore());
    },
    reset: (): void => {
      Object.values(consoleSpies).forEach(spy => spy.mockReset());
    },
  };
};

/**
 * Silent console mock that suppresses all output
 */
export const silentConsole = createConsoleMocks();

/**
 * Console mock that logs to arrays for inspection
 *
 * @returns Object with logs array, spies, and utility functions
 *
 */
export const collectingConsole = (): {
  logs: Array<{ level: string; args: unknown[] }>;
  spies: Record<string, ReturnType<typeof vi.spyOn>>;
  restore: () => void;
  clear: () => void;
} => {
  const logs: { level: string; args: unknown[] }[] = [];
  
  return {
    logs,
    spies: {
      error: vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        logs.push({ level: 'error', args });
      }),
      warn: vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
        logs.push({ level: 'warn', args });
      }),
      log: vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
        logs.push({ level: 'log', args });
      }),
      debug: vi.spyOn(console, 'debug').mockImplementation((...args: unknown[]) => {
        logs.push({ level: 'debug', args });
      }),
      info: vi.spyOn(console, 'info').mockImplementation((...args: unknown[]) => {
        logs.push({ level: 'info', args });
      }),
    },
    restore: (): void => {
      Object.values(collectingConsole().spies).forEach(spy => spy.mockRestore());
    },
    clear: (): void => {
      logs.length = 0;
    }
  };
};

/**
 * Setup console mocks for testing environment
 *
 * @returns Console mocks object
 *
 */
export const setupConsoleMocks = (): typeof silentConsole => {
  return silentConsole;
};

/**
 * Restore console to original state
 *
 * @returns void
 *
 */
export const restoreConsole = (): void => {
  silentConsole.restore();
}; 
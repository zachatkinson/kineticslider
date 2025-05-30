/**
 * Professional logging utility for KineticSlider
 * Replaces all console.* statements with proper logging levels
 */

import { LogLevel } from "../types/logger";
import type { LogEntry, LoggerConfig } from "../types/logger";
export { LogLevel } from "../types/logger";
export type { LogEntry, LoggerConfig } from "../types/logger";

class Logger {
  private config: LoggerConfig;
  private entries: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
      enableConsole: process.env.NODE_ENV !== 'production',
      enableStorage: true,
      maxEntries: 1000,
      ...config,
    };
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    // Store entry
    if (this.config.enableStorage) {
      this.entries.push(entry);
      if (this.entries.length > this.config.maxEntries) {
        this.entries.shift();
      }
    }

    // Console output (only in development)
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const { level, message, context, error } = entry;
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const fullMessage = `[${LogLevel[level]}] ${message}${contextStr}`;

    switch (level) {
      case LogLevel.DEBUG:
        // eslint-disable-next-line no-console
        console.debug(fullMessage);
        break;
      case LogLevel.INFO:
        // eslint-disable-next-line no-console
        console.info(fullMessage);
        break;
      case LogLevel.WARN:
        console.warn(fullMessage);
        break;
      case LogLevel.ERROR:
        console.error(fullMessage, error);
        break;
    }
  }

  /**
   * Log a debug message
   *
   * @param message - The debug message to log
   *
   * @param context - Optional context information
   *
   * @returns void
   *
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   *
   * @param message - The info message to log
   *
   * @param context - Optional context information
   *
   * @returns void
   *
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   *
   * @param message - The warning message to log
   *
   * @param context - Optional context information
   *
   * @returns void
   *
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   *
   * @param message - The error message to log
   *
   * @param error - Optional error object
   *
   * @param context - Optional context information
   *
   * @returns void
   *
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log a performance measurement
   *
   * @param operation - The operation that was measured
   *
   * @param duration - The duration in milliseconds
   *
   * @param context - Optional context information
   *
   * @returns void
   *
   */
  performance(operation: string, duration: number, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, `Performance: ${operation} took ${duration}ms`, context);
  }

  /**
   * Get all log entries
   *
   * @returns Array of log entries
   *
   */
  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Clear all log entries
   *
   * @returns void
   *
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Set the logging level
   *
   * @param level - The new logging level
   *
   * @returns void
   *
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Export factory for custom loggers
 *
 * @param config - Configuration for the logger
 *
 * @returns A new Logger instance
 *
 */
export function createLogger(config: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}

// Convenience functions
export const log = {
  debug: (message: string, context?: Record<string, unknown>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, unknown>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, unknown>) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: Record<string, unknown>) => logger.error(message, error, context),
  performance: (operation: string, duration: number, context?: Record<string, unknown>) => logger.performance(operation, duration, context),
}; 
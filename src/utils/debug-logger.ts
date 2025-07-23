/**
 * @fileoverview Debug Logger Utility
 *
 * Provides a centralized logging solution that only logs when debug mode is enabled.
 * Replaces console.log, console.warn, and console.error statements throughout the codebase
 * with a production-safe logging mechanism.
 *
 * @version 1.0.0
 */

import { SLIDER_EVENTS } from '../core/constants';
import type { SimpleEventEmitter } from '../core/event-emitter';

/**
 * Log levels for debug output
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Debug log entry interface
 */
export interface DebugLogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: number;
}

/**
 * Debug logger that respects the debug configuration
 */
export class DebugLogger {
  private static instance: DebugLogger | null = null;
  private debugEnabled = false;
  private eventEmitter: SimpleEventEmitter | null = null;
  private logHistory: DebugLogEntry[] = [];
  private readonly maxHistorySize = 100;

  private constructor() {}

  /**
   * Get singleton instance of debug logger
   */
  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  /**
   * Initialize the debug logger with configuration
   * @param debugEnabled - Whether debug logging is enabled
   * @param eventEmitter - Event emitter for important messages
   */
  initialize(debugEnabled: boolean, eventEmitter?: SimpleEventEmitter): void {
    this.debugEnabled = debugEnabled;
    this.eventEmitter = eventEmitter || null;
  }

  /**
   * Log a debug message
   * @param message - Debug message
   * @param context - Optional context (e.g., component name)
   * @param data - Optional additional data
   */
  debug(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log an info message
   * @param message - Info message
   * @param context - Optional context (e.g., component name)
   * @param data - Optional additional data
   */
  info(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Log a warning message - always emits as event for production handling
   * @param message - Warning message
   * @param context - Optional context (e.g., component name)
   * @param data - Optional additional data
   */
  warn(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, context, data);

    // Always emit warnings as events for production handling
    if (this.eventEmitter) {
      this.eventEmitter.emit(SLIDER_EVENTS.STATE_VALIDATION_WARNING, {
        message,
        context,
        data,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Log an error message - always emits as event for production handling
   * @param message - Error message
   * @param context - Optional context (e.g., component name)
   * @param data - Optional additional data or error object
   */
  error(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, context, data);

    // Always emit errors as events for production handling
    if (this.eventEmitter) {
      this.eventEmitter.emit(SLIDER_EVENTS.ERROR, {
        message,
        context,
        data,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Internal logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: unknown
  ): void {
    const entry: DebugLogEntry = {
      level,
      message,
      context,
      data,
      timestamp: Date.now(),
    };

    // Add to history for debugging
    this.addToHistory(entry);

    // Only output to console in debug mode
    if (this.debugEnabled) {
      const contextStr = context ? `[${context}] ` : '';
      const fullMessage = `${contextStr}${message}`;

      switch (level) {
        case LogLevel.DEBUG:
          // eslint-disable-next-line no-console
          console.log(`🔍 ${fullMessage}`, data || '');
          break;
        case LogLevel.INFO:
          // eslint-disable-next-line no-console
          console.info(`ℹ️ ${fullMessage}`, data || '');
          break;
        case LogLevel.WARN:
          // eslint-disable-next-line no-console
          console.warn(`⚠️ ${fullMessage}`, data || '');
          break;
        case LogLevel.ERROR:
          // eslint-disable-next-line no-console
          console.error(`❌ ${fullMessage}`, data || '');
          break;
      }
    }
  }

  /**
   * Add entry to log history with size management
   */
  private addToHistory(entry: DebugLogEntry): void {
    this.logHistory.push(entry);

    // Maintain history size limit
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * Get recent log history (useful for debugging)
   */
  getLogHistory(): readonly DebugLogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugEnabled(): boolean {
    return this.debugEnabled;
  }

  /**
   * Update debug enabled state
   */
  setDebugEnabled(enabled: boolean): void {
    this.debugEnabled = enabled;
  }
}

/**
 * Convenience function to get the debug logger instance
 */
export const debugLogger = DebugLogger.getInstance();

/**
 * Convenience functions for logging
 */
export const debug = (
  message: string,
  context?: string,
  data?: unknown
): void => {
  debugLogger.debug(message, context, data);
};

export const info = (
  message: string,
  context?: string,
  data?: unknown
): void => {
  debugLogger.info(message, context, data);
};

export const warn = (
  message: string,
  context?: string,
  data?: unknown
): void => {
  debugLogger.warn(message, context, data);
};

export const error = (
  message: string,
  context?: string,
  data?: unknown
): void => {
  debugLogger.error(message, context, data);
};

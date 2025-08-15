/**
 * @fileoverview Tests for Debug Logger Utility
 *
 * Comprehensive tests for the debug logging system including:
 * - Singleton pattern behavior
 * - Log level filtering and output
 * - Event emission for warnings/errors
 * - History management
 * - Configuration and state management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DebugLogger,
  LogLevel,
  debug,
  info,
  warn,
  error,
} from '../../utils/debug-logger';
import { SLIDER_EVENTS } from '../../core/constants';
import type { SimpleEventEmitter } from '../../core/event-emitter';

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock event emitter
const createMockEventEmitter = (): SimpleEventEmitter => {
  return {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
    removeAllListeners: vi.fn(),
    eventNames: vi.fn(() => []),
    listenerCount: vi.fn(() => 0),
  } as unknown as SimpleEventEmitter;
};

describe('DebugLogger', () => {
  let logger: DebugLogger;
  let mockEventEmitter: SimpleEventEmitter;

  beforeEach(() => {
    // Reset singleton instance for testing
    (DebugLogger as unknown as { instance: DebugLogger | null }).instance =
      null;
    logger = DebugLogger.getInstance();
    mockEventEmitter = createMockEventEmitter();

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
    vi.spyOn(console, 'info').mockImplementation(mockConsole.info);
    vi.spyOn(console, 'warn').mockImplementation(mockConsole.warn);
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error);

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    logger.clearHistory();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = DebugLogger.getInstance();
      const instance2 = DebugLogger.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(logger);
    });

    it('should maintain singleton behavior after reset', () => {
      // Test that getInstance consistently returns the same instance after reset
      const instance1 = DebugLogger.getInstance();
      const instance2 = DebugLogger.getInstance();
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(logger);
    });
  });

  describe('Initialization', () => {
    it('should initialize with debug disabled by default', () => {
      expect(logger.isDebugEnabled()).toBe(false);
    });

    it('should initialize with debug enabled when configured', () => {
      logger.initialize(true);
      expect(logger.isDebugEnabled()).toBe(true);
    });

    it('should store event emitter when provided', () => {
      logger.initialize(true, mockEventEmitter);

      // Test that event emitter is used by triggering a warning
      logger.warn('test warning');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        SLIDER_EVENTS.STATE_VALIDATION_WARNING,
        expect.objectContaining({
          message: 'test warning',
          timestamp: expect.any(Number),
        })
      );
    });

    it('should work without event emitter', () => {
      logger.initialize(true);

      // Should not throw when emitting without event emitter
      expect(() => {
        logger.warn('test warning');
        logger.error('test error');
      }).not.toThrow();
    });
  });

  describe('Debug Configuration', () => {
    it('should update debug enabled state', () => {
      expect(logger.isDebugEnabled()).toBe(false);

      logger.setDebugEnabled(true);
      expect(logger.isDebugEnabled()).toBe(true);

      logger.setDebugEnabled(false);
      expect(logger.isDebugEnabled()).toBe(false);
    });
  });

  describe('Logging Methods', () => {
    beforeEach(() => {
      logger.initialize(true, mockEventEmitter);
    });

    describe('debug()', () => {
      it('should log debug messages when debug is enabled', () => {
        logger.debug('test debug message');

        expect(console.log).toHaveBeenCalledWith('🔍 test debug message', '');
      });

      it('should include context in debug messages', () => {
        logger.debug('test message', 'TestComponent');

        expect(console.log).toHaveBeenCalledWith(
          '🔍 [TestComponent] test message',
          ''
        );
      });

      it('should include data in debug messages', () => {
        const testData = { key: 'value' };
        logger.debug('test message', 'TestComponent', testData);

        expect(console.log).toHaveBeenCalledWith(
          '🔍 [TestComponent] test message',
          testData
        );
      });

      it('should not log to console when debug is disabled', () => {
        logger.setDebugEnabled(false);
        logger.debug('test message');

        expect(console.log).not.toHaveBeenCalled();
      });

      it('should still add to history when debug is disabled', () => {
        logger.setDebugEnabled(false);
        logger.debug('test message');

        const history = logger.getLogHistory();
        expect(history).toHaveLength(1);
        expect(history[0]).toMatchObject({
          level: LogLevel.DEBUG,
          message: 'test message',
        });
      });
    });

    describe('info()', () => {
      it('should log info messages with correct format', () => {
        logger.info('test info message', 'TestComponent');

        expect(console.info).toHaveBeenCalledWith(
          'ℹ️ [TestComponent] test info message',
          ''
        );
      });

      it('should not emit events for info messages', () => {
        logger.info('test info');

        expect(mockEventEmitter.emit).not.toHaveBeenCalled();
      });
    });

    describe('warn()', () => {
      it('should log warning messages with correct format', () => {
        logger.warn('test warning', 'TestComponent');

        expect(console.warn).toHaveBeenCalledWith(
          '⚠️ [TestComponent] test warning',
          ''
        );
      });

      it('should emit warning events even when debug is disabled', () => {
        logger.setDebugEnabled(false);
        logger.warn('test warning', 'TestComponent', { data: 'test' });

        expect(mockEventEmitter.emit).toHaveBeenCalledWith(
          SLIDER_EVENTS.STATE_VALIDATION_WARNING,
          {
            message: 'test warning',
            context: 'TestComponent',
            data: { data: 'test' },
            timestamp: expect.any(Number),
          }
        );
      });

      it('should not log to console when debug is disabled but still emit event', () => {
        logger.setDebugEnabled(false);
        logger.warn('test warning');

        expect(console.warn).not.toHaveBeenCalled();
        expect(mockEventEmitter.emit).toHaveBeenCalled();
      });
    });

    describe('error()', () => {
      it('should log error messages with correct format', () => {
        logger.error('test error', 'TestComponent');

        expect(console.error).toHaveBeenCalledWith(
          '❌ [TestComponent] test error',
          ''
        );
      });

      it('should emit error events even when debug is disabled', () => {
        logger.setDebugEnabled(false);
        logger.error('test error', 'TestComponent', new Error('test'));

        expect(mockEventEmitter.emit).toHaveBeenCalledWith(
          SLIDER_EVENTS.ERROR,
          {
            message: 'test error',
            context: 'TestComponent',
            data: expect.any(Error),
            timestamp: expect.any(Number),
          }
        );
      });
    });
  });

  describe('History Management', () => {
    beforeEach(() => {
      logger.initialize(true);
      logger.clearHistory();
    });

    it('should maintain log history', () => {
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warning message');
      logger.error('error message');

      const history = logger.getLogHistory();
      expect(history).toHaveLength(4);

      expect(history[0]).toMatchObject({
        level: LogLevel.DEBUG,
        message: 'debug message',
        timestamp: expect.any(Number),
      });

      expect(history[1]).toMatchObject({
        level: LogLevel.INFO,
        message: 'info message',
      });

      expect(history[2]).toMatchObject({
        level: LogLevel.WARN,
        message: 'warning message',
      });

      expect(history[3]).toMatchObject({
        level: LogLevel.ERROR,
        message: 'error message',
      });
    });

    it('should include context and data in history entries', () => {
      const testData = { key: 'value' };
      logger.debug('test message', 'TestContext', testData);

      const history = logger.getLogHistory();
      expect(history[0]).toMatchObject({
        level: LogLevel.DEBUG,
        message: 'test message',
        context: 'TestContext',
        data: testData,
        timestamp: expect.any(Number),
      });
    });

    it('should limit history size to maxHistorySize', () => {
      // Add more than max history size (100 entries)
      for (let i = 0; i < 150; i++) {
        logger.debug(`message ${i}`);
      }

      const history = logger.getLogHistory();
      expect(history).toHaveLength(100);

      // Should contain the most recent entries
      expect(history[0].message).toBe('message 50'); // First kept entry
      expect(history[99].message).toBe('message 149'); // Last entry
    });

    it('should clear history when requested', () => {
      logger.debug('message 1');
      logger.info('message 2');

      expect(logger.getLogHistory()).toHaveLength(2);

      logger.clearHistory();

      expect(logger.getLogHistory()).toHaveLength(0);
    });

    it('should return readonly copy of history', () => {
      logger.debug('test message');
      const history = logger.getLogHistory();

      // Should not be able to modify the returned array
      expect(() => {
        (
          history as unknown as Array<{ level: LogLevel; message: string }>
        ).push({ level: LogLevel.INFO, message: 'hacked' });
      }).not.toThrow();

      // Original history should be unchanged
      expect(logger.getLogHistory()).toHaveLength(1);
      expect(logger.getLogHistory()[0].message).toBe('test message');
    });
  });

  describe('Convenience Functions', () => {
    beforeEach(() => {
      // The convenience functions use the same singleton instance that was reset
      // in the main beforeEach, so we just need to initialize it
      logger.initialize(true, mockEventEmitter);
    });

    it('should provide debug convenience function', () => {
      debug('test debug', 'TestContext', { data: 'test' });

      expect(console.log).toHaveBeenCalledWith('🔍 [TestContext] test debug', {
        data: 'test',
      });
    });

    it('should provide info convenience function', () => {
      info('test info', 'TestContext');

      expect(console.info).toHaveBeenCalledWith(
        'ℹ️ [TestContext] test info',
        ''
      );
    });

    it('should provide warn convenience function', () => {
      warn('test warning', 'TestContext');

      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ [TestContext] test warning',
        ''
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        SLIDER_EVENTS.STATE_VALIDATION_WARNING,
        expect.objectContaining({
          message: 'test warning',
          context: 'TestContext',
        })
      );
    });

    it('should provide error convenience function', () => {
      error('test error', 'TestContext');

      expect(console.error).toHaveBeenCalledWith(
        '❌ [TestContext] test error',
        ''
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        SLIDER_EVENTS.ERROR,
        expect.objectContaining({
          message: 'test error',
          context: 'TestContext',
        })
      );
    });
  });

  describe('LogLevel Enum', () => {
    it('should export correct log level values', () => {
      expect(LogLevel.DEBUG).toBe('debug');
      expect(LogLevel.INFO).toBe('info');
      expect(LogLevel.WARN).toBe('warn');
      expect(LogLevel.ERROR).toBe('error');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      logger.initialize(true);
    });

    it('should handle undefined context and data gracefully', () => {
      expect(() => {
        logger.debug('message', undefined, undefined);
      }).not.toThrow();

      expect(console.log).toHaveBeenCalledWith('🔍 message', '');
    });

    it('should handle empty strings gracefully', () => {
      logger.debug('', '', '');

      // Empty context string results in no context brackets
      expect(console.log).toHaveBeenCalledWith('🔍 ', '');
    });

    it('should handle complex data objects', () => {
      const complexData = {
        nested: { object: 'value' },
        array: [1, 2, 3],
        function: () => 'test',
        null: null,
        undefined: undefined,
      };

      expect(() => {
        logger.debug('complex data test', 'TestContext', complexData);
      }).not.toThrow();

      const history = logger.getLogHistory();
      expect(history[0].data).toBe(complexData);
    });

    it('should handle initialization multiple times', () => {
      const eventEmitter1 = createMockEventEmitter();
      const eventEmitter2 = createMockEventEmitter();

      logger.initialize(true, eventEmitter1);
      logger.initialize(false, eventEmitter2);

      expect(logger.isDebugEnabled()).toBe(false);

      // Should use the latest event emitter
      logger.warn('test');
      expect(eventEmitter1.emit).not.toHaveBeenCalled();
      expect(eventEmitter2.emit).toHaveBeenCalled();
    });
  });

  describe('Production Safety', () => {
    it('should not log to console in production mode', () => {
      logger.initialize(false); // Production mode

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warning message');
      logger.error('error message');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should still emit important events in production mode', () => {
      logger.initialize(false, mockEventEmitter); // Production mode

      logger.warn('warning in production');
      logger.error('error in production');

      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(2);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        SLIDER_EVENTS.STATE_VALIDATION_WARNING,
        expect.any(Object)
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        SLIDER_EVENTS.ERROR,
        expect.any(Object)
      );
    });

    it('should maintain history in production mode for debugging', () => {
      logger.initialize(false); // Production mode

      logger.debug('debug message');
      logger.error('error message');

      const history = logger.getLogHistory();
      expect(history).toHaveLength(2);
      expect(history[0].level).toBe(LogLevel.DEBUG);
      expect(history[1].level).toBe(LogLevel.ERROR);
    });
  });
});

/**
 * @fileoverview SimpleEventEmitter Tests
 *
 * Tests for the event emitter used for component communication throughout KineticSlider.
 * Verifies event emission, subscription management, and error handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimpleEventEmitter } from '../../core/event-emitter';
import { TEST_CONFIG } from '../../core/constants';
import {
  createMockListeners,
  createTestEventEmitter,
  testEventEmission,
} from '../utils/test-factories';

describe('SimpleEventEmitter', () => {
  let emitter: SimpleEventEmitter;

  beforeEach(() => {
    emitter = createTestEventEmitter();
  });

  describe('Event Subscription', () => {
    it('should register event listeners', () => {
      const result = testEventEmission(emitter, 'test-event', 'test data');

      expect(result.wasCalledOnce).toBe(true);
      expect(result.wasCalledWith).toBe(true);
    });

    it('should handle multiple listeners for same event', () => {
      const [listener1, listener2] = createMockListeners(2);

      emitter.on('test-event', listener1);
      emitter.on('test-event', listener2);

      emitter.emit('test-event', 'test data');

      expect(listener1).toHaveBeenCalledWith('test data');
      expect(listener2).toHaveBeenCalledWith('test data');
    });

    it('should handle multiple events independently', () => {
      const [listener1, listener2] = createMockListeners(2);

      emitter.on('event1', listener1);
      emitter.on('event2', listener2);

      emitter.emit('event1', 'data1');
      emitter.emit('event2', 'data2');

      expect(listener1).toHaveBeenCalledWith('data1');
      expect(listener1).not.toHaveBeenCalledWith('data2');
      expect(listener2).toHaveBeenCalledWith('data2');
      expect(listener2).not.toHaveBeenCalledWith('data1');
    });
  });

  describe('Event Emission', () => {
    it('should emit events with correct data', () => {
      const testData = { message: 'test', value: 42 };
      const result = testEventEmission(emitter, 'test-event', testData);

      expect(result.wasCalledOnce).toBe(true);
      expect(result.wasCalledWith).toBe(true);
    });

    it('should handle events with no listeners', () => {
      // Should not throw error
      expect(() => {
        emitter.emit('non-existent-event', 'data');
      }).not.toThrow();
    });

    it('should emit events without data', () => {
      const result = testEventEmission(emitter, 'test-event');

      expect(result.wasCalledOnce).toBe(true);
      expect(result.wasCalledWith).toBe(true);
    });
  });

  describe('Event Unsubscription', () => {
    it('should remove specific listener', () => {
      const [listener1, listener2] = createMockListeners(2);

      emitter.on('test-event', listener1);
      emitter.on('test-event', listener2);

      emitter.off('test-event', listener1);
      emitter.emit('test-event', 'data');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith('data');
    });

    it('should remove all listeners for an event', () => {
      const [listener1, listener2] = createMockListeners(2);

      emitter.on('test-event', listener1);
      emitter.on('test-event', listener2);

      emitter.removeAllListeners('test-event');
      emitter.emit('test-event', 'data');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should handle removing non-existent listener', () => {
      const [listener] = createMockListeners(1);

      // Should not throw error
      expect(() => {
        emitter.off('non-existent-event', listener);
      }).not.toThrow();
    });

    it('should handle removing from non-existent event', () => {
      // Should not throw error
      expect(() => {
        emitter.removeAllListeners('non-existent-event');
      }).not.toThrow();
    });
  });

  describe('Event Listener Management', () => {
    it('should not affect other events when removing listeners', () => {
      const [listener1, listener2] = createMockListeners(2);

      emitter.on('event1', listener1);
      emitter.on('event2', listener2);

      emitter.removeAllListeners('event1');
      emitter.emit('event1', 'data1');
      emitter.emit('event2', 'data2');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith('data2');
    });
  });

  describe('Error Handling', () => {
    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error(TEST_CONFIG.ERRORS.LISTENER_ERROR);
      });
      const [normalListener] = createMockListeners(1);

      emitter.on('test-event', errorListener);
      emitter.on('test-event', normalListener);

      // Should not throw and should continue with other listeners
      expect(() => {
        emitter.emit('test-event', 'data');
      }).not.toThrow();

      expect(errorListener).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalledWith('data');
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory when adding/removing many listeners', () => {
      const listeners = createMockListeners(1000);

      // Add many listeners
      listeners.forEach((listener) => {
        emitter.on('test-event', listener);
      });

      // Remove all listeners
      emitter.removeAllListeners('test-event');

      // Emit event - no listeners should be called
      emitter.emit('test-event', 'data');

      listeners.forEach((listener) => {
        expect(listener).not.toHaveBeenCalled();
      });
    });
  });
});

/**
 * @fileoverview GestureRecognizer Unit Tests
 *
 * Comprehensive testing for advanced gesture recognition using Pointer Events API.
 * Tests cover gesture classification, multi-touch handling, physics integration,
 * and cross-platform compatibility following our established DRY testing patterns.
 *
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GestureRecognizer, GestureType, GestureDirection } from '../../input/gesture-recognizer';
import {
  createPerformanceMeasure,
  assertPerformanceWithinBenchmark,
} from '../utils/test-factories';
import { INPUT } from '../../core/constants';

// Mock pointer event factory
const createMockPointerEvent = (
  type: string,
  options: Partial<PointerEvent> = {}
): PointerEvent => ({
  type,
  pointerId: 1,
  clientX: 100,
  clientY: 100,
  pageX: 100,
  pageY: 100,
  screenX: 100,
  screenY: 100,
  movementX: 0,
  movementY: 0,
  button: 0,
  buttons: 1,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  metaKey: false,
  bubbles: true,
  cancelable: true,
  composed: true,
  currentTarget: null,
  defaultPrevented: false,
  eventPhase: 0,
  isTrusted: true,
  target: null,
  timeStamp: performance.now(),
  width: 1,
  height: 1,
  pressure: 1,
  tangentialPressure: 0,
  tiltX: 0,
  tiltY: 0,
  twist: 0,
  pointerType: 'mouse',
  isPrimary: true,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  stopImmediatePropagation: vi.fn(),
  composedPath: vi.fn(() => []),
  initEvent: vi.fn(),
  ...options,
} as unknown as PointerEvent);

describe('GestureRecognizer', () => {
  let recognizer: GestureRecognizer;
  let mockElement: HTMLElement;
  let gestureCallback: ReturnType<typeof vi.fn>;
  let performanceMeasure: ReturnType<typeof createPerformanceMeasure>;

  beforeEach(() => {
    // Create mock element
    mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    } as unknown as HTMLElement;

    gestureCallback = vi.fn();
    performanceMeasure = createPerformanceMeasure();
    
    recognizer = new GestureRecognizer(mockElement, {
      enableMultiTouch: true,
      swipeThreshold: INPUT.SWIPE_THRESHOLD,
      tapTimeout: 300,
    });

    recognizer.onGesture = gestureCallback;
  });

  afterEach(() => {
    recognizer.destroy();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultRecognizer = new GestureRecognizer(mockElement);
      expect(defaultRecognizer).toBeDefined();
      
      // Verify event listeners are set up
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'pointerdown',
        expect.any(Function)
      );
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'pointermove',
        expect.any(Function)
      );
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'pointerup',
        expect.any(Function)
      );
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'pointercancel',
        expect.any(Function)
      );

      defaultRecognizer.destroy();
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        enableMultiTouch: false,
        swipeThreshold: 100,
        tapTimeout: 200,
        longPressTimeout: 800,
      };
      
      const customRecognizer = new GestureRecognizer(mockElement, customConfig);
      expect(customRecognizer).toBeDefined();
      customRecognizer.destroy();
    });

    it('should handle partial configuration updates', () => {
      const partialConfig = { swipeThreshold: 150 };
      const partialRecognizer = new GestureRecognizer(mockElement, partialConfig);
      
      expect(partialRecognizer).toBeDefined();
      partialRecognizer.destroy();
    });
  });

  describe('Tap Gesture Recognition', () => {
    it('should recognize single tap gesture', async () => {
      const pointerDown = createMockPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      });
      const pointerUp = createMockPointerEvent('pointerup', {
        clientX: 102, // Slight movement within tap threshold
        clientY: 101,
      });

      // Simulate tap sequence
      recognizer['handlePointerDown'](pointerDown);
      
      // Short delay within tap timeout
      await new Promise(resolve => setTimeout(resolve, 100));
      
      recognizer['handlePointerUp'](pointerUp);

      expect(gestureCallback).toHaveBeenCalledTimes(1);
      expect(gestureCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: GestureType.TAP,
          direction: GestureDirection.NONE,
          pointerCount: 1,
        })
      );
    });

    it('should recognize double tap gesture', async () => {
      const firstTap = {
        down: createMockPointerEvent('pointerdown', { clientX: 100, clientY: 100 }),
        up: createMockPointerEvent('pointerup', { clientX: 100, clientY: 100 }),
      };
      
      const secondTap = {
        down: createMockPointerEvent('pointerdown', { 
          pointerId: 1, // Same pointer ID as first tap for double tap detection
          clientX: 102, // Within tap threshold (5px) from first tap
          clientY: 102 
        }),
        up: createMockPointerEvent('pointerup', { 
          pointerId: 1, // Same pointer ID as first tap for double tap detection
          clientX: 102, 
          clientY: 102 
        }),
      };

      // First tap
      recognizer['handlePointerDown'](firstTap.down);
      await new Promise(resolve => setTimeout(resolve, 50));
      recognizer['handlePointerUp'](firstTap.up);

      // Verify first tap was detected
      expect(gestureCallback).toHaveBeenCalled();
      const firstCall = gestureCallback.mock.lastCall;
      expect(firstCall).toBeTruthy();
      const firstTapGesture = firstCall?.[0];
      expect(firstTapGesture?.type).toBe(GestureType.TAP);

      // Clear callback but keep internal state
      gestureCallback.mockClear();

      // Second tap (within double tap timeout)
      await new Promise(resolve => setTimeout(resolve, 50));
      recognizer['handlePointerDown'](secondTap.down);
      await new Promise(resolve => setTimeout(resolve, 50));
      recognizer['handlePointerUp'](secondTap.up);

      expect(gestureCallback).toHaveBeenCalled();
      const doubleTapCall = gestureCallback.mock.lastCall;
      expect(doubleTapCall).toBeTruthy();
      const doubleTapGesture = doubleTapCall?.[0];
      expect(doubleTapGesture?.type).toBe(GestureType.DOUBLE_TAP);
      expect(doubleTapGesture?.direction).toBe(GestureDirection.NONE);
    });

    it('should handle long press gesture', async () => {
      const longPressRecognizer = new GestureRecognizer(mockElement, {
        longPressTimeout: 100, // Short timeout for testing
      });
      longPressRecognizer.onGesture = gestureCallback;

      const pointerDown = createMockPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
      });

      longPressRecognizer['handlePointerDown'](pointerDown);
      
      // Wait for long press timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(gestureCallback).toHaveBeenCalled();
      const longPressCall = gestureCallback.mock.lastCall;
      expect(longPressCall).toBeTruthy();
      const longPressGesture = longPressCall?.[0];
      expect(longPressGesture?.type).toBe(GestureType.LONG_PRESS);
      expect(longPressGesture?.direction).toBe(GestureDirection.NONE);

      longPressRecognizer.destroy();
    });
  });

  describe('Swipe Gesture Recognition', () => {
    it('should recognize left swipe gesture', async () => {
      const swipeEvents = [
        createMockPointerEvent('pointerdown', { clientX: 200, clientY: 100 }),
        createMockPointerEvent('pointermove', { clientX: 150, clientY: 100 }),
        createMockPointerEvent('pointermove', { clientX: 100, clientY: 100 }),
        createMockPointerEvent('pointermove', { clientX: 50, clientY: 100 }),
        createMockPointerEvent('pointerup', { clientX: 50, clientY: 100 }),
      ];

      // Simulate fast left swipe
      recognizer['handlePointerDown'](swipeEvents[0]);
      
      for (let i = 1; i < swipeEvents.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 5)); // Fast movement
        recognizer['handlePointerMove'](swipeEvents[i]);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5));
      recognizer['handlePointerUp'](swipeEvents[swipeEvents.length - 1]);

      expect(gestureCallback).toHaveBeenCalled();
      const leftSwipeCall = gestureCallback.mock.lastCall;
      expect(leftSwipeCall).toBeTruthy();
      const leftSwipeGesture = leftSwipeCall?.[0];
      expect(leftSwipeGesture?.type).toBe(GestureType.SWIPE_LEFT);
      expect(leftSwipeGesture?.direction).toBe(GestureDirection.LEFT);
      expect(typeof leftSwipeGesture?.distance).toBe('number');
      expect(typeof leftSwipeGesture?.velocity).toBe('number');
    });

    it('should recognize right swipe gesture', async () => {
      const swipeEvents = [
        createMockPointerEvent('pointerdown', { clientX: 50, clientY: 100 }),
        createMockPointerEvent('pointermove', { clientX: 100, clientY: 100 }),
        createMockPointerEvent('pointermove', { clientX: 150, clientY: 100 }),
        createMockPointerEvent('pointermove', { clientX: 200, clientY: 100 }),
        createMockPointerEvent('pointerup', { clientX: 200, clientY: 100 }),
      ];

      // Simulate fast right swipe
      recognizer['handlePointerDown'](swipeEvents[0]);
      
      for (let i = 1; i < swipeEvents.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 5));
        recognizer['handlePointerMove'](swipeEvents[i]);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5));
      recognizer['handlePointerUp'](swipeEvents[swipeEvents.length - 1]);

      expect(gestureCallback).toHaveBeenCalled();
      const rightSwipeCall = gestureCallback.mock.lastCall;
      expect(rightSwipeCall).toBeTruthy();
      const rightSwipeGesture = rightSwipeCall?.[0];
      expect(rightSwipeGesture?.type).toBe(GestureType.SWIPE_RIGHT);
      expect(rightSwipeGesture?.direction).toBe(GestureDirection.RIGHT);
    });

    it('should recognize vertical swipe gestures', async () => {
      // Up swipe
      const upSwipe = [
        createMockPointerEvent('pointerdown', { clientX: 100, clientY: 200 }),
        createMockPointerEvent('pointermove', { clientX: 100, clientY: 150 }),
        createMockPointerEvent('pointermove', { clientX: 100, clientY: 100 }),
        createMockPointerEvent('pointerup', { clientX: 100, clientY: 50 }),
      ];

      recognizer['handlePointerDown'](upSwipe[0]);
      for (let i = 1; i < upSwipe.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 5));
        recognizer['handlePointerMove'](upSwipe[i]);
      }
      recognizer['handlePointerUp'](upSwipe[upSwipe.length - 1]);

      expect(gestureCallback).toHaveBeenCalled();
      const upSwipeCall = gestureCallback.mock.lastCall;
      expect(upSwipeCall).toBeTruthy();
      const upSwipeGesture = upSwipeCall?.[0];
      expect(upSwipeGesture?.type).toBe(GestureType.SWIPE_UP);
      expect(upSwipeGesture?.direction).toBe(GestureDirection.UP);
    });
  });

  describe('Pan Gesture Recognition', () => {
    it('should recognize pan gesture for slow movements', async () => {
      const panEvents = [
        createMockPointerEvent('pointerdown', { clientX: 100, clientY: 100 }),
        createMockPointerEvent('pointermove', { clientX: 110, clientY: 100 }),
        createMockPointerEvent('pointermove', { clientX: 120, clientY: 100 }),
        createMockPointerEvent('pointermove', { clientX: 130, clientY: 100 }),
        createMockPointerEvent('pointerup', { clientX: 140, clientY: 100 }),
      ];

      // Simulate slow pan movement
      recognizer['handlePointerDown'](panEvents[0]);
      
      for (let i = 1; i < panEvents.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Slow movement
        recognizer['handlePointerMove'](panEvents[i]);
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
      recognizer['handlePointerUp'](panEvents[panEvents.length - 1]);

      expect(gestureCallback).toHaveBeenCalled();
      const panCall = gestureCallback.mock.lastCall;
      expect(panCall).toBeTruthy();
      const panGesture = panCall?.[0];
      expect(panGesture?.type).toBe(GestureType.PAN);
      expect(typeof panGesture?.distance).toBe('number');
      expect(typeof panGesture?.velocity).toBe('number');
    });
  });

  describe('Multi-Touch Gesture Recognition', () => {
    it('should recognize pinch gesture', async () => {
      const multiTouchRecognizer = new GestureRecognizer(mockElement, {
        enableMultiTouch: true,
        maxPointers: 2,
      });
      multiTouchRecognizer.onGesture = gestureCallback;

      // First pointer
      const pointer1Down = createMockPointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
      });
      
      // Second pointer
      const pointer2Down = createMockPointerEvent('pointerdown', {
        pointerId: 2,
        clientX: 200,
        clientY: 100,
      });

      // Move pointers closer together (pinch in)
      const pointer1Move = createMockPointerEvent('pointermove', {
        pointerId: 1,
        clientX: 130,
        clientY: 100,
      });
      
      const pointer2Move = createMockPointerEvent('pointermove', {
        pointerId: 2,
        clientX: 170,
        clientY: 100,
      });

      // Simulate multi-touch pinch
      multiTouchRecognizer['handlePointerDown'](pointer1Down);
      multiTouchRecognizer['handlePointerDown'](pointer2Down);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      multiTouchRecognizer['handlePointerMove'](pointer1Move);
      multiTouchRecognizer['handlePointerMove'](pointer2Move);

      expect(gestureCallback).toHaveBeenCalled();
      const pinchCall = gestureCallback.mock.lastCall;
      expect(pinchCall).toBeTruthy();
      const pinchGesture = pinchCall?.[0];
      expect(pinchGesture?.type).toBe(GestureType.PINCH);
      expect(pinchGesture?.pointerCount).toBe(2);
      expect(typeof pinchGesture?.scale).toBe('number');

      multiTouchRecognizer.destroy();
    });

    it('should handle maximum pointer limit', () => {
      const limitedRecognizer = new GestureRecognizer(mockElement, {
        maxPointers: 2,
      });

      // Try to add 3 pointers
      const pointer1 = createMockPointerEvent('pointerdown', { pointerId: 1 });
      const pointer2 = createMockPointerEvent('pointerdown', { pointerId: 2 });
      const pointer3 = createMockPointerEvent('pointerdown', { pointerId: 3 });

      limitedRecognizer['handlePointerDown'](pointer1);
      limitedRecognizer['handlePointerDown'](pointer2);
      limitedRecognizer['handlePointerDown'](pointer3); // Should be ignored

      // Verify only 2 pointers are tracked
      expect(limitedRecognizer['activePointers'].size).toBe(2);

      limitedRecognizer.destroy();
    });
  });

  describe('Pointer Capture Management', () => {
    it('should set pointer capture on pointer down', () => {
      const pointerDown = createMockPointerEvent('pointerdown', { pointerId: 1 });
      
      recognizer['handlePointerDown'](pointerDown);
      
      expect(mockElement.setPointerCapture).toHaveBeenCalledWith(1);
    });

    it('should release pointer capture on pointer up', () => {
      const pointerDown = createMockPointerEvent('pointerdown', { pointerId: 1 });
      const pointerUp = createMockPointerEvent('pointerup', { pointerId: 1 });
      
      recognizer['handlePointerDown'](pointerDown);
      recognizer['handlePointerUp'](pointerUp);
      
      expect(mockElement.releasePointerCapture).toHaveBeenCalledWith(1);
    });

    it('should handle pointer capture errors gracefully', () => {
      // Mock capture to throw error
      mockElement.setPointerCapture = vi.fn(() => {
        throw new Error('Capture failed');
      });

      const pointerDown = createMockPointerEvent('pointerdown', { pointerId: 1 });
      
      expect(() => {
        recognizer['handlePointerDown'](pointerDown);
      }).not.toThrow();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should process gestures within performance budget', async () => {
      const measure = performanceMeasure.start('gesture-processing');

      // Simulate complex gesture sequence
      const events = Array.from({ length: 50 }, (_, i) =>
        createMockPointerEvent('pointermove', { 
          clientX: 100 + i * 2, 
          clientY: 100 
        })
      );

      const pointerDown = createMockPointerEvent('pointerdown');
      recognizer['handlePointerDown'](pointerDown);

      events.forEach((event) => {
        recognizer['handlePointerMove'](event);
      });

      const pointerUp = createMockPointerEvent('pointerup');
      recognizer['handlePointerUp'](pointerUp);

      const duration = measure.end();

      // Should complete within acceptable performance budget
      assertPerformanceWithinBenchmark(
        duration,
        'physics',
        'complexCalculation'
      );
    });

    it('should handle high-frequency events efficiently', async () => {
      const eventCount = 1000;
      const startTime = performance.now();

      for (let i = 0; i < eventCount; i++) {
        const event = createMockPointerEvent('pointermove', { 
          clientX: 100 + (i % 100),
          clientY: 100 
        });
        recognizer['handlePointerMove'](event);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle high frequency without blocking (allow extra time in test environment)
      expect(totalTime).toBeLessThan(200); // 200ms max for 1000 events
    });
  });

  describe('Memory Management', () => {
    it('should clean up active pointers on destroy', () => {
      const pointerDown = createMockPointerEvent('pointerdown', { pointerId: 1 });
      recognizer['handlePointerDown'](pointerDown);

      expect(recognizer['activePointers'].size).toBe(1);

      recognizer.destroy();

      // Verify cleanup
      expect(recognizer['activePointers'].size).toBe(0);
    });

    it('should remove event listeners on destroy', () => {
      recognizer.destroy();

      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'pointerdown',
        expect.any(Function)
      );
      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'pointermove',
        expect.any(Function)
      );
      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'pointerup',
        expect.any(Function)
      );
      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'pointercancel',
        expect.any(Function)
      );
    });

    it('should handle multiple destroy calls gracefully', () => {
      recognizer.destroy();
      
      expect(() => {
        recognizer.destroy();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle cancelled pointers', () => {
      const pointerDown = createMockPointerEvent('pointerdown', { pointerId: 1 });
      const pointerCancel = createMockPointerEvent('pointercancel', { pointerId: 1 });
      
      recognizer['handlePointerDown'](pointerDown);
      expect(recognizer['activePointers'].size).toBe(1);
      
      recognizer['handlePointerCancel'](pointerCancel);
      expect(recognizer['activePointers'].size).toBe(0);
    });

    it('should handle unknown pointer IDs', () => {
      const unknownPointerUp = createMockPointerEvent('pointerup', { pointerId: 999 });
      
      expect(() => {
        recognizer['handlePointerUp'](unknownPointerUp);
      }).not.toThrow();
    });

    it('should handle malformed events gracefully', () => {
      const malformedEvent = {
        type: 'pointerdown',
        pointerId: null,
      } as unknown as PointerEvent;
      
      expect(() => {
        recognizer['handlePointerDown'](malformedEvent);
      }).not.toThrow();
    });

    it('should handle events with missing properties', () => {
      const minimalEvent = {
        type: 'pointermove',
        pointerId: 1,
        clientX: undefined,
        clientY: undefined,
      } as unknown as PointerEvent;
      
      expect(() => {
        recognizer['handlePointerMove'](minimalEvent);
      }).not.toThrow();
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should work with mouse events', () => {
      const mouseDown = createMockPointerEvent('pointerdown', {
        pointerType: 'mouse',
        pointerId: 1,
      });
      
      expect(() => {
        recognizer['handlePointerDown'](mouseDown);
      }).not.toThrow();
    });

    it('should work with touch events', () => {
      const touchDown = createMockPointerEvent('pointerdown', {
        pointerType: 'touch',
        pointerId: 1,
        pressure: 1,
      });
      
      expect(() => {
        recognizer['handlePointerDown'](touchDown);
      }).not.toThrow();
    });

    it('should work with pen events', () => {
      const penDown = createMockPointerEvent('pointerdown', {
        pointerType: 'pen',
        pointerId: 1,
        pressure: 0.7,
        tiltX: 15,
        tiltY: 10,
      });
      
      expect(() => {
        recognizer['handlePointerDown'](penDown);
      }).not.toThrow();
    });
  });



  it('should handle pointer events', () => {
    const pointerEvent = {
      type: 'pointerdown',
      pointerId: 1,
      clientX: 100,
      clientY: 100,
      pointerType: 'mouse',
      isPrimary: true,
      timeStamp: performance.now(),
    } as unknown as PointerEvent;
    
    expect(() => {
      recognizer['handlePointerDown'](pointerEvent);
    }).not.toThrow();
  });
}); 
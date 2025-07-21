/**
 * @fileoverview Unit tests for NavigationManager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NavigationManager, NavigationInputType, NavigationDirection } from '../../managers/navigation-manager';
import { SLIDER_EVENTS } from '../../core/constants';

describe('NavigationManager', () => {
  let manager: NavigationManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new NavigationManager({
      enableKeyboard: true,
      enableMouse: true,
      enableTouch: true,
      enableGesture: true,
      enableWASD: true,
      enableHomeEnd: true,
      enableSpacebarToggle: true,
      enableEscapeStop: true,
      preventDuringTransition: true,
      debounceDelay: 0, // Disable debouncing for testing
      enableA11yAnnouncements: true
    });
  });

  afterEach(() => {
    manager.destroy();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('construction', () => {
    it('should create with default configuration', () => {
      const defaultManager = new NavigationManager();
      const config = defaultManager.getConfig();
      
      expect(config.enableKeyboard).toBe(true);
      expect(config.enableMouse).toBe(true);
      expect(config.enableTouch).toBe(true);
      expect(config.enableGesture).toBe(true);
      expect(config.debounceDelay).toBe(50);
      
      defaultManager.destroy();
    });

    it('should create with custom configuration', () => {
      const customManager = new NavigationManager({
        enableKeyboard: false,
        enableMouse: false,
        debounceDelay: 100,
        enableA11yAnnouncements: false
      });
      
      const config = customManager.getConfig();
      expect(config.enableKeyboard).toBe(false);
      expect(config.enableMouse).toBe(false);
      expect(config.debounceDelay).toBe(100);
      expect(config.enableA11yAnnouncements).toBe(false);
      
      customManager.destroy();
    });
  });

  describe('slide bounds management', () => {
    beforeEach(() => {
      manager.updateSlideBounds(0, 5);
    });

    it('should update slide bounds correctly', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_BOUNDS_UPDATED, eventSpy);

      manager.updateSlideBounds(2, 5);

      expect(eventSpy).toHaveBeenCalledWith({
        currentIndex: 2,
        totalSlides: 5,
        previousIndex: 0,
        bounds: {
          currentIndex: 2,
          totalSlides: 5,
          isAtFirst: false,
          isAtLast: false
        }
      });
    });

    it('should provide correct slide bounds information', () => {
      manager.updateSlideBounds(0, 5);
      let bounds = manager.getSlideBounds();
      expect(bounds.isAtFirst).toBe(true);
      expect(bounds.isAtLast).toBe(false);

      manager.updateSlideBounds(4, 5);
      bounds = manager.getSlideBounds();
      expect(bounds.isAtFirst).toBe(false);
      expect(bounds.isAtLast).toBe(true);
    });

    it('should not emit event when bounds do not change', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_BOUNDS_UPDATED, eventSpy);

      manager.updateSlideBounds(0, 5);
      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe('transition state management', () => {
    it('should update transition state', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_TRANSITION_STATE_CHANGED, eventSpy);

      manager.updateTransitionState(true);

      expect(eventSpy).toHaveBeenCalledWith({
        isTransitioning: true,
        wasTransitioning: false
      });
    });

    it('should process pending navigation when transition completes', () => {
      const deferredSpy = vi.fn();
      const executedSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_DEFERRED, deferredSpy);
      manager.on(SLIDER_EVENTS.NAVIGATION_DEFERRED_EXECUTED, executedSpy);

      manager.updateSlideBounds(0, 5);
      manager.updateTransitionState(true);

      // Request navigation during transition (should be deferred)
      const request = manager.requestNavigation(1, NavigationInputType.KEYBOARD);
      expect(request).toBeNull();
      expect(deferredSpy).toHaveBeenCalled();

      // Complete transition
      manager.updateTransitionState(false);
      expect(executedSpy).toHaveBeenCalled();
    });
  });

  describe('navigation requests', () => {
    beforeEach(() => {
      manager.updateSlideBounds(2, 5);
    });

    it('should create valid navigation request', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_REQUESTED, eventSpy);

      const request = manager.requestNavigation(3, NavigationInputType.API);

      expect(request).toBeTruthy();
      expect(request?.target).toBe(3);
      expect(request?.inputType).toBe(NavigationInputType.API);
      expect(eventSpy).toHaveBeenCalledWith({ request });
    });

    it('should reject navigation to current slide', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_NO_CHANGE, eventSpy);

      const request = manager.requestNavigation(2, NavigationInputType.API);

      expect(request).toBeNull();
      expect(eventSpy).toHaveBeenCalledWith({
        request: expect.objectContaining({ target: 2 }),
        currentIndex: 2
      });
    });

    it('should allow out-of-bounds slide index for LoopManager handling', () => {
      const request = manager.requestNavigation(10, NavigationInputType.API);
      expect(request?.target).toBe(10); // Allow out-of-bounds for LoopManager handling
    });

    it('should reject truly invalid slide indices', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_INVALID_TARGET, eventSpy);

      // Test negative index
      let request = manager.requestNavigation(-1, NavigationInputType.API);
      expect(request).toBeNull();

      // Test non-integer
      request = manager.requestNavigation(2.5, NavigationInputType.API);
      expect(request).toBeNull();

      expect(eventSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle navigation directions', () => {
      const request = manager.requestNavigation(NavigationDirection.NEXT, NavigationInputType.API);
      expect(request?.target).toBe(3);

      const request2 = manager.requestNavigation(NavigationDirection.PREVIOUS, NavigationInputType.API);
      expect(request2?.target).toBe(1);

      const request3 = manager.requestNavigation(NavigationDirection.FIRST, NavigationInputType.API);
      expect(request3?.target).toBe(0);

      const request4 = manager.requestNavigation(NavigationDirection.LAST, NavigationInputType.API);
      expect(request4?.target).toBe(4);
    });

    it('should handle edge cases for navigation directions', () => {
      manager.updateSlideBounds(4, 5); // At last slide
      const request = manager.requestNavigation(NavigationDirection.NEXT, NavigationInputType.API);
      expect(request?.target).toBe(5); // Allow out-of-bounds for LoopManager handling

      manager.updateSlideBounds(0, 5); // At first slide
      const request2 = manager.requestNavigation(NavigationDirection.PREVIOUS, NavigationInputType.API);
      expect(request2?.target).toBe(-1); // Allow out-of-bounds for LoopManager handling
    });
  });

  describe('keyboard input handling', () => {
    beforeEach(() => {
      manager.updateSlideBounds(2, 5);
    });

    it('should handle arrow keys', () => {
      let request = manager.handleKeyboardInput('ArrowRight');
      expect(request?.target).toBe(3);

      request = manager.handleKeyboardInput('ArrowLeft');
      expect(request?.target).toBe(1);
    });

    it('should handle Home and End keys when enabled', () => {
      let request = manager.handleKeyboardInput('Home');
      expect(request?.target).toBe(0);

      request = manager.handleKeyboardInput('End');
      expect(request?.target).toBe(4);
    });

    it('should handle WASD keys when enabled', () => {
      let request = manager.handleKeyboardInput('KeyD');
      expect(request?.target).toBe(3);

      request = manager.handleKeyboardInput('KeyA');
      expect(request?.target).toBe(1);

      request = manager.handleKeyboardInput('KeyS');
      expect(request?.target).toBe(3);

      request = manager.handleKeyboardInput('KeyW');
      expect(request?.target).toBe(1);
    });

    it('should handle spacebar for play/pause', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_PLAY_PAUSE_REQUESTED, eventSpy);

      const request = manager.handleKeyboardInput('Space');
      
      expect(request).toBeNull();
      expect(eventSpy).toHaveBeenCalledWith({
        inputType: NavigationInputType.KEYBOARD,
        context: undefined
      });
    });

    it('should handle escape key for emergency stop', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_EMERGENCY_STOP_REQUESTED, eventSpy);

      const request = manager.handleKeyboardInput('Escape');
      
      expect(request).toBeNull();
      expect(eventSpy).toHaveBeenCalled();
    });

    it('should ignore keys when keyboard disabled', () => {
      manager.updateConfig({ enableKeyboard: false });

      const request = manager.handleKeyboardInput('ArrowRight');
      expect(request).toBeNull();
    });

    it('should ignore Home/End when disabled', () => {
      manager.updateConfig({ enableHomeEnd: false });

      let request = manager.handleKeyboardInput('Home');
      expect(request).toBeNull();

      request = manager.handleKeyboardInput('End');
      expect(request).toBeNull();
    });

    it('should ignore WASD when disabled', () => {
      manager.updateConfig({ enableWASD: false });

      let request = manager.handleKeyboardInput('KeyD');
      expect(request).toBeNull();

      request = manager.handleKeyboardInput('KeyA');
      expect(request).toBeNull();
    });
  });

  describe('mouse input handling', () => {
    beforeEach(() => {
      manager.updateSlideBounds(2, 5);
    });

    it('should handle mouse clicks', () => {
      let request = manager.handleMouseInput('click', { targetIndex: 3 });
      expect(request?.target).toBe(3);

      request = manager.handleMouseInput('click', { direction: 'next' });
      expect(request?.target).toBe(3);

      request = manager.handleMouseInput('click', { direction: 'previous' });
      expect(request?.target).toBe(1);
    });

    it('should handle mouse wheel', () => {
      let request = manager.handleMouseInput('wheel', { deltaY: 100 });
      expect(request?.target).toBe(3);

      request = manager.handleMouseInput('wheel', { deltaY: -100 });
      expect(request?.target).toBe(1);
    });

    it('should ignore mouse input when disabled', () => {
      manager.updateConfig({ enableMouse: false });

      const request = manager.handleMouseInput('click', { targetIndex: 3 });
      expect(request).toBeNull();
    });

    it('should return null for invalid mouse input', () => {
      const request = manager.handleMouseInput('click', { invalid: 'data' });
      expect(request).toBeNull();
    });
  });

  describe('touch/gesture input handling', () => {
    beforeEach(() => {
      manager.updateSlideBounds(2, 5);
    });

    it('should handle swipe gestures', () => {
      let request = manager.handleTouchInput('swipe', { direction: 'left' });
      expect(request?.target).toBe(3);
      expect(request?.inputType).toBe(NavigationInputType.GESTURE);

      request = manager.handleTouchInput('swipe', { direction: 'right' });
      expect(request?.target).toBe(1);
    });

    it('should handle tap gestures', () => {
      const request = manager.handleTouchInput('tap', { targetIndex: 4 });
      expect(request?.target).toBe(4);
      expect(request?.inputType).toBe(NavigationInputType.TOUCH);
    });

    it('should handle pinch gestures', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_PINCH_GESTURE, eventSpy);

      const request = manager.handleTouchInput('pinch', { scale: 1.5 });
      
      expect(request).toBeNull();
      expect(eventSpy).toHaveBeenCalledWith({
        inputType: NavigationInputType.TOUCH,
        data: { scale: 1.5 }
      });
    });

    it('should ignore touch input when disabled', () => {
      manager.updateConfig({ enableTouch: false });

      const request = manager.handleTouchInput('tap', { targetIndex: 3 });
      expect(request).toBeNull();
    });

    it('should ignore gesture input when disabled', () => {
      manager.updateConfig({ enableGesture: false });

      const request = manager.handleTouchInput('swipe', { direction: 'left' });
      expect(request).toBeNull();
    });
  });

  describe('debouncing', () => {
    beforeEach(() => {
      manager.updateSlideBounds(2, 5);
    });

    it('should debounce rapid navigation requests', () => {
      // Create a manager with debouncing enabled for this specific test
      const debouncingManager = new NavigationManager({ debounceDelay: 50 });
      debouncingManager.updateSlideBounds(2, 5);
      
      const request1 = debouncingManager.requestNavigation(3, NavigationInputType.API);
      expect(request1).toBeTruthy();

      // Second request within debounce delay should be ignored
      const request2 = debouncingManager.requestNavigation(4, NavigationInputType.API);
      expect(request2).toBeNull();

      // After debounce delay, should allow navigation
      vi.advanceTimersByTime(60);
      const request3 = debouncingManager.requestNavigation(4, NavigationInputType.API);
      expect(request3).toBeTruthy();
      
      debouncingManager.destroy();
    });

    it('should respect debounce delay configuration', () => {
      manager.updateConfig({ debounceDelay: 100 });

      const request1 = manager.requestNavigation(3, NavigationInputType.API);
      expect(request1).toBeTruthy();

      vi.advanceTimersByTime(50);
      const request2 = manager.requestNavigation(4, NavigationInputType.API);
      expect(request2).toBeNull();

      vi.advanceTimersByTime(60);
      const request3 = manager.requestNavigation(4, NavigationInputType.API);
      expect(request3).toBeTruthy();
    });

    it('should disable debouncing when delay is 0', () => {
      manager.updateConfig({ debounceDelay: 0 });

      const request1 = manager.requestNavigation(3, NavigationInputType.API);
      expect(request1).toBeTruthy();

      const request2 = manager.requestNavigation(4, NavigationInputType.API);
      expect(request2).toBeTruthy();
    });
  });

  describe('navigation blocking', () => {
    beforeEach(() => {
      manager.updateSlideBounds(2, 5);
    });

    it('should block navigation during transitions when enabled', () => {
      const blockedSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_BLOCKED, blockedSpy);

      manager.updateTransitionState(true);
      const request = manager.requestNavigation(3, NavigationInputType.API);

      expect(request).toBeNull();
      // Should be deferred, not blocked in this case
      expect(blockedSpy).not.toHaveBeenCalled();
    });

    it('should allow navigation during transitions when disabled', () => {
      manager.updateConfig({ preventDuringTransition: false });
      manager.updateTransitionState(true);

      const request = manager.requestNavigation(3, NavigationInputType.API);
      expect(request).toBeTruthy();
    });

    it('should block navigation with single slide', () => {
      manager.updateSlideBounds(0, 1);
      
      const request = manager.requestNavigation(NavigationDirection.NEXT, NavigationInputType.API);
      expect(request).toBeNull();
    });

    it('should block navigation with no slides', () => {
      manager.updateSlideBounds(0, 0);
      
      const request = manager.requestNavigation(NavigationDirection.NEXT, NavigationInputType.API);
      expect(request).toBeNull();
    });
  });

  describe('configuration updates', () => {
    it('should update configuration and emit events', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_CONFIG_UPDATED, eventSpy);

      const updates = {
        enableKeyboard: false,
        debounceDelay: 100
      };

      manager.updateConfig(updates);

      const config = manager.getConfig();
      expect(config.enableKeyboard).toBe(false);
      expect(config.debounceDelay).toBe(100);
      
      expect(eventSpy).toHaveBeenCalledWith({
        config: expect.objectContaining(updates),
        oldConfig: expect.objectContaining({ enableKeyboard: true }),
        changes: updates
      });
    });
  });

  describe('navigation statistics', () => {
    beforeEach(() => {
      manager.updateSlideBounds(2, 5);
    });

    it('should provide navigation statistics', () => {
      const stats = manager.getNavigationStats();

      expect(stats.currentIndex).toBe(2);
      expect(stats.totalSlides).toBe(5);
      expect(stats.isTransitioning).toBe(false);
      expect(stats.canNavigateNext).toBe(true);
      expect(stats.canNavigatePrevious).toBe(true);
      expect(stats.hasPendingNavigation).toBe(false);
    });

    it('should reflect edge cases in navigation statistics', () => {
      manager.updateSlideBounds(0, 5);
      let stats = manager.getNavigationStats();
      expect(stats.canNavigatePrevious).toBe(false);
      expect(stats.canNavigateNext).toBe(true);

      manager.updateSlideBounds(4, 5);
      stats = manager.getNavigationStats();
      expect(stats.canNavigatePrevious).toBe(true);
      expect(stats.canNavigateNext).toBe(false);
    });
  });

  describe('accessibility features', () => {
    beforeEach(() => {
      manager.updateSlideBounds(2, 5);
    });

    it('should create accessibility announcements', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_A11Y_ANNOUNCE, eventSpy);

      const result = manager.createNavigationResult(
        true,
        2,
        3,
        3,
        NavigationInputType.KEYBOARD,
        Date.now()
      );

      expect(result.success).toBe(true);
      expect(result.fromIndex).toBe(2);
      expect(result.toIndex).toBe(3);
      expect(result.actualIndex).toBe(3);
      
      expect(eventSpy).toHaveBeenCalledWith({
        announcement: 'Navigated to slide 4 of 5',
        slideIndex: 3,
        totalSlides: 5
      });
    });

    it('should not announce when disabled', () => {
      manager.updateConfig({ enableA11yAnnouncements: false });
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_A11Y_ANNOUNCE, eventSpy);

      manager.createNavigationResult(
        true,
        2,
        3,
        3,
        NavigationInputType.KEYBOARD,
        Date.now()
      );

      expect(eventSpy).not.toHaveBeenCalled();
    });

    it('should not announce failed navigation', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_A11Y_ANNOUNCE, eventSpy);

      manager.createNavigationResult(
        false,
        2,
        3,
        2,
        NavigationInputType.KEYBOARD,
        Date.now(),
        'Navigation failed'
      );

      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe('slide index validation', () => {
    beforeEach(() => {
      manager.updateSlideBounds(2, 5);
    });

    it('should validate slide indices correctly', () => {
      expect(manager.validateSlideIndex(0)).toBe(true);
      expect(manager.validateSlideIndex(4)).toBe(true);
      expect(manager.validateSlideIndex(2.5)).toBe(false);
      expect(manager.validateSlideIndex(-1)).toBe(false);
      expect(manager.validateSlideIndex(5)).toBe(false);
    });

    it('should resolve navigation targets correctly', () => {
      expect(manager.resolveNavigationTarget(3)).toBe(3);
      expect(manager.resolveNavigationTarget(10)).toBe(10); // Allow out-of-bounds for LoopManager
      expect(manager.resolveNavigationTarget(-1)).toBeNull(); // Reject negative
      expect(manager.resolveNavigationTarget(2.5)).toBeNull(); // Reject non-integer
      expect(manager.resolveNavigationTarget(NavigationDirection.NEXT)).toBe(3);
      expect(manager.resolveNavigationTarget(NavigationDirection.PREVIOUS)).toBe(1);
      expect(manager.resolveNavigationTarget(NavigationDirection.FIRST)).toBe(0);
      expect(manager.resolveNavigationTarget(NavigationDirection.LAST)).toBe(4);
    });
  });

  describe('reset and destroy', () => {
    it('should reset manager state', () => {
      const eventSpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_RESET, eventSpy);

      manager.updateSlideBounds(3, 5);
      manager.updateTransitionState(true);

      manager.reset();

      const stats = manager.getNavigationStats();
      expect(stats.currentIndex).toBe(0);
      expect(stats.totalSlides).toBe(0);
      expect(stats.isTransitioning).toBe(false);
      expect(eventSpy).toHaveBeenCalled();
    });

    it('should destroy and cleanup all resources', () => {
      const resetSpy = vi.fn();
      const destroySpy = vi.fn();
      manager.on(SLIDER_EVENTS.NAVIGATION_RESET, resetSpy);
      manager.on(SLIDER_EVENTS.NAVIGATION_DESTROYED, destroySpy);

      manager.destroy();

      expect(resetSpy).toHaveBeenCalled();
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle navigation with empty slide set', () => {
      manager.updateSlideBounds(0, 0);
      
      const request = manager.requestNavigation(0, NavigationInputType.API);
      expect(request).toBeNull();
    });

    it('should handle unknown keyboard keys', () => {
      const request = manager.handleKeyboardInput('F1');
      expect(request).toBeNull();
    });

    it('should handle unknown mouse actions', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const request = manager.handleMouseInput('scroll' as any, {});
      expect(request).toBeNull();
    });

    it('should handle unknown touch gestures', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const request = manager.handleTouchInput('zoom' as any, {});
      expect(request).toBeNull();
    });

    it('should create navigation result with error', () => {
      const result = manager.createNavigationResult(
        false,
        2,
        3,
        2,
        NavigationInputType.API,
        Date.now() - 100,
        'Test error'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(result.duration).toBeGreaterThan(0);
    });
  });
});
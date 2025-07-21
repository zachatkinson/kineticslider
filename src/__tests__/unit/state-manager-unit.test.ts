/**
 * @fileoverview StateManager Unit Tests
 * 
 * Comprehensive unit tests for the StateManager class covering all functionality
 * including state management, validation, persistence, history tracking, and events.
 * 
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StateManager } from '../../managers/state-manager';
import { SLIDER_EVENTS, SLIDER_ERROR_CODES } from '../../core/constants';
import type { SliderState, StateBounds } from '../../managers/state-manager';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    vi.clearAllMocks();
    stateManager = new StateManager();
  });

  afterEach(() => {
    stateManager.destroy();
    vi.clearAllTimers();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default state', () => {
      const state = stateManager.getState();
      expect(state).toEqual({
        currentIndex: 0,
        totalSlides: 0,
        isPlaying: false,
        isTransitioning: false,
        isInitialized: false,
        isLoading: false,
        loadingProgress: 0,
      });
    });

    it('should initialize with custom initial state', () => {
      const customManager = new StateManager({
        initialState: {
          currentIndex: 2,
          totalSlides: 5,
          isPlaying: true,
        }
      });

      const state = customManager.getState();
      expect(state.currentIndex).toBe(2);
      expect(state.totalSlides).toBe(5);
      expect(state.isPlaying).toBe(true);
      
      customManager.destroy();
    });

    it('should initialize with custom configuration', () => {
      const customManager = new StateManager({
        strictValidation: false,
        enableBoundsChecking: false,
        allowTransientStates: true,
        enableNotifications: false,
      });

      const config = customManager.getConfig();
      expect(config.strictValidation).toBe(false);
      expect(config.enableBoundsChecking).toBe(false);
      expect(config.allowTransientStates).toBe(true);
      expect(config.enableNotifications).toBe(false);
      
      customManager.destroy();
    });
  });

  describe('State Updates', () => {
    it('should update state and emit events', () => {
      const eventSpy = vi.fn();
      stateManager.on(SLIDER_EVENTS.STATE_CHANGED, eventSpy);

      stateManager.updateState({ currentIndex: 1 });

      expect(stateManager.getCurrentIndex()).toBe(1);
      expect(eventSpy).toHaveBeenCalledWith({
        previousState: expect.objectContaining({ currentIndex: 0 }),
        newState: expect.objectContaining({ currentIndex: 1 }),
        changes: { currentIndex: 1 },
        context: undefined,
        metadata: undefined
      });
    });

    it('should update state with context and metadata', () => {
      const eventSpy = vi.fn();
      stateManager.on(SLIDER_EVENTS.STATE_CHANGED, eventSpy);

      const context = 'user-action';
      const metadata = { source: 'keyboard' };
      
      stateManager.updateState({ currentIndex: 2 }, context, metadata);

      expect(eventSpy).toHaveBeenCalledWith({
        previousState: expect.objectContaining({ currentIndex: 0 }),
        newState: expect.objectContaining({ currentIndex: 2 }),
        changes: { currentIndex: 2 },
        context,
        metadata
      });
    });

    it('should not emit events when notifications are disabled', () => {
      const customManager = new StateManager({ enableNotifications: false });
      const eventSpy = vi.fn();
      customManager.on(SLIDER_EVENTS.STATE_CHANGED, eventSpy);

      customManager.updateState({ currentIndex: 1 });

      expect(eventSpy).not.toHaveBeenCalled();
      customManager.destroy();
    });
  });

  describe('Current Index Management', () => {
    it('should get and set current index', () => {
      expect(stateManager.getCurrentIndex()).toBe(0);
      
      stateManager.setCurrentIndex(3);
      expect(stateManager.getCurrentIndex()).toBe(3);
    });

    it('should validate slide index on set', () => {
      stateManager.setTotalSlides(3);
      
      expect(() => stateManager.setCurrentIndex(5))
        .toThrow(`${SLIDER_ERROR_CODES.INVALID_SLIDE_INDEX}: Index 5 is out of range (0-2)`);
    });

    it('should allow non-integer index to throw error', () => {
      expect(() => stateManager.setCurrentIndex(1.5))
        .toThrow(`${SLIDER_ERROR_CODES.INVALID_SLIDE_INDEX}: Index must be an integer`);
    });

    it('should allow negative index to throw error', () => {
      expect(() => stateManager.setCurrentIndex(-1))
        .toThrow(`${SLIDER_ERROR_CODES.INVALID_SLIDE_INDEX}: Index cannot be negative`);
    });
  });

  describe('Total Slides Management', () => {
    it('should get and set total slides', () => {
      expect(stateManager.getTotalSlides()).toBe(0);
      
      stateManager.setTotalSlides(5);
      expect(stateManager.getTotalSlides()).toBe(5);
    });

    it('should adjust current index when total slides decreases', () => {
      stateManager.setTotalSlides(5);
      stateManager.setCurrentIndex(4);
      
      stateManager.setTotalSlides(3);
      
      expect(stateManager.getCurrentIndex()).toBe(2); // Adjusted to maxIndex
      expect(stateManager.getTotalSlides()).toBe(3);
    });

    it('should reset current index to 0 when total slides is 0', () => {
      stateManager.setTotalSlides(5);
      stateManager.setCurrentIndex(3);
      
      stateManager.setTotalSlides(0);
      
      expect(stateManager.getCurrentIndex()).toBe(0);
      expect(stateManager.getTotalSlides()).toBe(0);
    });

    it('should throw error for negative total slides', () => {
      expect(() => stateManager.setTotalSlides(-1))
        .toThrow(`${SLIDER_ERROR_CODES.INVALID_CONFIG}: Total slides cannot be negative`);
    });
  });

  describe('Transition State', () => {
    it('should get and set transition state', () => {
      expect(stateManager.isTransitioning()).toBe(false);
      
      stateManager.setTransitioning(true);
      expect(stateManager.isTransitioning()).toBe(true);
      
      stateManager.setTransitioning(false);
      expect(stateManager.isTransitioning()).toBe(false);
    });
  });

  describe('Playing State', () => {
    it('should get and set playing state', () => {
      expect(stateManager.isPlaying()).toBe(false);
      
      stateManager.setPlaying(true);
      expect(stateManager.isPlaying()).toBe(true);
      
      stateManager.setPlaying(false);
      expect(stateManager.isPlaying()).toBe(false);
    });
  });

  describe('Initialized State', () => {
    it('should get and set initialized state', () => {
      expect(stateManager.isInitialized()).toBe(false);
      
      stateManager.setInitialized(true);
      expect(stateManager.isInitialized()).toBe(true);
      
      stateManager.setInitialized(false);
      expect(stateManager.isInitialized()).toBe(false);
    });
  });

  describe('Loading State', () => {
    it('should get and set loading state', () => {
      expect(stateManager.isLoading()).toBe(false);
      
      stateManager.setLoading(true);
      expect(stateManager.isLoading()).toBe(true);
      
      stateManager.setLoading(false);
      expect(stateManager.isLoading()).toBe(false);
    });

    it('should set loading state with progress', () => {
      stateManager.setLoading(true, 50);
      
      expect(stateManager.isLoading()).toBe(true);
      expect(stateManager.getLoadingProgress()).toBe(50);
    });

    it('should clamp loading progress to 0-100 range', () => {
      stateManager.setLoading(true, -10);
      expect(stateManager.getLoadingProgress()).toBe(0);
      
      stateManager.setLoading(true, 150);
      expect(stateManager.getLoadingProgress()).toBe(100);
    });
  });

  describe('Loading Progress', () => {
    it('should get and set loading progress', () => {
      expect(stateManager.getLoadingProgress()).toBe(0);
      
      stateManager.setLoadingProgress(75);
      expect(stateManager.getLoadingProgress()).toBe(75);
    });

    it('should clamp progress to 0-100 range', () => {
      stateManager.setLoadingProgress(-20);
      expect(stateManager.getLoadingProgress()).toBe(0);
      
      stateManager.setLoadingProgress(120);
      expect(stateManager.getLoadingProgress()).toBe(100);
    });
  });

  describe('State Bounds', () => {
    beforeEach(() => {
      stateManager.setTotalSlides(5);
      stateManager.setCurrentIndex(2);
    });

    it('should return correct bounds information', () => {
      const bounds: StateBounds = stateManager.getStateBounds();
      
      expect(bounds).toEqual({
        minIndex: 0,
        maxIndex: 4,
        isAtFirst: false,
        isAtLast: false,
        canNavigateNext: true,
        canNavigatePrevious: true
      });
    });

    it('should return correct bounds at first slide', () => {
      stateManager.setCurrentIndex(0);
      const bounds = stateManager.getStateBounds();
      
      expect(bounds.isAtFirst).toBe(true);
      expect(bounds.isAtLast).toBe(false);
      expect(bounds.canNavigateNext).toBe(true);
      expect(bounds.canNavigatePrevious).toBe(false);
    });

    it('should return correct bounds at last slide', () => {
      stateManager.setCurrentIndex(4);
      const bounds = stateManager.getStateBounds();
      
      expect(bounds.isAtFirst).toBe(false);
      expect(bounds.isAtLast).toBe(true);
      expect(bounds.canNavigateNext).toBe(false);
      expect(bounds.canNavigatePrevious).toBe(true);
    });

    it('should handle empty slide collection', () => {
      stateManager.setTotalSlides(0);
      stateManager.setCurrentIndex(0);
      
      const bounds = stateManager.getStateBounds();
      expect(bounds.maxIndex).toBe(0);
      expect(bounds.canNavigateNext).toBe(false);
      expect(bounds.canNavigatePrevious).toBe(false);
    });
  });

  describe('Navigation Helpers', () => {
    beforeEach(() => {
      stateManager.setTotalSlides(5);
      stateManager.setCurrentIndex(2);
    });

    it('should correctly report can navigate next', () => {
      expect(stateManager.canNavigateNext()).toBe(true);
      
      stateManager.setCurrentIndex(4);
      expect(stateManager.canNavigateNext()).toBe(false);
    });

    it('should correctly report can navigate previous', () => {
      expect(stateManager.canNavigatePrevious()).toBe(true);
      
      stateManager.setCurrentIndex(0);
      expect(stateManager.canNavigatePrevious()).toBe(false);
    });
  });

  describe('State Validation', () => {
    it('should validate correct state', () => {
      stateManager.setTotalSlides(5);
      stateManager.setCurrentIndex(2);
      
      const validation = stateManager.validateState(stateManager.getState());
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid currentIndex (non-integer)', () => {
      const invalidState: SliderState = {
        ...stateManager.getState(),
        currentIndex: 1.5
      };
      
      const validation = stateManager.validateState(invalidState);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('currentIndex must be an integer');
    });

    it('should detect invalid currentIndex (negative)', () => {
      const invalidState: SliderState = {
        ...stateManager.getState(),
        currentIndex: -1
      };
      
      const validation = stateManager.validateState(invalidState);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('currentIndex cannot be negative');
    });

    it('should detect out of bounds currentIndex', () => {
      const invalidState: SliderState = {
        ...stateManager.getState(),
        totalSlides: 3,
        currentIndex: 5
      };
      
      const validation = stateManager.validateState(invalidState);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('currentIndex 5 is out of bounds (max: 2)');
    });

    it('should allow out of bounds during transition if configured', () => {
      const customManager = new StateManager({ allowTransientStates: true });
      
      const transientState: SliderState = {
        ...customManager.getState(),
        totalSlides: 3,
        currentIndex: 5,
        isTransitioning: true
      };
      
      const validation = customManager.validateState(transientState);
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('currentIndex 5 is out of bounds but allowed during transition');
      
      customManager.destroy();
    });

    it('should detect invalid totalSlides', () => {
      const invalidState: SliderState = {
        ...stateManager.getState(),
        totalSlides: -1
      };
      
      const validation = stateManager.validateState(invalidState);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('totalSlides cannot be negative');
    });

    it('should detect invalid loadingProgress', () => {
      const invalidState: SliderState = {
        ...stateManager.getState(),
        loadingProgress: 150
      };
      
      const validation = stateManager.validateState(invalidState);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('loadingProgress must be between 0 and 100');
    });

    it('should emit warning for logical inconsistencies', () => {
      const inconsistentState: SliderState = {
        ...stateManager.getState(),
        isPlaying: true,
        isTransitioning: true
      };
      
      const validation = stateManager.validateState(inconsistentState);
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('slider is both playing and transitioning');
    });

    it('should throw error on invalid state update when strict validation enabled', () => {
      const eventSpy = vi.fn();
      stateManager.on(SLIDER_EVENTS.STATE_VALIDATION_ERROR, eventSpy);
      
      expect(() => {
        stateManager.updateState({ currentIndex: -1 });
      }).toThrow(`${SLIDER_ERROR_CODES.INVALID_STATE}`);
      
      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('State History', () => {
    it('should track state history by default', () => {
      stateManager.updateState({ currentIndex: 1 }, 'test-change');
      stateManager.updateState({ currentIndex: 2 }, 'test-change-2');
      
      const history = stateManager.getHistory();
      expect(history).toHaveLength(2);
      
      expect(history[0].previousState.currentIndex).toBe(0);
      expect(history[0].newState.currentIndex).toBe(1);
      expect(history[0].context).toBe('test-change');
      
      expect(history[1].previousState.currentIndex).toBe(1);
      expect(history[1].newState.currentIndex).toBe(2);
      expect(history[1].context).toBe('test-change-2');
    });

    it('should limit history size', () => {
      const customManager = new StateManager({
        persistence: { maxHistoryEntries: 2 }
      });
      
      customManager.updateState({ currentIndex: 1 });
      customManager.updateState({ currentIndex: 2 });
      customManager.updateState({ currentIndex: 3 });
      
      const history = customManager.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].newState.currentIndex).toBe(2);
      expect(history[1].newState.currentIndex).toBe(3);
      
      customManager.destroy();
    });

    it('should clear history', () => {
      const eventSpy = vi.fn();
      stateManager.on(SLIDER_EVENTS.STATE_HISTORY_CLEARED, eventSpy);
      
      stateManager.updateState({ currentIndex: 1 });
      expect(stateManager.getHistory()).toHaveLength(1);
      
      stateManager.clearHistory();
      expect(stateManager.getHistory()).toHaveLength(0);
      expect(eventSpy).toHaveBeenCalled();
    });

    it('should revert to previous state', () => {
      const eventSpy = vi.fn();
      stateManager.on(SLIDER_EVENTS.STATE_REVERTED, eventSpy);
      
      stateManager.updateState({ currentIndex: 1 });
      stateManager.updateState({ currentIndex: 2 });
      
      expect(stateManager.getCurrentIndex()).toBe(2);
      
      const success = stateManager.revertToPreviousState();
      expect(success).toBe(true);
      expect(stateManager.getCurrentIndex()).toBe(1);
      expect(eventSpy).toHaveBeenCalled();
    });

    it('should fail to revert when no history exists', () => {
      const success = stateManager.revertToPreviousState();
      expect(success).toBe(false);
    });
  });

  describe('State Persistence', () => {
    it('should not persist by default', () => {
      stateManager.updateState({ currentIndex: 1 });
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should persist state when enabled', () => {
      const customManager = new StateManager({
        persistence: {
          enabled: true,
          storageKey: 'test-key',
          persistedProperties: ['currentIndex', 'isPlaying']
        }
      });
      
      customManager.updateState({ currentIndex: 3, isPlaying: true });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        expect.stringContaining('"currentIndex":3')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        expect.stringContaining('"isPlaying":true')
      );
      
      customManager.destroy();
    });

    it('should load persisted state on initialization', () => {
      const persistedData = {
        state: { currentIndex: 2, isPlaying: true },
        timestamp: Date.now()
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(persistedData));
      
      const customManager = new StateManager({
        persistence: {
          enabled: true,
          storageKey: 'test-key'
        }
      });
      
      expect(customManager.getCurrentIndex()).toBe(2);
      expect(customManager.isPlaying()).toBe(true);
      
      customManager.destroy();
    });

    it('should handle localStorage errors gracefully', () => {
      const errorSpy = vi.fn();
      const customManager = new StateManager({
        persistence: { enabled: true }
      });
      
      customManager.on(SLIDER_EVENTS.STATE_PERSISTENCE_ERROR, errorSpy);
      
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      customManager.updateState({ currentIndex: 1 });
      expect(errorSpy).toHaveBeenCalled();
      
      customManager.destroy();
    });
  });

  describe('Auto-save Functionality', () => {
    it('should setup auto-save timer when enabled', () => {
      vi.useFakeTimers();
      
      const customManager = new StateManager({
        persistence: {
          enabled: true,
          autoSaveInterval: 1000
        }
      });
      
      // Initially no save calls
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      
      // Advance timer
      vi.advanceTimersByTime(1000);
      
      // Should have auto-saved
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      customManager.destroy();
      vi.useRealTimers();
    });

    it('should clear auto-save timer on destroy', () => {
      vi.useFakeTimers();
      
      const customManager = new StateManager({
        persistence: {
          enabled: true,
          autoSaveInterval: 1000
        }
      });
      
      // Clear any initial persistence calls
      localStorageMock.setItem.mockClear();
      
      customManager.destroy();
      
      // The destroy() method calls persist once as part of cleanup
      const destroyCallCount = localStorageMock.setItem.mock.calls.length;
      
      // Advance timer after destroy
      vi.advanceTimersByTime(1000);
      
      // Should not have additional auto-save calls after destroy
      expect(localStorageMock.setItem.mock.calls.length).toBe(destroyCallCount);
      
      vi.useRealTimers();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const eventSpy = vi.fn();
      stateManager.on(SLIDER_EVENTS.STATE_CONFIG_UPDATED, eventSpy);
      
      const updates = {
        strictValidation: false,
        enableBoundsChecking: false
      };
      
      stateManager.updateConfig(updates);
      
      const config = stateManager.getConfig();
      expect(config.strictValidation).toBe(false);
      expect(config.enableBoundsChecking).toBe(false);
      expect(eventSpy).toHaveBeenCalledWith({
        oldConfig: expect.any(Object),
        newConfig: expect.any(Object),
        changes: updates
      });
    });

    it('should update persistence configuration', () => {
      vi.useFakeTimers();
      
      const updates = {
        persistence: {
          enabled: true,
          autoSaveInterval: 2000
        }
      };
      
      stateManager.updateConfig(updates);
      
      const config = stateManager.getConfig();
      expect(config.persistence?.enabled).toBe(true);
      expect(config.persistence?.autoSaveInterval).toBe(2000);
      
      vi.useRealTimers();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset state to initial values', () => {
      stateManager.setTotalSlides(5);
      stateManager.setCurrentIndex(3);
      stateManager.setPlaying(true);
      stateManager.updateState({ currentIndex: 1 }); // Create history
      
      stateManager.reset();
      
      const state = stateManager.getState();
      expect(state.currentIndex).toBe(0);
      expect(state.totalSlides).toBe(0);
      expect(state.isPlaying).toBe(false);
      expect(stateManager.getHistory()).toHaveLength(0);
    });

    it('should reset to custom initial state', () => {
      const customManager = new StateManager({
        initialState: {
          currentIndex: 2,
          totalSlides: 5
        }
      });
      
      customManager.setCurrentIndex(4);
      customManager.reset();
      
      const state = customManager.getState();
      expect(state.currentIndex).toBe(2);
      expect(state.totalSlides).toBe(5);
      
      customManager.destroy();
    });
  });

  describe('Validation Scenarios', () => {
    it('should handle edge case validations', () => {
      stateManager.setTotalSlides(1);
      
      // Should be valid
      stateManager.setCurrentIndex(0);
      expect(stateManager.getCurrentIndex()).toBe(0);
      
      // Should throw for out of bounds
      expect(() => stateManager.setCurrentIndex(1))
        .toThrow(SLIDER_ERROR_CODES.INVALID_SLIDE_INDEX);
    });

    it('should validate with bounds checking disabled', () => {
      const customManager = new StateManager({ 
        enableBoundsChecking: false,
        strictValidation: false  // Also disable strict validation
      });
      
      customManager.setTotalSlides(3);
      
      // Should not throw even though out of bounds
      expect(() => customManager.setCurrentIndex(5)).not.toThrow();
      expect(customManager.getCurrentIndex()).toBe(5);
      
      customManager.destroy();
    });
  });

  describe('Event Handling', () => {
    it('should emit validation warnings', () => {
      const warningSpy = vi.fn();
      stateManager.on(SLIDER_EVENTS.STATE_VALIDATION_WARNING, warningSpy);
      
      const customManager = new StateManager({ allowTransientStates: true });
      customManager.on(SLIDER_EVENTS.STATE_VALIDATION_WARNING, warningSpy);
      
      customManager.updateState({
        totalSlides: 3,
        currentIndex: 5,
        isTransitioning: true
      });
      
      expect(warningSpy).toHaveBeenCalled();
      customManager.destroy();
    });
  });

  describe('Destroy Functionality', () => {
    it('should cleanup resources on destroy', () => {
      const destroySpy = vi.fn();
      stateManager.on(SLIDER_EVENTS.STATE_MANAGER_DESTROYED, destroySpy);
      
      stateManager.destroy();
      
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should persist state on destroy if enabled', () => {
      const customManager = new StateManager({
        persistence: { enabled: true }
      });
      
      customManager.updateState({ currentIndex: 3 });
      localStorageMock.setItem.mockClear();
      
      customManager.destroy();
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should clear timers on destroy', () => {
      vi.useFakeTimers();
      
      const customManager = new StateManager({
        persistence: {
          enabled: true,
          autoSaveInterval: 1000
        }
      });
      
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
      
      customManager.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('Complex State Scenarios', () => {
    it('should handle rapid state changes', () => {
      const eventSpy = vi.fn();
      stateManager.on(SLIDER_EVENTS.STATE_CHANGED, eventSpy);
      
      // Rapid changes
      stateManager.updateState({ currentIndex: 1 });
      stateManager.updateState({ isPlaying: true });
      stateManager.updateState({ isTransitioning: true });
      stateManager.updateState({ loadingProgress: 50 });
      
      expect(eventSpy).toHaveBeenCalledTimes(4);
      
      const finalState = stateManager.getState();
      expect(finalState.currentIndex).toBe(1);
      expect(finalState.isPlaying).toBe(true);
      expect(finalState.isTransitioning).toBe(true);
      expect(finalState.loadingProgress).toBe(50);
    });

    it('should maintain state consistency during complex operations', () => {
      stateManager.setTotalSlides(10);
      stateManager.setCurrentIndex(5);
      stateManager.setPlaying(true);
      stateManager.setTransitioning(true);
      stateManager.setLoading(true, 75);
      stateManager.setInitialized(true);
      
      const state = stateManager.getState();
      const validation = stateManager.validateState(state);
      
      expect(validation.isValid).toBe(true);
      expect(state.totalSlides).toBe(10);
      expect(state.currentIndex).toBe(5);
      expect(state.isPlaying).toBe(true);
      expect(state.isTransitioning).toBe(true);
      expect(state.isLoading).toBe(true);
      expect(state.loadingProgress).toBe(75);
      expect(state.isInitialized).toBe(true);
    });
  });
});
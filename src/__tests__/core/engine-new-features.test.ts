import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SliderEngine } from '../../core/engine';
import { SLIDER_EVENTS } from '../../core/constants';
import type { ISliderController } from '../../core/types';

/**
 * Unit tests for the new SliderEngine features added in Phase 2.2
 * These test the public API methods without complex initialization scenarios
 */
describe('SliderEngine - New Features (Phase 2.2)', () => {
  let mockController: ISliderController;

  beforeEach(() => {
    // Create mock controller for accessibility testing
    mockController = {
      setInputConfig: vi.fn(),
      initialize: vi.fn(),
      destroy: vi.fn(),
      updateSlideState: vi.fn(),
      updatePlayState: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      getInputConfig: vi.fn(),
    } as unknown as ISliderController;
  });
  describe('Play/Pause Toggle Feature', () => {
    it('should start with isPlaying false', () => {
      const engine = new SliderEngine();
      expect(engine.isPlaying()).toBe(false);
    });

    it('should toggle from not playing to playing', () => {
      const engine = new SliderEngine();

      // Initially not playing
      expect(engine.isPlaying()).toBe(false);

      // Toggle to playing
      engine.togglePlayPause();
      expect(engine.isPlaying()).toBe(true);
    });

    it('should toggle from playing to not playing', () => {
      const engine = new SliderEngine();

      // Set to playing first
      engine.togglePlayPause();
      expect(engine.isPlaying()).toBe(true);

      // Toggle back to not playing
      engine.togglePlayPause();
      expect(engine.isPlaying()).toBe(false);
    });

    it('should maintain play state through multiple toggles', () => {
      const engine = new SliderEngine();

      // Multiple toggles
      expect(engine.isPlaying()).toBe(false);

      engine.togglePlayPause();
      expect(engine.isPlaying()).toBe(true);

      engine.togglePlayPause();
      expect(engine.isPlaying()).toBe(false);

      engine.togglePlayPause();
      expect(engine.isPlaying()).toBe(true);
    });

    it('should emit PLAY_STATE_CHANGED event when toggling', () => {
      const engine = new SliderEngine();
      const playStateListener = vi.fn();
      engine.on(SLIDER_EVENTS.PLAY_STATE_CHANGED, playStateListener);

      // Toggle play state
      engine.togglePlayPause();

      expect(playStateListener).toHaveBeenCalledWith(
        expect.objectContaining({
          isPlaying: true,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should update accessibility state when toggling play/pause', () => {
      const engine = new SliderEngine();

      // Mock the controller property to test accessibility integration
      // @ts-expect-error - Accessing private property for testing
      engine.controller = mockController;

      // Toggle to playing
      engine.togglePlayPause();
      expect(mockController.updatePlayState).toHaveBeenCalledWith(true);

      // Toggle to paused
      engine.togglePlayPause();
      expect(mockController.updatePlayState).toHaveBeenCalledWith(false);
    });

    it('should handle accessibility updates gracefully when controller is not available', () => {
      const engine = new SliderEngine();

      // Ensure controller is undefined
      // @ts-expect-error - Accessing private property for testing
      engine.controller = undefined;

      // Should not throw error
      expect(() => {
        engine.togglePlayPause();
      }).not.toThrow();
    });
  });

  describe('Escape Key Feature', () => {
    it('should handle escape without throwing errors', () => {
      const engine = new SliderEngine();

      // Should not throw error even before initialization
      expect(() => engine.handleEscape()).not.toThrow();
    });

    it('should emit error event if navigation fails', async () => {
      const engine = new SliderEngine();
      const errorListener = vi.fn();
      engine.on(SLIDER_EVENTS.ERROR, errorListener);

      // Mock goToSlide to fail
      const originalGoToSlide = engine.goToSlide;
      engine.goToSlide = vi
        .fn()
        .mockRejectedValue(new Error('Navigation failed'));

      // Handle escape
      engine.handleEscape();

      // Wait for async error handling
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to reset to first slide',
          error: expect.any(Error),
          timestamp: expect.any(Number),
        })
      );

      // Restore original method
      engine.goToSlide = originalGoToSlide;
    });

    it('should pause if playing when escape is pressed', () => {
      const engine = new SliderEngine();

      // Set to playing state
      engine.togglePlayPause();
      expect(engine.isPlaying()).toBe(true);

      // Mock goToSlide to avoid service dependency
      engine.goToSlide = vi.fn().mockResolvedValue(undefined);

      // Handle escape
      engine.handleEscape();

      // Should now be paused
      expect(engine.isPlaying()).toBe(false);
    });

    it('should update accessibility state when escape resets play state', () => {
      const engine = new SliderEngine();

      // Mock the controller for accessibility testing
      // @ts-expect-error - Accessing private property for testing
      engine.controller = mockController;

      // Set to playing state
      engine.togglePlayPause();
      expect(engine.isPlaying()).toBe(true);

      // Mock goToSlide to avoid service dependency
      engine.goToSlide = vi.fn().mockResolvedValue(undefined);

      // Handle escape
      engine.handleEscape();

      // Should have called updatePlayState with false (paused)
      expect(mockController.updatePlayState).toHaveBeenCalledWith(false);
    });
  });

  describe('Integration Behavior', () => {
    it('should maintain independent state for play/pause and escape features', () => {
      const engine = new SliderEngine();

      // Set playing state
      engine.togglePlayPause();
      expect(engine.isPlaying()).toBe(true);

      // Mock goToSlide to avoid service dependencies
      engine.goToSlide = vi.fn().mockResolvedValue(undefined);

      // Handle escape (which pauses)
      engine.handleEscape();

      // Should now be paused
      expect(engine.isPlaying()).toBe(false);

      // Toggle again should work independently
      engine.togglePlayPause();
      expect(engine.isPlaying()).toBe(true);
    });

    it('should emit appropriate events for all new features', () => {
      const engine = new SliderEngine();
      const eventListener = vi.fn();

      // Listen to all events
      engine.on(SLIDER_EVENTS.PLAY_STATE_CHANGED, eventListener);
      engine.on(SLIDER_EVENTS.ESCAPE_PRESSED, eventListener);

      // Mock goToSlide to avoid service dependencies
      engine.goToSlide = vi.fn().mockResolvedValue(undefined);

      // Use features
      engine.togglePlayPause(); // Should emit PLAY_STATE_CHANGED
      engine.handleEscape(); // Should emit ESCAPE_PRESSED and another PLAY_STATE_CHANGED (pause)

      // Should have emitted multiple events
      expect(eventListener).toHaveBeenCalledTimes(3);
    });
  });

  describe('Type Safety and API Consistency', () => {
    it('should have consistent return types', () => {
      const engine = new SliderEngine();

      // isPlaying should always return boolean
      expect(typeof engine.isPlaying()).toBe('boolean');

      // togglePlayPause should return void
      expect(engine.togglePlayPause()).toBeUndefined();

      // handleEscape should return void
      expect(engine.handleEscape()).toBeUndefined();
    });

    it('should work correctly when called in any order', () => {
      const engine = new SliderEngine();

      // Should not throw regardless of call order
      expect(() => {
        engine.handleEscape();
        engine.togglePlayPause();
        engine.isPlaying();
        engine.handleEscape();
        engine.togglePlayPause();
      }).not.toThrow();
    });
  });
});

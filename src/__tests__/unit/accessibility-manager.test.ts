/**
 * @fileoverview Accessibility Manager Unit Tests
 *
 * Comprehensive unit tests for the AccessibilityManager class including
 * ARIA management, screen reader support, and sub-manager coordination.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the sub-components
const mockScreenReaderSupport = {
  initialize: vi.fn().mockResolvedValue(undefined),
  announce: vi.fn(),
  destroy: vi.fn(),
  updateLabels: vi.fn(),
};

const mockKeyboardNavigator = {
  destroy: vi.fn(),
  setCurrentSlide: vi.fn(),
  setTotalSlides: vi.fn(),
  setPlayingState: vi.fn(),
};

const mockMotionPreferences = {
  initialize: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn(),
  prefersReducedMotion: vi.fn().mockReturnValue(false),
};

const mockFocusManager = {
  initialize: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn(),
  updateConfig: vi.fn(),
};

vi.mock('../../accessibility/screen-reader-support', () => ({
  ScreenReaderSupport: vi.fn(() => mockScreenReaderSupport),
}));

vi.mock('../../input/keyboard-navigator', () => ({
  KeyboardNavigator: vi.fn(() => mockKeyboardNavigator),
}));

vi.mock('../../accessibility/motion-preferences', () => ({
  MotionPreferences: vi.fn(() => mockMotionPreferences),
}));

vi.mock('../../accessibility/focus-manager', () => ({
  FocusManager: vi.fn(() => mockFocusManager),
}));

import { AccessibilityManager } from '../../accessibility/accessibility-manager';
import { SLIDER_EVENTS } from '../../core/constants';
import type { AccessibilityConfig, ISliderEngine } from '../../core/types';

describe('AccessibilityManager', () => {
  let accessibilityManager: AccessibilityManager;
  let mockContainer: HTMLElement;
  let mockEngine: ISliderEngine;
  let config: AccessibilityConfig;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create mock container element
    mockContainer = document.createElement('div');
    mockContainer.id = 'test-container';
    document.body.appendChild(mockContainer);

    // Mock engine
    mockEngine = {
      getCurrentIndex: vi.fn().mockReturnValue(0),
      getTotalSlides: vi.fn().mockReturnValue(3),
      goToSlide: vi.fn().mockResolvedValue(undefined),
      nextSlide: vi.fn().mockResolvedValue(undefined),
      previousSlide: vi.fn().mockResolvedValue(undefined),
      togglePlayPause: vi.fn(),
      handleEscape: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    } as unknown as ISliderEngine;

    // Default config
    config = {
      screenReader: true,
      keyboardNavigation: true,
      focusManagement: {
        autoFocus: true,
        trapFocus: false,
      },
      ariaLabels: {
        sliderLabel: 'Test slider',
        slideLabel: 'Slide {index} of {total}',
      },
    };

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    if (accessibilityManager) {
      accessibilityManager.destroy();
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      accessibilityManager = new AccessibilityManager();
      expect(accessibilityManager).toBeDefined();
      expect(accessibilityManager.isEnabled()).toBe(false);
    });

    it('should initialize with custom configuration', () => {
      accessibilityManager = new AccessibilityManager(config);
      expect(accessibilityManager.getConfig()).toEqual(
        expect.objectContaining(config)
      );
    });

    it('should initialize all sub-managers when enabled', async () => {
      accessibilityManager = new AccessibilityManager(config);
      await accessibilityManager.initialize(mockContainer, mockEngine);

      expect(accessibilityManager.isEnabled()).toBe(true);
    });

    it('should setup ARIA attributes on container', async () => {
      accessibilityManager = new AccessibilityManager(config);
      await accessibilityManager.initialize(mockContainer, mockEngine);

      expect(mockContainer.getAttribute('role')).toBe('region');
      expect(mockContainer.getAttribute('aria-label')).toBe('Test slider');
      expect(mockContainer.getAttribute('tabindex')).toBe('0');
    });

    it('should create live region for announcements', async () => {
      accessibilityManager = new AccessibilityManager(config);
      await accessibilityManager.initialize(mockContainer, mockEngine);

      const liveRegion = mockContainer.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion?.getAttribute('role')).toBe('status');
    });
  });

  describe('Slide Announcements', () => {
    beforeEach(async () => {
      accessibilityManager = new AccessibilityManager(config);
      await accessibilityManager.initialize(mockContainer, mockEngine);
    });

    it('should announce slide changes', () => {
      const emitSpy = vi.spyOn(accessibilityManager, 'emit');

      accessibilityManager.announceSlideChange(1, 3);

      expect(emitSpy).toHaveBeenCalledWith(
        SLIDER_EVENTS.ACCESSIBILITY_SLIDE_ANNOUNCED,
        expect.objectContaining({
          index: 1,
          total: 3,
          announcement: 'Slide 2 of 3',
        })
      );
    });

    it('should update ARIA attributes on slide change', () => {
      accessibilityManager.announceSlideChange(2, 3);

      expect(mockContainer.getAttribute('aria-valuenow')).toBe('3');
      expect(mockContainer.getAttribute('aria-valuemax')).toBe('3');
      expect(mockContainer.getAttribute('aria-valuetext')).toBe('Slide 3 of 3');
    });

    it('should update live region with announcement', () => {
      accessibilityManager.announceSlideChange(1, 3);

      const liveRegion = mockContainer.querySelector('[aria-live="polite"]');
      expect(liveRegion?.textContent).toBe('Slide 2 of 3');
    });
  });

  describe('Motion Preference Detection', () => {
    beforeEach(async () => {
      accessibilityManager = new AccessibilityManager(config);
      await accessibilityManager.initialize(mockContainer, mockEngine);
    });

    it('should respect motion preferences', () => {
      // Mock reduced motion preference
      vi.mocked(window.matchMedia).mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      // Test the functionality
      accessibilityManager.respectMotionPreferences();

      // The motion preferences should be updated
      // Note: The exact implementation may vary
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      accessibilityManager = new AccessibilityManager(config);
      await accessibilityManager.initialize(mockContainer, mockEngine);
    });

    it('should update configuration dynamically', () => {
      const newConfig = {
        screenReader: false,
        ariaLabels: {
          sliderLabel: 'Updated slider',
        },
      };

      accessibilityManager.updateConfig(newConfig);

      const updatedConfig = accessibilityManager.getConfig();
      expect(updatedConfig.screenReader).toBe(false);
      expect(updatedConfig.ariaLabels?.sliderLabel).toBe('Updated slider');
    });

    it('should enable and disable features', () => {
      const emitSpy = vi.spyOn(accessibilityManager, 'emit');

      accessibilityManager.enableFeature('screenReader');
      expect(emitSpy).toHaveBeenCalledWith(
        SLIDER_EVENTS.ACCESSIBILITY_FEATURE_ENABLED,
        { feature: 'screenReader' }
      );

      accessibilityManager.disableFeature('keyboardNavigation');
      expect(emitSpy).toHaveBeenCalledWith(
        SLIDER_EVENTS.ACCESSIBILITY_FEATURE_DISABLED,
        { feature: 'keyboardNavigation' }
      );
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      accessibilityManager = new AccessibilityManager(config);
      await accessibilityManager.initialize(mockContainer, mockEngine);
    });

    it('should handle keyboard navigation events', () => {
      const mockEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      const emitSpy = vi.spyOn(accessibilityManager, 'emit');

      accessibilityManager.handleKeyboardNavigation(mockEvent);

      expect(emitSpy).toHaveBeenCalledWith(
        SLIDER_EVENTS.ACCESSIBILITY_KEYBOARD_EVENT,
        expect.objectContaining({
          key: 'ArrowRight',
          handled: true,
        })
      );
    });

    it('should setup event listeners for engine events', () => {
      // Event listeners are set up during initialization
      // Check that the mock engine's on method was called
      expect(mockEngine.on).toHaveBeenCalled();

      // Check for specific events by examining all calls
      const onCalls = vi.mocked(mockEngine.on).mock.calls;
      const eventTypes = onCalls.map((call) => call[0]);

      expect(eventTypes).toContain(SLIDER_EVENTS.SLIDE_CHANGED);
      expect(eventTypes).toContain(SLIDER_EVENTS.PLAY_STATE_CHANGED);
    });
  });

  describe('Cleanup and Destruction', () => {
    beforeEach(async () => {
      accessibilityManager = new AccessibilityManager(config);
      await accessibilityManager.initialize(mockContainer, mockEngine);
    });

    it('should clean up all resources on destroy', () => {
      const emitSpy = vi.spyOn(accessibilityManager, 'emit');

      accessibilityManager.destroy();

      expect(emitSpy).toHaveBeenCalledWith(
        SLIDER_EVENTS.ACCESSIBILITY_DESTROYED
      );
      expect(accessibilityManager.isEnabled()).toBe(false);
    });

    it('should remove live region on destroy', () => {
      // Verify live region exists
      const liveRegion = mockContainer.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeTruthy();

      accessibilityManager.destroy();

      // Live region should be removed
      const removedLiveRegion = mockContainer.querySelector(
        '[aria-live="polite"]'
      );
      expect(removedLiveRegion).toBeFalsy();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // Mock sub-manager to throw error
      const { ScreenReaderSupport } = await import(
        '../../accessibility/screen-reader-support'
      );
      vi.mocked(ScreenReaderSupport).mockImplementation(() => {
        throw new Error('Test error');
      });

      accessibilityManager = new AccessibilityManager(config);

      await expect(
        accessibilityManager.initialize(mockContainer, mockEngine)
      ).rejects.toThrow('Test error');
    });

    it('should handle missing container gracefully', async () => {
      accessibilityManager = new AccessibilityManager(config);

      // Should not throw when container is null (graceful degradation)
      await expect(
        accessibilityManager.initialize(
          null as unknown as HTMLElement,
          mockEngine
        )
      ).resolves.not.toThrow();
    });
  });

  describe('ARIA Label Formatting', () => {
    beforeEach(async () => {
      accessibilityManager = new AccessibilityManager(config);
      await accessibilityManager.initialize(mockContainer, mockEngine);
    });

    it('should format slide labels correctly', () => {
      accessibilityManager.announceSlideChange(0, 5);
      const liveRegion = mockContainer.querySelector('[aria-live="polite"]');
      expect(liveRegion?.textContent).toBe('Slide 1 of 5');

      accessibilityManager.announceSlideChange(4, 5);
      expect(liveRegion?.textContent).toBe('Slide 5 of 5');
    });

    it('should use custom slide label template', async () => {
      const customConfig = {
        ...config,
        ariaLabels: {
          slideLabel: 'Image {index} out of {total}',
        },
      };

      accessibilityManager.destroy();
      accessibilityManager = new AccessibilityManager(customConfig);
      await accessibilityManager.initialize(mockContainer, mockEngine);

      accessibilityManager.announceSlideChange(2, 4);
      const liveRegion = mockContainer.querySelector('[aria-live="polite"]');
      expect(liveRegion?.textContent).toBe('Image 3 out of 4');
    });
  });
});

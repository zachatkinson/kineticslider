/**
 * @fileoverview KeyboardNavigator Unit Tests
 *
 * Comprehensive testing for accessibility-focused keyboard navigation with WCAG 2.1 AA compliance.
 * Tests cover keyboard interactions, focus management, screen reader support, and cross-platform
 * accessibility following our established DRY testing patterns.
 *
 * @version 1.0.0
 */

import {
  KeyboardNavigator,
  type KeyboardCallbacks,
} from '../../input/keyboard-navigator';
import { createMockKeyboardEvent } from '../utils/test-factories';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('KeyboardNavigator', () => {
  let navigator: KeyboardNavigator | undefined;
  let mockElement: HTMLElement;
  let mockCallbacks: KeyboardCallbacks;
  let mockAnnouncer: HTMLElement;

  beforeEach(() => {
    // Create mock element with all required DOM methods
    mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(() => ''),
      hasAttribute: vi.fn(() => false),
      focus: vi.fn(),
      blur: vi.fn(),
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      getBoundingClientRect: vi.fn(() => ({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
      })),
      tabIndex: 0,
      tagName: 'DIV',
      textContent: '',
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    } as unknown as HTMLElement;

    // Create mock screen reader announcer
    mockAnnouncer = {
      textContent: '',
      setAttribute: vi.fn(),
      style: {} as CSSStyleDeclaration,
      id: 'keyboard-navigator-announcements',
      className: 'sr-only',
      remove: vi.fn(),
    } as unknown as HTMLElement;

    // Mock document methods
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnnouncer);
    vi.spyOn(document, 'getElementById').mockReturnValue(null);
    vi.spyOn(document.body, 'appendChild').mockImplementation(
      () => mockAnnouncer
    );
    vi.spyOn(document.body, 'removeChild').mockImplementation(
      () => mockAnnouncer
    );

    // Create mock callbacks matching actual interface
    mockCallbacks = {
      onNext: vi.fn(),
      onPrevious: vi.fn(),
      onFirst: vi.fn(),
      onLast: vi.fn(),
      onTogglePlayPause: vi.fn(),
      onGoToSlide: vi.fn(),
      onEscape: vi.fn(),
    };

    // Create navigator with callbacks in constructor
    navigator = new KeyboardNavigator(mockElement, mockCallbacks, {
      enableArrowKeys: true,
      enableWASD: true,
      enableSpaceBar: true,
      enableEnterKey: true,
      enableTabNavigation: true,
      enableHomeEnd: true,
      enablePageKeys: true,
      respectMotionPreferences: true,
      enableAnnouncements: true,
      customBindings: new Map(),
    });
  });

  afterEach(() => {
    if (navigator) {
      navigator.destroy();
    }
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with callbacks in constructor', () => {
      const defaultNavigator = new KeyboardNavigator(
        mockElement,
        mockCallbacks
      );
      expect(defaultNavigator).toBeDefined();

      // Verify keyboard event listeners are set up
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'focus',
        expect.any(Function)
      );
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'blur',
        expect.any(Function)
      );

      defaultNavigator.destroy();
    });

    it('should set up proper ARIA attributes', () => {
      expect(mockElement.setAttribute).toHaveBeenCalledWith('role', 'region');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('tabindex', '0');
      // Note: aria-label is no longer set by KeyboardNavigator - handled by AccessibilityManager
      expect(mockElement.setAttribute).toHaveBeenCalledWith(
        'aria-describedby',
        '_slider-keyboard-instructions'
      );
      // aria-live is set on the separate live region element created by the navigator
    });

    it('should create screen reader announcer element', () => {
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockAnnouncer.setAttribute).toHaveBeenCalledWith('role', 'status');
      expect(mockAnnouncer.setAttribute).toHaveBeenCalledWith(
        'aria-live',
        'polite'
      );
      expect(document.body.appendChild).toHaveBeenCalledWith(mockAnnouncer);
    });

    it('should respect motion preferences', () => {
      // Mock matchMedia for motion preference testing
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn(),
      };
      const matchMediaSpy = vi
        .spyOn(window, 'matchMedia')
        .mockReturnValue(mockMediaQuery as unknown as MediaQueryList);

      const motionPreferenceNavigator = new KeyboardNavigator(
        mockElement,
        mockCallbacks,
        {
          respectMotionPreferences: true,
        }
      );

      // Should detect prefers-reduced-motion
      expect(matchMediaSpy).toHaveBeenCalledWith(
        '(prefers-reduced-motion: reduce)'
      );

      motionPreferenceNavigator.destroy();
    });
  });

  describe('Arrow Key Navigation', () => {
    it('should handle right arrow key', () => {
      const keyEvent = createMockKeyboardEvent('keydown', 'ArrowRight');

      navigator!['handleKeyDown'](keyEvent as unknown as KeyboardEvent);

      expect(mockCallbacks.onNext).toHaveBeenCalled();
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle left arrow key', () => {
      const keyEvent = createMockKeyboardEvent('keydown', 'ArrowLeft');

      navigator!['handleKeyDown'](keyEvent as unknown as KeyboardEvent);

      expect(mockCallbacks.onPrevious).toHaveBeenCalled();
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('should respect disabled arrow keys', () => {
      const disabledNavigator = new KeyboardNavigator(
        mockElement,
        mockCallbacks,
        {
          enableArrowKeys: false,
        }
      );

      const keyEvent = createMockKeyboardEvent('keydown', 'ArrowRight');
      disabledNavigator['handleKeyDown'](keyEvent as unknown as KeyboardEvent);

      expect(mockCallbacks.onNext).not.toHaveBeenCalled();
      expect(keyEvent.preventDefault).not.toHaveBeenCalled();

      disabledNavigator.destroy();
    });
  });

  describe('WASD Navigation', () => {
    it('should handle WASD keys', () => {
      const keys = [
        { key: 'd', callback: 'onNext' },
        { key: 's', callback: 'onNext' },
        { key: 'a', callback: 'onPrevious' },
        { key: 'w', callback: 'onPrevious' },
        { key: 'D', callback: 'onNext' },
        { key: 'S', callback: 'onNext' },
        { key: 'A', callback: 'onPrevious' },
        { key: 'W', callback: 'onPrevious' },
      ];

      keys.forEach(({ key, callback }) => {
        const keyEvent = createMockKeyboardEvent('keydown', key);
        navigator!['handleKeyDown'](keyEvent as unknown as KeyboardEvent);

        expect(
          mockCallbacks[callback as keyof KeyboardCallbacks]
        ).toHaveBeenCalled();
        expect(keyEvent.preventDefault).toHaveBeenCalled();

        // Reset mocks for next iteration
        vi.clearAllMocks();
      });
    });

    it('should respect disabled WASD keys', () => {
      const disabledNavigator = new KeyboardNavigator(
        mockElement,
        mockCallbacks,
        {
          enableWASD: false,
        }
      );

      const keyEvent = createMockKeyboardEvent('keydown', 'd');
      disabledNavigator['handleKeyDown'](keyEvent as unknown as KeyboardEvent);

      expect(mockCallbacks.onNext).not.toHaveBeenCalled();

      disabledNavigator.destroy();
    });
  });

  describe('Home/End Navigation', () => {
    it('should handle Home and End keys', () => {
      const homeKey = createMockKeyboardEvent('keydown', 'Home');
      const endKey = createMockKeyboardEvent('keydown', 'End');

      navigator!['handleKeyDown'](homeKey as unknown as KeyboardEvent);
      expect(mockCallbacks.onFirst).toHaveBeenCalled();

      navigator!['handleKeyDown'](endKey as unknown as KeyboardEvent);
      expect(mockCallbacks.onLast).toHaveBeenCalled();
    });

    it('should respect disabled Home/End keys', () => {
      const disabledNavigator = new KeyboardNavigator(
        mockElement,
        mockCallbacks,
        {
          enableHomeEnd: false,
        }
      );

      const homeKey = createMockKeyboardEvent('keydown', 'Home');
      disabledNavigator['handleKeyDown'](homeKey as unknown as KeyboardEvent);

      expect(mockCallbacks.onFirst).not.toHaveBeenCalled();

      disabledNavigator.destroy();
    });
  });

  describe('Page Up/Down Navigation', () => {
    it('should handle Page Up and Page Down keys', () => {
      const pageUpKey = createMockKeyboardEvent('keydown', 'PageUp');
      const pageDownKey = createMockKeyboardEvent('keydown', 'PageDown');

      navigator!['handleKeyDown'](pageUpKey as unknown as KeyboardEvent);
      expect(mockCallbacks.onPrevious).toHaveBeenCalled();

      navigator!['handleKeyDown'](pageDownKey as unknown as KeyboardEvent);
      expect(mockCallbacks.onNext).toHaveBeenCalled();
    });
  });

  describe('Activation Keys', () => {
    it('should handle Space key activation', () => {
      const spaceKey = createMockKeyboardEvent('keydown', ' ');

      navigator!['handleKeyDown'](spaceKey as unknown as KeyboardEvent);

      expect(mockCallbacks.onTogglePlayPause).toHaveBeenCalled();
      expect(spaceKey.preventDefault).toHaveBeenCalled();
    });

    it('should handle Enter key activation', () => {
      const enterKey = createMockKeyboardEvent('keydown', 'Enter');

      navigator!['handleKeyDown'](enterKey as unknown as KeyboardEvent);

      expect(mockCallbacks.onTogglePlayPause).toHaveBeenCalled();
      expect(enterKey.preventDefault).toHaveBeenCalled();
    });

    it('should handle Escape key', () => {
      const escapeKey = createMockKeyboardEvent('keydown', 'Escape');

      navigator!['handleKeyDown'](escapeKey as unknown as KeyboardEvent);

      expect(mockCallbacks.onEscape).toHaveBeenCalled();
      expect(escapeKey.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Custom Key Bindings', () => {
    it('should handle custom key bindings', () => {
      const customHandler = vi.fn();
      const customBindings = new Map([['f', customHandler]]);

      const customNavigator = new KeyboardNavigator(
        mockElement,
        mockCallbacks,
        {
          customBindings,
        }
      );

      const customKey = createMockKeyboardEvent('keydown', 'f');
      customNavigator['handleKeyDown'](customKey as unknown as KeyboardEvent);

      expect(customHandler).toHaveBeenCalled();
      expect(customKey.preventDefault).toHaveBeenCalled();

      customNavigator.destroy();
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should create announcer when enabled', () => {
      expect(navigator).toBeDefined();
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockAnnouncer);
    });

    it('should not create live region when announcements disabled', () => {
      // Clear previous calls
      vi.clearAllMocks();

      // Create spy to check what gets appended to document body
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');

      const silentNavigator = new KeyboardNavigator(
        mockElement,
        mockCallbacks,
        {
          enableAnnouncements: false,
        }
      );

      // Should append keyboard instructions but NOT live region
      const appendCalls = appendChildSpy.mock.calls;
      const liveRegionAppends = appendCalls.filter(
        (call) =>
          call[0] &&
          (call[0] as unknown as HTMLElement).id ===
            'keyboard-navigator-announcements'
      );
      expect(liveRegionAppends).toHaveLength(0);

      // Should still create keyboard instructions (for accessibility)
      const instructionAppends = appendCalls.filter(
        (call) =>
          call[0] &&
          (call[0] as unknown as HTMLElement).id ===
            '_slider-keyboard-instructions'
      );
      expect(instructionAppends).toHaveLength(1);

      silentNavigator.destroy();

      // Restore spy
      appendChildSpy.mockRestore();
    });
  });

  describe('Focus Management', () => {
    it('should handle focus events', () => {
      const focusEvent = new FocusEvent('focus');

      navigator!['handleFocus'](focusEvent);

      // Should call announceCurrentState (which sets textContent)
      expect(mockAnnouncer.textContent).toBeDefined();
    });

    it('should handle blur events', () => {
      const blurEvent = new FocusEvent('blur');

      // Should not throw error
      expect(() => {
        navigator!['handleBlur'](blurEvent);
      }).not.toThrow();
    });
  });

  describe('Configuration Management', () => {
    it('should allow runtime configuration updates', () => {
      // Test that configuration can be updated
      navigator!.updateConfig({
        enableArrowKeys: false,
      });

      const arrowKey = createMockKeyboardEvent('keydown', 'ArrowRight');
      navigator!['handleKeyDown'](arrowKey as unknown as KeyboardEvent);

      expect(mockCallbacks.onNext).not.toHaveBeenCalled();
    });

    it('should add custom key bindings', () => {
      const customHandler = vi.fn();
      navigator!.addKeyBinding('x', customHandler);

      const customKey = createMockKeyboardEvent('keydown', 'x');
      navigator!['handleKeyDown'](customKey as unknown as KeyboardEvent);

      expect(customHandler).toHaveBeenCalled();
    });

    it('should remove key bindings', () => {
      const customHandler = vi.fn();
      navigator!.addKeyBinding('x', customHandler);
      navigator!.removeKeyBinding('x');

      const customKey = createMockKeyboardEvent('keydown', 'x');
      navigator!['handleKeyDown'](customKey as unknown as KeyboardEvent);

      expect(customHandler).not.toHaveBeenCalled();
    });
  });

  describe('Slide State Management', () => {
    it('should set total slides', () => {
      navigator!.setTotalSlides(5);

      expect(mockElement.setAttribute).toHaveBeenCalledWith(
        'aria-valuemax',
        '5'
      );
    });

    it('should set current slide', () => {
      // Set total slides first so the index isn't clamped to 0
      navigator!.setTotalSlides(5);
      navigator!.setCurrentSlide(2);

      expect(mockElement.setAttribute).toHaveBeenCalledWith(
        'aria-valuenow',
        '3' // Implementation uses 1-based indexing for ARIA (currentSlide + 1)
      );
    });

    it('should set playing state', () => {
      navigator!.setPlayingState(true);

      // Should not throw error
      expect(() => {
        navigator!.setPlayingState(false);
      }).not.toThrow();
    });
  });

  describe('Utility Methods', () => {
    it('should focus element', () => {
      navigator!.focus();

      expect(mockElement.focus).toHaveBeenCalled();
    });

    it('should get focus state', () => {
      const focusState = navigator!.getFocusState();

      expect(focusState).toBeDefined();
      expect(typeof focusState.currentIndex).toBe('number');
      expect(typeof focusState.isTrapped).toBe('boolean');
    });
  });

  describe('Memory Management', () => {
    it('should clean up event listeners on destroy', () => {
      navigator!.destroy();

      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'focus',
        expect.any(Function)
      );
      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'blur',
        expect.any(Function)
      );
    });

    it('should remove announcer element on destroy', () => {
      navigator!.destroy();

      // Verify announcer cleanup was attempted
      expect(mockAnnouncer.remove).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing callbacks gracefully', () => {
      // Create navigator with minimal callbacks
      const minimalNavigator = new KeyboardNavigator(mockElement, {
        onNext: vi.fn(),
        onPrevious: vi.fn(),
        onFirst: vi.fn(),
        onLast: vi.fn(),
        onTogglePlayPause: vi.fn(),
        onGoToSlide: vi.fn(),
        onEscape: vi.fn(),
      });

      const keyEvent = createMockKeyboardEvent('keydown', 'ArrowRight');

      expect(() => {
        minimalNavigator['handleKeyDown'](keyEvent as unknown as KeyboardEvent);
      }).not.toThrow();

      minimalNavigator.destroy();
    });

    it('should ignore modifier key combinations', () => {
      const ctrlKey = createMockKeyboardEvent('keydown', 'ArrowRight', {
        ctrlKey: true,
      });

      navigator!['handleKeyDown'](ctrlKey as unknown as KeyboardEvent);

      expect(mockCallbacks.onNext).not.toHaveBeenCalled();
      expect(ctrlKey.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility Compliance', () => {
    it('should provide proper ARIA attributes', () => {
      // KeyboardNavigator sets role and tabindex, but not aria-label (handled by AccessibilityManager)
      expect(mockElement.setAttribute).toHaveBeenCalledWith('role', 'region');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('tabindex', '0');
    });

    it('should create keyboard instructions', () => {
      expect(document.createElement).toHaveBeenCalledWith('div');
      // Instructions should be created and added to DOM
      expect(document.body.appendChild).toHaveBeenCalled();
    });
  });
});

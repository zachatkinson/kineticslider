/**
 * Keyboard event handling types for the KineticSlider
 */

export interface KeyboardOptions {
  onLeft?: (() => void) | undefined;
  onRight?: (() => void) | undefined;
  onUp?: (() => void) | undefined;
  onDown?: (() => void) | undefined;
  onEnter?: (() => void) | undefined;
  onSpace?: (() => void) | undefined;
  onEscape?: (() => void) | undefined;
  onTab?: ((event: KeyboardEvent) => void) | undefined;
  onHome?: (() => void) | undefined;
  onEnd?: (() => void) | undefined;
  onPageUp?: (() => void) | undefined;
  onPageDown?: (() => void) | undefined;
  enabled?: boolean | undefined;
  preventDefault?: boolean | undefined;
  stopPropagation?: boolean | undefined;
}

/**
 * Keyboard-related type definitions and interfaces
 */

/**
 * Options for focus trap behavior
 */
export interface FocusTrapOptions {
  /** Whether to return focus to the previously focused element when deactivating */
  returnFocusOnDeactivate?: boolean;
  /** Whether the Escape key should deactivate the focus trap */
  escapeDeactivates?: boolean;
  /** Whether the focus trap is currently active */
  active?: boolean;
  /** Whether to automatically focus the first focusable element when activated */
  autoFocus?: boolean;
  /** Callback when focus trap is activated */
  onActivate?: () => void;
  /** Callback when focus trap is deactivated */
  onDeactivate?: () => void;
  /** Element or selector to focus if no focusable elements are found */
  fallbackFocus?: string | HTMLElement | (() => HTMLElement | null);
  /** Element or selector to focus when trap is activated */
  initialFocus?: string | HTMLElement | (() => HTMLElement | null);
}

/**
 * Keyboard navigation configuration
 */
export interface KeyboardConfig {
  /** Enable keyboard navigation */
  enabled?: boolean;
  /** Key codes for navigation */
  keyCodes?: {
    next?: string[];
    previous?: string[];
    first?: string[];
    last?: string[];
  };
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Whether to stop event propagation */
  stopPropagation?: boolean;
}

/**
 * Type for keyboard event handler functions
 */
export type KeyboardEventHandler = (() => void) | ((event: KeyboardEvent) => void);

/**
 * Type for keyboard event handlers map
 */
export type KeyboardHandlers = Record<string, KeyboardEventHandler | undefined>;

/**
 * Return type for useKeyboard hook
 */
export interface UseKeyboardReturn {
  /** Trap focus within a container */
  trapFocus: (container: HTMLElement | null, options?: FocusTrapOptions) => void;
  /** Release focus trap */
  releaseFocus: () => void;
  /** Whether focus is currently trapped */
  isFocusTrapped: boolean;
}

/**
 * Read the current file to understand the interfaces and fix any mismatches
 */

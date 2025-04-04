/**
 * Accessibility-related type definitions and interfaces
 */
import type { FocusTrapOptions } from './keyboard';

/**
 * Props for the FocusManager component
 * @example Example usage
 */
export interface FocusManagerProps {
  /** Child components to render */
  children: React.ReactNode;
  /** Whether to trap focus within the container */
  trapFocus?: boolean;
  /** Focus trap configuration options */
  trapOptions?: FocusTrapOptions;
  /** Initial element to focus */
  initialFocus?: string | HTMLElement | (() => HTMLElement | null);
  /** Element to return focus to when unmounted */
  returnFocusTo?: string | HTMLElement | (() => HTMLElement | null);
  /** Whether to restore focus when unmounted */
  restoreFocus?: boolean;
  /** Whether to auto-focus the first focusable element */
  autoFocus?: boolean;
  /** Whether pressing escape should deactivate the focus trap */
  escapeDeactivates?: boolean;
  /** Callback when focus trap is activated */
  onActivate?: () => void;
  /** Callback when focus trap is deactivated */
  onDeactivate?: () => void;
  /** Callback when escape key is pressed */
  onEscape?: () => void;
  /** Whether the component is currently active */
  active?: boolean;
  /** Reference to restore focus to when component is unmounted */
  restorePrevious?: React.RefObject<HTMLElement | null>;
}

/**
 * Accessibility configuration options
 * @example Example usage
 */
export interface AccessibilityConfig {
  /** Enable accessibility features */
  enabled: boolean;
  /** ARIA label for the slider region */
  ariaLabel?: string;
  /** Whether to announce slide changes */
  announceSlideChanges: boolean;
  /** Custom announcements for different actions */
  announcements?: {
    slideChange?: (current: number, total: number) => string;
    error?: (message: string) => string;
    loading?: string;
  };
  /** Keyboard navigation configuration */
  keyboardNavigation?: boolean;
  /** Focus management configuration */
  focusManagement?: {
    trapFocus?: boolean;
    restoreFocus?: boolean;
    initialFocus?: string;
  };
}

/**
 * Accessibility action types
 */
export type AccessibilityAction =
  | 'focus'
  | 'blur'
  | 'keyPress'
  | 'announcement'
  | 'roleChange'
  | 'stateChange';

/**
 * Accessibility event data
 * @example Example usage
 */
export interface AccessibilityEvent {
  type: AccessibilityAction;
  element: string;
  role?: string;
  state?: string;
  message?: string;
  timestamp: number;
}

/**
 * Props for slider accessibility hook
 * @example Example usage
 */
export interface UseSliderAccessibilityProps {
  /** Total number of slides */
  totalSlides: number;
  /** Current slide index (0-based) */
  currentIndex: number;
  /** Function to navigate to next slide */
  onNext: () => void;
  /** Function to navigate to previous slide */
  onPrev: () => void;
  /** Whether a slide transition is in progress */
  isAnimating: boolean;
}

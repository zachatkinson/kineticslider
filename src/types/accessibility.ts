/**
 * Accessibility-related types for focus management
 */
import { FocusTrapOptions } from './keyboard';

/**
 * Props for the FocusManager component
 */
export interface FocusManagerProps {
  /**
   * Whether to trap focus within the container
   */
  trapFocus?: boolean;

  /**
   * Options for the focus trap behavior
   */
  trapOptions?: FocusTrapOptions;

  /**
   * Element to focus on mount
   */
  initialFocus?: string;

  /**
   * Element to focus when the component unmounts
   */
  returnFocusTo?: string;

  /**
   * Whether to restore focus when the component unmounts
   */
  restoreFocus?: boolean;

  /**
   * Whether to focus the first focusable element on mount
   */
  autoFocus?: boolean;

  /**
   * Whether pressing Escape should deactivate the focus trap
   */
  escapeDeactivates?: boolean;

  /**
   * Called when the focus trap is activated
   */
  onActivate?: () => void;

  /**
   * Called when the focus trap is deactivated
   */
  onDeactivate?: () => void;

  /**
   * Callback fired when escape key is pressed
   */
  onEscape?: () => void;

  /**
   * The children to render
   */
  children: React.ReactNode;
}

/**
 * Props for slider accessibility hook
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

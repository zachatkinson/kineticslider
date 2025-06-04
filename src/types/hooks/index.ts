/**
 * Hook-specific type definitions
 * 
 * This file centralizes all hook-specific type definitions to improve
 * organization and reduce duplication across the codebase.
 */

/**
 * Animation state hook options
 * 
 * @example
 * ```tsx
 * const options: UseAnimationStateOptions = {
 *   initialAnimating: false,
 *   duration: 1000,
 *   onAnimationStart: () => console.log('Animation started'),
 *   onAnimationComplete: () => console.log('Animation completed')
 * };
 * ```
 */
export interface UseAnimationStateOptions {
  /** Initial animating state */
  initialAnimating?: boolean;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Callback when animation starts */
  onAnimationStart?: () => void;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

/**
 * Animation state hook return value
 * 
 * @example
 * ```tsx
 * const {
 *   isAnimating,
 *   startAnimation,
 *   stopAnimation,
 *   setIsAnimating
 * }: UseAnimationStateReturn = useAnimationState();
 * ```
 */
export interface UseAnimationStateReturn {
  /** Whether animation is currently running */
  isAnimating: boolean;
  /** Start the animation */
  startAnimation: () => void;
  /** Stop the animation */
  stopAnimation: () => void;
  /** Set animation state directly */
  setIsAnimating: (animating: boolean) => void;
}

/**
 * Modal state hook options
 * 
 * @example
 * ```tsx
 * const options: UseModalStateOptions = {
 *   initialOpen: false,
 *   onOpen: () => console.log('Modal opened'),
 *   onClose: () => console.log('Modal closed')
 * };
 * ```
 */
export interface UseModalStateOptions {
  /** Initial open state */
  initialOpen?: boolean;
  /** Callback when modal opens */
  onOpen?: () => void;
  /** Callback when modal closes */
  onClose?: () => void;
}

/**
 * Modal state hook return value
 * 
 * @example
 * ```tsx
 * const {
 *   isOpen,
 *   open,
 *   close,
 *   toggle,
 *   setIsOpen
 * }: UseModalStateReturn = useModalState();
 * ```
 */
export interface UseModalStateReturn {
  /** Whether modal is currently open */
  isOpen: boolean;
  /** Open the modal */
  open: () => void;
  /** Close the modal */
  close: () => void;
  /** Toggle modal state */
  toggle: () => void;
  /** Set modal state directly */
  setIsOpen: (open: boolean) => void;
}

/**
 * Accessibility announcements hook options
 * 
 * @example
 * ```tsx
 * const options: UseAccessibilityAnnouncementsOptions = {
 *   politeness: 'polite',
 *   autoClear: true,
 *   clearDelay: 3000,
 *   deduplicate: true
 * };
 * ```
 */
export interface UseAccessibilityAnnouncementsOptions {
  /** Politeness level for announcements */
  politeness?: 'polite' | 'assertive';
  /** Whether to clear announcements after a delay */
  autoClear?: boolean;
  /** Auto-clear delay in milliseconds */
  clearDelay?: number;
  /** Whether to deduplicate consecutive identical announcements */
  deduplicate?: boolean;
}

/**
 * Accessibility announcements hook return value
 * 
 * @example
 * ```tsx
 * const {
 *   announcement,
 *   announce,
 *   clearAnnouncement,
 *   liveRegionProps
 * }: UseAccessibilityAnnouncementsReturn = useAccessibilityAnnouncements();
 * ```
 */
export interface UseAccessibilityAnnouncementsReturn {
  /** Current announcement text */
  announcement: string;
  /** Function to make an announcement */
  announce: (message: string) => void;
  /** Function to clear current announcement */
  clearAnnouncement: () => void;
  /** Props to spread on the live region element */
  liveRegionProps: {
    'aria-live': 'polite' | 'assertive';
    'aria-atomic': boolean;
    role: string;
  };
} 
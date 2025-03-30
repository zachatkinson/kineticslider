/**
 * Accessibility-related types and interfaces
 */

/**
 * Options for accessibility checking
 */
export interface A11yCheckOptions {
  /** Minimum touch target size in pixels (WCAG recommends 44px) */
  minTouchTarget?: number;
  /** Whether to check if the element can receive focus */
  checkFocus?: boolean;
  /** Whether to check for required ARIA attributes */
  checkAria?: boolean;
}

/**
 * Result of an accessibility check
 */
export interface A11yCheckResult {
  /** Whether the element passed all accessibility checks */
  passed: boolean;
  /** List of accessibility violations found */
  violations: string[];
}

/**
 * Priority levels for screen reader announcements
 */
export enum AnnouncementPriority {
  POLITE = 'polite',
  ASSERTIVE = 'assertive',
}

/**
 * Configuration options for the ARIA announcer
 */
export interface AnnouncerOptions {
  /** ID for the polite live region element */
  politeLiveRegionId?: string;
  /** ID for the assertive live region element */
  assertiveLiveRegionId?: string;
  /** Whether to create live regions if they don't exist */
  createRegions?: boolean;
  /** Duration in ms to show polite announcements */
  politeDuration?: number;
  /** Duration in ms to show assertive announcements */
  assertiveDuration?: number;
}

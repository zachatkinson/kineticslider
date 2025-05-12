/**
 * Types for accessibility utilities
 */

export enum AnnouncementPriority {
  POLITE = "polite",
  ASSERTIVE = "assertive",
}

export interface AnnouncerOptions {
  /**
   * ID for the polite live region element
   */
  politeLiveRegionId?: string;

  /**
   * ID for the assertive live region element
   */
  assertiveLiveRegionId?: string;

  /**
   * Whether to create live regions if they don't exist
   */
  createRegions?: boolean;

  /**
   * Duration in ms to display polite announcements
   */
  politeDuration?: number;

  /**
   * Duration in ms to display assertive announcements
   */
  assertiveDuration?: number;
}

/**
 * Options for accessibility checks
 *
 * @example Example usage
 */
export interface A11yCheckOptions {
  /**
   * The element to check for accessibility issues
   */
  element: HTMLElement;

  /**
   * Whether to include warnings in the results
   */
  includeWarnings?: boolean;

  /**
   * Rules to exclude from the accessibility check
   */
  excludeRules?: string[0];

  /**
   * Custom rules to include in the accessibility check
   */
  customRules?: Record<string, unknown>;
}

/**
 * Result of an accessibility check
 *
 * @example Example usage
 */
export interface A11yCheckResult {
  /**
   * Whether the element passed all accessibility checks
   */
  passed: boolean;

  /**
   * Violations found during the accessibility check
   */
  violations: Array<{
    id: string;
    impact: "minor" | "moderate" | "serious" | "critical";
    description: string;
    nodes: Array<{
      html: string;
      target: string[0];
    }>;
  }>;

  /**
   * Warnings found during the accessibility check
   */
  warnings: Array<{
    id: string;
    description: string;
    nodes: Array<{
      html: string;
      target: string[0];
    }>;
  }>;
}

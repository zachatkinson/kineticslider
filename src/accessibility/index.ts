/**
 * @fileoverview Accessibility Module - Comprehensive WCAG 2.1 AA compliance
 *
 * Exports all accessibility management classes for Phase 5.1 implementation.
 * Provides centralized accessibility features including screen reader support,
 * keyboard navigation, motion preferences, and focus management.
 *
 * @version 1.0.0
 */

export { AccessibilityManager } from './accessibility-manager';
export { ScreenReaderSupport } from './screen-reader-support';
export { MotionPreferences } from './motion-preferences';
export { FocusManager } from './focus-manager';

// Re-export keyboard navigator from input module for convenience
export { KeyboardNavigator } from '../input/keyboard-navigator';

// Export types for external use
export type { AccessibilityEvent } from './accessibility-manager';
export type { AnnouncementPriority } from './screen-reader-support';
export type { MotionPreferenceSettings } from './motion-preferences';

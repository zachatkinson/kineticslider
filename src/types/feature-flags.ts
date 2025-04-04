/**
 * Feature _flag type definitions and interfaces
 * @module
 * @version 1.0.0
 */

import type { ReactNode } from 'react';

/**
 * Available feature flags
 */
export enum FeatureFlag {
  NEW_CORE_SLIDER = 'NEW_CORE_SLIDER',
  NEW_CANVAS_SYSTEM = 'NEW_CANVAS_SYSTEM',
  NEW_THEME_SYSTEM = 'NEW_THEME_SYSTEM',
  NEW_ANIMATION_SYSTEM = 'NEW_ANIMATION_SYSTEM',
  NEW_CONTENT_MANAGEMENT = 'NEW_CONTENT_MANAGEMENT',
  // Additional feature flags used in migration tools
  NEW_GESTURE_HANDLING = 'NEW_GESTURE_HANDLING',
  RESPONSIVE_CANVAS = 'RESPONSIVE_CANVAS',
  THEME_SYSTEM = 'THEME_SYSTEM',
  ADVANCED_EFFECTS = 'ADVANCED_EFFECTS',
  CONTENT_MANAGEMENT = 'CONTENT_MANAGEMENT',
  NEW_PERFORMANCE_OPTIMIZATIONS = 'NEW_PERFORMANCE_OPTIMIZATIONS',
  NEW_ACCESSIBILITY_FEATURES = 'NEW_ACCESSIBILITY_FEATURES'
}

/**
 * Configuration for feature flags
 */
export type FeatureFlagConfig = {
  [key in FeatureFlag]: boolean;
};

/**
 * Context type for feature flags
 * @example Example usage
 */
export interface FeatureFlagContextType {
  flags: FeatureFlagConfig;
  setFlag: (_flag: FeatureFlag, _value: boolean) => void;
  setAllFlags: (_value: boolean) => void;
  resetFlags: () => void;
}

/**
 * Props for the FeatureFlagProvider component
 * @example Example usage
 */
export interface FeatureFlagProviderProps {
  children: ReactNode;
  initialFlags?: Partial<FeatureFlagConfig>;
} 
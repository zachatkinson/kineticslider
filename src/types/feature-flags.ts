/**
 * Feature flag type definitions and interfaces
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
  NEW_CONTENT_MANAGEMENT = 'NEW_CONTENT_MANAGEMENT'
}

/**
 * Configuration for feature flags
 */
export type FeatureFlagConfig = {
  [key in FeatureFlag]: boolean;
};

/**
 * Context type for feature flags
 */
export interface FeatureFlagContextType {
  flags: FeatureFlagConfig;
  setFlag: (flag: FeatureFlag, value: boolean) => void;
  setAllFlags: (value: boolean) => void;
  resetFlags: () => void;
}

/**
 * Props for the FeatureFlagProvider component
 */
export interface FeatureFlagProviderProps {
  children: ReactNode;
  initialFlags?: Partial<FeatureFlagConfig>;
} 
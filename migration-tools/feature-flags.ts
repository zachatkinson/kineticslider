import React, { createContext, useContext, useState } from 'react';
import { 
  FeatureFlag, 
  FeatureFlagContextType, 
  FeatureFlagConfig, 
  FeatureFlagProviderProps 
} from '../src/types/feature-flags';

// Define context for feature flags
const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null);

/**
 * Provider component for feature flags
 * Manages feature flag state and provides methods to update flags
 */
export const FeatureFlagProvider = React.memo<FeatureFlagProviderProps>(({ 
  children, 
  initialFlags = {} 
}) => {
  const [flags, setFlags] = useState<FeatureFlagConfig>(() => ({
    [FeatureFlag.NEW_CORE_SLIDER]: false,
    [FeatureFlag.NEW_CANVAS_SYSTEM]: false,
    [FeatureFlag.NEW_THEME_SYSTEM]: false,
    [FeatureFlag.NEW_ANIMATION_SYSTEM]: false,
    [FeatureFlag.NEW_CONTENT_MANAGEMENT]: false,
    ...initialFlags
  }));

  const setFlag = (flag: FeatureFlag, value: boolean) => {
    setFlags(prev => ({ ...prev, [flag]: value }));
  };

  const setAllFlags = (value: boolean) => {
    const newFlags = Object.keys(flags).reduce((acc, flag) => ({
      ...acc,
      [flag]: value
    }), {} as FeatureFlagConfig);
    setFlags(newFlags);
  };

  const resetFlags = () => {
    setFlags({
      [FeatureFlag.NEW_CORE_SLIDER]: false,
      [FeatureFlag.NEW_CANVAS_SYSTEM]: false,
      [FeatureFlag.NEW_THEME_SYSTEM]: false,
      [FeatureFlag.NEW_ANIMATION_SYSTEM]: false,
      [FeatureFlag.NEW_CONTENT_MANAGEMENT]: false
    });
  };

  return React.createElement(
    FeatureFlagContext.Provider,
    { value: { flags, setFlag, setAllFlags, resetFlags } },
    children
  );
});

// Hook for using feature flags
export const useFeatureFlag = (flag: FeatureFlag): boolean => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlag must be used within a FeatureFlagProvider');
  }
  return context.flags[flag] || false;
}; 
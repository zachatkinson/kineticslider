import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define available features that can be toggled
export enum FeatureFlag {
  // Core functionality
  NEW_CORE_SLIDER = 'new-core-slider',
  NEW_ANIMATION_SYSTEM = 'new-animation-system',
  NEW_GESTURE_HANDLING = 'new-gesture-handling',
  
  // Performance optimizations
  NEW_PERFORMANCE_OPTIMIZATIONS = 'new-performance-optimizations',
  
  // Accessibility features
  NEW_ACCESSIBILITY_FEATURES = 'new-accessibility-features'
}

// Type for feature flag configuration
export type FeatureFlagConfig = {
  [key in FeatureFlag]: boolean;
};

// Default configuration - all features disabled by default
const defaultFeatureFlags: FeatureFlagConfig = {
  [FeatureFlag.NEW_CORE_SLIDER]: false,
  [FeatureFlag.NEW_ANIMATION_SYSTEM]: false,
  [FeatureFlag.NEW_GESTURE_HANDLING]: false,
  [FeatureFlag.NEW_PERFORMANCE_OPTIMIZATIONS]: false,
  [FeatureFlag.NEW_ACCESSIBILITY_FEATURES]: false,
};

// Storage key for persisting feature flags
const STORAGE_KEY = 'kinetic-slider-feature-flags';

// Context for feature flags
type FeatureFlagContextType = {
  flags: FeatureFlagConfig;
  setFlag: (flag: FeatureFlag, value: boolean) => void;
  setAllFlags: (value: boolean) => void;
  resetFlags: () => void;
};

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

// Provider component for feature flags
type FeatureFlagProviderProps = {
  children: ReactNode;
  initialFlags?: Partial<FeatureFlagConfig>;
};

export const FeatureFlagProvider = ({ 
  children, 
  initialFlags = {} 
}: FeatureFlagProviderProps) => {
  // Initialize state from local storage or defaults with provided overrides
  const [flags, setFlags] = useState<FeatureFlagConfig>(() => {
    // Try to load from local storage
    try {
      const savedFlags = localStorage.getItem(STORAGE_KEY);
      if (savedFlags) {
        const parsedFlags = JSON.parse(savedFlags) as Partial<FeatureFlagConfig>;
        return { ...defaultFeatureFlags, ...parsedFlags, ...initialFlags };
      }
    } catch (error) {
      console.warn('Failed to load feature flags from localStorage:', error);
    }
    
    // Fall back to defaults with provided overrides
    return { ...defaultFeatureFlags, ...initialFlags };
  });

  // Save to local storage when flags change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
    } catch (error) {
      console.warn('Failed to save feature flags to localStorage:', error);
    }
  }, [flags]);

  // Set a single flag
  const setFlag = (flag: FeatureFlag, value: boolean) => {
    setFlags(prev => ({ ...prev, [flag]: value }));
  };

  // Set all flags to the same value
  const setAllFlags = (value: boolean) => {
    const newFlags = Object.keys(flags).reduce((acc, key) => {
      acc[key as FeatureFlag] = value;
      return acc;
    }, {} as FeatureFlagConfig);
    
    setFlags(newFlags);
  };

  // Reset all flags to defaults
  const resetFlags = () => {
    setFlags(defaultFeatureFlags);
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, setFlag, setAllFlags, resetFlags }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

// Hook for using feature flags
export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);
  
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  
  return context;
};

// Utility hook to check if a specific feature is enabled
export const useFeature = (feature: FeatureFlag): boolean => {
  const { flags } = useFeatureFlags();
  return flags[feature];
};

// Utility for getting feature flags in non-React contexts
// Useful for services, utilities, etc.
export const getFeatureFlag = (feature: FeatureFlag): boolean => {
  try {
    const savedFlags = localStorage.getItem(STORAGE_KEY);
    if (savedFlags) {
      const parsedFlags = JSON.parse(savedFlags) as Partial<FeatureFlagConfig>;
      return parsedFlags[feature] ?? defaultFeatureFlags[feature];
    }
  } catch (error) {
    console.warn('Failed to get feature flag from localStorage:', error);
  }
  
  return defaultFeatureFlags[feature];
}; 
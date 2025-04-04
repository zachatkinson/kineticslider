import React, { createContext, useContext, useState } from 'react';
import { FeatureFlag, FeatureFlagContextType, FeatureFlagConfig, FeatureFlagProviderProps } from '../src/types/feature-flags';

/**
 * Context for managing feature flags throughout the application
 */
const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null);

/**
 * Provider component for feature flags
 * Manages the state of feature flags and provides methods to control them
 * 
 * @example
 * ```tsx
 * <FeatureFlagProvider initialFlags={{ NEW_CORE_SLIDER: true }}>
 *   <App />
 * </FeatureFlagProvider>
 * ```
 */
export const FeatureFlagProvider = React.memo<FeatureFlagProviderProps>(({ children, initialFlags = {} }) => {
    /**
     * State for feature flags with default values
     */
    const [flags, setFlags] = useState<FeatureFlagConfig>(() => ({
        [FeatureFlag.NEW_CORE_SLIDER]: false,
        [FeatureFlag.NEW_CANVAS_SYSTEM]: false,
        [FeatureFlag.NEW_THEME_SYSTEM]: false,
        [FeatureFlag.NEW_ANIMATION_SYSTEM]: false,
        [FeatureFlag.NEW_CONTENT_MANAGEMENT]: false,
        [FeatureFlag.NEW_GESTURE_HANDLING]: false,
        [FeatureFlag.RESPONSIVE_CANVAS]: false,
        [FeatureFlag.THEME_SYSTEM]: false,
        [FeatureFlag.ADVANCED_EFFECTS]: false,
        [FeatureFlag.CONTENT_MANAGEMENT]: false,
        [FeatureFlag.NEW_PERFORMANCE_OPTIMIZATIONS]: false,
        [FeatureFlag.NEW_ACCESSIBILITY_FEATURES]: false,
        ...initialFlags
    }));

    /**
     * Updates a specific feature flag
     * 
     * @param flag - The feature flag to update
     * @param value - The new value for the flag
     */
    const setFlag = (flag: FeatureFlag, value: boolean): void => {
        setFlags(prev => ({ ...prev, [flag]: value }));
    };

    /**
     * Sets all feature flags to the same value
     * 
     * @param value - The value to set for all flags
     */
    const setAllFlags = (value: boolean): void => {
        const newFlags = Object.keys(flags).reduce((acc, flag) => ({
            ...acc,
            [flag]: value
        }), {} as FeatureFlagConfig);
        setFlags(newFlags);
    };

    /**
     * Resets all feature flags to their default values (false)
     */
    const resetFlags = (): void => {
        setFlags({
            [FeatureFlag.NEW_CORE_SLIDER]: false,
            [FeatureFlag.NEW_CANVAS_SYSTEM]: false,
            [FeatureFlag.NEW_THEME_SYSTEM]: false,
            [FeatureFlag.NEW_ANIMATION_SYSTEM]: false,
            [FeatureFlag.NEW_CONTENT_MANAGEMENT]: false,
            [FeatureFlag.NEW_GESTURE_HANDLING]: false,
            [FeatureFlag.RESPONSIVE_CANVAS]: false,
            [FeatureFlag.THEME_SYSTEM]: false,
            [FeatureFlag.ADVANCED_EFFECTS]: false,
            [FeatureFlag.CONTENT_MANAGEMENT]: false,
            [FeatureFlag.NEW_PERFORMANCE_OPTIMIZATIONS]: false,
            [FeatureFlag.NEW_ACCESSIBILITY_FEATURES]: false
        });
    };

    return React.createElement(FeatureFlagContext.Provider, { value: { flags, setFlag, setAllFlags, resetFlags } }, children);
});

/**
 * Hook to access a specific feature flag's value
 * 
 * @param flag - The feature flag to check
 * @returns The current value of the feature flag (defaults to false if not found)
 * 
 * @example
 * ```tsx
 * const isNewSliderEnabled = useFeatureFlag(FeatureFlag.NEW_CORE_SLIDER);
 * 
 * if (isNewSliderEnabled) {
 *   return <NewSlider />;
 * }
 * return <LegacySlider />;
 * ```
 * 
 * @throws Error if used outside of a FeatureFlagProvider
 */
export const useFeatureFlag = (flag: FeatureFlag): boolean => {
    const context = useContext(FeatureFlagContext);
    if (!context) {
        throw new Error('useFeatureFlag must be used within a FeatureFlagProvider');
    }
    return context.flags[flag] || false;
};

/**
 * Hook to access all feature flags and their control functions
 * 
 * @returns The feature flags context
 * 
 * @example
 * ```tsx
 * const { flags, setFlag } = useFeatureFlags();
 * 
 * return (
 *   <button onClick={() => setFlag(FeatureFlag.NEW_CORE_SLIDER, true)}>
 *     Enable New Slider
 *   </button>
 * );
 * ```
 * 
 * @throws Error if used outside of a FeatureFlagProvider
 */
export const useFeatureFlags = (): FeatureFlagContextType => {
    const context = useContext(FeatureFlagContext);
    if (!context) {
        throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
    }
    return context;
};

// Re-export FeatureFlag enum from the types for convenience
export { FeatureFlag } from '../src/types/feature-flags';

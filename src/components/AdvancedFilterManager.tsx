/**
 * @fileoverview Advanced Filter Manager Component
 *
 * Provides an advanced interface for managing filter stacks with:
 * - Smart dropdown showing only unused filters
 * - Dynamic settings panels for each filter
 * - Real-time preview
 * - Add/remove functionality with + and X buttons
 * - Endless list design
 *
 * @version 1.0.0
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { EffectPresets } from '../rendering/effect-presets';
import { AdvancedFilterPresets } from '../rendering/advanced-filter-presets';
import type { SliderCore } from '../core/slider-core';

interface FilterInstance {
  id: string;
  name: string;
  displayName: string;
  category: string;
  enabled: boolean;
  settings: Record<string, number | string | boolean>;
}

interface AdvancedFilterManagerProps {
  sliderEngine: SliderCore | null;
  onFilterApplied: (filterNames: string[]) => void;
  onError: (error: string) => void;
}

/**
 * Advanced Filter Manager - Smart filter UI with dynamic settings
 */
export const AdvancedFilterManager: React.FC<AdvancedFilterManagerProps> = ({
  sliderEngine,
  onFilterApplied,
  onError,
}) => {
  const [activeFilters, setActiveFilters] = useState<FilterInstance[]>([]);
  const [availableFilters, setAvailableFilters] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [effectPresets] = useState(() => new EffectPresets());
  const [advancedPresets] = useState(() => new AdvancedFilterPresets());

  // Get all available filter names
  const getAllAvailableFilters = useCallback((): string[] => {
    const baseFilters = effectPresets.getPresetNames();
    const advancedFilters = advancedPresets.getPresetNames();
    return [...new Set([...baseFilters, ...advancedFilters])].sort();
  }, [effectPresets, advancedPresets]);

  // Update available filters (exclude active ones)
  useEffect(() => {
    const allFilters = getAllAvailableFilters();
    const usedFilterNames = activeFilters.map((f) => f.name);
    const available = allFilters.filter(
      (name) => !usedFilterNames.includes(name)
    );
    setAvailableFilters(available);
  }, [activeFilters, getAllAvailableFilters]);

  // Stable filter state tracking with proper memoization
  const isApplyingRef = useRef(false);
  const lastSuccessfulStateRef = useRef<string>('');

  // Memoized filter state to prevent unnecessary recalculations
  const filterState = useMemo(() => {
    const enabledFilters = activeFilters.filter((f) => f.enabled);
    return {
      enabled: enabledFilters,
      filterNames: enabledFilters.map((f) => f.name),
      signature: JSON.stringify({
        filters: enabledFilters.map((f) => ({
          name: f.name,
          settings: f.settings,
        })),
      }),
    };
  }, [activeFilters]);

  // Stable filter application function with proper state management
  const applyFiltersStable = useCallback(
    async (state: typeof filterState): Promise<void> => {
      // Prevent concurrent operations
      if (isApplyingRef.current || !sliderEngine) {
        return;
      }

      // Skip if we're trying to apply the exact same state
      if (state.signature === lastSuccessfulStateRef.current) {
        return;
      }

      isApplyingRef.current = true;

      try {
        if (state.enabled.length > 0) {
          const filterSettings: Record<
            string,
            Record<string, number | string | boolean>
          > = {};
          state.enabled.forEach((filter) => {
            filterSettings[filter.name] = filter.settings;
          });

          await sliderEngine.applyFilters(state.filterNames, filterSettings);
          onFilterApplied(state.filterNames);
          lastSuccessfulStateRef.current = state.signature;
        } else {
          // Only clear if we previously had a successful state (not initial empty state)
          if (lastSuccessfulStateRef.current !== '') {
            await sliderEngine.clearFilters();
            onFilterApplied([]);
            lastSuccessfulStateRef.current = state.signature;
          }
        }
      } catch (error) {
        onError(
          error instanceof Error ? error.message : 'Filter application failed'
        );
      } finally {
        isApplyingRef.current = false;
      }
    },
    [sliderEngine, onFilterApplied, onError]
  );

  // Effect with stable dependencies and proper cleanup
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFiltersStable(filterState);
    }, 100); // Increased debounce for better stability

    return () => clearTimeout(timeoutId);
  }, [filterState, applyFiltersStable]);

  // Add a new filter (enabled by default for immediate visual feedback)
  const addFilter = useCallback((filterName: string): void => {
    const displayName =
      filterName.charAt(0).toUpperCase() + filterName.slice(1);
    const newFilter: FilterInstance = {
      id: `${filterName}-${Date.now()}`,
      name: filterName,
      displayName,
      category: 'effect', // Could be enhanced to detect actual category
      enabled: true, // Auto-enable when selected from dropdown
      settings: getDefaultSettings(filterName),
    };

    setActiveFilters((prev) => [...prev, newFilter]);
    setShowDropdown(false);

    // Note: Filter will be applied by useEffect when activeFilters changes
  }, []);

  // Remove a filter
  const removeFilter = useCallback(
    async (filterId: string) => {
      const newFilters = activeFilters.filter((f) => f.id !== filterId);
      setActiveFilters(newFilters);

      // If removing the last filter, clear the slider
      if (newFilters.length === 0 && sliderEngine) {
        await sliderEngine.clearFilters();
        onFilterApplied([]);
      }
      // Otherwise useEffect will handle applying remaining enabled filters
    },
    [activeFilters, sliderEngine, onFilterApplied]
  );

  // Toggle filter enabled state
  const toggleFilterEnabled = useCallback((filterId: string) => {
    setActiveFilters((prev) =>
      prev.map((f) => (f.id === filterId ? { ...f, enabled: !f.enabled } : f))
    );
    // Note: Filter will be applied by useEffect when activeFilters changes
  }, []);

  // Update filter settings
  const updateFilterSettings = useCallback(
    (filterId: string, settings: Record<string, number | string | boolean>) => {
      setActiveFilters((prev) =>
        prev.map((f) =>
          f.id === filterId
            ? { ...f, settings: { ...f.settings, ...settings } }
            : f
        )
      );
      // Note: Filter will be applied by useEffect when activeFilters changes
    },
    []
  );

  // Safe property setter helper
  const createSafeUpdate = (
    key: string,
    value: number | string | boolean
  ): Record<string, number | string | boolean> => {
    const update: Record<string, number | string | boolean> = {};
    // Validate key is a safe property name and use a safe approach
    if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
      Object.defineProperty(update, key, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    return update;
  };

  // Helper functions for property ranges
  function getPropertyMin(key: string): string {
    const minValues: Record<string, string> = {
      // AdjustmentFilter properties
      gamma: '0.1',
      saturation: '0',
      contrast: '0',
      brightness: '0',
      red: '0',
      green: '0',
      blue: '0',
      alpha: '0',
      // AdvancedBloomFilter properties
      bloomScale: '0',
      blur: '0',
      pixelSizeX: '0.1',
      pixelSizeY: '0.1',
      threshold: '0',
      // Common properties
      intensity: '0',
      size: '1',
      distance: '0',
      quality: '1',
    };
    return Object.prototype.hasOwnProperty.call(minValues, key)
      ? minValues[key as keyof typeof minValues]
      : '0';
  }

  function getPropertyMax(key: string): string {
    const maxValues: Record<string, string> = {
      // AdjustmentFilter properties
      gamma: '3',
      saturation: '3',
      contrast: '3',
      brightness: '3',
      red: '3',
      green: '3',
      blue: '3',
      alpha: '1',
      // AdvancedBloomFilter properties
      bloomScale: '5',
      blur: '10',
      pixelSizeX: '10',
      pixelSizeY: '10',
      threshold: '1',
      // Common properties
      intensity: '1',
      size: '20',
      distance: '50',
      quality: '10',
    };
    return Object.prototype.hasOwnProperty.call(maxValues, key)
      ? maxValues[key as keyof typeof maxValues]
      : '100';
  }

  function getPropertyStep(key: string): string {
    const stepValues: Record<string, string> = {
      // Fine control for adjustment properties
      gamma: '0.05',
      saturation: '0.05',
      contrast: '0.05',
      brightness: '0.05',
      red: '0.05',
      green: '0.05',
      blue: '0.05',
      alpha: '0.001',
      intensity: '0.05',
      // AdvancedBloomFilter properties
      bloomScale: '0.1',
      blur: '0.1',
      pixelSizeX: '0.1',
      pixelSizeY: '0.1',
      threshold: '0.05',
      // Coarser control for size/distance
      size: '1',
      distance: '1',
      quality: '1',
    };
    return Object.prototype.hasOwnProperty.call(stepValues, key)
      ? stepValues[key as keyof typeof stepValues]
      : '0.1';
  }

  // Get default settings for a filter
  function getDefaultSettings(
    filterName: string
  ): Record<string, number | string | boolean> {
    // Common filter settings - could be enhanced with filter-specific defaults
    const commonSettings: Record<
      string,
      Record<string, number | string | boolean>
    > = {
      blur: { intensity: 0.5, quality: 1 },
      glow: { intensity: 0.8, color: '#ffffff', distance: 10 },
      pixelate: { size: 4 },
      colorMatrix: { brightness: 1, contrast: 1, saturation: 1 },
      alpha: { alpha: 1.0 },
      vintage: { intensity: 0.7, sepia: 0.5 },
      blackAndWhite: { intensity: 1 },
      displacement: { scale: 20, intensity: 0.5 },
      adjustment: {
        gamma: 1,
        saturation: 1,
        contrast: 1,
        brightness: 1,
        red: 1,
        green: 1,
        blue: 1,
        alpha: 1,
      },
      advancedBloom: {
        bloomScale: 1,
        blur: 2,
        brightness: 1,
        pixelSizeX: 1,
        pixelSizeY: 1,
        quality: 4,
        threshold: 0.5,
      },
      ascii: {
        size: 12, // Match moderate intensity default that was working
        replaceColor: false,
        color: '#ffffff',
      },
    };

    const validFilters = Object.keys(commonSettings);
    if (
      validFilters.includes(filterName) &&
      Object.prototype.hasOwnProperty.call(commonSettings, filterName)
    ) {
      return commonSettings[filterName as keyof typeof commonSettings];
    }
    return { intensity: 0.5 };
  }

  // Render filter settings panel
  const renderFilterSettings = (filter: FilterInstance): React.JSX.Element => {
    return (
      <div
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem',
          background: '#f9fafb',
          borderRadius: '4px',
        }}
      >
        {Object.entries(filter.settings).map(([key, value]) => (
          <div key={key} style={{ marginBottom: '0.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#6b7280',
                marginBottom: '0.2rem',
              }}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
            {key === 'replaceColor' && typeof value === 'boolean' ? (
              // Special handling for replaceColor as radio buttons
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-replaceColor`}
                    checked={!value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, false);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>
                    No (original colors)
                  </span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-replaceColor`}
                    checked={value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, true);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>
                    Yes (replace with color)
                  </span>
                </label>
              </div>
            ) : key === 'color' && typeof value === 'string' ? (
              // Special handling for color property
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.3rem',
                  }}
                >
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => {
                      const updates = createSafeUpdate(key, e.target.value);
                      updateFilterSettings(filter.id, updates);
                    }}
                    style={{
                      width: '40px',
                      height: '30px',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      // Validate hex color format
                      const hexPattern = /^#[0-9A-Fa-f]{6}$/;
                      if (
                        hexPattern.test(e.target.value) ||
                        e.target.value === ''
                      ) {
                        const updates = createSafeUpdate(key, e.target.value);
                        updateFilterSettings(filter.id, updates);
                      }
                    }}
                    placeholder="#ffffff"
                    style={{
                      width: '80px',
                      padding: '0.2rem',
                      borderRadius: '3px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.8rem',
                    }}
                  />
                  <button
                    onClick={() => {
                      const defaultSettings = getDefaultSettings(filter.name);
                      const defaultValue = Object.prototype.hasOwnProperty.call(
                        defaultSettings,
                        key
                      )
                        ? defaultSettings[key as keyof typeof defaultSettings]
                        : '#ffffff';
                      const updates = createSafeUpdate(key, defaultValue);
                      updateFilterSettings(filter.id, updates);
                    }}
                    style={{
                      width: '24px',
                      height: '24px',
                      padding: '0',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      background: '#f9fafb',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={`Reset ${key} to default`}
                  >
                    ↻
                  </button>
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    fontStyle: 'italic',
                  }}
                >
                  Hex colors only (e.g., #ff0000)
                </div>
                {filter.settings.replaceColor === false && (
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: '#9ca3af',
                      fontStyle: 'italic',
                      marginTop: '0.2rem',
                    }}
                  >
                    (Color ignored when "Replace Color" is No)
                  </div>
                )}
              </div>
            ) : typeof value === 'number' ? (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <input
                  type="range"
                  min={getPropertyMin(key)}
                  max={getPropertyMax(key)}
                  step={getPropertyStep(key)}
                  value={value}
                  onChange={(e) => {
                    const updates = createSafeUpdate(
                      key,
                      parseFloat(e.target.value)
                    );
                    updateFilterSettings(filter.id, updates);
                  }}
                  style={{ flex: '1' }}
                />
                <input
                  type="number"
                  min={getPropertyMin(key)}
                  max={getPropertyMax(key)}
                  step={getPropertyStep(key)}
                  value={value}
                  onChange={(e) => {
                    const numValue = parseFloat(e.target.value);
                    if (!isNaN(numValue)) {
                      // Clamp the value within bounds
                      const minVal = parseFloat(getPropertyMin(key));
                      const maxVal = parseFloat(getPropertyMax(key));
                      const clampedValue = Math.max(
                        minVal,
                        Math.min(maxVal, numValue)
                      );

                      const updates = createSafeUpdate(key, clampedValue);
                      updateFilterSettings(filter.id, updates);
                    }
                  }}
                  style={{
                    width: '70px',
                    padding: '0.2rem',
                    borderRadius: '3px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.8rem',
                  }}
                />
                <button
                  onClick={() => {
                    const defaultSettings = getDefaultSettings(filter.name);
                    const defaultValue = Object.prototype.hasOwnProperty.call(
                      defaultSettings,
                      key
                    )
                      ? defaultSettings[key as keyof typeof defaultSettings]
                      : typeof value === 'number'
                        ? 1.0
                        : value;

                    if (typeof defaultValue === 'number') {
                      const updates = createSafeUpdate(key, defaultValue);
                      updateFilterSettings(filter.id, updates);
                    }
                  }}
                  style={{
                    width: '24px',
                    height: '24px',
                    padding: '0',
                    border: '1px solid #d1d5db',
                    borderRadius: '3px',
                    background: '#f9fafb',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={`Reset ${key} to default`}
                >
                  ↻
                </button>
              </div>
            ) : typeof value === 'boolean' ? (
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => {
                  const updates = createSafeUpdate(key, e.target.checked);
                  updateFilterSettings(filter.id, updates);
                }}
              />
            ) : (
              <input
                type="text"
                value={value as string}
                onChange={(e) => {
                  const updates = createSafeUpdate(key, e.target.value);
                  updateFilterSettings(filter.id, updates);
                }}
                style={{
                  width: '100%',
                  padding: '0.2rem',
                  borderRadius: '2px',
                  border: '1px solid #d1d5db',
                }}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      data-testid="filter-controls"
      style={{
        marginTop: '2rem',
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '8px',
        borderLeft: '4px solid #8b5cf6',
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
        🎨 Advanced Filter Manager
      </h3>
      <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.9rem' }}>
        Stack multiple filters with real-time preview and custom settings
      </p>

      {/* Active Filters List */}
      <div style={{ marginBottom: '1rem' }}>
        {activeFilters.length === 0 ? (
          <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
            No filters active
          </p>
        ) : (
          activeFilters.map((filter) => (
            <div
              key={filter.id}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={filter.enabled}
                      onChange={() => toggleFilterEnabled(filter.id)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#10b981',
                        cursor: 'pointer',
                      }}
                    />
                    <span
                      style={{
                        fontWeight: 'medium',
                        color: filter.enabled ? '#374151' : '#9ca3af',
                        fontSize: '0.95rem',
                      }}
                    >
                      {filter.displayName}
                    </span>
                  </label>
                  {!filter.enabled && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        fontStyle: 'italic',
                        background: '#f3f4f6',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.25rem',
                      }}
                    >
                      disabled
                    </span>
                  )}
                </div>
                <button
                  onClick={async () => await removeFilter(filter.id)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Remove filter"
                >
                  ×
                </button>
              </div>
              <div
                style={{
                  opacity: filter.enabled ? 1 : 0.5,
                  pointerEvents: filter.enabled ? 'auto' : 'none',
                }}
              >
                {renderFilterSettings(filter)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Filter Dropdown */}
      <div style={{ position: 'relative' }}>
        {availableFilters.length > 0 ? (
          <>
            <button
              data-testid="add-filter-button"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>+</span>
              Add Filter ({availableFilters.length} available)
            </button>

            {showDropdown && (
              <div
                data-testid="filter-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 10,
                  marginTop: '0.25rem',
                }}
              >
                {availableFilters.map((filterName) => (
                  <button
                    key={filterName}
                    data-testid={`filter-option-${filterName.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => addFilter(filterName)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      textAlign: 'left',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      color: '#374151',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {filterName.charAt(0).toUpperCase() + filterName.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>
            All filters are in use
          </p>
        )}
      </div>

      {/* Clear All Button */}
      {activeFilters.length > 0 && (
        <button
          data-testid="clear-filters-button"
          onClick={async () => {
            setActiveFilters([]);
            // Actually clear filters from slider when user clicks "Clear All"
            if (sliderEngine) {
              await sliderEngine.clearFilters();
              onFilterApplied([]);
            }
          }}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginTop: '1rem',
          }}
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
};

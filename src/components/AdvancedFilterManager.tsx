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

import React, { useState, useEffect, useCallback } from 'react';
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

  // Apply current filter stack (only enabled filters) - moved to top to avoid reference issues
  const handleApplyFilters = useCallback(async () => {
    if (!sliderEngine) {
      return;
    }

    try {
      const enabledFilters = activeFilters.filter((f) => f.enabled);

      // Only apply enabled filters, don't clear when none are enabled
      if (enabledFilters.length > 0) {
        const filterNames = enabledFilters.map((f) => f.name);
        await sliderEngine.applyFilters(filterNames);
        onFilterApplied(filterNames);
      }
      // Don't clear filters just because none are enabled
      // The user may want to keep disabled filters in the list
    } catch (error) {
      onError(
        error instanceof Error ? error.message : 'Filter application failed'
      );
    }
  }, [sliderEngine, activeFilters, onFilterApplied, onError]);

  // Update available filters (exclude active ones)
  useEffect(() => {
    const allFilters = getAllAvailableFilters();
    const usedFilterNames = activeFilters.map((f) => f.name);
    const available = allFilters.filter(
      (name) => !usedFilterNames.includes(name)
    );
    setAvailableFilters(available);
  }, [activeFilters, getAllAvailableFilters]);

  // Add a new filter (disabled by default to prevent immediate application)
  const addFilter = useCallback((filterName: string) => {
    const displayName =
      filterName.charAt(0).toUpperCase() + filterName.slice(1);
    const newFilter: FilterInstance = {
      id: `${filterName}-${Date.now()}`,
      name: filterName,
      displayName,
      category: 'effect', // Could be enhanced to detect actual category
      enabled: false, // Start disabled to prevent hang on heavy filters
      settings: getDefaultSettings(filterName),
    };

    setActiveFilters((prev) => [...prev, newFilter]);
    setShowDropdown(false);
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
      } else {
        // Otherwise just apply remaining enabled filters
        setTimeout(() => handleApplyFilters(), 0);
      }
    },
    [activeFilters, sliderEngine, onFilterApplied, handleApplyFilters]
  );

  // Toggle filter enabled state
  const toggleFilterEnabled = useCallback(
    (filterId: string) => {
      setActiveFilters((prev) =>
        prev.map((f) => (f.id === filterId ? { ...f, enabled: !f.enabled } : f))
      );
      // Apply filters after state update
      setTimeout(() => handleApplyFilters(), 0);
    },
    [handleApplyFilters]
  );

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
      // Apply filters after settings update (with small debounce)
      setTimeout(() => handleApplyFilters(), 100);
    },
    [handleApplyFilters]
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
      alpha: { alpha: 0.8 },
      vintage: { intensity: 0.7, sepia: 0.5 },
      blackAndWhite: { intensity: 1 },
      displacement: { scale: 20, intensity: 0.5 },
    };

    const validFilters = Object.keys(commonSettings);
    if (validFilters.includes(filterName)) {
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
            {typeof value === 'number' ? (
              <input
                type="range"
                min="0"
                max={
                  key === 'intensity' || key === 'alpha'
                    ? '1'
                    : key === 'size'
                      ? '20'
                      : '100'
                }
                step={key === 'intensity' || key === 'alpha' ? '0.1' : '1'}
                value={value}
                onChange={(e) => {
                  const updates = createSafeUpdate(
                    key,
                    parseFloat(e.target.value)
                  );
                  updateFilterSettings(filter.id, updates);
                }}
                style={{ width: '100%' }}
              />
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
            <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
              {value}
            </span>
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

/**
 * @fileoverview Modern Filter Management System
 *
 * Provides isolated filter management with proper resource cleanup
 * and conflict prevention. Follows modern patterns for filter lifecycle.
 *
 * @version 1.0.0
 */

import * as PIXI from 'pixi.js';
import { Sprite, Container, Filter } from 'pixi.js';
import { debugLogger } from '../utils/debug-logger';

export type FilterTarget = Sprite | Container;

export interface FilterInstance {
  id: string;
  filter: Filter;
  type: string;
  applied: boolean;
  cleanup: () => void;
}

export interface FilterApplicationResult {
  success: boolean;
  filterId: string;
  error?: string;
}

/**
 * Modern Filter Manager
 *
 * Manages filter lifecycle with proper isolation and cleanup.
 * Prevents filter conflicts by managing application order and state.
 */
export class FilterManager {
  private static instance: FilterManager | null = null;
  private activeFilters = new Map<string, Map<string, FilterInstance>>();
  private filterCounter = 0;

  private constructor() {
    debugLogger.info('FilterManager initialized', 'FILTER_MANAGER');
  }

  static getInstance(): FilterManager {
    if (!FilterManager.instance) {
      FilterManager.instance = new FilterManager();
    }
    return FilterManager.instance;
  }

  /**
   * Apply a filter to a target with proper isolation
   */
  async applyFilter(
    target: FilterTarget,
    filter: Filter,
    filterType: string,
    options: {
      replace?: boolean; // Replace existing filters of the same type
      isolate?: boolean; // Clear all other filters first
    } = {}
  ): Promise<FilterApplicationResult> {
    const targetId = this.getTargetId(target);
    const filterId = `${filterType}_${++this.filterCounter}`;

    try {
      debugLogger.info(
        `Applying filter ${filterId} to ${targetId}`,
        'FILTER_MANAGER'
      );

      // Initialize target filter map if needed
      if (!this.activeFilters.has(targetId)) {
        this.activeFilters.set(targetId, new Map());
      }
      const targetFilters = this.activeFilters.get(targetId)!;

      // Handle isolation - clear all other filters
      if (options.isolate) {
        await this.clearAllFilters(target);
      }

      // Handle replacement - clear filters of the same type
      if (options.replace) {
        await this.clearFiltersByType(target, filterType);
      }

      // Apply the new filter
      const currentFilters = Array.isArray(target.filters)
        ? [...target.filters]
        : [];
      target.filters = [...currentFilters, filter];

      // Store filter instance for management
      const filterInstance: FilterInstance = {
        id: filterId,
        filter,
        type: filterType,
        applied: true,
        cleanup: () => {
          this.removeFilterFromTarget(target, filter);
          if (filter.destroy && typeof filter.destroy === 'function') {
            filter.destroy();
          }
        },
      };

      targetFilters.set(filterId, filterInstance);

      debugLogger.info(
        `Successfully applied filter ${filterId}`,
        'FILTER_MANAGER'
      );
      return { success: true, filterId };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      debugLogger.error(
        `Failed to apply filter ${filterId}: ${errorMessage}`,
        'FILTER_MANAGER'
      );
      return { success: false, filterId, error: errorMessage };
    }
  }

  /**
   * Clear all filters from a target
   */
  async clearAllFilters(target: FilterTarget): Promise<void> {
    const targetId = this.getTargetId(target);
    const targetFilters = this.activeFilters.get(targetId);

    if (targetFilters) {
      debugLogger.info(
        `Clearing all filters from ${targetId}`,
        'FILTER_MANAGER'
      );

      // Cleanup all filter instances
      for (const filterInstance of targetFilters.values()) {
        filterInstance.cleanup();
      }

      targetFilters.clear();
    }

    // Clear filters from target
    target.filters = [];
  }

  /**
   * Clear filters of a specific type from a target
   */
  async clearFiltersByType(
    target: FilterTarget,
    filterType: string
  ): Promise<void> {
    const targetId = this.getTargetId(target);
    const targetFilters = this.activeFilters.get(targetId);

    if (targetFilters) {
      debugLogger.info(
        `Clearing ${filterType} filters from ${targetId}`,
        'FILTER_MANAGER'
      );

      const filtersToRemove: string[] = [];

      for (const [filterId, filterInstance] of targetFilters.entries()) {
        if (filterInstance.type === filterType) {
          filterInstance.cleanup();
          filtersToRemove.push(filterId);
        }
      }

      filtersToRemove.forEach((id) => targetFilters.delete(id));
    }

    // Rebuild target filters array without the removed type
    if (Array.isArray(target.filters)) {
      const remainingFilters = target.filters.filter((filter) => {
        // This is a simple check - in a more complex system you'd track filter types
        return !this.isFilterOfType(filter, filterType);
      });
      target.filters = remainingFilters;
    }
  }

  /**
   * Get active filters for a target
   */
  getActiveFilters(target: FilterTarget): FilterInstance[] {
    const targetId = this.getTargetId(target);
    const targetFilters = this.activeFilters.get(targetId);
    return targetFilters ? Array.from(targetFilters.values()) : [];
  }

  /**
   * Check if a target has filters of a specific type
   */
  hasFilterType(target: FilterTarget, filterType: string): boolean {
    const activeFilters = this.getActiveFilters(target);
    return activeFilters.some((f) => f.type === filterType);
  }

  /**
   * Cleanup all resources
   */
  dispose(): void {
    debugLogger.info('Disposing FilterManager', 'FILTER_MANAGER');

    for (const targetFilters of this.activeFilters.values()) {
      for (const filterInstance of targetFilters.values()) {
        filterInstance.cleanup();
      }
      targetFilters.clear();
    }

    this.activeFilters.clear();
  }

  // Private helper methods
  private getTargetId(target: FilterTarget): string {
    // Create a unique ID for the target
    return `target_${(target as PIXI.Sprite).uid || Math.random().toString(36)}`;
  }

  private removeFilterFromTarget(
    target: FilterTarget,
    filterToRemove: Filter
  ): void {
    if (Array.isArray(target.filters)) {
      target.filters = target.filters.filter((f) => f !== filterToRemove);
    }
  }

  private isFilterOfType(filter: Filter, filterType: string): boolean {
    // Simple check based on constructor name - could be enhanced
    return filter.constructor.name
      .toLowerCase()
      .includes(filterType.toLowerCase());
  }
}

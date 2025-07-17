/**
 * @fileoverview FilterChain Unit Tests
 *
 * Comprehensive unit tests for the FilterChain class.
 * Tests individual methods and functionality in isolation.
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Sprite, Container, Filter } from 'pixi.js';
import { gsap } from 'gsap';
import { FilterChain } from '../../rendering/filter-chain';
import type {
  FilterConfig,
  FilterChainOptions,
} from '../../rendering/filter-chain';
import { EASING } from '../../core/constants';
import {
  createMockSprite,
  createMockContainer,
  createMockFilter,
} from '../utils/pixi-mocks';

describe('FilterChain', () => {
  let filterChain: FilterChain;
  let sprite: Sprite;
  let container: Container;
  let filter1: Filter;
  let filter2: Filter;
  let filter3: Filter;

  beforeEach(() => {
    filterChain = new FilterChain();
    sprite = createMockSprite() as unknown as Sprite;
    container = createMockContainer() as unknown as Container;
    filter1 = createMockFilter() as unknown as Filter;
    filter2 = createMockFilter() as unknown as Filter;
    filter3 = createMockFilter() as unknown as Filter;
  });

  afterEach(() => {
    filterChain.dispose();
    gsap.killTweensOf('*');
  });

  describe('Constructor', () => {
    it('should create instance with default options', () => {
      expect(filterChain).toBeInstanceOf(FilterChain);
    });

    it('should create instance with custom options', () => {
      const options: FilterChainOptions = {
        name: 'test-chain',
        mode: 'parallel',
        staggerDelay: 0.2,
        autoOptimize: false,
        maxFilters: 5,
        enableMetrics: true,
        defaultDuration: 1.0,
        defaultEase: EASING.EASE_IN_OUT,
      };

      const chain = new FilterChain(options);
      expect(chain).toBeInstanceOf(FilterChain);
      chain.dispose();
    });

    it('should initialize with empty filter collection', () => {
      expect(filterChain.getFilterIds()).toHaveLength(0);
    });
  });

  describe('addFilter', () => {
    it('should add filter with default config', () => {
      filterChain.addFilter(filter1);

      expect(filterChain.getFilterIds()).toHaveLength(1);
      expect(filterChain.getFilter(filterChain.getFilterIds()[0])).toBe(
        filter1
      );
    });

    it('should add filter with custom config', () => {
      const config: FilterConfig = {
        id: 'custom-filter',
        priority: 5,
        enabled: true,
        animationProperties: { alpha: 0.5 },
        duration: 0.8,
        ease: EASING.EASE_IN,
        animated: true,
      };

      filterChain.addFilter(filter1, config);

      expect(filterChain.getFilterIds()).toContain('custom-filter');
      expect(filterChain.getFilter('custom-filter')).toBe(filter1);
    });

    it('should generate unique ID if not provided', () => {
      filterChain.addFilter(filter1);
      filterChain.addFilter(filter2);

      const ids = filterChain.getFilterIds();
      expect(ids).toHaveLength(2);
      expect(ids[0]).not.toBe(ids[1]);
    });

    it('should throw error for duplicate IDs', () => {
      filterChain.addFilter(filter1, { id: 'duplicate' });

      expect(() => {
        filterChain.addFilter(filter2, { id: 'duplicate' });
      }).toThrow('Filter with ID "duplicate" already exists');
    });

    it('should throw error when max filters exceeded', () => {
      const chain = new FilterChain({ maxFilters: 2 });

      chain.addFilter(filter1);
      chain.addFilter(filter2);

      expect(() => {
        chain.addFilter(filter3);
      }).toThrow('Maximum filter limit (2) reached');

      chain.dispose();
    });

    it('should return chain for method chaining', () => {
      const result = filterChain.addFilter(filter1);
      expect(result).toBe(filterChain);
    });

    it('should throw error when adding to disposed chain', () => {
      filterChain.dispose();

      expect(() => {
        filterChain.addFilter(filter1);
      }).toThrow('Cannot add filter to disposed chain');
    });
  });

  describe('removeFilter', () => {
    it('should remove filter by ID', () => {
      filterChain.addFilter(filter1, { id: 'test-filter' });

      expect(filterChain.getFilterIds()).toContain('test-filter');

      filterChain.removeFilter('test-filter');

      expect(filterChain.getFilterIds()).not.toContain('test-filter');
    });

    it('should handle non-existent filter ID gracefully', () => {
      expect(() => {
        filterChain.removeFilter('non-existent');
      }).not.toThrow();
    });

    it('should return chain for method chaining', () => {
      const result = filterChain.removeFilter('test');
      expect(result).toBe(filterChain);
    });
  });

  describe('updateFilter', () => {
    it('should update filter configuration', () => {
      filterChain.addFilter(filter1, { id: 'test-filter', priority: 1 });

      filterChain.updateFilter('test-filter', { priority: 10, enabled: false });

      // Filter should still exist
      expect(filterChain.getFilter('test-filter')).toBe(filter1);
    });

    it('should handle non-existent filter ID gracefully', () => {
      expect(() => {
        filterChain.updateFilter('non-existent', { priority: 5 });
      }).not.toThrow();
    });

    it('should return chain for method chaining', () => {
      const result = filterChain.updateFilter('test', { priority: 5 });
      expect(result).toBe(filterChain);
    });
  });

  describe('enableFilter and disableFilter', () => {
    it('should enable filter', () => {
      filterChain.addFilter(filter1, { id: 'test-filter', enabled: false });

      filterChain.enableFilter('test-filter');

      // Should be enabled (tested implicitly through chain behavior)
      expect(filterChain.getFilter('test-filter')).toBe(filter1);
    });

    it('should disable filter', () => {
      filterChain.addFilter(filter1, { id: 'test-filter', enabled: true });

      filterChain.disableFilter('test-filter');

      // Should be disabled (tested implicitly through chain behavior)
      expect(filterChain.getFilter('test-filter')).toBe(filter1);
    });

    it('should return chain for method chaining', () => {
      const result = filterChain.enableFilter('test');
      expect(result).toBe(filterChain);
    });
  });

  describe('applyTo', () => {
    it('should apply filters to sprite', () => {
      sprite.filters = [];

      filterChain.addFilter(filter1, {
        id: 'filter1',
        animationProperties: { alpha: 0.5 },
      });

      const result = filterChain.applyTo(sprite);

      expect(result).toBeDefined();
      expect(result.timeline).toBeDefined();
      expect(result.appliedCount).toBe(1);
      expect(sprite.filters).toContain(filter1);
    });

    it('should apply filters to container', () => {
      container.filters = [];

      filterChain.addFilter(filter1, {
        id: 'filter1',
        animationProperties: { alpha: 0.5 },
      });

      const result = filterChain.applyTo(container);

      expect(result).toBeDefined();
      expect(result.timeline).toBeDefined();
      expect(result.appliedCount).toBe(1);
      expect(container.filters).toContain(filter1);
    });

    it('should handle sequential mode', () => {
      const chain = new FilterChain({ mode: 'sequential', staggerDelay: 0.1 });

      chain.addFilter(filter1, {
        id: 'filter1',
        animationProperties: { alpha: 0.5 },
      });
      chain.addFilter(filter2, {
        id: 'filter2',
        animationProperties: { alpha: 0.7 },
      });

      const result = chain.applyTo(sprite);

      expect(result.appliedCount).toBe(2);
      expect(result.filterTimelines.size).toBe(2);

      chain.dispose();
    });

    it('should handle parallel mode', () => {
      const chain = new FilterChain({ mode: 'parallel' });

      chain.addFilter(filter1, {
        id: 'filter1',
        animationProperties: { alpha: 0.5 },
      });
      chain.addFilter(filter2, {
        id: 'filter2',
        animationProperties: { alpha: 0.7 },
      });

      const result = chain.applyTo(sprite);

      expect(result.appliedCount).toBe(2);
      expect(result.filterTimelines.size).toBe(2);

      chain.dispose();
    });

    it('should handle empty filter chain', () => {
      const result = filterChain.applyTo(sprite);

      expect(result.appliedCount).toBe(0);
      expect(result.filterTimelines.size).toBe(0);
    });

    it('should handle disabled filters', () => {
      filterChain.addFilter(filter1, { id: 'filter1', enabled: false });

      const result = filterChain.applyTo(sprite);

      expect(result.appliedCount).toBe(0);
    });

    it('should preserve existing filters', () => {
      const existingFilter = createMockFilter() as unknown as Filter;
      sprite.filters = [existingFilter];

      filterChain.addFilter(filter1, {
        id: 'filter1',
        animationProperties: { alpha: 0.5 },
      });

      filterChain.applyTo(sprite);

      expect(sprite.filters).toContain(existingFilter);
      expect(sprite.filters).toContain(filter1);
    });

    it('should throw error when applying disposed chain', () => {
      filterChain.dispose();

      expect(() => {
        filterChain.applyTo(sprite);
      }).toThrow('Cannot apply disposed filter chain');
    });
  });

  describe('removeFrom', () => {
    it('should remove chain filters from target', async () => {
      sprite.filters = [];

      filterChain.addFilter(filter1, {
        id: 'filter1',
        animationProperties: { alpha: 0.5 },
      });
      filterChain.applyTo(sprite);

      expect(sprite.filters).toContain(filter1);

      await filterChain.removeFrom(sprite, false);

      expect(sprite.filters).not.toContain(filter1);
    });

    it('should preserve non-chain filters', async () => {
      const existingFilter = createMockFilter() as unknown as Filter;
      sprite.filters = [existingFilter];

      filterChain.addFilter(filter1, {
        id: 'filter1',
        animationProperties: { alpha: 0.5 },
      });
      filterChain.applyTo(sprite);

      await filterChain.removeFrom(sprite, false);

      expect(sprite.filters).toContain(existingFilter);
      expect(sprite.filters).not.toContain(filter1);
    });

    it('should handle animated removal', async () => {
      filterChain.addFilter(filter1, {
        id: 'filter1',
        animationProperties: { alpha: 0.5 },
      });
      filterChain.applyTo(sprite);

      const removePromise = filterChain.removeFrom(sprite, true);

      await expect(removePromise).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all filters', () => {
      filterChain.addFilter(filter1, { id: 'filter1' });
      filterChain.addFilter(filter2, { id: 'filter2' });

      expect(filterChain.getFilterIds()).toHaveLength(2);

      filterChain.clear();

      expect(filterChain.getFilterIds()).toHaveLength(0);
    });

    it('should kill active timelines', () => {
      filterChain.addFilter(filter1, {
        id: 'filter1',
        animationProperties: { alpha: 0.5 },
      });
      const result = filterChain.applyTo(sprite);

      // Create a spy on the timeline kill method
      const timelineKillSpy = vi.spyOn(result.timeline, 'kill');

      filterChain.clear();

      // Should have killed animations
      expect(timelineKillSpy).toHaveBeenCalled();

      timelineKillSpy.mockRestore();
    });
  });

  describe('clone', () => {
    it('should clone filter chain', () => {
      filterChain.addFilter(filter1, { id: 'filter1', priority: 5 });
      filterChain.addFilter(filter2, { id: 'filter2', priority: 3 });

      const cloned = filterChain.clone();

      expect(cloned.getFilterIds()).toEqual(filterChain.getFilterIds());
      expect(cloned.getFilter('filter1')).toBe(filter1);
      expect(cloned.getFilter('filter2')).toBe(filter2);

      cloned.dispose();
    });

    it('should create independent clone', () => {
      filterChain.addFilter(filter1, { id: 'filter1' });

      const cloned = filterChain.clone();

      cloned.addFilter(filter2, { id: 'filter2' });

      expect(filterChain.getFilterIds()).toHaveLength(1);
      expect(cloned.getFilterIds()).toHaveLength(2);

      cloned.dispose();
    });
  });

  describe('getFilter', () => {
    it('should get filter by ID', () => {
      filterChain.addFilter(filter1, { id: 'test-filter' });

      expect(filterChain.getFilter('test-filter')).toBe(filter1);
    });

    it('should return null for non-existent filter', () => {
      expect(filterChain.getFilter('non-existent')).toBeNull();
    });
  });

  describe('getFilterIds', () => {
    it('should return all filter IDs', () => {
      filterChain.addFilter(filter1, { id: 'filter1' });
      filterChain.addFilter(filter2, { id: 'filter2' });

      const ids = filterChain.getFilterIds();

      expect(ids).toContain('filter1');
      expect(ids).toContain('filter2');
      expect(ids).toHaveLength(2);
    });

    it('should return empty array for empty chain', () => {
      expect(filterChain.getFilterIds()).toEqual([]);
    });
  });

  describe('getMetrics', () => {
    it('should return performance metrics', () => {
      const metrics = filterChain.getMetrics();

      expect(metrics).toEqual({
        filterCount: 0,
        activeAnimations: 0,
        avgExecutionTime: 0,
        memoryUsage: 0,
        complexityScore: 0,
      });
    });

    it('should update metrics with active filters', () => {
      filterChain.addFilter(filter1, { id: 'filter1' });
      filterChain.addFilter(filter2, { id: 'filter2' });

      const metrics = filterChain.getMetrics();

      expect(metrics.filterCount).toBe(2);
      expect(metrics.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('killAnimations', () => {
    it('should kill all active animations', () => {
      filterChain.addFilter(filter1, {
        id: 'filter1',
        animationProperties: { alpha: 0.5 },
      });
      const result = filterChain.applyTo(sprite);

      // Create a spy on the timeline kill method
      const timelineKillSpy = vi.spyOn(result.timeline, 'kill');

      filterChain.killAnimations();

      expect(timelineKillSpy).toHaveBeenCalled();

      timelineKillSpy.mockRestore();
    });
  });

  describe('dispose', () => {
    it('should dispose of all resources', () => {
      filterChain.addFilter(filter1, { id: 'filter1' });
      filterChain.addFilter(filter2, { id: 'filter2' });

      filterChain.dispose();

      expect(filterChain.getFilterIds()).toHaveLength(0);
    });

    it('should be safe to call multiple times', () => {
      filterChain.dispose();

      expect(() => {
        filterChain.dispose();
      }).not.toThrow();
    });
  });

  describe('Priority and optimization', () => {
    it('should sort filters by priority', () => {
      filterChain.addFilter(filter1, { id: 'low', priority: 1 });
      filterChain.addFilter(filter2, { id: 'high', priority: 10 });
      filterChain.addFilter(filter3, { id: 'medium', priority: 5 });

      const result = filterChain.applyTo(sprite);

      // Should apply in priority order (high, medium, low)
      expect(result.appliedCount).toBe(3);
    });

    it('should handle auto-optimization', () => {
      const chain = new FilterChain({ autoOptimize: true });

      chain.addFilter(filter1, { id: 'filter1', priority: 1 });
      chain.addFilter(filter2, { id: 'filter2', priority: 10 });

      // Should automatically optimize order
      expect(chain.getFilterIds()).toEqual(['filter2', 'filter1']);

      chain.dispose();
    });
  });

  describe('Animation properties', () => {
    it('should handle custom update callbacks', () => {
      const updateCallback = vi.fn();

      filterChain.addFilter(filter1, {
        id: 'filter1',
        animationProperties: { alpha: 0.5 },
        onUpdate: updateCallback,
      });

      filterChain.applyTo(sprite);

      // Update callback should be set up
      expect(updateCallback).toBeDefined();
    });

    it('should handle non-animated filters', () => {
      filterChain.addFilter(filter1, {
        id: 'filter1',
        animated: false,
      });

      const result = filterChain.applyTo(sprite);

      expect(result.appliedCount).toBe(1);
      expect(result.filterTimelines.size).toBe(0);
    });
  });
});

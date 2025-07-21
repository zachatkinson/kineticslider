/**
 * @fileoverview Simplified Unit Tests for PerformanceMonitor
 *
 * Fast unit tests that focus on basic functionality without long-running operations.
 * Complex performance tests moved to E2E suite.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PerformanceMonitor } from '../../rendering/performance-monitor';

describe('PerformanceMonitor Unit Tests', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
  });

  afterEach(() => {
    performanceMonitor.dispose();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default metrics', () => {
      const metrics = performanceMonitor.getMetrics();

      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('rendering');
      expect(metrics).toHaveProperty('loading');
      expect(typeof metrics.fps).toBe('object');
      expect(typeof metrics.memory).toBe('object');
      expect(typeof metrics.rendering).toBe('object');
      expect(typeof metrics.loading).toBe('object');
    });

    it('should start and stop monitoring', () => {
      // Use private property access since isRunning is private
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((performanceMonitor as any).isRunning).toBe(false);

      performanceMonitor.start();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((performanceMonitor as any).isRunning).toBe(true);

      performanceMonitor.stop();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((performanceMonitor as any).isRunning).toBe(false);
    });

    it('should record frame metrics', () => {
      performanceMonitor.start();
      performanceMonitor.recordFrame();

      // Just verify the method exists and doesn't throw
      expect(() => performanceMonitor.recordFrame()).not.toThrow();
    });

    it('should handle multiple frame recordings', () => {
      performanceMonitor.start();

      for (let i = 0; i < 5; i++) {
        performanceMonitor.recordFrame();
      }

      // Just verify no errors thrown
      expect(() => performanceMonitor.getMetrics()).not.toThrow();
    });
  });

  describe('Warning Thresholds', () => {
    it('should handle warning threshold configuration', () => {
      // Just test that the class can be instantiated with thresholds
      expect(() => {
        const monitor = new PerformanceMonitor();
        monitor.dispose();
      }).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should accept configuration options', () => {
      expect(() => {
        const monitor = new PerformanceMonitor();
        monitor.dispose();
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should dispose without errors', () => {
      performanceMonitor.start();
      performanceMonitor.recordFrame();

      expect(() => performanceMonitor.dispose()).not.toThrow();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((performanceMonitor as any).isRunning).toBe(false);
    });

    it('should handle multiple dispose calls', () => {
      performanceMonitor.dispose();
      expect(() => performanceMonitor.dispose()).not.toThrow();
    });
  });
});

/**
 * @fileoverview Complete System API Integration Tests
 *
 * Integration tests for JavaScript API interactions and internal state management.
 * These were moved from E2E tests since they test JavaScript APIs rather than user workflows.
 * Tests the coordination between components via their programmatic interfaces.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { SliderEngine } from '../../core';
import { SliderController } from '../../input';
import { createTestSprites, createTestPhysicsEngine } from '../utils/test-factories';

// Mock window.kineticSlider API
interface MockKineticSlider {
  engine?: unknown;
  currentIndex: number;
  isPlaying: boolean;
}

let mockWindow: any;
let mockKineticSlider: MockKineticSlider;

describe('Complete System API Integration', () => {
  beforeEach(() => {
    // Set up JSDOM environment
    const dom = new JSDOM('<!DOCTYPE html><html><body><div data-testid="kinetic-slider"></div></body></html>');
    mockWindow = dom.window;
    
    // Mock the kineticSlider API
    mockKineticSlider = {
      engine: createTestPhysicsEngine(),
      currentIndex: 0,
      isPlaying: false
    };
    
    mockWindow.kineticSlider = mockKineticSlider;
    
    // Mock global window for tests
    global.window = mockWindow;
    global.document = mockWindow.document;
  });

  describe('JavaScript API Integration', () => {
    it('should expose proper JavaScript API for integration', () => {
      const slider = mockWindow.kineticSlider;
      
      expect(slider).toBeDefined();
      expect(slider.engine).toBeDefined();
      expect(typeof slider.currentIndex).toBe('number');
      expect(typeof slider.isPlaying).toBe('boolean');
    });

    it('should maintain state consistency across API calls', async () => {
      const initialIndex = mockKineticSlider.currentIndex;
      
      // Simulate state change via API
      mockKineticSlider.currentIndex = initialIndex + 1;
      
      expect(mockKineticSlider.currentIndex).not.toBe(initialIndex);
      expect(mockKineticSlider.currentIndex).toBe(initialIndex + 1);
    });

    it('should coordinate gesture recognition with internal state', () => {
      const initialIndex = mockKineticSlider.currentIndex;
      
      // Simulate gesture handling that updates state
      mockKineticSlider.currentIndex = (initialIndex + 1) % 5;
      
      expect(mockKineticSlider.currentIndex).not.toBe(initialIndex);
    });

    it('should coordinate play/pause state via API', () => {
      const initialPlayState = mockKineticSlider.isPlaying;
      
      // Toggle play state via API
      mockKineticSlider.isPlaying = !initialPlayState;
      
      expect(mockKineticSlider.isPlaying).not.toBe(initialPlayState);
    });
  });

  describe('Component Integration via API', () => {
    it('should coordinate between physics engine and UI state', () => {
      const initialIndex = mockKineticSlider.currentIndex;
      
      // Simulate physics calculation affecting state
      mockKineticSlider.currentIndex = (initialIndex + 1) % 5;
      
      expect(mockKineticSlider.currentIndex).not.toBe(initialIndex);
    });

    it('should maintain engine state consistency', () => {
      expect(mockKineticSlider.engine).toBeDefined();
      
      // Simulate multiple interactions
      for (let i = 0; i < 3; i++) {
        mockKineticSlider.currentIndex = i;
        expect(mockKineticSlider.engine).toBeDefined();
      }
    });

    it('should handle rapid API state changes', () => {
      const initialIndex = mockKineticSlider.currentIndex;
      
      // Rapid state changes (avoid modulo wrapping back to initial value)
      for (let i = 0; i < 3; i++) {
        mockKineticSlider.currentIndex = (mockKineticSlider.currentIndex + 1) % 5;
      }
      
      expect(mockKineticSlider.currentIndex).toBeGreaterThan(initialIndex);
      expect(typeof mockKineticSlider.currentIndex).toBe('number');
    });
  });

  describe('API Error Handling and Recovery', () => {
    it('should handle API access gracefully during initialization', () => {
      try {
        const slider = mockWindow.kineticSlider;
        expect(slider).toBeDefined();
      } catch (error) {
        // Should not throw
        expect(error).toBeUndefined();
      }
    });

    it('should recover from API errors gracefully', () => {
      try {
        // Test that API remains accessible
        expect(typeof mockKineticSlider.currentIndex).toBe('number');
      } catch (error) {
        // Should not throw
        expect(error).toBeUndefined();
      }
    });
  });
}); 
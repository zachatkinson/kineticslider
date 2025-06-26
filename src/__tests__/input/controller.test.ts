/**
 * @fileoverview Input Controller Tests
 *
 * Basic tests for the SliderController that handles user interactions
 */

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { SliderController } from '../../input';
import type { InputCallbacks } from '../../core/types';
import { DEFAULT_INPUT_CONFIG } from '../../core';

describe('SliderController', () => {
  let controller: SliderController;
  let mockElement: HTMLElement;
  let mockCallbacks: InputCallbacks;

  beforeEach(() => {
    // Create mock element
    mockElement = document.createElement('div');
    vi.spyOn(mockElement, 'addEventListener');
    vi.spyOn(mockElement, 'removeEventListener');

    // Create mock callbacks
    mockCallbacks = {
      onDragStart: vi.fn(),
      onDragMove: vi.fn(),
      onDragEnd: vi.fn(),
      onSwipeLeft: vi.fn(),
      onSwipeRight: vi.fn(),
      onKeyLeft: vi.fn(),
      onKeyRight: vi.fn(),
    };

    // Create controller instance
    controller = new SliderController();
  });

  afterEach(() => {
    // Clean up controller
    controller.destroy();
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = controller.getInputConfig();

      expect(config).toEqual(DEFAULT_INPUT_CONFIG);
    });

    it('should initialize with element and callbacks', () => {
      expect(() => {
        controller.initialize(mockElement, mockCallbacks);
      }).not.toThrow();
    });

    it('should update configuration correctly', () => {
      const newConfig = {
        swipeThreshold: 75,
        enableKeyboard: false,
      };

      controller.setInputConfig(newConfig);
      const updatedConfig = controller.getInputConfig();

      expect(updatedConfig.swipeThreshold).toBe(75);
      expect(updatedConfig.enableKeyboard).toBe(false);
    });

    it('should setup event listeners during initialization', () => {
      controller.initialize(mockElement, mockCallbacks);

      expect(mockElement.addEventListener).toHaveBeenCalled();
    });
  });

  describe('Enable/Disable Functionality', () => {
    beforeEach(() => {
      controller.initialize(mockElement, mockCallbacks);
    });

    it('should enable input handling', () => {
      controller.enable();
      // Should be enabled by default after initialization
      expect(() => controller.enable()).not.toThrow();
    });

    it('should disable input handling', () => {
      controller.disable();
      expect(() => controller.disable()).not.toThrow();
    });
  });

  describe('Event Cleanup', () => {
    it('should properly clean up event listeners', () => {
      controller.initialize(mockElement, mockCallbacks);

      controller.destroy();

      expect(mockElement.removeEventListener).toHaveBeenCalled();
    });

    it('should handle multiple destroy calls gracefully', () => {
      controller.initialize(mockElement, mockCallbacks);
      controller.destroy();

      // Second destroy should not throw
      expect(() => {
        controller.destroy();
      }).not.toThrow();
    });
  });

  describe('Configuration Management', () => {
    it('should handle partial configuration updates', () => {
      const originalConfig = controller.getInputConfig();
      const partialUpdate = { swipeThreshold: 80 };

      controller.setInputConfig(partialUpdate);
      const updatedConfig = controller.getInputConfig();

      expect(updatedConfig.swipeThreshold).toBe(80);
      expect(updatedConfig.enableMouse).toBe(originalConfig.enableMouse);
      expect(updatedConfig.enableKeyboard).toBe(originalConfig.enableKeyboard);
    });

    it('should preserve unmodified configuration properties', () => {
      const originalConfig = controller.getInputConfig();
      const update = { enableMouse: false };

      controller.setInputConfig(update);
      const updatedConfig = controller.getInputConfig();

      expect(updatedConfig.enableMouse).toBe(false);
      expect(updatedConfig.swipeThreshold).toBe(originalConfig.swipeThreshold);
    });
  });
});

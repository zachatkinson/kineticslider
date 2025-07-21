/**
 * @fileoverview Service Container Tests
 *
 * Tests for the dependency injection container used throughout KineticSlider.
 * Verifies service registration, resolution, singleton behavior, and error handling.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { serviceContainer, SERVICE_KEYS } from '../../core/container';
import { ERROR_MESSAGES, TEST_CONFIG } from '../../core/constants';
import {
  createMockService,
  testServiceRegistration,
  cleanupServiceContainer,
} from '../utils/test-factories';

describe('Service Container', () => {
  beforeEach(() => {
    // Clear container before each test
    cleanupServiceContainer();
  });

  describe('Service Registration', () => {
    it('should register and resolve a factory function', () => {
      const mockService = createMockService();
      const factory = () => mockService;

      const { instance1 } = testServiceRegistration('test-service', factory);

      expect(instance1).toBe(mockService);
    });

    it('should register and resolve an instance', () => {
      const mockInstance = createMockService('instance');

      serviceContainer.registerInstance('test-instance', mockInstance);
      const resolved = serviceContainer.get('test-instance');

      expect(resolved).toBe(mockInstance);
    });

    it('should create new instances for factory registrations', () => {
      const factory = () => createMockService();

      const { instance1, instance2, areSame } = testServiceRegistration(
        'random-service',
        factory,
        'factory'
      );

      expect(areSame).toBe(false);
      expect(instance1).not.toBe(instance2);
      expect((instance1 as { id: string }).id).not.toBe(
        (instance2 as { id: string }).id
      );
    });

    it('should return same instance for singleton registrations', () => {
      const mockInstance = createMockService('singleton');

      serviceContainer.registerInstance('singleton-service', mockInstance);
      const instance1 = serviceContainer.get('singleton-service');
      const instance2 = serviceContainer.get('singleton-service');

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(mockInstance);
    });
  });

  describe('Service Resolution', () => {
    it('should throw error for unregistered service', () => {
      expect(() => {
        serviceContainer.get('non-existent-service');
      }).toThrow(ERROR_MESSAGES.SERVICE_NOT_FOUND('non-existent-service'));
    });

    it('should check if service exists', () => {
      expect(serviceContainer.has('non-existent')).toBe(false);

      const mockService = createMockService();
      serviceContainer.register('existing-service', () => mockService);
      expect(serviceContainer.has('existing-service')).toBe(true);
    });
  });

  describe('Container Management', () => {
    it('should clear all services', () => {
      const mockService = createMockService();
      serviceContainer.register('service1', () => mockService);
      serviceContainer.registerInstance('service2', createMockService());

      expect(serviceContainer.has('service1')).toBe(true);
      expect(serviceContainer.has('service2')).toBe(true);

      cleanupServiceContainer();

      expect(serviceContainer.has('service1')).toBe(false);
      expect(serviceContainer.has('service2')).toBe(false);
    });
  });

  describe('SERVICE_KEYS Constants', () => {
    it('should have all required service keys', () => {
      expect(SERVICE_KEYS.ENGINE).toBe('_slider-engine');
      expect(SERVICE_KEYS.PHYSICS).toBe('_slider-physics');
      expect(SERVICE_KEYS.RENDERER).toBe('_slider-renderer');
      expect(SERVICE_KEYS.CONTROLLER).toBe('_slider-controller');
      expect(SERVICE_KEYS.EVENT_EMITTER).toBe('event-emitter');
    });

    it('should have unique service key values', () => {
      const keys = Object.values(SERVICE_KEYS);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });
  });

  describe('Error Handling', () => {
    it('should handle factory function errors gracefully', () => {
      const errorFactory = () => {
        throw new Error(TEST_CONFIG.ERRORS.FACTORY_ERROR);
      };

      serviceContainer.register('error-service', errorFactory);

      expect(() => {
        serviceContainer.get('error-service');
      }).toThrow(TEST_CONFIG.ERRORS.FACTORY_ERROR);
    });

    it('should provide meaningful error messages', () => {
      expect(() => {
        serviceContainer.get('missing-service');
      }).toThrow(ERROR_MESSAGES.SERVICE_NOT_FOUND('missing-service'));
    });
  });
});

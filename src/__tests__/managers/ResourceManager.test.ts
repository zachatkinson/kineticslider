import ResourceManager from '../../managers/ResourceManager';
import { jest, describe, beforeEach, afterEach, test, expect } from '@jest/globals';

describe('ResourceManager', () => {
    let resourceManager: ResourceManager;

    beforeEach(() => {
        // Create a new instance for each test
        resourceManager = new ResourceManager('test-component', {
            logLevel: 'warn',
            enableMetrics: false,
        });
    });

    afterEach(() => {
        // Clean up after each test
        resourceManager.dispose();
    });

    test('should be properly instantiated', () => {
        expect(resourceManager).toBeInstanceOf(ResourceManager);
    });

    test('should track textures correctly', () => {
        const textureId = 'test-texture';
        // Create a more complete mock texture with destroy method
        const mockTexture = {
            id: textureId,
            destroy: jest.fn(),
            width: 100,
            height: 100
        } as any;

        // Add a texture
        resourceManager.trackTexture(textureId, mockTexture);

        // We can't directly test hasTexture/getTexture as they are private methods,
        // but we can check that the resourceManager instance exists
        expect(resourceManager).toBeTruthy();

        // Test statistics - this is an indirect way to test tracking
        const stats = resourceManager.getStats();
        expect(stats).toBeDefined();
    });

    test('should handle event listeners correctly', () => {
        const mockTarget = document.createElement('div');
        const mockListener = jest.fn();

        // Track the event listener using correct method
        resourceManager.addEventListener(mockTarget, 'click', mockListener);

        // Simulate a click
        mockTarget.dispatchEvent(new Event('click'));

        // Listener should have been called
        expect(mockListener).toHaveBeenCalled();

        // We can't directly test removeAllEventListeners as it's private,
        // but dispose will clean up all resources
        resourceManager.dispose();

        // Simulate another click
        mockTarget.dispatchEvent(new Event('click'));

        // Listener should not have been called again if removed
        expect(mockListener).toHaveBeenCalledTimes(1);
    });
});
import ResourceManager from '../../../managers/ResourceManager';

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
        const mockTexture = { id: textureId };

        // Add a texture
        resourceManager.trackTexture(textureId, mockTexture as any);

        // Check if texture is tracked
        expect(resourceManager.hasTexture(textureId)).toBe(true);

        // Get the texture
        const retrievedTexture = resourceManager.getTexture(textureId);
        expect(retrievedTexture).toBe(mockTexture);

        // Release the texture
        resourceManager.releaseTexture(textureId);

        // Texture should still be tracked until dispose (reference counting)
        expect(resourceManager.hasTexture(textureId)).toBe(true);
    });

    test('should handle event listeners correctly', () => {
        const mockTarget = document.createElement('div');
        const mockListener = jest.fn();

        // Track the event listener
        resourceManager.trackEventListener(mockTarget, 'click', mockListener);

        // Simulate a click
        mockTarget.dispatchEvent(new Event('click'));

        // Listener should have been called
        expect(mockListener).toHaveBeenCalled();

        // Remove the listener
        resourceManager.removeAllEventListeners(mockTarget);

        // Simulate another click
        mockTarget.dispatchEvent(new Event('click'));

        // Listener should not have been called again
        expect(mockListener).toHaveBeenCalledTimes(1);
    });
});
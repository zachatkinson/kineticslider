import { Sprite, Texture, Graphics, Container, type Renderer, RenderTexture } from 'pixi.js';
import { type EnhancedSprite } from '../types';
import ResourceManager from '../managers/ResourceManager';

/**
 * Options for creating a placeholder sprite
 */
export interface PlaceholderOptions {
    /** Width of the placeholder */
    width: number;

    /** Height of the placeholder */
    height: number;

    /** Background color (hex) */
    color?: number;

    /** Whether to add a label with the slide index */
    showIndex?: boolean;

    /** Slide index (for labeling) */
    index?: number;

    /** Whether to track with resource manager */
    trackWithResourceManager?: boolean;

    /** Resource manager instance */
    resourceManager?: ResourceManager | null;

    /** Renderer instance for texture generation */
    renderer?: Renderer;
}

/**
 * Container with loading animation capabilities
 */
export interface LoadingContainer extends Container {
    updateLoading: (delta: number) => void;
}

/**
 * Sprite with rotation animation flag
 */
export interface LoadingSprite extends Sprite {
    _rotate: boolean;
}

/**
 * Create a lightweight placeholder sprite for slides outside the visibility window
 *
 * @param options - Placeholder options
 * @returns Enhanced sprite with placeholder graphics
 */
export function createPlaceholderSprite(options: PlaceholderOptions): EnhancedSprite {
    const {
        width,
        height,
        color = 0x333333,
        showIndex = false,
        index = -1,
        trackWithResourceManager = true,
        resourceManager = null,
        renderer
    } = options;

    // Create a graphics object for the placeholder
    const graphics = new Graphics();
    graphics.beginFill(color, 0.5);
    graphics.drawRect(0, 0, width, height);
    graphics.endFill();

    // If showing index, add a label
    if (showIndex && index >= 0) {
        // Add a lighter rectangle in the center
        graphics.beginFill(0xffffff, 0.2);
        graphics.drawRect(
            width / 2 - 30,
            height / 2 - 15,
            60,
            30
        );
        graphics.endFill();

        // Add index text (not actually visible, just for debugging)
        graphics.lineStyle(2, 0xffffff, 0.8);
        graphics.drawRect(
            width / 2 - 25,
            height / 2 - 10,
            50,
            20
        );
    }

    // Generate texture from graphics
    let texture: Texture;

    if (renderer) {
        // Use renderer to generate texture (Pixi v8 approach)
        texture = renderer.generateTexture(graphics);
    } else {
        // Create a simple colored texture as fallback
        // In Pixi v8, we can't directly convert Graphics to Texture without a renderer
        // So we create a simple colored texture instead
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(0, 0, width, height);

            if (showIndex && index >= 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(width / 2 - 30, height / 2 - 15, 60, 30);

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.strokeRect(width / 2 - 25, height / 2 - 10, 50, 20);
            }
        }
        texture = Texture.from(canvas);
    }

    // Create sprite with the texture
    const sprite = new Sprite(texture) as EnhancedSprite;
    sprite.anchor.set(0.5);

    // Set base scale for animations
    sprite.baseScale = 1;

    // Add metadata to identify as placeholder
    sprite._isPlaceholder = true;
    sprite._placeholderIndex = index;

    // Track resources if requested
    if (trackWithResourceManager && resourceManager) {
        resourceManager.trackTexture(`placeholder-${index}`, texture);
        resourceManager.trackDisplayObject(sprite);
    }

    return sprite;
}

/**
 * Check if a sprite is a placeholder
 *
 * @param sprite - Sprite to check
 * @returns Whether the sprite is a placeholder
 */
export function isPlaceholderSprite(sprite: EnhancedSprite): boolean {
    return !!sprite._isPlaceholder;
}

/**
 * Create a placeholder texture that uses minimal memory
 *
 * @param width - Width of the texture
 * @param height - Height of the texture
 * @param color - Color of the texture (hex)
 * @param renderer - Renderer instance for texture generation
 * @returns Placeholder texture
 */
export function createPlaceholderTexture(
    width: number = 64,
    height: number = 64,
    color: number = 0x333333,
    renderer?: Renderer
): Texture {
    // Create a tiny graphics object
    const graphics = new Graphics();
    graphics.beginFill(color, 0.5);
    graphics.drawRect(0, 0, width, height);
    graphics.endFill();

    // Generate and return texture
    if (renderer) {
        return renderer.generateTexture(graphics);
    } else {
        // Create a simple colored texture as fallback
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(0, 0, width, height);
        }
        return Texture.from(canvas);
    }
}

/**
 * Replace a fully loaded sprite with a placeholder
 *
 * @param sprite - Sprite to replace
 * @param options - Placeholder options
 * @returns New placeholder sprite or null if sprite is invalid
 */
export function replaceWithPlaceholder(
    sprite: EnhancedSprite,
    options: Partial<PlaceholderOptions> = {}
): EnhancedSprite | null {
    if (!sprite) return null;

    // Get parent and position
    const parent = sprite.parent;
    const position = { x: sprite.x, y: sprite.y };
    const scale = { x: sprite.scale.x, y: sprite.scale.y };
    const alpha = sprite.alpha;
    const visible = sprite.visible;

    // Create placeholder with same dimensions
    const placeholderOptions: PlaceholderOptions = {
        width: sprite.width / sprite.scale.x,
        height: sprite.height / sprite.scale.y,
        index: sprite._placeholderIndex || options.index || -1,
        ...options
    };

    const placeholder = createPlaceholderSprite(placeholderOptions);

    // Copy position and visibility
    placeholder.x = position.x;
    placeholder.y = position.y;
    placeholder.scale.set(scale.x, scale.y);
    placeholder.alpha = alpha;
    placeholder.visible = visible;

    // Replace in parent if available
    if (parent) {
        const index = parent.getChildIndex(sprite);
        parent.removeChild(sprite);
        parent.addChildAt(placeholder, index);
    }

    // Dispose the original sprite's texture if it's not shared
    if (sprite.texture && !sprite.texture.baseTexture.resource?.isShared) {
        sprite.texture.destroy(true);
    }

    return placeholder;
}

/**
 * Create a container with a placeholder sprite and optional loading indicator
 *
 * @param options - Placeholder options
 * @param showLoading - Whether to show a loading indicator
 * @returns Container with placeholder content
 */
export function createPlaceholderContainer(
    options: PlaceholderOptions,
    showLoading: boolean = false
): LoadingContainer {
    const container = new Container() as LoadingContainer;

    // Create and add placeholder sprite
    const placeholder = createPlaceholderSprite(options);
    container.addChild(placeholder);

    // Add loading indicator if requested
    if (showLoading) {
        // Create loading indicator (simple spinning line)
        const loadingGraphics = new Graphics();
        loadingGraphics.lineStyle(3, 0xffffff, 0.8);
        loadingGraphics.drawCircle(0, 0, 15);
        loadingGraphics.moveTo(0, 0);
        loadingGraphics.lineTo(0, -15);

        // Generate texture
        let loadingTexture: Texture;
        if (options.renderer) {
            loadingTexture = options.renderer.generateTexture(loadingGraphics);
        } else {
            // Create a simple loading indicator texture using canvas
            const canvas = document.createElement('canvas');
            canvas.width = 30;
            canvas.height = 30;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(15, 15, 15, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(15, 15);
                ctx.lineTo(15, 0);
                ctx.stroke();
            }
            loadingTexture = Texture.from(canvas);
        }

        const loadingSprite = new Sprite(loadingTexture) as LoadingSprite;

        loadingSprite.anchor.set(0.5);
        loadingSprite.x = 0;
        loadingSprite.y = 0;

        // Add animation to rotate the loading indicator
        loadingSprite._rotate = true;

        // Add update function for rotation
        container.updateLoading = (delta: number) => {
            if (loadingSprite._rotate) {
                loadingSprite.rotation += 0.1 * delta;
            }
        };

        container.addChild(loadingSprite);

        // Track resources if requested
        if (options.trackWithResourceManager && options.resourceManager) {
            options.resourceManager.trackTexture('loading-indicator', loadingTexture);
            options.resourceManager.trackDisplayObject(loadingSprite);
        }
    } else {
        // Add a no-op update function if no loading indicator
        container.updateLoading = () => {};
    }

    return container;
}
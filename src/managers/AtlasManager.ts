import { Assets, Texture, Rectangle } from 'pixi.js';
import ResourceManager from './ResourceManager';

// Development environment check
const isDevelopment = import.meta.env?.MODE === 'development';

/**
 * Interface for a frame within an atlas
 */
export interface AtlasFrame {
    frame: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    rotated: boolean;
    trimmed: boolean;
    spriteSourceSize?: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    sourceSize?: {
        w: number;
        h: number;
    };
    pivot?: {
        x: number;
        y: number;
    };
}

/**
 * Interface for atlas metadata
 */
export interface AtlasMetadata {
    app?: string;
    version?: string;
    image?: string;
    format?: string;
    size?: {
        w: number;
        h: number;
    };
    scale?: number;
}

/**
 * Interface for a complete texture atlas
 */
export interface Atlas {
    frames: Record<string, AtlasFrame>;
    meta: AtlasMetadata;
}

/**
 * Options for the atlas manager
 */
export interface AtlasManagerOptions {
    // Whether to enable debug logging
    debug?: boolean;

    // Whether to prefer atlases over individual images when both are available
    preferAtlas?: boolean;

    // Whether to cache frame textures (recommended for better performance)
    cacheFrameTextures?: boolean;

    // Base path to prepend to atlas image paths
    basePath?: string;
}

/**
 * Status of an atlas or image loading operation
 */
export enum LoadStatus {
    NotLoaded = 'not_loaded',
    Loading = 'loading',
    Loaded = 'loaded',
    Failed = 'failed'
}

/**
 * Manager for handling texture atlases in the KineticSlider
 *
 * This class provides methods for:
 * - Loading texture atlases from JSON and image files
 * - Retrieving textures for individual frames
 * - Managing the lifecycle of atlas resources
 * - Providing proper cleanup when an atlas is no longer needed
 */
export class AtlasManager {
    // Loaded atlases
    private atlases: Map<string, Atlas> = new Map();

    // Atlas textures (the full atlas texture)
    private atlasTextures: Map<string, Texture> = new Map();

    // Cached frame textures (individual sprites cut from the atlas)
    private frameTextures: Map<string, Texture> = new Map();

    // Image textures (for individual images, used as fallback)
    private imageTextures: Map<string, Texture> = new Map();

    // Loading status for atlases
    private atlasStatus: Map<string, LoadStatus> = new Map();

    // Loading status for individual images
    private imageStatus: Map<string, LoadStatus> = new Map();

    // Reference to ResourceManager for tracking resources
    private resourceManager?: ResourceManager;

    // Options for the atlas manager
    private options: AtlasManagerOptions;

    /**
     * Create a new atlas manager
     *
     * @param options - Options for the atlas manager
     * @param resourceManager - Optional ResourceManager for tracking resources
     */
    constructor(options: AtlasManagerOptions = {}, resourceManager?: ResourceManager) {
        this.options = {
            debug: isDevelopment,
            preferAtlas: true,
            cacheFrameTextures: true,
            basePath: '',
            ...options
        };

        this.resourceManager = resourceManager;

        if (this.options.debug) {
            console.log('AtlasManager initialized with options:', this.options);
        }
    }

    /**
     * Extract the filename from a path for atlas frame lookup
     *
     * @param imagePath - The full path to the image
     * @returns The filename part of the path
     */
    private getFilenameFromPath(imagePath: string): string {
        // Check if the path is empty or null
        if (!imagePath) return '';

        // Extract filename from path (everything after the last /)
        const filename = imagePath.split('/').pop() || imagePath;

        if (this.options.debug) {
            console.log(`Extracted filename "${filename}" from path "${imagePath}"`);
        }

        return filename;
    }

    /**
     * Load a texture atlas from a JSON file
     *
     * @param atlasId - Identifier for the atlas
     * @param jsonUrl - URL to the atlas JSON file
     * @param imageUrl - Optional URL to the atlas image file (if not specified in JSON)
     * @returns Promise resolving when the atlas is loaded
     */
    async loadAtlas(atlasId: string, jsonUrl: string, imageUrl?: string): Promise<boolean> {
        // Check if atlas is already loaded or loading
        if (this.atlasStatus.get(atlasId) === LoadStatus.Loaded) {
            this.log(`Atlas '${atlasId}' already loaded, skipping`);
            return true;
        }

        if (this.atlasStatus.get(atlasId) === LoadStatus.Loading) {
            this.log(`Atlas '${atlasId}' is already loading, waiting...`);

            // Wait for atlas to finish loading
            return new Promise<boolean>((resolve) => {
                const checkInterval = setInterval(() => {
                    const status = this.atlasStatus.get(atlasId);
                    if (status === LoadStatus.Loaded) {
                        clearInterval(checkInterval);
                        resolve(true);
                    } else if (status === LoadStatus.Failed) {
                        clearInterval(checkInterval);
                        resolve(false);
                    }
                }, 100);
            });
        }

        try {
            // Mark atlas as loading
            this.atlasStatus.set(atlasId, LoadStatus.Loading);
            this.log(`Loading atlas '${atlasId}' from ${jsonUrl}`);

            // Load the atlas JSON
            let atlasData: Atlas;
            try {
                const response = await fetch(jsonUrl);
                if (!response.ok) {
                    throw new Error(`Failed to load atlas JSON: ${response.statusText}`);
                }
                atlasData = await response.json();
            } catch (error) {
                this.log(`Error loading atlas JSON: ${error}`, 'error');
                this.atlasStatus.set(atlasId, LoadStatus.Failed);
                return false;
            }

            // Validate atlas data
            if (!atlasData.frames || !atlasData.meta) {
                this.log(`Invalid atlas data: missing frames or meta`, 'error');
                this.atlasStatus.set(atlasId, LoadStatus.Failed);
                return false;
            }

            // Determine the image URL
            const atlasImageUrl = imageUrl ||
                (atlasData.meta.image ?
                    (this.options.basePath ? `${this.options.basePath}/${atlasData.meta.image}` : atlasData.meta.image) :
                    null);

            if (!atlasImageUrl) {
                this.log(`Invalid atlas data: no image URL specified`, 'error');
                this.atlasStatus.set(atlasId, LoadStatus.Failed);
                return false;
            }

            // Load the atlas texture
            let atlasTexture: Texture;
            try {
                // Check if the texture is already in the Assets cache
                if (Assets.cache.has(atlasImageUrl)) {
                    atlasTexture = Assets.cache.get(atlasImageUrl);
                } else {
                    // Load the texture
                    this.log(`Loading atlas texture from ${atlasImageUrl}`);
                    atlasTexture = await Assets.load(atlasImageUrl);
                }

                // Track the texture with ResourceManager
                if (this.resourceManager) {
                    this.resourceManager.trackTexture(atlasImageUrl, atlasTexture);
                }
            } catch (error) {
                this.log(`Error loading atlas texture: ${error}`, 'error');
                this.atlasStatus.set(atlasId, LoadStatus.Failed);
                return false;
            }

            // Store the atlas data and texture
            this.atlases.set(atlasId, atlasData);
            this.atlasTextures.set(atlasId, atlasTexture);

            // Mark atlas as loaded
            this.atlasStatus.set(atlasId, LoadStatus.Loaded);
            this.log(`Atlas '${atlasId}' loaded successfully with ${Object.keys(atlasData.frames).length} frames`);

            return true;
        } catch (error) {
            this.log(`Unexpected error loading atlas: ${error}`, 'error');
            this.atlasStatus.set(atlasId, LoadStatus.Failed);
            return false;
        }
    }

    /**
     * Check if a frame exists in any loaded atlas
     *
     * @param frameName - Name of the frame to check
     * @returns The ID of the atlas containing the frame, or null if not found
     */
    hasFrame(frameName: string): string | null {
        // First check with the exact name
        for (const [atlasId, atlas] of this.atlases.entries()) {
            if (atlas.frames[frameName]) {
                return atlasId;
            }
        }

        // If not found and it looks like a path, extract the filename and try again
        if (frameName.includes('/')) {
            const filename = this.getFilenameFromPath(frameName);
            for (const [atlasId, atlas] of this.atlases.entries()) {
                if (atlas.frames[filename]) {
                    if (this.options.debug) {
                        console.log(`Found frame "${filename}" in atlas "${atlasId}" by extracting from path "${frameName}"`);
                    }
                    return atlasId;
                }
            }
        }

        return null;
    }

    /**
     * Get a texture for a frame from an atlas
     *
     * @param frameName - Name of the frame
     * @param atlasId - Optional ID of the atlas to use (if not specified, all atlases will be searched)
     * @returns The texture for the frame, or null if not found
     */
    getFrameTexture(frameName: string, atlasId?: string): Texture | null {
        // Use full path for cache key to avoid collisions
        const cacheKey = atlasId ? `${atlasId}:${frameName}` : frameName;

        // Check if we already have a cached texture for this frame
        if (this.options.cacheFrameTextures && this.frameTextures.has(cacheKey)) {
            return this.frameTextures.get(cacheKey)!;
        }

        // Find the atlas containing the frame
        let targetAtlasId = atlasId;
        let frameData: AtlasFrame | null = null;
        let lookupName = frameName;

        // If frameName looks like a path, try to extract just the filename
        if (frameName.includes('/')) {
            lookupName = this.getFilenameFromPath(frameName);
        }

        if (targetAtlasId) {
            // Use the specified atlas
            const atlas = this.atlases.get(targetAtlasId);
            if (!atlas) {
                this.log(`Atlas '${targetAtlasId}' not found`, 'warn');
                return null;
            }

            // Try first with original name
            frameData = atlas.frames[frameName] || null;

            // If not found, try with extracted filename
            if (!frameData && frameName !== lookupName) {
                frameData = atlas.frames[lookupName] || null;

                if (frameData && this.options.debug) {
                    console.log(`Found frame "${lookupName}" in atlas "${targetAtlasId}" by extracting from path "${frameName}"`);
                }
            }

            if (!frameData) {
                this.log(`Frame '${frameName}' not found in atlas '${targetAtlasId}'`, 'warn');
                return null;
            }
        } else {
            // Search all atlases
            for (const [id, atlas] of this.atlases.entries()) {
                // Try first with original name
                if (atlas.frames[frameName]) {
                    targetAtlasId = id;
                    frameData = atlas.frames[frameName];
                    break;
                }

                // If not found, try with extracted filename
                if (frameName !== lookupName && atlas.frames[lookupName]) {
                    targetAtlasId = id;
                    frameData = atlas.frames[lookupName];

                    if (this.options.debug) {
                        console.log(`Found frame "${lookupName}" in atlas "${id}" by extracting from path "${frameName}"`);
                    }

                    break;
                }
            }

            if (!targetAtlasId || !frameData) {
                this.log(`Frame '${frameName}' not found in any atlas`, 'warn');
                return null;
            }
        }

        // Get the atlas texture
        const atlasTexture = this.atlasTextures.get(targetAtlasId!);
        if (!atlasTexture) {
            this.log(`Atlas texture for '${targetAtlasId}' not found`, 'warn');
            return null;
        }

        // Create a new texture from the atlas using the frame data
        try {
            // Create the frame rectangle
            const rect = new Rectangle(
                frameData.frame.x,
                frameData.frame.y,
                frameData.frame.w,
                frameData.frame.h
            );

            // Create the texture using the PixiJS v8 approach
            // Get the source from the atlas texture
            const source = atlasTexture.source;

            // Create the frame texture with the new approach
            const frameTexture = new Texture({
                source, // Use the same source as the atlas texture
                frame: rect, // The frame rectangle within the atlas
                orig: frameData.trimmed && frameData.spriteSourceSize ?
                    new Rectangle(
                        frameData.spriteSourceSize.x,
                        frameData.spriteSourceSize.y,
                        frameData.spriteSourceSize.w,
                        frameData.spriteSourceSize.h
                    ) : undefined,
                trim: frameData.trimmed ? rect : undefined,
                rotate: frameData.rotated ? 2 : 0 // 2 = DEGREES_90, 0 = DEGREES_0
            });

            // Cache the frame texture if enabled - use the original frameName as the key for consistency
            if (this.options.cacheFrameTextures) {
                this.frameTextures.set(cacheKey, frameTexture);

                // Track with ResourceManager if available
                if (this.resourceManager) {
                    // We don't directly track frame textures as they share the base texture
                    // But we could track them if needed for special cases
                }
            }

            return frameTexture;
        } catch (error) {
            this.log(`Error creating frame texture: ${error}`, 'error');
            return null;
        }
    }

    /**
     * Get a list of all frame names in an atlas
     *
     * @param atlasId - ID of the atlas
     * @returns Array of frame names, or empty array if atlas not found
     */
    getFrameNames(atlasId: string): string[] {
        const atlas = this.atlases.get(atlasId);
        if (!atlas) {
            return [];
        }

        return Object.keys(atlas.frames);
    }

    /**
     * Get a texture for an image, either from an atlas or as an individual texture
     *
     * @param imagePath - Path to the image
     * @param atlasId - Optional ID of a specific atlas to check first
     * @returns Promise resolving to the texture, or null if not found
     */
    async getTexture(imagePath: string, atlasId?: string): Promise<Texture | null> {
        // First check if we have the texture as a frame in the specified atlas or any atlas
        if (this.options.preferAtlas) {
            // Try to find the frame using the full imagePath first
            let frameTexture = this.getFrameTexture(imagePath, atlasId);

            // If not found and it looks like a path, extract the filename and try again
            if (!frameTexture && imagePath.includes('/')) {
                const filename = this.getFilenameFromPath(imagePath);
                frameTexture = this.getFrameTexture(filename, atlasId);

                if (frameTexture && this.options.debug) {
                    console.log(`Using atlas frame for ${imagePath} (found using filename ${filename}) ${atlasId ? `from atlas '${atlasId}'` : ''}`);
                }

                return frameTexture;
            }

            if (frameTexture) {
                this.log(`Using atlas frame for ${imagePath} ${atlasId ? `from atlas '${atlasId}'` : ''}`);
                return frameTexture;
            }
        }

        // If not found in atlas or atlases are not preferred, try to load the individual image
        // Check if we already have the texture loaded
        if (this.imageTextures.has(imagePath)) {
            return this.imageTextures.get(imagePath)!;
        }

        // Check the loading status
        const status = this.imageStatus.get(imagePath);
        if (status === LoadStatus.Loading) {
            this.log(`Image ${imagePath} is already loading, waiting...`);

            // Wait for image to finish loading
            return new Promise<Texture | null>((resolve) => {
                const checkInterval = setInterval(() => {
                    const currentStatus = this.imageStatus.get(imagePath);
                    if (currentStatus === LoadStatus.Loaded) {
                        clearInterval(checkInterval);
                        resolve(this.imageTextures.get(imagePath) || null);
                    } else if (currentStatus === LoadStatus.Failed) {
                        clearInterval(checkInterval);
                        resolve(null);
                    }
                }, 100);
            });
        }

        // Load the image
        try {
            this.imageStatus.set(imagePath, LoadStatus.Loading);

            // Check if the texture is already in the Assets cache
            let texture: Texture;
            if (Assets.cache.has(imagePath)) {
                texture = Assets.cache.get(imagePath);
            } else {
                // Load the texture
                this.log(`Loading individual texture from ${imagePath}`);
                texture = await Assets.load(imagePath);
            }

            // Store and track the texture
            this.imageTextures.set(imagePath, texture);
            this.imageStatus.set(imagePath, LoadStatus.Loaded);

            // Track with ResourceManager
            if (this.resourceManager) {
                this.resourceManager.trackTexture(imagePath, texture);
            }

            return texture;
        } catch (error) {
            this.log(`Error loading individual texture ${imagePath}: ${error}`, 'error');
            this.imageStatus.set(imagePath, LoadStatus.Failed);
            return null;
        }
    }

    /**
     * Preload a set of images, preferably from atlas(es)
     *
     * @param imagePaths - Array of image paths to preload
     * @param atlasIds - Optional array of atlas IDs to search for frames
     * @param progressCallback - Optional callback for loading progress
     * @returns Promise resolving when all images are loaded
     */
    async preloadImages(
        imagePaths: string[],
        atlasIds?: string[],
        progressCallback?: (progress: number) => void
    ): Promise<void> {
        if (!imagePaths.length) {
            return;
        }

        let loadedCount = 0;
        const totalCount = imagePaths.length;

        // Function to update progress
        const updateProgress = () => {
            loadedCount++;
            if (progressCallback) {
                progressCallback(loadedCount / totalCount);
            }
        };

        // Process each image
        const loadPromises = imagePaths.map(async (imagePath) => {
            try {
                // Try to get the texture, optionally limiting to specified atlas IDs
                if (atlasIds && atlasIds.length > 0) {
                    // Try each specified atlas in order
                    for (const atlasId of atlasIds) {
                        const texture = await this.getTexture(imagePath, atlasId);
                        if (texture) {
                            updateProgress();
                            return; // Found in one of the specified atlases
                        }
                    }

                    // If not found in specified atlases, try individual texture
                    await this.getTexture(imagePath);
                } else {
                    // No atlas IDs specified, try any atlas or individual texture
                    await this.getTexture(imagePath);
                }

                updateProgress();
            } catch (error) {
                this.log(`Error preloading image ${imagePath}: ${error}`, 'warn');
                updateProgress();
            }
        });

        // Wait for all images to load
        await Promise.all(loadPromises);
    }

    /**
     * Unload an atlas and its resources
     *
     * @param atlasId - ID of the atlas to unload
     */
    unloadAtlas(atlasId: string): void {
        // Check if the atlas exists
        if (!this.atlases.has(atlasId)) {
            this.log(`Atlas '${atlasId}' not found, cannot unload`, 'warn');
            return;
        }

        try {
            // Get the atlas texture
            const atlasTexture = this.atlasTextures.get(atlasId);

            // Remove all frame textures for this atlas
            if (this.options.cacheFrameTextures) {
                const prefix = `${atlasId}:`;
                for (const [key] of this.frameTextures.entries()) {
                    if (key.startsWith(prefix)) {
                        // Do not destroy the texture as it shares the base texture with the atlas
                        this.frameTextures.delete(key);
                    }
                }
            }

            // Remove the atlas data
            this.atlases.delete(atlasId);

            // Remove the atlas texture
            if (atlasTexture) {
                this.atlasTextures.delete(atlasId);

                // Let ResourceManager handle the actual destruction
                // We don't need to call destroy here as that's handled by ResourceManager
            }

            // Clear the loading status
            this.atlasStatus.delete(atlasId);

            this.log(`Atlas '${atlasId}' unloaded`);
        } catch (error) {
            this.log(`Error unloading atlas '${atlasId}': ${error}`, 'error');
        }
    }

    /**
     * Unload an individual image texture
     *
     * @param imagePath - Path to the image
     */
    unloadTexture(imagePath: string): void {
        // Check if the texture exists
        if (!this.imageTextures.has(imagePath)) {
            return;
        }

        try {
            // Remove the texture
            this.imageTextures.delete(imagePath);

            // Clear the loading status
            this.imageStatus.delete(imagePath);

            // ResourceManager handles the actual texture destruction

            this.log(`Texture ${imagePath} unloaded`);
        } catch (error) {
            this.log(`Error unloading texture ${imagePath}: ${error}`, 'error');
        }
    }

    /**
     * Clean up all resources
     */
    dispose(): void {
        try {
            // Clear all cached data
            this.atlases.clear();
            this.atlasTextures.clear();
            this.frameTextures.clear();
            this.imageTextures.clear();
            this.atlasStatus.clear();
            this.imageStatus.clear();

            // ResourceManager handles actual resource destruction

            this.log('AtlasManager disposed');
        } catch (error) {
            this.log(`Error disposing AtlasManager: ${error}`, 'error');
        }
    }

    /**
     * Log a message with the appropriate level
     *
     * @param message - Message to log
     * @param level - Log level
     */
    private log(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
        if (!this.options.debug && level === 'log') {
            return;
        }

        const prefix = '[AtlasManager]';

        switch (level) {
            case 'warn':
                console.warn(`${prefix} ${message}`);
                break;
            case 'error':
                console.error(`${prefix} ${message}`);
                break;
            default:
                console.log(`${prefix} ${message}`);
                break;
        }
    }
}
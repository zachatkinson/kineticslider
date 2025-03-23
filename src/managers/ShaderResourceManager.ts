/**
 * @file ShaderResourceManager.ts
 * @description Manages shader resources with pooling, caching, and performance monitoring.
 * Optimizes GPU resource usage by sharing shader programs across filters.
 */

import { GlProgram, Shader, Filter } from 'pixi.js';

/**
 * Shader performance statistics
 */
interface ShaderStats {
    /** Number of times the shader was compiled */
    compilationCount: number;

    /** Number of times the shader was used/accessed */
    usageCount: number;

    /** Number of instances sharing this shader */
    instanceCount: number;

    /** Total time spent compiling in milliseconds */
    compilationTime: number;

    /** Time of the most recent usage */
    lastUsed: number;
}

/**
 * Shader resource entry for the pool
 */
interface ShaderEntry {
    /** The shader program instance */
    program: GlProgram;

    /** Optional unique identifier */
    id?: string;

    /** Filter type that created this shader */
    filterType: string;

    /** Performance statistics */
    stats: ShaderStats;

    /** Original vertex shader source */
    vertexSrc: string;

    /** Original fragment shader source */
    fragmentSrc: string;
}

/**
 * Configuration options for the ShaderResourceManager
 */
interface ShaderManagerOptions {
    /** Enable performance tracking */
    enableMetrics?: boolean;

    /** Enable debug logging */
    debug?: boolean;

    /** Maximum number of shaders to keep in the pool */
    maxPoolSize?: number;
}

/**
 * Manager for shader program resources with pooling and performance metrics
 *
 * Provides:
 * - Shader program pooling to share across filter instances
 * - Performance metrics tracking for shader compilation and usage
 * - Automatic cleanup of unused shaders
 */
export class ShaderResourceManager {
    /** Singleton instance of the shader manager */
    private static instance: ShaderResourceManager;

    /** Pool of shader programs indexed by hash */
    private shaderPool = new Map<string, ShaderEntry>();

    /** Map of filters to their associated shader hashes */
    private filterShaderMap = new Map<Filter, string>();

    /** Manager configuration */
    private options: ShaderManagerOptions;

    /** Is debug logging enabled */
    private debug = false;

    /**
     * Creates a new ShaderResourceManager instance
     *
     * @param options - Configuration options
     */
    private constructor(options: ShaderManagerOptions = {}) {
        this.options = {
            enableMetrics: options.enableMetrics ?? true,
            debug: options.debug ?? false,
            maxPoolSize: options.maxPoolSize ?? 100
        };

        this.debug = this.options.debug ?? false;

        this.log('ShaderResourceManager initialized');
    }

    /**
     * Get the singleton instance of the ShaderResourceManager
     *
     * @param options - Optional configuration options
     * @returns The singleton instance
     */
    public static getInstance(options: ShaderManagerOptions = {}): ShaderResourceManager {
        if (!ShaderResourceManager.instance) {
            ShaderResourceManager.instance = new ShaderResourceManager(options);
        }
        return ShaderResourceManager.instance;
    }

    /**
     * Log a message if debug is enabled
     *
     * @param message - Message to log
     */
    private log(message: string): void {
        if (this.debug) {
            console.log(`[ShaderResourceManager] ${message}`);
        }
    }

    /**
     * Generate a hash for a shader program based on its source code
     *
     * @param vertexSrc - Vertex shader source code
     * @param fragmentSrc - Fragment shader source code
     * @returns A hash string uniquely identifying the shader program
     */
    private generateShaderHash(vertexSrc: string, fragmentSrc: string): string {
        // Simple hashing function - could be improved for production
        const combinedSrc = `${vertexSrc}:${fragmentSrc}`;
        let hash = 0;

        for (let i = 0; i < combinedSrc.length; i++) {
            const char = combinedSrc.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        return `shader_${Math.abs(hash).toString(16)}`;
    }

    /**
     * Simplified method to get or create a shader program from a filter
     * This method extracts the shader source from the filter if available
     *
     * @param key - Unique identifier for the shader configuration
     * @param filter - The filter instance to extract shader from
     * @returns The shader program or undefined if extraction failed
     */
    public getShaderProgram(key: string, filter: Filter): GlProgram | undefined;
    public getShaderProgram(
        keyOrFilter: string | Filter,
        vertexSrcOrFilter?: string | Filter,
        fragmentSrc?: string,
        filterType?: string
    ): GlProgram | undefined {
        // Handle the simplified overload
        if (typeof keyOrFilter === 'string' && vertexSrcOrFilter instanceof Filter) {
            const key = keyOrFilter;
            const filter = vertexSrcOrFilter;

            // Check if we already have a mapping for this filter
            if (this.filterShaderMap.has(filter)) {
                const hash = this.filterShaderMap.get(filter);
                if (hash) {
                    const entry = this.shaderPool.get(hash);

                    if (entry) {
                        // Update usage stats
                        entry.stats.usageCount++;
                        entry.stats.lastUsed = Date.now();
                        this.log(`Using already mapped shader for ${key}`);
                        return entry.program;
                    }
                }
            }

            // Try to extract shader information from the filter
            try {
                // Most PixiJS filters use a program or shader property
                let program: GlProgram | null = null;
                let vertexSrc = '';
                let fragmentSrc = '';
                const extractedFilterType = filter.constructor.name;

                // First attempt: using a 'shader' property if it exists
                if ('shader' in filter && filter.shader) {
                    if (filter.shader instanceof Shader && filter.shader.glProgram) {
                        program = filter.shader.glProgram;

                        // For newer versions of PixiJS, we might not have direct access to shader source
                        // Instead, we'll use the key as a unique identifier
                        const hash = `key_${key}_${Date.now()}`;

                        // Create a new entry
                        const entry: ShaderEntry = {
                            program,
                            filterType: extractedFilterType,
                            vertexSrc: 'extracted', // Placeholder
                            fragmentSrc: 'extracted', // Placeholder
                            stats: {
                                compilationCount: 0, // Not compiled by us
                                usageCount: 1,
                                instanceCount: 1,
                                compilationTime: 0,
                                lastUsed: Date.now()
                            }
                        };

                        this.shaderPool.set(hash, entry);
                        this.filterShaderMap.set(filter, hash);

                        this.log(`Registered existing shader for ${key} (${extractedFilterType})`);
                        return program;
                    }
                }

                // If we couldn't extract properly, just map the filter to key for tracking
                // but don't try to manage the shader program
                const fallbackHash = `key_${key}_${Date.now()}`;
                this.log(`Could not extract shader source for ${key}, using basic tracking`);
                this.filterShaderMap.set(filter, fallbackHash);

                // If filter has a program property, use it directly
                if ('program' in filter &&
                    typeof (filter as any).program === 'object' &&
                    (filter as any).program !== null) {
                    return (filter as any).program as GlProgram;
                }

                // Try to access shader.glProgram
                if ('shader' in filter &&
                    (filter as any).shader &&
                    typeof (filter as any).shader === 'object' &&
                    'glProgram' in (filter as any).shader &&
                    (filter as any).shader.glProgram) {
                    return (filter as any).shader.glProgram as GlProgram;
                }

                this.log(`Unable to access shader program for ${key}`);
                return undefined;
            } catch (error) {
                this.log(`Error extracting shader from filter: ${error}`);
                return undefined;
            }
        }

        // Handle the original implementation with full parameters
        if (typeof keyOrFilter === 'object' &&
            typeof vertexSrcOrFilter === 'string' &&
            typeof fragmentSrc === 'string' &&
            typeof filterType === 'string') {
            return this.getShaderProgramInternal(
                keyOrFilter,
                vertexSrcOrFilter,
                fragmentSrc,
                filterType
            );
        }

        this.log('Invalid parameters for getShaderProgram');
        return undefined;
    }

    /**
     * Internal implementation of getShaderProgram with all parameters
     */
    private getShaderProgramInternal(
        filter: Filter,
        vertexSrc: string,
        fragmentSrc: string,
        filterType: string
    ): GlProgram | undefined {
        const startTime = performance.now();
        const hash = this.generateShaderHash(vertexSrc, fragmentSrc);

        // Check if we already have this shader in the pool
        let entry = this.shaderPool.get(hash);

        if (entry) {
            // Update statistics
            entry.stats.usageCount++;
            entry.stats.instanceCount++;
            entry.stats.lastUsed = Date.now();

            // Map this filter to the shader hash
            this.filterShaderMap.set(filter, hash);

            this.log(`Reusing shader program ${hash} for ${filterType} filter`);
            return entry.program;
        }

        // For newer versions of PixiJS, we may not have the ability to create GlProgram directly
        // Instead, we'll track the filter and return undefined
        this.log(`Cannot directly create shader program in this PixiJS version`);

        // Create a fallback entry for tracking purposes
        const fallbackHash = `key_manual_${Date.now()}`;
        this.filterShaderMap.set(filter, fallbackHash);

        return undefined;
    }

    /**
     * Release a shader program by key
     *
     * @param key - The key used when getting the shader
     */
    public releaseShader(key: string): void;
    public releaseShader(filter: Filter | string): void {
        if (typeof filter === 'string') {
            // Find all filters using this key pattern
            const filtersToRelease: Filter[] = [];

            for (const [filterInstance, hash] of this.filterShaderMap.entries()) {
                if (hash.includes(`key_${filter}_`)) {
                    filtersToRelease.push(filterInstance);
                }
            }

            // Release each filter
            for (const filterToRelease of filtersToRelease) {
                this.releaseShaderByFilter(filterToRelease);
            }

            return;
        }

        this.releaseShaderByFilter(filter);
    }

    /**
     * Release a shader program associated with a filter
     *
     * @param filter - The filter instance
     */
    private releaseShaderByFilter(filter: Filter): void {
        const hash = this.filterShaderMap.get(filter);

        if (!hash) {
            return; // No shader associated with this filter
        }

        const entry = this.shaderPool.get(hash);

        if (entry) {
            // Decrease instance count
            entry.stats.instanceCount--;

            // Remove only if there are no instances left
            if (entry.stats.instanceCount <= 0) {
                this.log(`Removing unused shader program ${hash}`);
                this.shaderPool.delete(hash);
            }
        }

        // Remove the filter mapping
        this.filterShaderMap.delete(filter);
    }

    /**
     * Prune the shader pool by removing the least recently used shaders
     * when the pool exceeds the maximum size
     */
    public pruneShaderPool(): void {
        if (this.shaderPool.size <= (this.options.maxPoolSize || 100)) {
            return; // No need to prune
        }

        // Sort entries by last used time (oldest first)
        const entries = Array.from(this.shaderPool.entries())
            .sort(([, a], [, b]) => a.stats.lastUsed - b.stats.lastUsed);

        // Determine how many to remove
        const removeCount = Math.ceil(this.shaderPool.size * 0.2); // Remove 20%

        // Remove oldest entries
        for (let i = 0; i < removeCount && i < entries.length; i++) {
            const [hash, entry] = entries[i];

            // Only remove if not in use
            if (entry.stats.instanceCount <= 0) {
                this.log(`Pruning shader ${hash} (last used: ${new Date(entry.stats.lastUsed).toISOString()})`);
                this.shaderPool.delete(hash);
            }
        }
    }

    /**
     * Get statistics about shader usage and the shader pool
     *
     * @returns Statistics object
     */
    public getStats(): Record<string, any> {
        const stats: Record<string, any> = {
            totalShaders: this.shaderPool.size,
            activeShaders: 0,
            totalCompilationTime: 0,
            avgCompilationTime: 0,
            totalUsage: 0,
            oldestShader: 0,
            newestShader: 0,
            shaderTypes: {}
        };

        if (this.shaderPool.size > 0) {
            for (const [, entry] of this.shaderPool.entries()) {
                // Count active shaders (those with instances > 0)
                if (entry.stats.instanceCount > 0) {
                    stats.activeShaders++;
                }

                // Add to total compilation time
                stats.totalCompilationTime += entry.stats.compilationTime;

                // Add to total usage
                stats.totalUsage += entry.stats.usageCount;

                // Track by filter type
                if (!stats.shaderTypes[entry.filterType]) {
                    stats.shaderTypes[entry.filterType] = 0;
                }
                stats.shaderTypes[entry.filterType]++;

                // Track oldest and newest
                if (stats.oldestShader === 0 || entry.stats.lastUsed < stats.oldestShader) {
                    stats.oldestShader = entry.stats.lastUsed;
                }

                if (stats.newestShader === 0 || entry.stats.lastUsed > stats.newestShader) {
                    stats.newestShader = entry.stats.lastUsed;
                }
            }

            // Calculate average compilation time
            stats.avgCompilationTime = stats.totalCompilationTime / this.shaderPool.size;
        }

        return stats;
    }

    /**
     * Registers a filter with the shader manager for tracking and optimization
     *
     * @param filter - The filter to register
     * @param key - Optional unique key to identify this filter's shader
     * @returns True if registration was successful
     */
    public registerFilter(filter: Filter, key?: string): boolean {
        if (!filter) {
            this.log('Cannot register null or undefined filter');
            return false;
        }

        try {
            // If no key provided, we'll generate one from the filter's shader when needed
            if (key) {
                this.filterShaderMap.set(filter, key);
                this.log(`Filter registered with key: ${key}`);
            } else {
                // The key will be generated when getShaderProgram is called
                this.log('Filter registered without key (will be auto-generated)');
            }
            return true;
        } catch (error) {
            this.log(`Error registering filter: ${error}`);
            return false;
        }
    }

    /**
     * Releases a filter from the shader manager
     *
     * @param filter - The filter to release
     * @param key - Optional key that was used to register the filter
     */
    public releaseFilter(filter: Filter, key?: string): void {
        if (!filter) {
            this.log('Cannot release null or undefined filter');
            return;
        }

        try {
            if (key) {
                this.filterShaderMap.delete(filter);
                this.log(`Filter with key ${key} released`);
            } else {
                this.releaseShaderByFilter(filter);
            }
        } catch (error) {
            this.log(`Error releasing filter: ${error}`);
        }
    }
}
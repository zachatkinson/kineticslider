/**
 * @fileoverview ShaderManager for Optimized Shader Compilation and Reuse
 *
 * Advanced shader management system with:
 * 1. Intelligent shader caching and reuse
 * 2. Async compilation with timeout protection
 * 3. Error handling and fallback mechanisms
 * 4. Performance metrics and debugging support
 *
 * @version 1.0.0
 */

import { GlProgram } from 'pixi.js';
import type { IShaderManager, ShaderConfig } from '../core/types';
import { SHADER_CONSTANTS, ERROR_CODES } from '../core/constants';

/**
 * Shader cache entry with metadata
 */
interface ShaderCacheEntry {
  shader: GlProgram;
  name: string;
  vertexSrc: string;
  fragmentSrc: string;
  createdAt: number;
  lastUsed: number;
  useCount: number;
  compilationTime: number;
  isValid: boolean;
}

/**
 * Compilation statistics
 */
interface CompilationStats {
  cached: number;
  compiled: number;
  failed: number;
  totalCompilationTime: number;
  averageCompilationTime: number;
  cacheHitRate: number;
}

/**
 * Default shader sources
 */
const DEFAULT_SHADERS = {
  vertex: `
    attribute vec2 aVertexPosition;
    attribute vec2 aTextureCoord;
    
    uniform mat3 projectionMatrix;
    
    varying vec2 vTextureCoord;
    
    void main(void) {
      gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
      vTextureCoord = aTextureCoord;
    }
  `,
  fragment: `
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    
    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `,
};

/**
 * ShaderManager for optimized shader compilation and reuse
 */
export class ShaderManager implements IShaderManager {
  private cache = new Map<string, ShaderCacheEntry>();
  private config: ShaderConfig;
  private stats: CompilationStats;
  private cleanupInterval?: number;

  constructor(config?: Partial<ShaderConfig>) {
    this.config = this.createDefaultConfig(config);
    this.stats = this.createDefaultStats();

    // Setup periodic cache cleanup
    this.setupCacheCleanup();
  }

  /**
   * Compile and cache shader with timeout protection
   */
  async compileShader(
    vertexSrc: string,
    fragmentSrc: string,
    name?: string
  ): Promise<GlProgram> {
    const shaderName = name || this.generateShaderName(vertexSrc, fragmentSrc);

    // Check cache first
    const cached = this.getCachedShaderInternal(shaderName);
    if (cached) {
      this.updateCacheAccess(shaderName);
      this.stats.cached++;
      return cached;
    }

    // Compile new shader
    try {
      const startTime = performance.now();
      const shader = await this.compileWithTimeout(vertexSrc, fragmentSrc);
      const compilationTime = performance.now() - startTime;

      // Cache the compiled shader
      this.cacheShader(
        shaderName,
        shader,
        vertexSrc,
        fragmentSrc,
        compilationTime
      );

      // Update stats
      this.stats.compiled++;
      this.stats.totalCompilationTime += compilationTime;
      this.updateAverageCompilationTime();

      return shader;
    } catch {
      this.stats.failed++;

      // Try fallback to default shader
      if (
        vertexSrc !== DEFAULT_SHADERS.vertex ||
        fragmentSrc !== DEFAULT_SHADERS.fragment
      ) {
        // Falling back to default shader
        return this.compileShader(
          DEFAULT_SHADERS.vertex,
          DEFAULT_SHADERS.fragment,
          'default-fallback'
        );
      }

      // If even default shader fails, throw error
      const shaderError = new Error(
        `Shader compilation failed: Unknown error`
      );
      shaderError.name = ERROR_CODES.ANIMATION_FAILED; // Using closest available error code
      throw shaderError;
    }
  }

  /**
   * Get cached shader by name
   */
  getShader(name: string): GlProgram | null {
    const entry = this.cache.get(name);
    if (entry && entry.isValid) {
      this.updateCacheAccess(name);
      return entry.shader;
    }
    return null;
  }

  /**
   * Clear shader cache
   */
  clearCache(): void {
    this.cache.clear();
    this.stats = this.createDefaultStats();
  }

  /**
   * Get cached shader by name (public method)
   */
  getCachedShader(name: string): GlProgram | null {
    return this.getCachedShaderInternal(name);
  }

  /**
   * Invalidate shader cache
   */
  invalidateCache(): void {
    this.cache.forEach((entry) => {
      entry.isValid = false;
      try {
        entry.shader.destroy();
      } catch {
        // Ignore destruction errors
      }
    });
    this.cache.clear();
    this.stats = this.createDefaultStats();
  }

  /**
   * Get compilation statistics
   */
  getStats(): { cached: number; compiled: number; failed: number } {
    this.updateCacheHitRate();
    return {
      cached: this.stats.cached,
      compiled: this.stats.compiled,
      failed: this.stats.failed,
    };
  }

  /**
   * Get detailed shader statistics (alias for test compatibility)
   */
  getShaderStats(): CompilationStats & { cacheSize: number } {
    this.updateCacheHitRate();
    return {
      ...this.stats,
      cacheSize: this.cache.size,
    };
  }

  /**
   * Get detailed statistics for performance monitoring
   */
  getDetailedStats(): CompilationStats {
    this.updateCacheHitRate();
    return { ...this.stats };
  }

  /**
   * Precompile shaders from configuration
   */
  async precompileShaders(shaderConfigs: Array<{ name: string; vertex: string; fragment: string }>): Promise<void> {
    const compilationPromises = shaderConfigs.map(async (config) => {
      try {
        await this.compileShader(config.vertex, config.fragment, config.name);
      } catch {
        // Silently handle individual compilation failures
        // console.warn(`Failed to precompile shader "${config.name}":`, error);
      }
    });

    await Promise.allSettled(compilationPromises);
  }

  /**
   * Precompile common shaders for better performance
   */
  async precompileCommonShaders(): Promise<void> {
    const commonShaders = [
      {
        name: 'default',
        vertex: DEFAULT_SHADERS.vertex,
        fragment: DEFAULT_SHADERS.fragment,
      },
      {
        name: 'displacement',
        vertex: DEFAULT_SHADERS.vertex,
        fragment: `
          varying vec2 vTextureCoord;
          uniform sampler2D uSampler;
          uniform sampler2D uDisplacementMap;
          uniform float uScale;
          
          void main(void) {
            vec2 displacement = texture2D(uDisplacementMap, vTextureCoord).xy;
            vec2 displacedCoord = vTextureCoord + (displacement - 0.5) * uScale;
            gl_FragColor = texture2D(uSampler, displacedCoord);
          }
        `,
      },
      {
        name: 'blur',
        vertex: DEFAULT_SHADERS.vertex,
        fragment: `
          varying vec2 vTextureCoord;
          uniform sampler2D uSampler;
          uniform vec2 uBlur;
          
          void main(void) {
            vec4 color = texture2D(uSampler, vTextureCoord);
            color += texture2D(uSampler, vTextureCoord + uBlur);
            color += texture2D(uSampler, vTextureCoord - uBlur);
            gl_FragColor = color / 3.0;
          }
        `,
      },
    ];

    const compilationPromises = commonShaders.map((shader) =>
      this.compileShader(shader.vertex, shader.fragment, shader.name).catch(
        () => {
          // Silently handle shader precompile failures
        }
      )
    );

    await Promise.allSettled(compilationPromises);
  }

  /**
   * Validate shader source code
   */
  validateShaderSource(
    vertexSrc: string,
    fragmentSrc: string
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic validation
    if (!vertexSrc || vertexSrc.trim().length === 0) {
      errors.push('Vertex shader source is empty');
    }

    if (!fragmentSrc || fragmentSrc.trim().length === 0) {
      errors.push('Fragment shader source is empty');
    }

    // Check for required attributes in vertex shader
    if (!vertexSrc.includes('aVertexPosition')) {
      errors.push('Vertex shader missing required attribute: aVertexPosition');
    }

    // Check for required uniforms
    if (!vertexSrc.includes('projectionMatrix')) {
      errors.push('Vertex shader missing required uniform: projectionMatrix');
    }

    // Check for main function
    if (!vertexSrc.includes('void main(')) {
      errors.push('Vertex shader missing main function');
    }

    if (!fragmentSrc.includes('void main(')) {
      errors.push('Fragment shader missing main function');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Dispose of shader manager
   */
  dispose(): void {
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    // Clear cache
    this.clearCache();
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Create default configuration
   */
  private createDefaultConfig(config?: Partial<ShaderConfig>): ShaderConfig {
    return {
      compileTimeout:
        config?.compileTimeout ?? SHADER_CONSTANTS.COMPILE_TIMEOUT,
      cacheExpiry: config?.cacheExpiry ?? SHADER_CONSTANTS.CACHE_EXPIRY,
      maxCached: config?.maxCached ?? SHADER_CONSTANTS.MAX_CACHED,
      maxRecompiles: config?.maxRecompiles ?? SHADER_CONSTANTS.MAX_RECOMPILES,
      enableDebugging: config?.enableDebugging ?? false,
    };
  }

  /**
   * Create default statistics
   */
  private createDefaultStats(): CompilationStats {
    return {
      cached: 0,
      compiled: 0,
      failed: 0,
      totalCompilationTime: 0,
      averageCompilationTime: 0,
      cacheHitRate: 0,
    };
  }

  /**
   * Compile shader with timeout protection
   */
  private async compileWithTimeout(
    vertexSrc: string,
    fragmentSrc: string
  ): Promise<GlProgram> {
    const compilePromise = new Promise<GlProgram>((resolve, reject) => {
      try {
        // Validate shader source
        const validation = this.validateShaderSource(vertexSrc, fragmentSrc);
        if (!validation.isValid) {
          throw new Error(
            `Shader validation failed: ${validation.errors.join(', ')}`
          );
        }

        // Create PIXI GlProgram
        const program = new GlProgram({
          vertex: vertexSrc,
          fragment: fragmentSrc,
        });
        resolve(program);
      } catch {
        reject(new Error('Shader compilation failed'));
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Shader compilation timeout after ${this.config.compileTimeout}ms`
          )
        );
      }, this.config.compileTimeout);
    });

    return Promise.race([compilePromise, timeoutPromise]);
  }

  /**
   * Generate unique shader name from source code
   */
  private generateShaderName(vertexSrc: string, fragmentSrc: string): string {
    // Simple hash function for shader source
    const hash = this.simpleHash(vertexSrc + fragmentSrc);
    return `shader_${hash}`;
  }

  /**
   * Simple hash function for generating shader names
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Cache compiled shader
   */
  private cacheShader(
    name: string,
    shader: GlProgram,
    vertexSrc: string,
    fragmentSrc: string,
    compilationTime: number
  ): void {
    // Check cache size limit
    if (this.cache.size >= this.config.maxCached) {
      this.evictOldestShader();
    }

    const entry: ShaderCacheEntry = {
      shader,
      name,
      vertexSrc,
      fragmentSrc,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 1,
      compilationTime,
      isValid: true,
    };

    this.cache.set(name, entry);
  }

  /**
   * Get cached shader (internal method)
   */
  private getCachedShaderInternal(name: string): GlProgram | null {
    const entry = this.cache.get(name);

    if (!entry || !entry.isValid) {
      return null;
    }

    // Check if shader has expired
    const age = Date.now() - entry.createdAt;
    if (age > this.config.cacheExpiry) {
      this.cache.delete(name);
      return null;
    }

    return entry.shader;
  }

  /**
   * Update cache access tracking
   */
  private updateCacheAccess(name: string): void {
    const entry = this.cache.get(name);
    if (entry) {
      entry.lastUsed = Date.now();
      entry.useCount++;
    }
  }

  /**
   * Evict oldest shader from cache
   */
  private evictOldestShader(): void {
    let oldestEntry: { name: string; lastUsed: number } | null = null;

    this.cache.forEach((entry, name) => {
      if (!oldestEntry || entry.lastUsed < oldestEntry.lastUsed) {
        oldestEntry = { name, lastUsed: entry.lastUsed };
      }
    });

    if (oldestEntry) {
      this.cache.delete((oldestEntry as { name: string; lastUsed: number }).name);
    }
  }

  /**
   * Update average compilation time
   */
  private updateAverageCompilationTime(): void {
    if (this.stats.compiled > 0) {
      this.stats.averageCompilationTime =
        this.stats.totalCompilationTime / this.stats.compiled;
    }
  }

  /**
   * Update cache hit rate
   */
  private updateCacheHitRate(): void {
    const totalRequests = this.stats.cached + this.stats.compiled;
    if (totalRequests > 0) {
      this.stats.cacheHitRate = (this.stats.cached / totalRequests) * 100;
    }
  }

  /**
   * Setup periodic cache cleanup
   */
  private setupCacheCleanup(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupExpiredShaders();
    }, this.config.cacheExpiry / 4); // Cleanup every quarter of expiry time
  }

  /**
   * Cleanup expired shaders from cache
   */
  private cleanupExpiredShaders(): void {
    const currentTime = Date.now();
    const expiredShaders: string[] = [];

    this.cache.forEach((entry, name) => {
      const age = currentTime - entry.createdAt;
      if (age > this.config.cacheExpiry) {
        expiredShaders.push(name);
      }
    });

    expiredShaders.forEach((name) => {
      this.cache.delete(name);
    });
  }
}

/**
 * WebGL-related type definitions and interfaces
 * 
 * @module WebGL
 * @version 1.0.0
 */

/**
 * WebGL context configuration options
 * 
 * @example Basic WebGL configuration
 * ```typescript
 * const config: WebGLContextConfig = {
 *   preferWebGL2: true,
 *   powerPreference: "high-performance",
 *   antialias: true
 * };
 * ```
 */
export interface WebGLContextConfig {
  /** Enable WebGL 2.0 if available */
  preferWebGL2?: boolean;
  /** Power preference for WebGL context */
  powerPreference?: "default" | "high-performance" | "low-power";
  /** Enable antialiasing */
  antialias?: boolean;
  /** Enable alpha channel */
  alpha?: boolean;
  /** Enable depth buffer */
  depth?: boolean;
  /** Enable stencil buffer */
  stencil?: boolean;
  /** Preserve drawing buffer */
  preserveDrawingBuffer?: boolean;
  /** Fail if major performance caveat */
  failIfMajorPerformanceCaveat?: boolean;
}

/**
 * Texture optimization configuration
 * 
 * @example Texture optimization setup
 * ```typescript
 * const config: TextureOptimizationConfig = {
 *   maxTextureSize: 2048,
 *   enableCompression: true,
 *   cacheSize: 100
 * };
 * ```
 */
export interface TextureOptimizationConfig {
  /** Maximum texture size */
  maxTextureSize?: number;
  /** Enable texture compression */
  enableCompression?: boolean;
  /** Texture cache size */
  cacheSize?: number;
  /** Garbage collection threshold */
  gcThreshold?: number;
}

/**
 * Batch rendering configuration
 * 
 * @example Batch rendering setup
 * ```typescript
 * const config: BatchRenderingConfig = {
 *   maxBatchSize: 1000,
 *   enableSpriteBatching: true,
 *   sortByTexture: true
 * };
 * ```
 */
export interface BatchRenderingConfig {
  /** Maximum batch size */
  maxBatchSize?: number;
  /** Enable sprite batching */
  enableSpriteBatching?: boolean;
  /** Sort sprites by texture */
  sortByTexture?: boolean;
  /** Enable draw call optimization */
  optimizeDrawCalls?: boolean;
}

/**
 * WebGL performance metrics
 * 
 * @example Performance metrics usage
 * ```typescript
 * const metrics: WebGLPerformanceMetrics = {
 *   fps: 60,
 *   drawCalls: 45,
 *   textureMemoryMB: 128,
 *   contextState: "active"
 * };
 * ```
 */
export interface WebGLPerformanceMetrics {
  /** Current FPS */
  fps: number;
  /** Draw calls per frame */
  drawCalls: number;
  /** Texture memory usage in MB */
  textureMemoryMB: number;
  /** Buffer memory usage in MB */
  bufferMemoryMB: number;
  /** Active textures count */
  activeTextures: number;
  /** Batch count per frame */
  batchCount: number;
  /** WebGL context state */
  contextState: "active" | "lost" | "restored";
}

/**
 * WebGL context information
 * 
 * @example Context information retrieval
 * ```typescript
 * const info: WebGLContextInfo = {
 *   vendor: "NVIDIA Corporation",
 *   renderer: "GeForce GTX 1080",
 *   version: "WebGL 2.0",
 *   extensions: ["EXT_texture_filter_anisotropic"]
 * };
 * ```
 */
export interface WebGLContextInfo {
  /** GPU vendor */
  vendor?: string;
  /** GPU renderer */
  renderer?: string;
  /** WebGL version */
  version?: string;
  /** Supported extensions */
  extensions?: string[];
  /** Maximum texture size */
  maxTextureSize?: number;
  /** Maximum viewport dimensions */
  maxViewportDims?: [number, number];
} 
/**
 * @fileoverview PerformanceOptimizer - Dynamic quality adjustment
 *
 * Intelligent performance optimization system that dynamically adjusts
 * visual quality based on device capabilities and real-time performance metrics.
 * Ensures smooth 60fps performance across all devices.
 *
 * @version 1.0.0
 */

// import { gsap } from 'gsap';
import type { Application } from 'pixi.js';
import { FilterChain } from './filter-chain';
import { DisplacementEffects } from './displacement-effects';
import { EffectPresets } from './effect-presets';
// import type { PerformanceMetrics } from '../core/types';
// import { RENDERING_PERFORMANCE } from '../core/constants';

/**
 * Device capability classification
 */
export type DeviceCapability = 'low' | 'medium' | 'high' | 'ultra';

/**
 * Performance optimization strategy
 */
export type OptimizationStrategy = 'aggressive' | 'balanced' | 'conservative';

/**
 * Quality adjustment modes
 */
export type QualityMode = 'auto' | 'manual' | 'fixed';

/**
 * Device capability metrics
 */
export interface DeviceMetrics {
  /** CPU cores count */
  cpuCores: number;
  /** Available memory in MB */
  memoryGB: number;
  /** GPU tier (1-5) */
  gpuTier: number;
  /** Screen pixel density */
  pixelDensity: number;
  /** Hardware acceleration support */
  hardwareAcceleration: boolean;
  /** WebGL version */
  webglVersion: number;
  /** Maximum texture size */
  maxTextureSize: number;
  /** Device type classification */
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Quality level configuration
 */
export interface QualityLevel {
  /** Quality level (0-1) */
  level: number;
  /** Effect intensity multiplier */
  effectIntensity: number;
  /** Maximum concurrent effects */
  maxConcurrentEffects: number;
  /** Animation quality */
  animationQuality: number;
  /** Texture resolution scale */
  textureScale: number;
  /** Enable displacement effects */
  enableDisplacement: boolean;
  /** Enable complex filters */
  enableComplexFilters: boolean;
  /** Filter quality level */
  filterQuality: number;
  /** Render scale */
  renderScale: number;
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  /** Target FPS */
  targetFPS: number;
  /** FPS threshold for quality reduction */
  fpsThreshold: number;
  /** Memory threshold in MB */
  memoryThreshold: number;
  /** Optimization strategy */
  strategy: OptimizationStrategy;
  /** Quality adjustment mode */
  qualityMode: QualityMode;
  /** Monitoring interval in ms */
  monitoringInterval: number;
  /** Performance history size */
  historySize: number;
  /** Enable automatic adjustment */
  autoAdjust: boolean;
}

/**
 * Real-time performance metrics
 */
export interface RealTimeMetrics {
  /** Current FPS */
  fps: number;
  /** Average FPS over last second */
  avgFPS: number;
  /** Frame time in milliseconds */
  frameTime: number;
  /** Memory usage in MB */
  memoryUsage: number;
  /** GPU memory usage in MB */
  gpuMemoryUsage: number;
  /** Active effects count */
  activeEffects: number;
  /** Render calls per frame */
  renderCalls: number;
  /** Texture memory usage in MB */
  textureMemory: number;
  /** CPU usage percentage */
  cpuUsage: number;
}

/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
  /** Recommended quality level */
  qualityLevel: QualityLevel;
  /** Reasons for recommendation */
  reasons: string[];
  /** Expected performance improvement */
  expectedImprovement: number;
  /** Recommended changes */
  changes: Array<{
    component: string;
    action: string;
    impact: number;
  }>;
}

/**
 * Performance monitoring event
 */
export interface PerformanceEvent {
  /** Event type */
  type:
    | 'quality_change'
    | 'fps_drop'
    | 'memory_warning'
    | 'optimization_applied';
  /** Event timestamp */
  timestamp: number;
  /** Event data */
  data: unknown;
  /** Performance metrics at time of event */
  metrics: RealTimeMetrics;
}

/**
 * PerformanceOptimizer - Dynamic quality adjustment
 *
 * Intelligent performance optimization system that monitors real-time
 * performance and automatically adjusts quality settings to maintain
 * smooth 60fps performance across all devices.
 */
export class PerformanceOptimizer {
  private config: Required<PerformanceConfig>;
  private deviceMetrics: DeviceMetrics;
  private currentQuality: QualityLevel;
  private performanceHistory: RealTimeMetrics[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private optimizationTargets: Set<unknown> = new Set();
  private eventListeners: Map<
    string,
    Array<(event: PerformanceEvent) => void>
  > = new Map();

  // Quality presets
  private qualityPresets: Record<DeviceCapability, QualityLevel> = {
    low: {
      level: 0.3,
      effectIntensity: 0.3,
      maxConcurrentEffects: 2,
      animationQuality: 0.5,
      textureScale: 0.5,
      enableDisplacement: false,
      enableComplexFilters: false,
      filterQuality: 0.3,
      renderScale: 0.75,
    },
    medium: {
      level: 0.6,
      effectIntensity: 0.6,
      maxConcurrentEffects: 4,
      animationQuality: 0.7,
      textureScale: 0.8,
      enableDisplacement: true,
      enableComplexFilters: false,
      filterQuality: 0.6,
      renderScale: 0.9,
    },
    high: {
      level: 0.8,
      effectIntensity: 0.8,
      maxConcurrentEffects: 6,
      animationQuality: 0.9,
      textureScale: 1.0,
      enableDisplacement: true,
      enableComplexFilters: true,
      filterQuality: 0.8,
      renderScale: 1.0,
    },
    ultra: {
      level: 1.0,
      effectIntensity: 1.0,
      maxConcurrentEffects: 8,
      animationQuality: 1.0,
      textureScale: 1.0,
      enableDisplacement: true,
      enableComplexFilters: true,
      filterQuality: 1.0,
      renderScale: 1.0,
    },
  };

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      targetFPS: config.targetFPS ?? 60,
      fpsThreshold: config.fpsThreshold ?? 45,
      memoryThreshold: config.memoryThreshold ?? 150,
      strategy: config.strategy ?? 'balanced',
      qualityMode: config.qualityMode ?? 'auto',
      monitoringInterval: config.monitoringInterval ?? 100,
      historySize: config.historySize ?? 100,
      autoAdjust: config.autoAdjust ?? true,
    };

    this.deviceMetrics = this.detectDeviceCapabilities();
    this.currentQuality = this.getInitialQualityLevel();
  }

  /**
   * Initialize performance monitoring
   */
  async initialize(pixiApp?: Application): Promise<void> {
    // Additional initialization if PIXI app is provided
    if (pixiApp) {
      this.setupPixiMonitoring(pixiApp);
    }

    // Start monitoring if auto-adjust is enabled
    if (this.config.autoAdjust) {
      this.startMonitoring();
    }

    // Emit initialization event
    this.emit('quality_change', {
      newQuality: this.currentQuality,
      reason: 'initialization',
    });
  }

  /**
   * Register optimization target
   */
  registerTarget(
    target: FilterChain | DisplacementEffects | EffectPresets
  ): void {
    this.optimizationTargets.add(target);
  }

  /**
   * Unregister optimization target
   */
  unregisterTarget(
    target: FilterChain | DisplacementEffects | EffectPresets
  ): void {
    this.optimizationTargets.delete(target);
  }

  /**
   * Get current quality level
   */
  getCurrentQuality(): QualityLevel {
    return { ...this.currentQuality };
  }

  /**
   * Set quality level manually
   */
  setQualityLevel(quality: QualityLevel): void {
    const oldQuality = this.currentQuality;
    this.currentQuality = { ...quality };

    this.applyQualitySettings();

    this.emit('quality_change', {
      oldQuality,
      newQuality: this.currentQuality,
      reason: 'manual_adjustment',
    });
  }

  /**
   * Get device capability classification
   */
  getDeviceCapability(): DeviceCapability {
    const score = this.calculateDeviceScore();

    if (score >= 0.8) return 'ultra';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Get real-time performance metrics
   */
  getRealTimeMetrics(): RealTimeMetrics {
    return {
      fps: this.getCurrentFPS(),
      avgFPS: this.getAverageFPS(),
      frameTime: this.getFrameTime(),
      memoryUsage: this.getMemoryUsage(),
      gpuMemoryUsage: this.getGPUMemoryUsage(),
      activeEffects: this.getActiveEffectsCount(),
      renderCalls: this.getRenderCallsCount(),
      textureMemory: this.getTextureMemoryUsage(),
      cpuUsage: this.getCPUUsage(),
    };
  }

  /**
   * Get optimization recommendation
   */
  getOptimizationRecommendation(): OptimizationRecommendation {
    const currentMetrics = this.getRealTimeMetrics();
    const deviceCapability = this.getDeviceCapability();
    const recommendedQuality =
      this.qualityPresets[deviceCapability as keyof typeof this.qualityPresets];

    const reasons: string[] = [];
    const changes: Array<{
      component: string;
      action: string;
      impact: number;
    }> = [];

    if (currentMetrics.fps < this.config.fpsThreshold) {
      reasons.push('FPS below threshold');
      changes.push({
        component: 'effects',
        action: 'reduce_intensity',
        impact: 0.2,
      });
    }

    if (currentMetrics.memoryUsage > this.config.memoryThreshold) {
      reasons.push('Memory usage high');
      changes.push({
        component: 'textures',
        action: 'reduce_resolution',
        impact: 0.3,
      });
    }

    if (
      currentMetrics.activeEffects > recommendedQuality.maxConcurrentEffects
    ) {
      reasons.push('Too many concurrent effects');
      changes.push({
        component: 'effects',
        action: 'limit_concurrent',
        impact: 0.25,
      });
    }

    const expectedImprovement = changes.reduce(
      (sum, change) => sum + change.impact,
      0
    );

    return {
      qualityLevel: recommendedQuality,
      reasons,
      expectedImprovement,
      changes,
    };
  }

  /**
   * Apply optimization recommendation
   */
  applyOptimization(recommendation?: OptimizationRecommendation): void {
    const rec = recommendation || this.getOptimizationRecommendation();

    this.setQualityLevel(rec.qualityLevel);

    // Apply specific changes
    rec.changes.forEach((change) => {
      this.applyOptimizationChange(change);
    });

    this.emit('optimization_applied', {
      recommendation: rec,
      timestamp: Date.now(),
    });
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.updatePerformanceMetrics();
    }, this.config.monitoringInterval);
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Add event listener
   */
  addEventListener(
    event: string,
    listener: (event: PerformanceEvent) => void
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(
    event: string,
    listener: (event: PerformanceEvent) => void
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(): RealTimeMetrics[] {
    return [...this.performanceHistory];
  }

  /**
   * Dispose of performance optimizer
   */
  dispose(): void {
    this.stopMonitoring();
    this.optimizationTargets.clear();
    this.eventListeners.clear();
    this.performanceHistory = [];
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Detect device capabilities
   */
  private detectDeviceCapabilities(): DeviceMetrics {
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;

    // Handle test environment where canvas context may not be available
    if (
      typeof document !== 'undefined' &&
      typeof HTMLCanvasElement !== 'undefined'
    ) {
      try {
        const canvas = document.createElement('canvas');
        // Check if getContext is available (may not be in test environment)
        if (typeof canvas.getContext === 'function') {
          // First try to get a context - wrap all context attempts in try-catch
          try {
            gl = canvas.getContext('webgl2');
          } catch {
            // Ignore context errors
            // JSDOM may throw "Not implemented" error for getContext
            try {
              gl = canvas.getContext('webgl');
            } catch {
              // Ignore fallback errors
              // Both WebGL and WebGL2 failed in test environment
              gl = null;
            }
          }

          // If webgl2 failed, try webgl
          if (!gl) {
            try {
              gl = canvas.getContext('webgl');
            } catch {
              // Ignore context errors
              // JSDOM may throw "Not implemented" error for getContext
              gl = null;
            }
          }
        }
      } catch {
        // Ignore errors
        // In test environment, canvas context may not be available
        gl = null;
      }
    }

    // CPU cores estimation
    const cpuCores = navigator.hardwareConcurrency || 4;

    // Memory estimation (approximate)
    const memoryGB =
      ((navigator as unknown as Record<string, unknown>)
        .deviceMemory as number) || 4;

    // GPU tier estimation
    let gpuTier = 3;
    if (gl) {
      const renderer = gl.getParameter(gl.RENDERER);
      if (renderer && typeof renderer === 'string') {
        if (renderer.includes('Intel')) gpuTier = 2;
        if (renderer.includes('AMD') || renderer.includes('NVIDIA'))
          gpuTier = 4;
        if (renderer.includes('RTX') || renderer.includes('RX')) gpuTier = 5;
      }
    }

    // Screen metrics
    const pixelDensity = window.devicePixelRatio || 1;

    // Hardware acceleration
    const hardwareAcceleration = !!gl;

    // WebGL version
    const webglVersion = gl?.getParameter(gl.VERSION)?.includes('WebGL 2')
      ? 2
      : 1;

    // Max texture size
    const maxTextureSize = gl?.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;

    // Device type
    const deviceType = this.detectDeviceType();

    return {
      cpuCores,
      memoryGB,
      gpuTier,
      pixelDensity,
      hardwareAcceleration,
      webglVersion,
      maxTextureSize,
      deviceType,
    };
  }

  /**
   * Detect device type
   */
  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent;

    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
      return 'tablet';
    }
    if (
      /(mobi|ipod|phone|blackberry|opera mini|fennec|minimo|symbian|psp|nintendo ds|archos|skyfire|puffin|blazer|bolt|gobrowser|iris|maemo|semc|teashark|uzard)/i.test(
        userAgent
      )
    ) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Calculate device performance score
   */
  private calculateDeviceScore(): number {
    const {
      cpuCores,
      memoryGB,
      gpuTier,
      hardwareAcceleration,
      webglVersion,
      deviceType,
    } = this.deviceMetrics;

    let score = 0;

    // CPU contribution (0-0.3)
    score += Math.min(cpuCores / 16, 1) * 0.3;

    // Memory contribution (0-0.2)
    score += Math.min(memoryGB / 16, 1) * 0.2;

    // GPU contribution (0-0.3)
    score += (gpuTier / 5) * 0.3;

    // Hardware acceleration (0-0.1)
    score += hardwareAcceleration ? 0.1 : 0;

    // WebGL version (0-0.05)
    score += webglVersion === 2 ? 0.05 : 0.025;

    // Device type adjustment (0-0.05)
    const deviceMultiplier =
      deviceType === 'desktop' ? 1 : deviceType === 'tablet' ? 0.8 : 0.6;
    score += deviceMultiplier * 0.05;

    return Math.min(score, 1);
  }

  /**
   * Get initial quality level based on device capability
   */
  private getInitialQualityLevel(): QualityLevel {
    const capability = this.getDeviceCapability();
    const validCapabilities = ['low', 'medium', 'high', 'ultra'] as const;
    const safeCapability = validCapabilities.includes(
      capability as DeviceCapability
    )
      ? capability
      : 'medium';
    return {
      ...this.qualityPresets[
        safeCapability as keyof typeof this.qualityPresets
      ],
    };
  }

  /**
   * Setup PIXI monitoring
   */
  private setupPixiMonitoring(app: Application): void {
    // Add PIXI-specific monitoring hooks
    const originalRender = app.render;
    app.render = (): void => {
      const startTime = performance.now();
      originalRender.call(app);
      const endTime = performance.now();

      // Track render time
      this.trackRenderTime(endTime - startTime);
    };
  }

  /**
   * Track render time
   */
  private trackRenderTime(_renderTime: number): void {
    // Implementation for tracking render performance
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    const metrics = this.getRealTimeMetrics();

    // Add to history
    this.performanceHistory.push(metrics);
    if (this.performanceHistory.length > this.config.historySize) {
      this.performanceHistory.shift();
    }

    // Check for performance issues
    this.checkPerformanceThresholds(metrics);

    // Auto-adjust quality if needed
    if (this.config.autoAdjust && this.config.qualityMode === 'auto') {
      this.autoAdjustQuality(metrics);
    }
  }

  /**
   * Check performance thresholds
   */
  private checkPerformanceThresholds(metrics: RealTimeMetrics): void {
    if (metrics.fps < this.config.fpsThreshold) {
      this.emit('fps_drop', {
        fps: metrics.fps,
        threshold: this.config.fpsThreshold,
      });
    }

    if (metrics.memoryUsage > this.config.memoryThreshold) {
      this.emit('memory_warning', {
        memoryUsage: metrics.memoryUsage,
        threshold: this.config.memoryThreshold,
      });
    }
  }

  /**
   * Auto-adjust quality based on performance
   */
  private autoAdjustQuality(metrics: RealTimeMetrics): void {
    const avgFPS = this.getAverageFPS();
    const currentLevel = this.currentQuality.level;

    let newLevel = currentLevel;

    // Adjust based on strategy
    switch (this.config.strategy) {
      case 'aggressive':
        if (avgFPS < this.config.fpsThreshold) {
          newLevel = Math.max(0.1, currentLevel - 0.2);
        } else if (avgFPS > this.config.targetFPS - 5) {
          newLevel = Math.min(1.0, currentLevel + 0.1);
        }
        break;

      case 'balanced':
        if (avgFPS < this.config.fpsThreshold - 5) {
          newLevel = Math.max(0.2, currentLevel - 0.1);
        } else if (avgFPS > this.config.targetFPS) {
          newLevel = Math.min(1.0, currentLevel + 0.05);
        }
        break;

      case 'conservative':
        if (avgFPS < this.config.fpsThreshold - 10) {
          newLevel = Math.max(0.3, currentLevel - 0.05);
        } else if (avgFPS > this.config.targetFPS + 5) {
          newLevel = Math.min(1.0, currentLevel + 0.02);
        }
        break;
    }

    if (Math.abs(newLevel - currentLevel) > 0.05) {
      this.currentQuality.level = newLevel;
      this.applyQualitySettings();

      this.emit('quality_change', {
        oldLevel: currentLevel,
        newLevel,
        reason: 'auto_adjustment',
        metrics,
      });
    }
  }

  /**
   * Apply quality settings to targets
   */
  private applyQualitySettings(): void {
    this.optimizationTargets.forEach((target) => {
      if (target instanceof FilterChain) {
        this.applyFilterChainOptimization(target);
      } else if (target instanceof DisplacementEffects) {
        this.applyDisplacementOptimization(target);
      } else if (target instanceof EffectPresets) {
        this.applyPresetsOptimization(target);
      }
    });
  }

  /**
   * Apply filter chain optimization
   */
  private applyFilterChainOptimization(filterChain: FilterChain): void {
    const metrics = filterChain.getMetrics();

    // Adjust based on current quality
    if (metrics.complexityScore > this.currentQuality.level) {
      // Reduce complexity
      this.optimizeFilterChain(filterChain);
    }
  }

  /**
   * Apply displacement optimization
   */
  private applyDisplacementOptimization(
    displacementEffects: DisplacementEffects
  ): void {
    const metrics = displacementEffects.getPerformanceMetrics();

    // Disable displacement effects if quality is too low
    if (!this.currentQuality.enableDisplacement && metrics.activeEffects > 0) {
      displacementEffects.stopAllEffects();
    }
  }

  /**
   * Apply presets optimization
   */
  private applyPresetsOptimization(effectPresets: EffectPresets): void {
    // Adjust preset library based on quality
    if (this.currentQuality.level < 0.5) {
      // Recommend only low-performance presets
      effectPresets.getRecommendedPresets(2);
      // Implementation would filter available presets
    }
  }

  /**
   * Optimize filter chain
   */
  private optimizeFilterChain(_filterChain: FilterChain): void {
    // Implementation would optimize filter chain based on quality settings
  }

  /**
   * Apply optimization change
   */
  private applyOptimizationChange(_change: {
    component: string;
    action: string;
    impact: number;
  }): void {
    // Implementation would apply specific optimization changes
  }

  /**
   * Emit event
   */
  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const performanceEvent: PerformanceEvent = {
        type: event as PerformanceEvent['type'],
        timestamp: Date.now(),
        data,
        metrics: this.getRealTimeMetrics(),
      };

      listeners.forEach((listener) => {
        try {
          listener(performanceEvent);
        } catch {
          // console.error('Error in performance event listener:', error);
        }
      });
    }
  }

  // Performance metric getters (simplified implementations)
  private getCurrentFPS(): number {
    return 60; // Placeholder - would use actual FPS counter
  }

  private getAverageFPS(): number {
    if (this.performanceHistory.length === 0) return 60;
    const sum = this.performanceHistory.reduce(
      (acc, metrics) => acc + metrics.fps,
      0
    );
    return sum / this.performanceHistory.length;
  }

  private getFrameTime(): number {
    return 16.67; // Placeholder - would calculate from FPS
  }

  private getMemoryUsage(): number {
    return (
      (
        (performance as unknown as Record<string, unknown>).memory as {
          usedJSHeapSize?: number;
        }
      )?.usedJSHeapSize || 0 / 1024 / 1024
    );
  }

  private getGPUMemoryUsage(): number {
    return 0; // Placeholder - would use WebGL memory info
  }

  private getActiveEffectsCount(): number {
    return Array.from(this.optimizationTargets).reduce(
      (count: number, target: unknown) => {
        if (target instanceof FilterChain) {
          return count + target.getMetrics().activeAnimations;
        }
        if (target instanceof DisplacementEffects) {
          return count + target.getPerformanceMetrics().activeEffects;
        }
        return count;
      },
      0
    );
  }

  private getRenderCallsCount(): number {
    return 0; // Placeholder - would track render calls
  }

  private getTextureMemoryUsage(): number {
    return 0; // Placeholder - would track texture memory
  }

  private getCPUUsage(): number {
    return 0; // Placeholder - would estimate CPU usage
  }
}

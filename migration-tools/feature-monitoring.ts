import type { FeatureEvent, FeatureMetrics } from '../src/types/migration';
import { FeatureFlag } from '../src/types/feature-flags';

/**
 * Class responsible for tracking and analyzing feature usage, errors, and performance
 * 
 * @example
 * ```ts
 * // Track a feature usage event
 * featureMonitoring.trackEvent({
 *   feature: FeatureFlag.NEW_CORE_SLIDER,
 *   type: 'usage',
 *   timestamp: new Date()
 * });
 * 
 * // Retrieve metrics for a feature
 * const metrics = featureMonitoring.getMetrics(FeatureFlag.NEW_CORE_SLIDER);
 * console.log(`Usage count: ${metrics.usageCount}, Error rate: ${metrics.errorRate}`);
 * ```
 */
class FeatureMonitoring {
    /**
     * Collection of all feature events
     */
    private events: FeatureEvent[] = [];
    
    /**
     * Aggregated metrics for each feature
     */
    private metrics: Map<FeatureFlag, FeatureMetrics> = new Map();
    
    /**
     * Tracks a new feature event and updates metrics
     * 
     * @param event - The feature event to track
     *
     */
    trackEvent(event: FeatureEvent): void {
        this.events.push(event);
        this.updateMetrics(event);
    }
    
    /**
     * Updates metrics based on the event type
     * 
     * @param event - The feature event to process
     *
     */
    private updateMetrics(event: FeatureEvent): void {
        const feature = event.feature;
        const currentMetrics = this.metrics.get(feature) || {
            usageCount: 0,
            errorCount: 0,
            errorRate: 0,
            averageLatency: 0,
            lastUpdated: new Date()
        };
        
        switch (event.type) {
            case 'usage':
                currentMetrics.usageCount++;
                break;
            case 'error':
                currentMetrics.errorCount++;
                currentMetrics.errorRate = currentMetrics.errorCount / currentMetrics.usageCount;
                break;
            case 'latency':
                const latency = (event.metadata?.latency as number) || 0;
                currentMetrics.averageLatency = (currentMetrics.averageLatency * (currentMetrics.usageCount - 1) + latency) / currentMetrics.usageCount;
                break;
        }
        
        currentMetrics.lastUpdated = event.timestamp;
        this.metrics.set(feature, currentMetrics);
    }
    
    /**
     * Retrieves metrics for a specific feature
     * 
     * @param feature - The feature flag to get metrics for
     *
     * @returns The metrics for the specified feature
     *
     */
    getMetrics(feature: FeatureFlag): FeatureMetrics {
        return this.metrics.get(feature) || {
            usageCount: 0,
            errorCount: 0,
            errorRate: 0,
            averageLatency: 0,
            lastUpdated: new Date()
        };
    }
    
    /**
     * Retrieves all events for a specific feature
     * 
     * @param feature - The feature flag to get events for
     *
     * @returns Array of events for the specified feature
     *
     */
    getEvents(feature: FeatureFlag): FeatureEvent[] {
        return this.events.filter(event => event.feature === feature);
    }
}

/**
 * Singleton instance of FeatureMonitoring
 */
export const featureMonitoring = new FeatureMonitoring();

/**
 * Tracks a new feature event
 * 
 * @param event - The feature event to track
 * 
 * @example
 * ```ts
 * trackFeatureUsage({
 *   feature: FeatureFlag.NEW_CORE_SLIDER,
 *   type: 'usage',
 *   timestamp: new Date(),
 *   metadata: { componentId: 'slider-1' }
 * });
 * ```
 */
export function trackFeatureUsage(event: FeatureEvent): void {
    featureMonitoring.trackEvent(event);
}

/**
 * Retrieves metrics for a specific feature
 * 
 * @param featureName - The feature flag to get metrics for
 *
 * @returns The metrics for the specified feature
 * 
 * @example
 * ```ts
 * const metrics = getFeatureMetrics(FeatureFlag.NEW_CORE_SLIDER);
 * console.log(`Usage count: ${metrics.usageCount}, Error rate: ${metrics.errorRate}`);
 * ```
 */
export function getFeatureMetrics(featureName: FeatureFlag): FeatureMetrics {
    return featureMonitoring.getMetrics(featureName);
}

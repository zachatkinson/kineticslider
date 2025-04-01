import type { FeatureEvent, FeatureMetrics } from '../src/types/migration';
import { FeatureFlag } from './feature-flags';

class FeatureMonitoring {
  private events: FeatureEvent[] = [];
  private metrics: Map<FeatureFlag, FeatureMetrics> = new Map();

  trackEvent(event: FeatureEvent): void {
    this.events.push(event);
    this.updateMetrics(event);
  }

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

  getMetrics(feature: FeatureFlag): FeatureMetrics {
    return this.metrics.get(feature) || {
      usageCount: 0,
      errorCount: 0,
      errorRate: 0,
      averageLatency: 0,
      lastUpdated: new Date()
    };
  }

  getEvents(feature: FeatureFlag): FeatureEvent[] {
    return this.events.filter(event => event.feature === feature);
  }
}

export const featureMonitoring = new FeatureMonitoring();

// Example usage:
/*
// Record feature usage
featureMonitoring.recordUsage(FeatureFlag.NEW_ANIMATION_SYSTEM, {
  componentId: 'slider-1',
  animationType: 'slide',
});

// Record feature error
try {
  // Feature code
} catch (error) {
  featureMonitoring.recordError(FeatureFlag.NEW_ANIMATION_SYSTEM, error);
}

// Record performance
const startTime = performance.now();
// Feature code
const duration = performance.now() - startTime;
featureMonitoring.recordPerformance(FeatureFlag.NEW_ANIMATION_SYSTEM, duration);

// Get metrics
const metrics = featureMonitoring.getFeatureMetrics(FeatureFlag.NEW_ANIMATION_SYSTEM);
console.log('Feature Metrics:', metrics);

// Get error rate
const errorRate = featureMonitoring.getErrorRate(FeatureFlag.NEW_ANIMATION_SYSTEM);
console.log('Error Rate:', errorRate);
*/

export function trackFeatureUsage(event: FeatureEvent): void {
  featureMonitoring.trackEvent(event);
}

export function getFeatureMetrics(featureName: FeatureFlag): FeatureMetrics {
  return featureMonitoring.getMetrics(featureName);
} 
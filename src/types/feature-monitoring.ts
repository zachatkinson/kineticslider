/**
 * Feature monitoring type definitions
 *
 * @module
 * @version 1.0.0
 */

import type { FeatureFlag } from "./feature-flags";

export interface FeatureEvent {
  feature: FeatureFlag;
  type: "usage" | "error" | "latency";
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface FeatureMetrics {
  usageCount: number;
  errorCount: number;
  errorRate: number;
  averageLatency: number;
  lastUpdated: Date;
}

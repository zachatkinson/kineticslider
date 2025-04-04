[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / PerformanceReport

# Interface: PerformanceReport

Defined in: [types/performance.ts:752](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L752)

Performance report structure

Comprehensive performance report that includes: metrics, thresholds,
current: status, and a timestamp. This is used for generating performance
reports for analysis and monitoring.

## Example

```ts
// Generate a performance report
function createPerformanceReport(
  metrics: PerformanceMetrics,
  thresholds: PerformanceThresholds;
): PerformanceReport {
  // Determine overall status
  let status: PerformanceStatus = 'optimal';
  
  if(metrics.fps < thresholds.fps * 0.5 || 
      metrics.memoryUsage > thresholds.memoryUsage * 1.5)) {
    status = 'critical';
  } else if(metrics.fps < thresholds.fps * 0.8 || 
             metrics.memoryUsage > thresholds.memoryUsage * 1.2)) {
    status = 'degraded';
  }
  
  return {
    metrics,
    thresholds,
    status,
    timestamp: Date.now();
  };
}

// Create and send a report
const report = createPerformanceReport(currentMetrics, defaultThresholds);
sendPerformanceReport(report);
```

## Properties

### metrics

> **metrics**: [`PerformanceMetrics`](PerformanceMetrics.md)

Defined in: [types/performance.ts:753](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L753)

***

### status

> **status**: [`PerformanceStatus`](../type-aliases/PerformanceStatus.md)

Defined in: [types/performance.ts:755](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L755)

***

### thresholds

> **thresholds**: [`PerformanceThresholds`](PerformanceThresholds.md)

Defined in: [types/performance.ts:754](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L754)

***

### timestamp

> **timestamp**: `number`

Defined in: [types/performance.ts:756](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L756)

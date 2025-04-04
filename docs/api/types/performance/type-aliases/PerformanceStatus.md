[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / PerformanceStatus

# Type Alias: PerformanceStatus

> **PerformanceStatus** = `"optimal"` \| `"degraded"` \| `"critical"`

Defined in: [types/performance.ts:712](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L712)

Performance status types

Qualitative assessment of performance based on metric values and thresholds.
Used for high-level reporting and visualization of performance status.

- "optimal" - All metrics are well within acceptable thresholds
- "degraded" - Some metrics are approaching or slightly exceeding thresholds
- "critical" - Multiple metrics significantly exceed thresholds

## Example

```ts
// Determine performance status based on metrics
function getPerformanceStatus(metrics: PerformanceMetrics): PerformanceStatus {
  if(metrics.fps < 20 || metrics.memoryUsage > 150_000_000)) {
    return 'critical';
  } else if(metrics.fps < 40 || metrics.memoryUsage > 100_000_000)) {
    return 'degraded';
  } else {
    return 'optimal';
  }
}

// Use the status for reporting or UI indicators
const status = getPerformanceStatus(currentMetrics);
updateStatusIndicator(status);
```

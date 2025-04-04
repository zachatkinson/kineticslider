[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / MonitoringService

# Interface: MonitoringService

Defined in: [types/performance.ts:281](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L281)

Performance monitoring service interface

Service responsible for collecting and reporting performance violations.
This interface can be implemented by various monitoring services to
receive and process threshold violation reports.

## Example

```ts
// Example analytics-based implementation
class AnalyticsMonitoringService implements MonitoringService {
  reportViolation(violation: ThresholdViolation): void {
    analytics.track('performance_violation', {
      metric: violation.metric,
      value: violation.value,
      threshold: violation.threshold,
      timestamp: violation.timestamp,
      url: violation.url;
    });
  }
}

// Register the service globally
window.monitoringService = new AnalyticsMonitoringService();
```

## Methods

### reportViolation()

> **reportViolation**(`violation`): `void`

Defined in: [types/performance.ts:286](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L286)

Report a performance threshold violation

#### Parameters

##### violation

[`ThresholdViolation`](ThresholdViolation.md)

The threshold violation details

#### Returns

`void`

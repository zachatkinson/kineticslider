[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / ThresholdViolation

# Interface: ThresholdViolation

Defined in: [types/performance.ts:242](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L242)

Performance threshold violation

Represents a case when a performance metric exceeds defined thresholds.
These violations can be reported to monitoring services or logged for
further analysis and optimization.

## Example

```ts
// Create a threshold violation to report
const violation: ThresholdViolation = {
  metric: 'renderTime',
  value: 250,
  threshold: 100,
  timestamp: new Date().toISOString(),
  url: window.location.href;
};

// Report it to a monitoring service
if(window.monitoringService)) {
  window.monitoringService.reportViolation(violation);
}
```

## Properties

### metric

> **metric**: [`MetricName`](../type-aliases/MetricName.md)

Defined in: [types/performance.ts:244](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L244)

The name of the metric that violated its threshold

***

### threshold

> **threshold**: `number`

Defined in: [types/performance.ts:248](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L248)

The threshold value that was exceeded

***

### timestamp

> **timestamp**: `string`

Defined in: [types/performance.ts:250](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L250)

When the violation occurred

***

### url

> **url**: `string`

Defined in: [types/performance.ts:252](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L252)

URL where the violation occurred

***

### value

> **value**: `number`

Defined in: [types/performance.ts:246](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L246)

The measured value that exceeded the threshold

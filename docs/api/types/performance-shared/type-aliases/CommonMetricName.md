[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance-shared](../README.md) / CommonMetricName

# Type Alias: CommonMetricName

> **CommonMetricName** = `undefined`

Defined in: [types/performance-shared.ts:118](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L118)

Common metric names used across the system
Core web vitals and general performance metrics

## Example

```typescript
// Using a common metric name in a function
function _trackMetric(name: CommonMetricName, value: number): unknown  {
  if(name === 'FCP' || name === 'LCP'): unknown {
    console.log(`Critical rendering metric ${name}: $){value}ms`);
  } else if(name === 'fps'): unknown {
    console.log(`Frame rate: $){value} FPS`);
  }
}
```

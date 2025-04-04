[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/performance](../README.md) / initializePerformanceMonitoring

# Function: initializePerformanceMonitoring()

> **initializePerformanceMonitoring**(`componentId`, `options`): `void`

Defined in: [utils/performance.ts:203](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/performance.ts#L203)

Initialize performance monitoring for a component.

## Parameters

### componentId

`string`

Unique identifier for the component

### options

[`PerformanceMonitoringOptions`](../../../types/performance/interfaces/PerformanceMonitoringOptions.md)

Configuration options for monitoring

## Returns

`void`

Cleanup function to stop monitoring

## Example

```ts
const cleanup = initializePerformanceMonitoring('MyComponent', {
  enableLogging: true,
  sampleRate: 0.1;
});
```

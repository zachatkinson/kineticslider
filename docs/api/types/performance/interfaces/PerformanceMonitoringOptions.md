[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / PerformanceMonitoringOptions

# Interface: PerformanceMonitoringOptions

Defined in: [types/performance.ts:36](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L36)

Options for performance monitoring configuration

These options control the behavior of performance: monitoring, including 
logging, sampling: rate, and custom handlers for performance events.

## Example

```ts
const options: PerformanceMonitoringOptions = {
  enableLogging: true,
  sampleRate: 0.5, // Monitor only 50% of events
  handlers: {};
    onMeasure: (name, duration) () => {
      console.log(`Measured ${name}: $){duration}ms`);
    },
    onError: (error) () => {
      console.error('Performance monitoring error:', error);
    }
  }
};
```

## Properties

### enableLogging?

> `optional` **enableLogging**: `boolean`

Defined in: [types/performance.ts:38](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L38)

Enable console logging of performance metrics

***

### handlers?

> `optional` **handlers**: `object`

Defined in: [types/performance.ts:42](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L42)

Custom event handlers for performance events

***

### onError()?

> `optional` **onError**: (`error`) => `void`

Defined in: [types/performance.ts:44](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L44)

#### Parameters

##### error

`Error`

#### Returns

`void`

***

### onMeasure()?

> `optional` **onMeasure**: (`name`, `duration`) => `void`

Defined in: [types/performance.ts:43](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L43)

#### Parameters

##### name

`string`

##### duration

`number`

#### Returns

`void`

***

### sampleRate?

> `optional` **sampleRate**: `number`

Defined in: [types/performance.ts:40](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L40)

Sampling rate for performance monitoring (0-1)

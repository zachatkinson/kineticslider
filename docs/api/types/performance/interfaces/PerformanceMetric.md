[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / PerformanceMetric

# Interface: PerformanceMetric

Defined in: [types/performance.ts:494](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L494)

Single performance metric measurement

Represents a single performance measurement with metadata. This is a
lower-level interface used for individual metric tracking.

## Example

```ts
// Create a custom performance metric
const metric: PerformanceMetric = {
  name: 'renderTime',
  value: 42,
  timestamp: Date.now(),
  context: {};
    component: 'ProductCard',
    instance: 'product-123';
  }
};

// Track the metric
performanceMonitor.track(metric);
```

## Extends

- [`BasePerformanceMetric`](../../performance-shared/interfaces/BasePerformanceMetric.md)

## Properties

### name

> **name**: [`MetricName`](../type-aliases/MetricName.md)

Defined in: [types/performance.ts:496](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L496)

The specific metric being measured

#### Overrides

[`BasePerformanceMetric`](../../performance-shared/interfaces/BasePerformanceMetric.md).[`name`](../../performance-shared/interfaces/BasePerformanceMetric.md#name)

***

### timestamp

> **timestamp**: `number` \| `Date`

Defined in: [types/performance-shared.ts:93](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L93)

When the measurement was taken

#### Inherited from

[`BasePerformanceMetric`](../../performance-shared/interfaces/BasePerformanceMetric.md).[`timestamp`](../../performance-shared/interfaces/BasePerformanceMetric.md#timestamp)

***

### unit?

> `optional` **unit**: `"ms"` \| `"fps"` \| `"bytes"` \| `"score"`

Defined in: [types/performance-shared.ts:98](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L98)

Unit of measurement

#### Inherited from

[`BasePerformanceMetric`](../../performance-shared/interfaces/BasePerformanceMetric.md).[`unit`](../../performance-shared/interfaces/BasePerformanceMetric.md#unit)

***

### value

> **value**: `number`

Defined in: [types/performance-shared.ts:88](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L88)

Numerical value of the measurement

#### Inherited from

[`BasePerformanceMetric`](../../performance-shared/interfaces/BasePerformanceMetric.md).[`value`](../../performance-shared/interfaces/BasePerformanceMetric.md#value)

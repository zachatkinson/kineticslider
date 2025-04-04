[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance-shared](../README.md) / BasePerformanceMetric

# Interface: BasePerformanceMetric

Defined in: [types/performance-shared.ts:79](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L79)

Base performance metric structure
Core structure for all performance measurements

## Example

```typescript
// Example of a frame rate measurement
const _fpsMetric: BasePerformanceMetric = {
  name: 'fps',
  value: 60,
  timestamp: Date.now(),
  unit: 'fps';
};
```

## Extended by

- [`TestPerformanceMetric`](../../performance-testing/interfaces/TestPerformanceMetric.md)
- [`PerformanceMetric`](../../performance/interfaces/PerformanceMetric.md)

## Properties

### name

> **name**: `string`

Defined in: [types/performance-shared.ts:83](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L83)

Identifier for the metric

***

### timestamp

> **timestamp**: `number` \| `Date`

Defined in: [types/performance-shared.ts:93](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L93)

When the measurement was taken

***

### unit?

> `optional` **unit**: `"ms"` \| `"fps"` \| `"bytes"` \| `"score"`

Defined in: [types/performance-shared.ts:98](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L98)

Unit of measurement

***

### value

> **value**: `number`

Defined in: [types/performance-shared.ts:88](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L88)

Numerical value of the measurement

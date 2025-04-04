[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance-shared](../README.md) / MetricSummary

# Interface: MetricSummary

Defined in: [types/performance-shared.ts:26](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L26)

Basic metric summary statistics
Contains statistical values calculated from a series of metric measurements

## Example

```typescript
// Example metric summary for FPS measurements
const _fpsSummary: MetricSummary = {
  avg: 58.7,
  p95: 60,
  min: 45,
  max: 60,
  count: 120,
  median: 59,
  stdDev: 3.2;
};
```

## Properties

### avg

> **avg**: `number`

Defined in: [types/performance-shared.ts:30](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L30)

Average (mean) value of the metric

***

### count

> **count**: `number`

Defined in: [types/performance-shared.ts:60](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L60)

Number of measurements included in these statistics

***

### max

> **max**: `number`

Defined in: [types/performance-shared.ts:55](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L55)

Maximum recorded value

***

### median?

> `optional` **median**: `number`

Defined in: [types/performance-shared.ts:35](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L35)

Median value of the metric (middle value in the sorted data)

***

### min

> **min**: `number`

Defined in: [types/performance-shared.ts:50](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L50)

Minimum recorded value

***

### p95

> **p95**: `number`

Defined in: [types/performance-shared.ts:45](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L45)

95th percentile value (value below which 95% of observations fall)

***

### stdDev?

> `optional` **stdDev**: `number`

Defined in: [types/performance-shared.ts:40](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L40)

Standard deviation of the metric (measure of dispersion)

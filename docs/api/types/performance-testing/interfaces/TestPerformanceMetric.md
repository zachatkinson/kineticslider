[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance-testing](../README.md) / TestPerformanceMetric

# Interface: TestPerformanceMetric

Defined in: [types/performance-testing.ts:75](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-testing.ts#L75)

Performance metric with feature flag context

## Description

*

## Examples

```ts
Example usage
```

```ts

```

## Extends

- [`BasePerformanceMetric`](../../performance-shared/interfaces/BasePerformanceMetric.md)

## Properties

### featureFlags

> **featureFlags**: `Record`\<[`FeatureFlag`](../../feature-flags/enumerations/FeatureFlag.md), `boolean`\>

Defined in: [types/performance-testing.ts:76](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-testing.ts#L76)

***

### name

> **name**: `string`

Defined in: [types/performance-shared.ts:83](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance-shared.ts#L83)

Identifier for the metric

#### Inherited from

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

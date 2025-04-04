[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / PerformanceEventDetail

# Interface: PerformanceEventDetail

Defined in: [types/performance.ts:614](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L614)

Performance event detail

Data structure for performance-related custom events. Used for creating
and dispatching custom performance events in the application.

## Example

```ts
// Create a performance event detail
const detail: PerformanceEventDetail = {
  metric: 'renderTime',
  value: 28.5,
  name: 'ProductList',
  id: 'list-123',
  timestamp: Date.now(),
  source: 'ShoppingCart';
};

// Dispatch a custom performance event
const event = new CustomEvent('performance-measurement', { detail });
window.dispatchEvent(event);
```

## Properties

### id?

> `optional` **id**: `string`

Defined in: [types/performance.ts:622](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L622)

Optional unique identifier for the measurement

***

### metric

> **metric**: `string`

Defined in: [types/performance.ts:616](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L616)

Name of the metric being reported

***

### name?

> `optional` **name**: `string`

Defined in: [types/performance.ts:620](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L620)

Optional name or label for the measurement

***

### source?

> `optional` **source**: `string`

Defined in: [types/performance.ts:626](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L626)

Source component or system that generated the metric

***

### timestamp?

> `optional` **timestamp**: `number`

Defined in: [types/performance.ts:624](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L624)

When the measurement was taken (timestamp)

***

### value

> **value**: `number`

Defined in: [types/performance.ts:618](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L618)

Value of the metric

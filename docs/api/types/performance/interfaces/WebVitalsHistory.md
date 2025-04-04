[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / WebVitalsHistory

# Interface: WebVitalsHistory

Defined in: [types/performance.ts:78](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L78)

Core Web Vitals metrics history

Tracks historical values of key user experience metrics as defined by Google's 
Web Vitals initiative. These metrics are critical for measuring and improving
user experience.

## See

https://web.dev/vitals/ for more information on Web Vitals

## Example

```ts
const webVitals: WebVitalsHistory = {
  FCP: [1245, 1300], // First Contentful Paint measurements in ms
  LCP: [2100, 2300], // Largest Contentful Paint measurements in ms
  CLS: [0.05, 0.08], // Cumulative Layout Shift scores (unitless)
  FID: [95, 110]     // First Input Delay measurements in ms
};
```

## Properties

### CLS?

> `optional` **CLS**: `any`

Defined in: [types/performance.ts:86](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L86)

Cumulative Layout Shift score (unitless, array of measurements)

***

### FCP?

> `optional` **FCP**: `any`

Defined in: [types/performance.ts:80](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L80)

First Contentful Paint in milliseconds (array of measurements)

***

### FID?

> `optional` **FID**: `any`

Defined in: [types/performance.ts:84](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L84)

First Input Delay in milliseconds (array of measurements)

***

### LCP?

> `optional` **LCP**: `any`

Defined in: [types/performance.ts:82](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L82)

Largest Contentful Paint in milliseconds (array of measurements)

***

### TBT?

> `optional` **TBT**: `any`

Defined in: [types/performance.ts:90](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L90)

Total Blocking Time in milliseconds (array of measurements)

***

### TTI?

> `optional` **TTI**: `any`

Defined in: [types/performance.ts:88](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L88)

Time to Interactive in milliseconds (array of measurements)

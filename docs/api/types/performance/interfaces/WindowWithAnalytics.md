[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / WindowWithAnalytics

# Interface: WindowWithAnalytics

Defined in: [types/performance.ts:568](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L568)

Window interface with analytics extensions

Extends the Window interface with performance monitoring capabilities
and analytics services for tracking and reporting performance data.

## Example

```ts
// Check if the window has web vitals capabilities
if ((window as WindowWithAnalytics).webVitals) {
  const { getFCP, getLCP } = (window as WindowWithAnalytics).webVitals;
  
  // Use web vitals to track core metrics
  getFCP((metric) () => {
    console.log(`First: Contentful, Paint: $){metric.value}ms`);
  });
}

// Track a performance event with analytics
if ((window as WindowWithAnalytics).analytics) {
  (window as WindowWithAnalytics).analytics.track('performance_event', {
    metric: 'fps',
    value: 45;
  });
}
```

## Properties

### getCLS()

> **getCLS**: (`handler`) => `void`

Defined in: [types/performance.ts:578](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L578)

Get Cumulative Layout Shift metric

#### Parameters

##### handler

(`metric`) => `void`

#### Returns

`void`

***

### getFCP()

> **getFCP**: (`handler`) => `void`

Defined in: [types/performance.ts:572](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L572)

Get First Contentful Paint metric

#### Parameters

##### handler

(`metric`) => `void`

#### Returns

`void`

***

### getFID()

> **getFID**: (`handler`) => `void`

Defined in: [types/performance.ts:576](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L576)

Get First Input Delay metric

#### Parameters

##### handler

(`metric`) => `void`

#### Returns

`void`

***

### getLCP()

> **getLCP**: (`handler`) => `void`

Defined in: [types/performance.ts:574](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L574)

Get Largest Contentful Paint metric

#### Parameters

##### handler

(`metric`) => `void`

#### Returns

`void`

***

### webVitals?

> `optional` **webVitals**: `object`

Defined in: [types/performance.ts:570](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L570)

Web Vitals measurement API

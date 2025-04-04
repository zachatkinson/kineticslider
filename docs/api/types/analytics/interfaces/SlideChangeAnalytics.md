[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/analytics](../README.md) / SlideChangeAnalytics

# Interface: SlideChangeAnalytics

Defined in: [types/analytics.ts:159](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L159)

Analytics data for slide changes

## Extends

- [`BaseAnalyticsData`](BaseAnalyticsData.md)

## Properties

### componentId?

> `optional` **componentId**: `string`

Defined in: [types/analytics.ts:153](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L153)

#### Inherited from

[`BaseAnalyticsData`](BaseAnalyticsData.md).[`componentId`](BaseAnalyticsData.md#componentid)

***

### eventType

> **eventType**: `"slide_change"`

Defined in: [types/analytics.ts:160](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L160)

#### Overrides

[`BaseAnalyticsData`](BaseAnalyticsData.md).[`eventType`](BaseAnalyticsData.md#eventtype)

***

### fromIndex

> **fromIndex**: [`SlideIndex`](../../branded/type-aliases/SlideIndex.md)

Defined in: [types/analytics.ts:161](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L161)

***

### isAutoplay

> **isAutoplay**: `boolean`

Defined in: [types/analytics.ts:164](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L164)

***

### sessionId?

> `optional` **sessionId**: `string`

Defined in: [types/analytics.ts:154](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L154)

#### Inherited from

[`BaseAnalyticsData`](BaseAnalyticsData.md).[`sessionId`](BaseAnalyticsData.md#sessionid)

***

### slideId

> **slideId**: [`SliderId`](../../branded/type-aliases/SliderId.md)

Defined in: [types/analytics.ts:163](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L163)

***

### timestamp

> **timestamp**: `string`

Defined in: [types/analytics.ts:152](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L152)

#### Inherited from

[`BaseAnalyticsData`](BaseAnalyticsData.md).[`timestamp`](BaseAnalyticsData.md#timestamp)

***

### toIndex

> **toIndex**: [`SlideIndex`](../../branded/type-aliases/SlideIndex.md)

Defined in: [types/analytics.ts:162](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L162)

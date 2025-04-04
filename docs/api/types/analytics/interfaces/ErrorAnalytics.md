[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/analytics](../README.md) / ErrorAnalytics

# Interface: ErrorAnalytics

Defined in: [types/analytics.ts:187](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L187)

Analytics data for errors

## Extends

- [`BaseAnalyticsData`](BaseAnalyticsData.md)

## Properties

### componentId?

> `optional` **componentId**: `string`

Defined in: [types/analytics.ts:153](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L153)

#### Inherited from

[`BaseAnalyticsData`](BaseAnalyticsData.md).[`componentId`](BaseAnalyticsData.md#componentid)

***

### componentInfo?

> `optional` **componentInfo**: `object`

Defined in: [types/analytics.ts:191](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L191)

***

### currentIndex

> **currentIndex**: [`SlideIndex`](../../branded/type-aliases/SlideIndex.md)

Defined in: [types/analytics.ts:192](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L192)

***

### error

> **error**: `Error`

Defined in: [types/analytics.ts:189](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L189)

***

### errorType

> **errorType**: `ErrorType`

Defined in: [types/analytics.ts:190](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L190)

***

### eventType

> **eventType**: `"error"`

Defined in: [types/analytics.ts:188](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L188)

#### Overrides

[`BaseAnalyticsData`](BaseAnalyticsData.md).[`eventType`](BaseAnalyticsData.md#eventtype)

***

### isAnimating

> **isAnimating**: `boolean`

Defined in: [types/analytics.ts:193](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L193)

***

### isDragging

> **isDragging**: `boolean`

Defined in: [types/analytics.ts:194](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L194)

***

### sessionId?

> `optional` **sessionId**: `string`

Defined in: [types/analytics.ts:154](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L154)

#### Inherited from

[`BaseAnalyticsData`](BaseAnalyticsData.md).[`sessionId`](BaseAnalyticsData.md#sessionid)

***

### timestamp

> **timestamp**: `string`

Defined in: [types/analytics.ts:152](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L152)

#### Inherited from

[`BaseAnalyticsData`](BaseAnalyticsData.md).[`timestamp`](BaseAnalyticsData.md#timestamp)

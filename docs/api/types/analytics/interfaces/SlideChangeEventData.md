[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/analytics](../README.md) / SlideChangeEventData

# Interface: SlideChangeEventData

Defined in: [types/analytics.ts:38](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L38)

Event-specific data interfaces

## Example

```ts
Example usage
```

## Extends

- [`BaseEventData`](BaseEventData.md)

## Properties

### componentId?

> `optional` **componentId**: `string`

Defined in: [types/analytics.ts:31](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L31)

#### Inherited from

[`BaseEventData`](BaseEventData.md).[`componentId`](BaseEventData.md#componentid)

***

### fromIndex

> **fromIndex**: [`SlideIndex`](../../branded/type-aliases/SlideIndex.md)

Defined in: [types/analytics.ts:40](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L40)

***

### isAutoplay

> **isAutoplay**: `boolean`

Defined in: [types/analytics.ts:43](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L43)

***

### sessionId

> **sessionId**: `string`

Defined in: [types/analytics.ts:29](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L29)

#### Inherited from

[`BaseEventData`](BaseEventData.md).[`sessionId`](BaseEventData.md#sessionid)

***

### slideId

> **slideId**: [`SliderId`](../../branded/type-aliases/SliderId.md)

Defined in: [types/analytics.ts:42](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L42)

***

### timestamp

> **timestamp**: `number`

Defined in: [types/analytics.ts:28](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L28)

#### Inherited from

[`BaseEventData`](BaseEventData.md).[`timestamp`](BaseEventData.md#timestamp)

***

### toIndex

> **toIndex**: [`SlideIndex`](../../branded/type-aliases/SlideIndex.md)

Defined in: [types/analytics.ts:41](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L41)

***

### type

> **type**: `"slide_change"`

Defined in: [types/analytics.ts:39](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L39)

#### Overrides

[`BaseEventData`](BaseEventData.md).[`type`](BaseEventData.md#type)

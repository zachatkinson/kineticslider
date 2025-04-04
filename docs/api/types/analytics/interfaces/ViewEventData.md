[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/analytics](../README.md) / ViewEventData

# Interface: ViewEventData

Defined in: [types/analytics.ts:66](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L66)

Base _event data interface

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

### duration

> **duration**: `number`

Defined in: [types/analytics.ts:69](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L69)

***

### isVisible

> **isVisible**: `boolean`

Defined in: [types/analytics.ts:70](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L70)

***

### sessionId

> **sessionId**: `string`

Defined in: [types/analytics.ts:29](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L29)

#### Inherited from

[`BaseEventData`](BaseEventData.md).[`sessionId`](BaseEventData.md#sessionid)

***

### slideId

> **slideId**: [`SliderId`](../../branded/type-aliases/SliderId.md)

Defined in: [types/analytics.ts:68](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L68)

***

### timestamp

> **timestamp**: `number`

Defined in: [types/analytics.ts:28](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L28)

#### Inherited from

[`BaseEventData`](BaseEventData.md).[`timestamp`](BaseEventData.md#timestamp)

***

### type

> **type**: `"view"`

Defined in: [types/analytics.ts:67](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L67)

#### Overrides

[`BaseEventData`](BaseEventData.md).[`type`](BaseEventData.md#type)

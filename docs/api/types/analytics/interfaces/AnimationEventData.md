[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/analytics](../README.md) / AnimationEventData

# Interface: AnimationEventData

Defined in: [types/analytics.ts:46](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L46)

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

### direction

> **direction**: `"forward"` \| `"backward"`

Defined in: [types/analytics.ts:49](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L49)

***

### duration

> **duration**: `number`

Defined in: [types/analytics.ts:48](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L48)

***

### sessionId

> **sessionId**: `string`

Defined in: [types/analytics.ts:29](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L29)

#### Inherited from

[`BaseEventData`](BaseEventData.md).[`sessionId`](BaseEventData.md#sessionid)

***

### timestamp

> **timestamp**: `number`

Defined in: [types/analytics.ts:28](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L28)

#### Inherited from

[`BaseEventData`](BaseEventData.md).[`timestamp`](BaseEventData.md#timestamp)

***

### type

> **type**: `"animation_complete"` \| `"animation_start"`

Defined in: [types/analytics.ts:47](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L47)

#### Overrides

[`BaseEventData`](BaseEventData.md).[`type`](BaseEventData.md#type)

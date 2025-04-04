[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/analytics](../README.md) / GestureEventData

# Interface: GestureEventData

Defined in: [types/analytics.ts:52](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L52)

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

> **direction**: `"horizontal"` \| `"vertical"`

Defined in: [types/analytics.ts:54](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L54)

***

### distance

> **distance**: `number`

Defined in: [types/analytics.ts:55](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L55)

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

> **type**: `"gesture_detected"` \| `"gesture_start"` \| `"gesture_end"`

Defined in: [types/analytics.ts:53](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L53)

#### Overrides

[`BaseEventData`](BaseEventData.md).[`type`](BaseEventData.md#type)

***

### velocity

> **velocity**: `number`

Defined in: [types/analytics.ts:56](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L56)

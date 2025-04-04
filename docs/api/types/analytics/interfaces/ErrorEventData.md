[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/analytics](../README.md) / ErrorEventData

# Interface: ErrorEventData

Defined in: [types/analytics.ts:59](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L59)

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

### errorType

> **errorType**: `ErrorType`

Defined in: [types/analytics.ts:61](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L61)

***

### message

> **message**: `string`

Defined in: [types/analytics.ts:62](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L62)

***

### sessionId

> **sessionId**: `string`

Defined in: [types/analytics.ts:29](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L29)

#### Inherited from

[`BaseEventData`](BaseEventData.md).[`sessionId`](BaseEventData.md#sessionid)

***

### stack?

> `optional` **stack**: `string`

Defined in: [types/analytics.ts:63](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L63)

***

### timestamp

> **timestamp**: `number`

Defined in: [types/analytics.ts:28](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L28)

#### Inherited from

[`BaseEventData`](BaseEventData.md).[`timestamp`](BaseEventData.md#timestamp)

***

### type

> **type**: `"error"`

Defined in: [types/analytics.ts:60](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/analytics.ts#L60)

#### Overrides

[`BaseEventData`](BaseEventData.md).[`type`](BaseEventData.md#type)

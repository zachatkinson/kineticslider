[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/error](../README.md) / GestureError

# Interface: GestureError

Defined in: [types/error.ts:217](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L217)

Gesture error for touch/mouse interactions

## Example

```ts
Example usage
```

## Extends

- [`BaseError`](BaseError.md)

## Properties

### currentX

> **currentX**: `number`

Defined in: [types/error.ts:222](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L222)

***

### currentY

> **currentY**: `number`

Defined in: [types/error.ts:223](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L223)

***

### details

> **details**: `object`

Defined in: [types/error.ts:219](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L219)

***

### eventType

> **eventType**: `string`

Defined in: [types/error.ts:224](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L224)

***

### message

> **message**: `string`

Defined in: [types/error.ts:58](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L58)

#### Inherited from

[`BaseError`](BaseError.md).[`message`](BaseError.md#message)

***

### severity?

> `optional` **severity**: [`ErrorSeverity`](../enumerations/ErrorSeverity.md)

Defined in: [types/error.ts:62](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L62)

#### Inherited from

[`BaseError`](BaseError.md).[`severity`](BaseError.md#severity)

***

### stack?

> `optional` **stack**: `string`

Defined in: [types/error.ts:59](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L59)

#### Inherited from

[`BaseError`](BaseError.md).[`stack`](BaseError.md#stack)

***

### startX

> **startX**: `number`

Defined in: [types/error.ts:220](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L220)

***

### startY

> **startY**: `number`

Defined in: [types/error.ts:221](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L221)

***

### timestamp

> **timestamp**: `number`

Defined in: [types/error.ts:60](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L60)

#### Inherited from

[`BaseError`](BaseError.md).[`timestamp`](BaseError.md#timestamp)

***

### type

> **type**: [`GESTURE`](../enumerations/ErrorType.md#gesture)

Defined in: [types/error.ts:218](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L218)

#### Overrides

[`BaseError`](BaseError.md).[`type`](BaseError.md#type)

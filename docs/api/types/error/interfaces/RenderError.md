[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/error](../README.md) / RenderError

# Interface: RenderError

Defined in: [types/error.ts:245](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L245)

Render error for component failures

## Example

```ts
Example usage
```

## Extends

- [`BaseError`](BaseError.md)

## Properties

### componentStack

> **componentStack**: `string`

Defined in: [types/error.ts:249](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L249)

***

### details

> **details**: `object`

Defined in: [types/error.ts:247](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L247)

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

### slideId

> **slideId**: [`SliderId`](../../branded/type-aliases/SliderId.md)

Defined in: [types/error.ts:248](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L248)

***

### stack?

> `optional` **stack**: `string`

Defined in: [types/error.ts:59](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L59)

#### Inherited from

[`BaseError`](BaseError.md).[`stack`](BaseError.md#stack)

***

### timestamp

> **timestamp**: `number`

Defined in: [types/error.ts:60](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L60)

#### Inherited from

[`BaseError`](BaseError.md).[`timestamp`](BaseError.md#timestamp)

***

### type

> **type**: [`RENDER`](../enumerations/ErrorType.md#render)

Defined in: [types/error.ts:246](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L246)

#### Overrides

[`BaseError`](BaseError.md).[`type`](BaseError.md#type)

[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/error](../README.md) / AnimationError

# Interface: AnimationError

Defined in: [types/error.ts:203](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L203)

Animation error for slider transitions

## Example

```ts
Example usage
```

## Extends

- [`BaseError`](BaseError.md)

## Properties

### currentSlide

> **currentSlide**: [`SlideIndex`](../../branded/type-aliases/SlideIndex.md)

Defined in: [types/error.ts:206](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L206)

***

### details

> **details**: `object`

Defined in: [types/error.ts:205](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L205)

***

### duration

> **duration**: `number`

Defined in: [types/error.ts:208](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L208)

***

### message

> **message**: `string`

Defined in: [types/error.ts:58](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L58)

#### Inherited from

[`BaseError`](BaseError.md).[`message`](BaseError.md#message)

***

### property

> **property**: `string`

Defined in: [types/error.ts:209](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L209)

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

### targetSlide

> **targetSlide**: [`SlideIndex`](../../branded/type-aliases/SlideIndex.md)

Defined in: [types/error.ts:207](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L207)

***

### timestamp

> **timestamp**: `number`

Defined in: [types/error.ts:60](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L60)

#### Inherited from

[`BaseError`](BaseError.md).[`timestamp`](BaseError.md#timestamp)

***

### type

> **type**: [`ANIMATION`](../enumerations/ErrorType.md#animation)

Defined in: [types/error.ts:204](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L204)

#### Overrides

[`BaseError`](BaseError.md).[`type`](BaseError.md#type)

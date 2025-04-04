[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/errors](../README.md) / SliderError

# Class: SliderError

Defined in: [utils/errors.ts:11](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/errors.ts#L11)

## Example

```ts
Example usage
```

## Extends

- `Error`

## Extended by

- [`ValidationError`](ValidationError.md)
- [`AnimationError`](AnimationError.md)
- [`GestureError`](GestureError.md)
- [`ResourceError`](ResourceError.md)

## Implements

- [`KineticSlider`](../../../index/variables/KineticSlider.md)

## Constructors

### Constructor

> **new SliderError**(`message`, `code`, `details`?): `SliderError`

Defined in: [utils/errors.ts:19](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/errors.ts#L19)

#### Parameters

##### message

`string`

##### code

`string`

##### details?

`unknown`

#### Returns

`SliderError`

#### Overrides

`Error.constructor`

## Properties

### code

> `readonly` **code**: `string`

Defined in: [utils/errors.ts:12](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/errors.ts#L12)

***

### details?

> `readonly` `optional` **details**: `unknown`

Defined in: [utils/errors.ts:14](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/errors.ts#L14)

***

### timestamp

> `readonly` **timestamp**: `string`

Defined in: [utils/errors.ts:13](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/errors.ts#L13)

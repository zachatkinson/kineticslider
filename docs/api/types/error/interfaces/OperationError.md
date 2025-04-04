[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/error](../README.md) / OperationError

# Interface: OperationError

Defined in: [types/error.ts:285](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L285)

Operation error for general failures

## Example

```ts
Example usage
```

## Extends

- [`BaseError`](BaseError.md)

## Properties

### context?

> `optional` **context**: `Record`\<`string`, `unknown`\>

Defined in: [types/error.ts:290](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L290)

***

### details

> **details**: `object`

Defined in: [types/error.ts:287](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L287)

***

### input?

> `optional` **input**: `unknown`

Defined in: [types/error.ts:289](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L289)

***

### message

> **message**: `string`

Defined in: [types/error.ts:58](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L58)

#### Inherited from

[`BaseError`](BaseError.md).[`message`](BaseError.md#message)

***

### operation

> **operation**: `string`

Defined in: [types/error.ts:288](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L288)

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

### timestamp

> **timestamp**: `number`

Defined in: [types/error.ts:60](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L60)

#### Inherited from

[`BaseError`](BaseError.md).[`timestamp`](BaseError.md#timestamp)

***

### type

> **type**: [`OPERATION`](../enumerations/ErrorType.md#operation)

Defined in: [types/error.ts:286](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L286)

#### Overrides

[`BaseError`](BaseError.md).[`type`](BaseError.md#type)

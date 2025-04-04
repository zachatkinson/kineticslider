[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/error](../README.md) / ErrorEvent

# Interface: ErrorEvent

Defined in: [types/error.ts:94](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L94)

Structure of a tracked error event

## Example

```ts
Example usage
```

## Extends

- [`BaseError`](BaseError.md)

## Properties

### componentInfo

> **componentInfo**: `Record`\<`string`, `unknown`\>

Defined in: [types/error.ts:95](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L95)

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

### timestamp

> **timestamp**: `number`

Defined in: [types/error.ts:60](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L60)

#### Inherited from

[`BaseError`](BaseError.md).[`timestamp`](BaseError.md#timestamp)

***

### type

> **type**: [`ErrorType`](../enumerations/ErrorType.md)

Defined in: [types/error.ts:61](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/error.ts#L61)

#### Inherited from

[`BaseError`](BaseError.md).[`type`](BaseError.md#type)

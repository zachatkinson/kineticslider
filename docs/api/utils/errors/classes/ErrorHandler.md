[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/errors](../README.md) / \_ErrorHandler

# Class: \_ErrorHandler

Defined in: [utils/errors.ts:47](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/errors.ts#L47)

Error handler class for consistent error processing

## Example

```ts
Example usage
```

## Constructors

### Constructor

> **new \_ErrorHandler**(`onError`?): `_ErrorHandler`

Defined in: [utils/errors.ts:51](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/errors.ts#L51)

#### Parameters

##### onError?

(`error`, `errorInfo`) => `void`

#### Returns

`_ErrorHandler`

## Properties

### onError()?

> `private` `readonly` `optional` **onError**: (`error`, `errorInfo`) => `void`

Defined in: [utils/errors.ts:52](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/errors.ts#L52)

#### Parameters

##### error

`Error`

##### errorInfo

[`SliderErrorInfo`](../../../types/error/interfaces/SliderErrorInfo.md)

#### Returns

`void`

## Methods

### handle()

> **handle**\<`T`\>(`operation`, `context`): `Promise`\<`T`\>

Defined in: [utils/errors.ts:63](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/errors.ts#L63)

Handle an operation that might throw an error

#### Type Parameters

##### T

`T`

#### Parameters

##### operation

() => `T` \| `Promise`\<`T`\>

##### context

`Record`\<`string`, `unknown`\> = `{}`

#### Returns

`Promise`\<`T`\>

***

### normalizeError()

> `private` **normalizeError**(`error`): [`SliderError`](SliderError.md)

Defined in: [utils/errors.ts:111](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/errors.ts#L111)

Normalize any error into a SliderError

#### Parameters

##### error

`unknown`

#### Returns

[`SliderError`](SliderError.md)

***

### processError()

> `private` **processError**(`error`, `context`): `Promise`\<`void`\>

Defined in: [utils/errors.ts:81](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/errors.ts#L81)

Process and report an error

#### Parameters

##### error

`unknown`

##### context

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`void`\>

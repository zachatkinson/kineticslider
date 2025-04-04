[**KineticSlider Documentation v0.1.0**](../../../../README.md)

***

[KineticSlider Documentation](../../../../modules.md) / [types/test/vitest](../README.md) / ExtendedMock

# Interface: ExtendedMock()\<_T\>

Defined in: [types/test/vitest.ts:32](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L32)

Extended mock interface for testing

## Description

*

## Example

```ts
Example usage
```

## Type Parameters

### _T

`_T` = `unknown`

> **ExtendedMock**(...`args`): `unknown`

Defined in: [types/test/vitest.ts:33](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L33)

Extended mock interface for testing

## Parameters

### args

...`any`

## Returns

`unknown`

## Description

*

## Example

```ts
Example usage
```

## Properties

### calls

> **calls**: `unknown`[][]

Defined in: [types/test/vitest.ts:41](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L41)

***

### instances

> **instances**: `any`

Defined in: [types/test/vitest.ts:42](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L42)

***

### invocationCallOrder

> **invocationCallOrder**: `any`

Defined in: [types/test/vitest.ts:43](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L43)

***

### mock

> **mock**: `object`

Defined in: [types/test/vitest.ts:40](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L40)

***

### results

> **results**: `object`[]

Defined in: [types/test/vitest.ts:44](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L44)

#### type

> **type**: `string`

#### value

> **value**: `unknown`

## Methods

### getMockName()

> **getMockName**(): `string`

Defined in: [types/test/vitest.ts:39](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L39)

#### Returns

`string`

***

### mockImplementation()

> **mockImplementation**(`_fn`, `unknown`, `unknown`): `this`

Defined in: [types/test/vitest.ts:34](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L34)

#### Parameters

##### \_fn

(...`args`) => `any`

##### unknown

`any`

##### unknown

`any`

#### Returns

`this`

***

### mockRejectedValue()

> **mockRejectedValue**(`value`): `this`

Defined in: [types/test/vitest.ts:38](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L38)

#### Parameters

##### value

`unknown`

#### Returns

`this`

***

### mockResolvedValue()

> **mockResolvedValue**(`value`): `this`

Defined in: [types/test/vitest.ts:37](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L37)

#### Parameters

##### value

`unknown`

#### Returns

`this`

***

### mockReturnThis()

> **mockReturnThis**(): `this`

Defined in: [types/test/vitest.ts:35](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L35)

#### Returns

`this`

***

### mockReturnValue()

> **mockReturnValue**(`value`): `this`

Defined in: [types/test/vitest.ts:36](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L36)

#### Parameters

##### value

`unknown`

#### Returns

`this`

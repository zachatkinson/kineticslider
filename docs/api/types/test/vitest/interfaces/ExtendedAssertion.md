[**KineticSlider Documentation v0.1.0**](../../../../README.md)

***

[KineticSlider Documentation](../../../../modules.md) / [types/test/vitest](../README.md) / ExtendedAssertion

# Interface: ExtendedAssertion\<T\>

Defined in: [types/test/vitest.ts:16](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L16)

Extended assertion interface with custom matchers

## Description

*

## Example

```ts
Example usage
```

## Extends

- [`CustomMatchers`](CustomMatchers.md)\<`T`\>

## Type Parameters

### T

`T` = `unknown`

## Methods

### toBe()

> **toBe**(`expected`): `void`

Defined in: [types/test/vitest.ts:17](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L17)

#### Parameters

##### expected

`unknown`

#### Returns

`void`

***

### toHaveBeenCalledWithDirection()

> **toHaveBeenCalledWithDirection**(`direction`): `T`

Defined in: [types/test/vitest.ts:9](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/test/vitest.ts#L9)

#### Parameters

##### direction

`string`

#### Returns

`T`

#### Inherited from

[`CustomMatchers`](CustomMatchers.md).[`toHaveBeenCalledWithDirection`](CustomMatchers.md#tohavebeencalledwithdirection)

[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/common](../README.md) / DeepReadOnly

# Type Alias: DeepReadOnly\<T\>

> **DeepReadOnly**\<`T`\> = `{ readonly [P in keyof T]: T[P] extends object ? DeepReadOnly<T[P]> : T[P] }`

Defined in: [types/common.ts:12](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/common.ts#L12)

## Type Parameters

### T

`T`

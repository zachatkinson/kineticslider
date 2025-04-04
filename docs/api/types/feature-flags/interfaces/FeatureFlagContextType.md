[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/feature-flags](../README.md) / FeatureFlagContextType

# Interface: FeatureFlagContextType

Defined in: [types/feature-flags.ts:31](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/feature-flags.ts#L31)

Context type for feature flags

## Example

```ts
Example usage
```

## Properties

### flags

> **flags**: [`FeatureFlagConfig`](../type-aliases/FeatureFlagConfig.md)

Defined in: [types/feature-flags.ts:32](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/feature-flags.ts#L32)

***

### resetFlags()

> **resetFlags**: () => `void`

Defined in: [types/feature-flags.ts:35](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/feature-flags.ts#L35)

#### Returns

`void`

***

### setAllFlags()

> **setAllFlags**: (`_value`) => `void`

Defined in: [types/feature-flags.ts:34](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/feature-flags.ts#L34)

#### Parameters

##### \_value

`boolean`

#### Returns

`void`

***

### setFlag()

> **setFlag**: (`_flag`, `_value`) => `void`

Defined in: [types/feature-flags.ts:33](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/feature-flags.ts#L33)

#### Parameters

##### \_flag

[`FeatureFlag`](../enumerations/FeatureFlag.md)

##### \_value

`boolean`

#### Returns

`void`

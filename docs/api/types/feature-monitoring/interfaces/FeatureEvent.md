[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/feature-monitoring](../README.md) / FeatureEvent

# Interface: FeatureEvent

Defined in: [types/feature-monitoring.ts:9](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/feature-monitoring.ts#L9)

## Properties

### feature

> **feature**: [`FeatureFlag`](../../feature-flags/enumerations/FeatureFlag.md)

Defined in: [types/feature-monitoring.ts:10](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/feature-monitoring.ts#L10)

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [types/feature-monitoring.ts:13](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/feature-monitoring.ts#L13)

***

### timestamp

> **timestamp**: `Date`

Defined in: [types/feature-monitoring.ts:12](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/feature-monitoring.ts#L12)

***

### type

> **type**: `"error"` \| `"usage"` \| `"latency"`

Defined in: [types/feature-monitoring.ts:11](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/feature-monitoring.ts#L11)

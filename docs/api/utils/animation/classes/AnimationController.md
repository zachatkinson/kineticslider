[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/animation](../README.md) / AnimationController

# Class: AnimationController

Defined in: [utils/animation.ts:21](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/animation.ts#L21)

Animation Controller class that follows cursor rules for GSAP
- Timeline management
- Performance optimization
- Memory management
- Best practices

## Example

```ts
Example usage
```

## Constructors

### Constructor

> **new AnimationController**(`defaultConfig`): `AnimationController`

Defined in: [utils/animation.ts:29](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/animation.ts#L29)

#### Parameters

##### defaultConfig

`Partial`\<[`ExtendedAnimationConfig`](../../../types/animation/interfaces/ExtendedAnimationConfig.md)\> = `{}`

#### Returns

`AnimationController`

## Properties

### defaultConfig

> `private` **defaultConfig**: `Partial`\<[`ExtendedAnimationConfig`](../../../types/animation/interfaces/ExtendedAnimationConfig.md)\>

Defined in: [utils/animation.ts:24](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/animation.ts#L24)

***

### timelines

> `private` **timelines**: `Map`\<`string`, `Timeline`\>

Defined in: [utils/animation.ts:22](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/animation.ts#L22)

***

### tweens

> `private` **tweens**: `Map`\<`string`, `Tween`\>

Defined in: [utils/animation.ts:23](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/animation.ts#L23)

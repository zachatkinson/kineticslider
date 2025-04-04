[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/browserSupport](../README.md) / ResizeObserverFallback

# Class: ResizeObserverFallback

Defined in: [utils/browserSupport.ts:69](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/browserSupport.ts#L69)

## Example

```ts
Example usage
```

## Constructors

### Constructor

> **new ResizeObserverFallback**(`callback`): `ResizeObserverFallback`

Defined in: [utils/browserSupport.ts:78](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/browserSupport.ts#L78)

#### Parameters

##### callback

[`ResizeObserverCallback`](../../../types/browser/type-aliases/ResizeObserverCallback.md)

#### Returns

`ResizeObserverFallback`

## Properties

### callback

> `private` **callback**: [`ResizeObserverCallback`](../../../types/browser/type-aliases/ResizeObserverCallback.md)

Defined in: [utils/browserSupport.ts:71](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/browserSupport.ts#L71)

***

### elements

> `private` **elements**: `Set`\<`Element`\>

Defined in: [utils/browserSupport.ts:70](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/browserSupport.ts#L70)

***

### rafId

> `private` **rafId**: `null` \| `number`

Defined in: [utils/browserSupport.ts:72](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/browserSupport.ts#L72)

***

### sizes

> `private` **sizes**: `Map`\<`Element`, \{ `height`: `number`; `width`: `number`; \}\>

Defined in: [utils/browserSupport.ts:73](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/browserSupport.ts#L73)

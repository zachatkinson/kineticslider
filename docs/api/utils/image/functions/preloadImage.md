[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/image](../README.md) / \_preloadImage

# Function: \_preloadImage()

> **\_preloadImage**(`src`, `options`): () => `unknown`

Defined in: [utils/image.ts:13](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/image.ts#L13)

Preloads an image and tracks its loading state

## Parameters

### src

`string`

The source URL of the image to preload

### options

[`PreloadImageOptions`](../../../types/image/interfaces/PreloadImageOptions.md) = `{}`

Configuration options for preloading

## Returns

`Function`

A cleanup function to abort loading if needed

### Returns

`unknown`

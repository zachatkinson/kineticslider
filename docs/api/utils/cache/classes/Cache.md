[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [utils/cache](../README.md) / Cache

# Class: Cache\<T\>

Defined in: [utils/cache.ts:19](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/cache.ts#L19)

Generic cache implementation with TTL and size limits

## Example

```ts
Example usage
```

## Extended by

- [`ValidationCache`](ValidationCache.md)

## Type Parameters

### T

`T`

## Constructors

### Constructor

> **new Cache**\<`T`\>(): `Cache`\<`T`\>

#### Returns

`Cache`\<`T`\>

## Properties

### cache

> `private` **cache**: `Map`\<`string`, [`CacheEntry`](../../../types/cache/interfaces/CacheEntry.md)\<`T`\>\>

Defined in: [utils/cache.ts:20](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/cache.ts#L20)

***

### options

> `private` **options**: [`CacheOptions`](../../../types/cache/interfaces/CacheOptions.md)

Defined in: [utils/cache.ts:21](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/utils/cache.ts#L21)

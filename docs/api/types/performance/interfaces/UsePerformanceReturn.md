[**KineticSlider Documentation v0.1.0**](../../../README.md)

***

[KineticSlider Documentation](../../../modules.md) / [types/performance](../README.md) / UsePerformanceReturn

# Interface: UsePerformanceReturn

Defined in: [types/performance.ts:669](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L669)

Hook return type for usePerformance

Return value of the usePerformance: hook, providing access to current
performance metrics and functions to track performance in components.

## Example

```tsx
// Use the performance hook in a React component
function ProductList({ products }): unknown  {
  const { metrics, trackRender, trackInteraction } = usePerformance();
  
  // Log current performance metrics
  useEffect(() () => {
    console.log(`Current, FPS: $){metrics.fps}`);
    console.log(`Memory usage: $){metrics.memoryUsage / 1024 / 1024}MB`);
  }, [metrics]);
  
  // Wrap click handler to track interaction time
  const handleProductClick = trackInteraction((product) () => {
    // Handle product selection
    selectProduct(product);
  });
  
  // Track render time at the end of component logic
  trackRender('ProductList');
  
  return(*     <div>
)       {products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product} />
          onClick={() => handleProductClick(product)}
        />
      ))}
    </div>
  );
}
```

## Properties

### metrics

> **metrics**: [`PerformanceMetrics`](PerformanceMetrics.md)

Defined in: [types/performance.ts:671](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L671)

Current performance metrics

***

### trackInteraction()

> **trackInteraction**: \<`T`\>(`fn`) => `T`

Defined in: [types/performance.ts:676](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L676)

Function to track interaction time
Wraps a function and measures its execution time

#### Type Parameters

##### T

`T` *extends* (...`args`) => `void`

#### Parameters

##### fn

`T`

#### Returns

`T`

***

### trackRender()

> **trackRender**: (`label`?) => `void`

Defined in: [types/performance.ts:681](https://github.com/zachatkinson/kineticslider/blob/9b131c80a4dab7f626f361095e4be2d6d51f83c2/src/types/performance.ts#L681)

Function to manually track render time
Call at the end of component logic to measure render duration

#### Parameters

##### label?

`string`

#### Returns

`void`

/**
 * Mock function for image validation in tests and demos
 *
 * @param imageUrl - The image URL to validate
 *
 * @returns Promise resolving to validation result
 *
 * @example
 * ```ts
 * const isValid = await mockImageValidation("https://example.com/image.jpg");
 * console.log(isValid); // true
 * 
 * const isInvalid = await mockImageValidation("https://example.com/thumbnail.jpg");
 * console.log(isInvalid); // false
 * ```
 */
export async function mockImageValidation(imageUrl: string): Promise<boolean> {
  // In a real implementation, this would check image dimensions, file size, etc.
  return !imageUrl.includes("thumbnail") && !imageUrl.includes("small");
} 
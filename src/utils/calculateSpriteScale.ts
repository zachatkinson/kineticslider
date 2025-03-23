/**
 * Calculate the appropriate scale for a sprite to fit in a container while maintaining aspect ratio
 *
 * @param imageWidth - Width of the image
 * @param imageHeight - Height of the image
 * @param containerWidth - Width of the container
 * @param containerHeight - Height of the container
 * @returns Object containing scale value and baseScale for reference
 */
export const calculateSpriteScale = (
    imageWidth: number,
    imageHeight: number,
    containerWidth: number,
    containerHeight: number
): { scale: number; baseScale: number } => {
    // Ensure dimensions are valid numbers
    if (!imageWidth || !imageHeight || !containerWidth || !containerHeight) {
        console.warn("Invalid dimensions for sprite scaling, using fallback scale 1");
        return { scale: 1, baseScale: 1 };
    }

    // Calculate aspect ratios
    const imageAspect = imageWidth / imageHeight;
    const containerAspect = containerWidth / containerHeight;

    let scale: number;

    // Determine which dimension (width or height) is the constraint
    if (imageAspect > containerAspect) {
        // Image is wider relative to container, so height is the constraint
        scale = containerHeight / imageHeight;
    } else {
        // Image is taller relative to container, so width is the constraint
        scale = containerWidth / imageWidth;
    }

    // Add padding to prevent edge cases
    scale = scale * 0.95; // 5% padding

    // Log scale calculation
    console.log(
        `Scale calculation: Image (${imageWidth}x${imageHeight}), Container (${containerWidth}x${containerHeight}), Scale: ${scale}`
    );

    return {
        scale,
        baseScale: scale
    };
};
/**
 * Calculates the scale factor for an image to fit inside a container
 * while preserving its aspect ratio.
 *
 * @param imageWidth - The width of the image.
 * @param imageHeight - The height of the image.
 * @param containerWidth - The width of the container.
 * @param containerHeight - The height of the container.
 * @returns The scale factor to apply to the image.
 */
export function calculateSpriteScale(
    imageWidth: number,
    imageHeight: number,
    containerWidth: number,
    containerHeight: number
): number {
    const imageAspect = imageWidth / imageHeight;
    const containerAspect = containerWidth / containerHeight;

    if (imageAspect > containerAspect) {
        return containerHeight / imageHeight;
    } else {
        return containerWidth / imageWidth;
    }
}
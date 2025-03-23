/**
 * Texture Atlas Generator for KineticSlider
 *
 * This script generates texture atlases from individual image files.
 * It packages multiple images into a single atlas image and generates
 * a JSON file with the coordinates of each image within the atlas.
 *
 * Usage:
 *   node generateAtlas.cjs [options] [files...]
 *
 * Options:
 *   --input, -i      Directory containing images to pack (can be omitted if files are provided)
 *   --output, -o     Output directory for atlas files (default: "public/atlas")
 *   --name, -n       Base name for the atlas files (default: "atlas")
 *   --size, -s       Maximum atlas size (default: "4096x4096")
 *   --padding, -p    Padding between images (default: 2)
 *   --pot            Force power-of-two dimensions (default: true)
 *   --preserve-paths Preserve original paths in frame keys (default: false)
 *   --path-prefix    Prefix for paths when --preserve-paths is used (default: "")
 *   --help, -h       Show help
 *
 * Examples:
 *   // Process a directory of images
 *   node generateAtlas.cjs --input=public/images/slides --name=slides-atlas
 *
 *   // Process specific image files with path preservation
 *   node generateAtlas.cjs --output=public/atlas --name=effects-atlas --preserve-paths public/images/effect1.png public/images/effect2.png
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments with support for both named options and file arguments
const argv = yargs(hideBin(process.argv))
    .option('input', {
        alias: 'i',
        description: 'Directory containing images to pack',
        type: 'string'
    })
    .option('output', {
        alias: 'o',
        description: 'Output directory for atlas files',
        type: 'string',
        default: 'public/atlas'
    })
    .option('name', {
        alias: 'n',
        description: 'Base name for the atlas files',
        type: 'string',
        default: 'atlas'
    })
    .option('size', {
        alias: 's',
        description: 'Maximum atlas size',
        type: 'string',
        default: '4096x4096'
    })
    .option('padding', {
        alias: 'p',
        description: 'Padding between images',
        type: 'number',
        default: 2
    })
    .option('pot', {
        description: 'Force power-of-two dimensions',
        type: 'boolean',
        default: true
    })
    .option('trim', {
        description: 'Trim transparent pixels from images',
        type: 'boolean',
        default: false
    })
    .option('preserve-paths', {
        description: 'Preserve original paths in frame keys',
        type: 'boolean',
        default: false
    })
    .option('path-prefix', {
        description: 'Prefix for paths when --preserve-paths is used',
        type: 'string',
        default: ''
    })
    .option('verbose', {
        alias: 'v',
        description: 'Show detailed output',
        type: 'boolean',
        default: false
    })
    .help()
    .alias('help', 'h')
    .example('node generateAtlas.cjs --input=public/images/slides --name=slides-atlas', 'Process a directory of images')
    .example('node generateAtlas.cjs --output=public/atlas --name=effects-atlas --preserve-paths public/images/effect1.png public/images/effect2.png', 'Process specific image files with path preservation')
    .argv;

// Extract max width and height from size option
const [maxWidth, maxHeight] = argv.size.split('x').map(Number);
console.log(`Using maximum atlas dimensions: ${maxWidth}x${maxHeight}`);

// Ensure output directory exists
if (!fs.existsSync(argv.output)) {
    fs.mkdirSync(argv.output, { recursive: true });
    console.log(`Created output directory: ${argv.output}`);
}

/**
 * Get the next power of two greater than or equal to the input value
 */
function nextPowerOfTwo(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Trim transparent pixels from an image
 * Returns the trimmed image and the trim data
 */
async function trimImage(imagePath) {
    try {
        const img = await loadImage(imagePath);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');

        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;

        // Find the bounds of the non-transparent pixels
        let left = img.width;
        let right = 0;
        let top = img.height;
        let bottom = 0;

        // Scan the image data
        for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
                const alpha = data[(y * img.width + x) * 4 + 3];
                if (alpha > 0) {
                    left = Math.min(left, x);
                    right = Math.max(right, x);
                    top = Math.min(top, y);
                    bottom = Math.max(bottom, y);
                }
            }
        }

        // Check if the image has any non-transparent pixels
        if (left > right || top > bottom) {
            return {
                trimmed: false,
                image: img,
                trim: {
                    x: 0,
                    y: 0,
                    width: img.width,
                    height: img.height
                }
            };
        }

        // Calculate the dimensions of the trimmed image
        const width = right - left + 1;
        const height = bottom - top + 1;

        // Create a new canvas for the trimmed image
        const trimmedCanvas = createCanvas(width, height);
        const trimmedCtx = trimmedCanvas.getContext('2d');

        // Draw the trimmed image
        trimmedCtx.drawImage(img, left, top, width, height, 0, 0, width, height);

        return {
            trimmed: true,
            image: await loadImage(trimmedCanvas.toBuffer()),
            trim: {
                x: left,
                y: top,
                width,
                height
            },
            originalSize: {
                width: img.width,
                height: img.height
            }
        };
    } catch (error) {
        console.error(`Error trimming image ${imagePath}:`, error);
        // Fall back to loading the original image
        const img = await loadImage(imagePath);
        return {
            trimmed: false,
            image: img,
            trim: {
                x: 0,
                y: 0,
                width: img.width,
                height: img.height
            }
        };
    }
}

/**
 * Get a normalized frame key for the image path
 * Based on the preserve-paths option, either uses the full path or just the filename
 */
function getFrameKey(imagePath) {
    if (argv['preserve-paths']) {
        // Use the original path, optionally with a prefix
        // If we have a prefix, ensure we don't have double slashes
        const prefix = argv['path-prefix'] ? argv['path-prefix'].replace(/\/$/, '') + '/' : '';

        // Remove any "public" prefix if present, as this is typically not part of the URL path
        let normalizedPath = imagePath.replace(/^public\//, '');

        // Normalize path separators to forward slashes
        normalizedPath = normalizedPath.replace(/\\/g, '/');

        // Combine prefix and normalized path
        return prefix + normalizedPath;
    } else {
        // Just use the filename without any path
        return path.basename(imagePath);
    }
}

/**
 * Find all image files to process based on command line arguments
 * Can handle both directory input and individual files
 */
function findImageFiles() {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    let imagePaths = [];

    try {
        // Check if individual files were provided as arguments
        const fileArgs = argv._;
        if (fileArgs && fileArgs.length > 0) {
            imagePaths = fileArgs.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return imageExtensions.includes(ext) && fs.existsSync(file);
            });

            if (imagePaths.length > 0) {
                console.log(`Found ${imagePaths.length} images from command line arguments`);
                return imagePaths;
            }
        }

        // If no valid files were provided or found, check input directory
        if (argv.input) {
            if (!fs.existsSync(argv.input)) {
                console.error(`Input directory not found: ${argv.input}`);
                process.exit(1);
            }

            const files = fs.readdirSync(argv.input);
            imagePaths = files
                .filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return imageExtensions.includes(ext);
                })
                .map(file => path.join(argv.input, file));

            console.log(`Found ${imagePaths.length} images in directory: ${argv.input}`);
            return imagePaths;
        }

        // No valid inputs found
        console.error('No input directory or image files specified. Use --input or provide file paths.');
        process.exit(1);
    } catch (error) {
        console.error('Error finding image files:', error);
        process.exit(1);
    }
}

/**
 * Simulate packing to verify atlas size is sufficient
 * Returns true if all images fit, false otherwise
 */
function verifyAtlasFit(images, atlasWidth, atlasHeight, padding) {
    let currentX = padding;
    let currentY = padding;
    let rowHeight = 0;

    for (const img of images) {
        const width = img.image.width;
        const height = img.image.height;

        // Check if we need to move to the next row
        if (currentX + width + padding > atlasWidth) {
            currentX = padding;
            currentY += rowHeight + padding;
            rowHeight = 0;
        }

        // Check if we've exceeded the atlas height
        if (currentY + height + padding > atlasHeight) {
            return false; // Won't fit
        }

        // Update position and row height
        currentX += width + padding;
        rowHeight = Math.max(rowHeight, height);
    }

    return true; // All images fit
}

/**
 * Calculate optimal atlas dimensions based on image sizes
 */
function calculateAtlasDimensions(images, padding) {
    // Get total area and maximum dimensions
    let totalArea = 0;
    let maxImgWidth = 0;
    let maxImgHeight = 0;

    for (const img of images) {
        const paddedWidth = img.image.width + padding * 2;
        const paddedHeight = img.image.height + padding * 2;
        totalArea += paddedWidth * paddedHeight;
        maxImgWidth = Math.max(maxImgWidth, paddedWidth);
        maxImgHeight = Math.max(maxImgHeight, paddedHeight);
    }

    // Calculate total images and average aspect ratio
    const totalImages = images.length;
    const avgAspectRatio = images.reduce((sum, img) =>
        sum + (img.image.width / img.image.height), 0) / totalImages;

    // Safety factor to ensure images fit
    const safetyFactor = 1.2; // Add 20% extra space

    // Estimate initial dimensions
    let atlasWidth, atlasHeight;

    // For very wide images, create vertically-oriented atlas
    if (avgAspectRatio > 2) {
        atlasWidth = Math.min(maxWidth, nextPowerOfTwo(maxImgWidth));
        const estRows = Math.ceil(totalImages);
        atlasHeight = Math.min(maxHeight, nextPowerOfTwo(estRows * (maxImgHeight + padding) * safetyFactor));
    }
    // For very tall images, create horizontally-oriented atlas
    else if (avgAspectRatio < 0.5) {
        atlasHeight = Math.min(maxHeight, nextPowerOfTwo(maxImgHeight));
        const estColumns = Math.ceil(totalImages);
        atlasWidth = Math.min(maxWidth, nextPowerOfTwo(estColumns * (maxImgWidth + padding) * safetyFactor));
    }
    // For more square-like images, use square-ish atlas
    else {
        // Calculate total padded area (accounting for padding between all images)
        const paddedArea = totalArea * safetyFactor;

        // Calculate minimum width needed for a single row of images
        const minWidth = Math.max(
            maxImgWidth,
            totalImages * (maxImgWidth + padding) - padding // last image doesn't need right padding
        );

        // Start with a square-ish atlas
        atlasWidth = Math.min(maxWidth, Math.max(minWidth, Math.ceil(Math.sqrt(paddedArea))));
        atlasHeight = Math.min(maxHeight, Math.ceil(paddedArea / atlasWidth));
    }

    // Ensure minimum size can fit at least one image with padding
    atlasWidth = Math.max(atlasWidth, maxImgWidth);
    atlasHeight = Math.max(atlasHeight, maxImgHeight);

    // Ensure dimensions are power-of-two if requested
    if (argv.pot) {
        atlasWidth = nextPowerOfTwo(atlasWidth);
        atlasHeight = nextPowerOfTwo(atlasHeight);
    }

    // Enforce max dimensions
    atlasWidth = Math.min(atlasWidth, maxWidth);
    atlasHeight = Math.min(atlasHeight, maxHeight);

    // Verify the calculated size is sufficient
    if (!verifyAtlasFit(images, atlasWidth, atlasHeight, padding)) {
        // If not big enough, try to double the size
        if (atlasWidth < maxWidth) {
            atlasWidth = Math.min(maxWidth, atlasWidth * 2);
        } else if (atlasHeight < maxHeight) {
            atlasHeight = Math.min(maxHeight, atlasHeight * 2);
        }

        // Check again after resizing
        if (!verifyAtlasFit(images, atlasWidth, atlasHeight, padding)) {
            console.warn(`Warning: calculated atlas size ${atlasWidth}x${atlasHeight} may not fit all images.`);
        }
    }

    console.log(`Calculated atlas dimensions: ${atlasWidth}x${atlasHeight} (avg aspect ratio: ${avgAspectRatio.toFixed(2)})`);

    return { atlasWidth, atlasHeight };
}

/**
 * Pack images into an atlas using a simple bin-packing algorithm
 */
async function packImages(imagePaths) {
    // Load and process all images
    console.log('Loading and processing images...');

    const images = [];
    for (const imagePath of imagePaths) {
        try {
            // Get the frame key based on current options
            const frameKey = getFrameKey(imagePath);

            // Process the image based on options
            let imgData;
            if (argv.trim) {
                imgData = await trimImage(imagePath);
            } else {
                const img = await loadImage(imagePath);
                imgData = {
                    trimmed: false,
                    image: img,
                    trim: {
                        x: 0,
                        y: 0,
                        width: img.width,
                        height: img.height
                    },
                    originalSize: {
                        width: img.width,
                        height: img.height
                    }
                };
            }

            images.push({
                path: imagePath,
                frameKey,
                ...imgData
            });

            if (argv.verbose) {
                console.log(`Loaded image: ${frameKey} (${imgData.image.width}x${imgData.image.height})`);
            }
        } catch (error) {
            console.error(`Error loading image ${imagePath}:`, error);
        }
    }

    // Sort images by height (typically gives better packing)
    images.sort((a, b) => b.image.height - a.image.height);

    // Initialize atlas data
    const atlas = {
        frames: {},
        meta: {
            app: "KineticSlider Atlas Generator",
            version: "1.0.0",
            format: "RGBA8888",
            size: { w: 0, h: 0 },
            scale: 1,
            preservePaths: argv['preserve-paths']
        }
    };

    // Calculate optimal atlas dimensions
    const { atlasWidth, atlasHeight } = calculateAtlasDimensions(images, argv.padding);

    // Initialize the atlas canvas
    const canvas = createCanvas(atlasWidth, atlasHeight);
    const ctx = canvas.getContext('2d');

    // Clear the canvas with transparent pixels
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Perform the actual packing
    console.log(`Packing images into ${atlasWidth}x${atlasHeight} atlas...`);

    // Simple row-based packing algorithm
    let currentX = argv.padding;
    let currentY = argv.padding;
    let rowHeight = 0;
    let imagesProcessed = 0;

    // Pack each image
    for (const img of images) {
        const width = img.image.width;
        const height = img.image.height;

        // Check if we need to move to the next row
        if (currentX + width + argv.padding > atlasWidth) {
            currentX = argv.padding;
            currentY += rowHeight + argv.padding;
            rowHeight = 0;
        }

        // Check if we've exceeded the atlas height
        if (currentY + height + argv.padding > atlasHeight) {
            console.error(`Atlas dimensions too small for all images! Only packed ${imagesProcessed} of ${images.length}`);
            break;
        }

        // Store image info in the atlas data using the appropriate frame key
        atlas.frames[img.frameKey] = {
            frame: {
                x: currentX,
                y: currentY,
                w: width,
                h: height
            },
            rotated: false,
            trimmed: img.trimmed,
            sourceSize: {
                w: img.originalSize ? img.originalSize.width : width,
                h: img.originalSize ? img.originalSize.height : height
            }
        };

        // If the image was trimmed, add the spriteSourceSize info
        if (img.trimmed) {
            atlas.frames[img.frameKey].spriteSourceSize = {
                x: img.trim.x,
                y: img.trim.y,
                w: img.trim.width,
                h: img.trim.height
            };
        }

        // Draw the image on the atlas
        ctx.drawImage(img.image, currentX, currentY);
        imagesProcessed++;

        if (argv.verbose) {
            console.log(`Packed ${img.frameKey} at [${currentX}, ${currentY}]`);
        }

        // Update position and row height
        currentX += width + argv.padding;
        rowHeight = Math.max(rowHeight, height);
    }

    // Update atlas size metadata
    atlas.meta.size = {
        w: atlasWidth,
        h: atlasHeight
    };

    // Set the output image filename
    atlas.meta.image = `${argv.name}.png`;

    // Add path preservation metadata
    if (argv['preserve-paths']) {
        atlas.meta.pathPrefix = argv['path-prefix'] || '';
    }

    return {
        atlas,
        canvas,
        imagesProcessed,
        totalImages: images.length
    };
}

/**
 * Save the atlas image and JSON data
 */
async function saveAtlas(atlas, canvas) {
    const jsonPath = path.join(argv.output, `${argv.name}.json`);
    const imagePath = path.join(argv.output, `${argv.name}.png`);

    // Save JSON data
    fs.writeFileSync(jsonPath, JSON.stringify(atlas, null, 2));
    console.log(`Saved atlas JSON to ${jsonPath}`);

    // Save image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(imagePath, buffer);
    console.log(`Saved atlas image to ${imagePath}`);
}

/**
 * Main function to generate the atlas
 */
async function generateAtlas() {
    try {
        console.log('Starting atlas generation...');

        if (argv['preserve-paths']) {
            console.log('Path preservation enabled. Using full paths as frame keys.');
            if (argv['path-prefix']) {
                console.log(`Using path prefix: "${argv['path-prefix']}"`);
            }
        }

        // Find image files using the enhanced function
        const imagePaths = findImageFiles();
        console.log(`Found ${imagePaths.length} images to process`);

        if (imagePaths.length === 0) {
            console.error('No images found to process!');
            process.exit(1);
        }

        // Pack images
        const { atlas, canvas, imagesProcessed, totalImages } = await packImages(imagePaths);

        // Save the atlas
        await saveAtlas(atlas, canvas);

        if (imagesProcessed < totalImages) {
            console.warn(`Warning: Only packed ${imagesProcessed} of ${totalImages} images. Consider using a larger atlas size.`);
        }

        console.log(`Atlas generation complete! Successfully packed ${imagesProcessed} images.`);
    } catch (error) {
        console.error('Error generating atlas:', error);
        process.exit(1);
    }
}

// Run the generator
generateAtlas();
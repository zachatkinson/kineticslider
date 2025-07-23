# KineticSlider Configuration Templates

Ready-to-use configuration templates for common use cases. Copy and paste these templates into your project and customize as needed.

## Table of Contents

1. [Basic Templates](#basic-templates)
2. [E-commerce Templates](#e-commerce-templates)
3. [Portfolio Templates](#portfolio-templates)
4. [Marketing Templates](#marketing-templates)
5. [Accessibility Templates](#accessibility-templates)
6. [Performance Templates](#performance-templates)
7. [Responsive Templates](#responsive-templates)
8. [Advanced Templates](#advanced-templates)

---

## Basic Templates

### Simple Image Gallery

```typescript
import { KineticSlider, type SliderConfig } from 'kinetic-slider';

const basicGalleryConfig: SliderConfig = {
  slides: [
    { 
      id: 'image1', 
      src: '/images/gallery/image1.jpg',
      alt: 'Beautiful landscape with mountains and lake',
      title: 'Mountain Lake Vista'
    },
    { 
      id: 'image2', 
      src: '/images/gallery/image2.jpg',
      alt: 'Sunset over the ocean with palm trees',
      title: 'Tropical Sunset'
    },
    { 
      id: 'image3', 
      src: '/images/gallery/image3.jpg',
      alt: 'City skyline at dusk with lights reflecting',
      title: 'Urban Evening'
    }
  ]
};

// Initialize
const slider = new KineticSlider();
await slider.initialize(basicGalleryConfig, document.getElementById('gallery'));
```

### Auto-Playing Slideshow

```typescript
const slideshowConfig: SliderConfig = {
  slides: [
    { id: 'slide1', src: '/images/slideshow/slide1.jpg', alt: 'Welcome slide' },
    { id: 'slide2', src: '/images/slideshow/slide2.jpg', alt: 'Feature slide' },
    { id: 'slide3', src: '/images/slideshow/slide3.jpg', alt: 'Call to action slide' }
  ],
  
  // Auto-play settings
  autoPlay: true,
  autoPlayInterval: 5000,
  loop: true,
  
  // User interaction
  pauseOnHover: true,
  pauseOnFocus: true,
  pauseOnInteraction: true,
  
  // Smooth transitions
  duration: 800,
  easing: 'power2.inOut'
};
```

### Interactive Touch Gallery

```typescript
const touchGalleryConfig: SliderConfig = {
  slides: [
    { id: 'photo1', src: '/photos/photo1.jpg', alt: 'Photo 1' },
    { id: 'photo2', src: '/photos/photo2.jpg', alt: 'Photo 2' },
    { id: 'photo3', src: '/photos/photo3.jpg', alt: 'Photo 3' }
  ],
  
  // Disable auto-play for user control
  autoPlay: false,
  interactive: true,
  
  // Optimized for touch
  physics: {
    swipeThreshold: 30,        // Lower threshold for easier swiping
    momentumDamping: 0.85,     // Smooth momentum
    scaleIntensity: 0.05       // Subtle scale effect
  },
  
  // Input configuration
  input: {
    enableTouch: true,
    enableMouse: true,
    enableKeyboard: true,
    dragThreshold: 5
  }
};
```

---

## E-commerce Templates

### Product Showcase

```typescript
const productShowcaseConfig: SliderConfig = {
  slides: [
    {
      id: 'product-main',
      src: '/products/shoe-front.jpg',
      alt: 'Nike Air Max front view',
      title: 'Front View',
      metadata: {
        description: 'Main product image showing front design',
        priority: 1,
        data: { view: 'front', isMain: true }
      }
    },
    {
      id: 'product-side',
      src: '/products/shoe-side.jpg',
      alt: 'Nike Air Max side profile',
      title: 'Side Profile',
      metadata: {
        description: 'Side view showcasing the profile and sole',
        priority: 2,
        data: { view: 'side' }
      }
    },
    {
      id: 'product-back',
      src: '/products/shoe-back.jpg',
      alt: 'Nike Air Max heel detail',
      title: 'Heel Detail',
      metadata: {
        description: 'Back view showing heel design and branding',
        priority: 3,
        data: { view: 'back' }
      }
    }
  ],
  
  // E-commerce optimized settings
  autoPlay: false,  // Let users control viewing
  loop: false,      // Linear progression through views
  
  // Quick transitions for product browsing
  duration: 400,
  easing: 'power2.out',
  
  // Preload for instant switching
  preloadCount: 3,
  
  // Accessibility for e-commerce
  accessibility: {
    screenReader: true,
    keyboardNavigation: true,
    ariaLabels: {
      sliderLabel: 'Product image gallery',
      slideLabel: 'Product view {index} of {total}: {title}',
      previousButton: 'Previous product view',
      nextButton: 'Next product view'
    }
  }
};
```

### Category Banner Carousel

```typescript
const categoryBannerConfig: SliderConfig = {
  slides: [
    {
      id: 'category-mens',
      src: '/banners/mens-collection.jpg',
      alt: 'Men\'s fashion collection banner',
      title: 'Men\'s Collection',
      metadata: {
        data: { 
          category: 'mens',
          link: '/collections/mens',
          sale: true 
        }
      }
    },
    {
      id: 'category-womens',
      src: '/banners/womens-collection.jpg',
      alt: 'Women\'s fashion collection banner',
      title: 'Women\'s Collection',
      metadata: {
        data: { 
          category: 'womens',
          link: '/collections/womens',
          sale: false 
        }
      }
    },
    {
      id: 'category-accessories',
      src: '/banners/accessories-collection.jpg',
      alt: 'Accessories collection banner',
      title: 'Accessories',
      metadata: {
        data: { 
          category: 'accessories',
          link: '/collections/accessories',
          sale: true 
        }
      }
    }
  ],
  
  // Auto-rotate banners
  autoPlay: true,
  autoPlayInterval: 6000,
  loop: true,
  
  // Pause on interaction
  pauseOnHover: true,
  
  // Smooth, professional transitions
  duration: 1000,
  easing: 'power2.inOut',
  
  // Performance optimization
  preloadCount: 2,
  memoryManagement: {
    maxMemoryUsage: 256,
    autoGarbageCollection: true
  }
};
```

---

## Portfolio Templates

### Photography Portfolio

```typescript
const photographyPortfolioConfig: SliderConfig = {
  slides: [
    {
      id: 'portfolio-landscape-1',
      src: '/portfolio/landscape-yosemite.jpg',
      alt: 'Yosemite Valley at sunrise with Half Dome visible',
      title: 'Yosemite Sunrise',
      metadata: {
        description: 'Early morning light illuminating Yosemite Valley',
        tags: ['landscape', 'nature', 'california', 'sunrise'],
        data: {
          location: 'Yosemite National Park',
          camera: 'Canon EOS R5',
          settings: 'f/8, 1/250s, ISO 100',
          date: '2023-05-15'
        }
      }
    },
    {
      id: 'portfolio-portrait-1',
      src: '/portfolio/portrait-musician.jpg',
      alt: 'Professional headshot of jazz musician with saxophone',
      title: 'Jazz Portrait',
      metadata: {
        description: 'Studio portrait of professional jazz saxophonist',
        tags: ['portrait', 'music', 'studio', 'professional'],
        data: {
          location: 'Studio',
          camera: 'Canon EOS R5',
          settings: 'f/2.8, 1/160s, ISO 200',
          date: '2023-06-02'
        }
      }
    },
    {
      id: 'portfolio-street-1',
      src: '/portfolio/street-tokyo.jpg',
      alt: 'Busy Tokyo street at night with neon signs reflecting on wet pavement',
      title: 'Tokyo Nights',
      metadata: {
        description: 'Street photography capturing Tokyo\'s vibrant nightlife',
        tags: ['street', 'urban', 'tokyo', 'night', 'neon'],
        data: {
          location: 'Shibuya, Tokyo',
          camera: 'Sony A7III',
          settings: 'f/1.8, 1/60s, ISO 1600',
          date: '2023-08-20'
        }
      }
    }
  ],
  
  // Portfolio viewing experience
  autoPlay: false,        // User-controlled viewing
  interactive: true,
  loop: false,           // Linear progression
  
  // Cinematic transitions
  duration: 800,
  easing: 'power2.inOut',
  
  // High-quality rendering
  rendering: {
    width: 1920,
    height: 1080,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2)
  },
  
  // Enhanced physics for smooth interaction
  physics: {
    transitionDuration: 0.8,
    transitionEase: 'power2.inOut',
    swipeThreshold: 60,
    scaleIntensity: 0.02,  // Subtle scale for professional look
    momentumDamping: 0.9
  },
  
  // Accessibility
  accessibility: {
    screenReader: true,
    keyboardNavigation: true,
    ariaLabels: {
      sliderLabel: 'Photography portfolio gallery',
      slideLabel: 'Photograph {index} of {total}: {title}. {description}',
      previousButton: 'Previous photograph',
      nextButton: 'Next photograph'
    }
  }
};
```

### Design Work Showcase

```typescript
const designShowcaseConfig: SliderConfig = {
  slides: [
    {
      id: 'design-mobile-app',
      src: '/portfolio/mobile-app-design.jpg',
      alt: 'Mobile app interface design showing home screen and navigation',
      title: 'Fitness Tracking App',
      metadata: {
        description: 'Mobile app UI/UX design for fitness tracking application',
        tags: ['mobile', 'ui-design', 'fitness', 'ios'],
        data: {
          client: 'FitLife Inc.',
          year: '2023',
          tools: ['Figma', 'Sketch', 'Principle'],
          category: 'Mobile Design'
        }
      }
    },
    {
      id: 'design-website',
      src: '/portfolio/website-design.jpg',
      alt: 'Modern website design with clean layout and typography',
      title: 'E-commerce Website',
      metadata: {
        description: 'Complete website design for luxury fashion e-commerce',
        tags: ['web-design', 'e-commerce', 'luxury', 'responsive'],
        data: {
          client: 'Luxe Fashion',
          year: '2023',
          tools: ['Figma', 'Adobe XD', 'InVision'],
          category: 'Web Design'
        }
      }
    },
    {
      id: 'design-branding',
      src: '/portfolio/branding-project.jpg',
      alt: 'Complete brand identity including logo, colors, and typography',
      title: 'Brand Identity Design',
      metadata: {
        description: 'Complete brand identity design for tech startup',
        tags: ['branding', 'logo-design', 'identity', 'startup'],
        data: {
          client: 'TechStart Co.',
          year: '2023',
          tools: ['Illustrator', 'Photoshop', 'InDesign'],
          category: 'Brand Design'
        }
      }
    }
  ],
  
  // Professional presentation
  autoPlay: false,
  interactive: true,
  
  // Smooth, professional transitions
  duration: 600,
  easing: 'power2.out',
  
  // Optimized for design viewing
  rendering: {
    width: 1440,
    height: 900,
    antialias: true,
    backgroundColor: 0xf8f9fa  // Light background for design work
  },
  
  // Memory optimization for large design files
  memoryManagement: {
    maxMemoryUsage: 512,      // Higher for design images
    autoGarbageCollection: true,
    textureCacheSize: 20
  }
};
```

---

## Marketing Templates

### Hero Banner Carousel

```typescript
const heroBannerConfig: SliderConfig = {
  slides: [
    {
      id: 'hero-summer-sale',
      src: '/marketing/summer-sale-hero.jpg',
      alt: 'Summer sale banner with 50% off text and beach background',
      title: 'Summer Sale - 50% Off',
      metadata: {
        description: 'Limited time summer sale promotion',
        data: {
          campaign: 'summer-2023',
          discount: 50,
          cta: 'Shop Now',
          link: '/sale/summer'
        }
      },
      timing: {
        duration: 1200,    // Longer for important messaging
        delay: 0
      }
    },
    {
      id: 'hero-new-collection',
      src: '/marketing/new-collection-hero.jpg',
      alt: 'New fall collection showcase with models wearing latest designs',
      title: 'New Fall Collection',
      metadata: {
        description: 'Latest fall fashion collection now available',
        data: {
          campaign: 'fall-collection-2023',
          cta: 'Explore Collection',
          link: '/collections/fall-2023'
        }
      },
      timing: {
        duration: 1000,
        delay: 200
      }
    },
    {
      id: 'hero-brand-story',
      src: '/marketing/brand-story-hero.jpg',
      alt: 'Brand story image showing sustainable fashion production process',
      title: 'Our Sustainable Promise',
      metadata: {
        description: 'Learn about our commitment to sustainable fashion',
        data: {
          campaign: 'sustainability',
          cta: 'Learn More',
          link: '/sustainability'
        }
      },
      timing: {
        duration: 1000,
        delay: 100
      }
    }
  ],
  
  // Marketing-optimized settings
  autoPlay: true,
  autoPlayInterval: 8000,    // Longer intervals for reading
  loop: true,
  
  // Pause for user engagement
  pauseOnHover: true,
  pauseOnFocus: true,
  
  // Impactful transitions
  duration: 1200,
  easing: 'power2.inOut',
  
  // Enhanced visual effects
  effects: {
    opacity: 1.0,
    blur: {
      enabled: false  // Keep text readable
    },
    colorAdjustments: {
      brightness: 0.05,   // Slight brightness boost
      contrast: 0.1,      // Enhanced contrast
      saturation: 0.1     // Richer colors
    }
  },
  
  // Performance for landing pages
  preloadCount: 3,
  memoryManagement: {
    maxMemoryUsage: 256,
    autoGarbageCollection: true
  },
  
  // Accessibility for marketing content
  accessibility: {
    screenReader: true,
    keyboardNavigation: true,
    ariaLabels: {
      sliderLabel: 'Featured promotions and collections',
      slideLabel: 'Promotion {index} of {total}: {title}',
      previousButton: 'Previous promotion',
      nextButton: 'Next promotion',
      playPauseButton: 'Play or pause promotional slideshow'
    }
  }
};
```

### Testimonial Carousel

```typescript
const testimonialConfig: SliderConfig = {
  slides: [
    {
      id: 'testimonial-sarah',
      src: '/testimonials/sarah-profile.jpg',
      alt: 'Profile photo of Sarah Johnson, satisfied customer',
      title: 'Sarah Johnson',
      metadata: {
        description: 'Customer testimonial from Sarah Johnson',
        data: {
          customerName: 'Sarah Johnson',
          location: 'New York, NY',
          rating: 5,
          testimonial: 'Outstanding quality and service. The team went above and beyond to ensure our project was perfect.',
          date: '2023-08-15'
        }
      }
    },
    {
      id: 'testimonial-mike',
      src: '/testimonials/mike-profile.jpg',
      alt: 'Profile photo of Mike Chen, satisfied customer',
      title: 'Mike Chen',
      metadata: {
        description: 'Customer testimonial from Mike Chen',
        data: {
          customerName: 'Mike Chen',
          location: 'San Francisco, CA',
          rating: 5,
          testimonial: 'Incredible attention to detail and professional service. Highly recommend to anyone looking for quality work.',
          date: '2023-07-22'
        }
      }
    },
    {
      id: 'testimonial-lisa',
      src: '/testimonials/lisa-profile.jpg',
      alt: 'Profile photo of Lisa Rodriguez, satisfied customer',
      title: 'Lisa Rodriguez',
      metadata: {
        description: 'Customer testimonial from Lisa Rodriguez',
        data: {
          customerName: 'Lisa Rodriguez',
          location: 'Austin, TX',
          rating: 5,
          testimonial: 'Amazing experience from start to finish. The results exceeded our expectations in every way.',
          date: '2023-09-03'
        }
      }
    }
  ],
  
  // Testimonial-specific settings
  autoPlay: true,
  autoPlayInterval: 7000,   // Allow time to read testimonials
  loop: true,
  
  // Gentle, trustworthy transitions
  duration: 800,
  easing: 'power1.inOut',
  
  // Subtle physics for professional feel
  physics: {
    transitionDuration: 0.8,
    scaleIntensity: 0.02,   // Very subtle
    momentumDamping: 0.95
  },
  
  // Accessibility for testimonials
  accessibility: {
    screenReader: true,
    keyboardNavigation: true,
    ariaLabels: {
      sliderLabel: 'Customer testimonials',
      slideLabel: 'Testimonial {index} of {total} from {title}',
      previousButton: 'Previous testimonial',
      nextButton: 'Next testimonial'
    }
  }
};
```

---

## Accessibility Templates

### WCAG 2.1 AA Compliant Gallery

```typescript
const accessibleGalleryConfig: SliderConfig = {
  slides: [
    {
      id: 'accessible-image-1',
      src: '/gallery/nature-scene.jpg',
      alt: 'Serene mountain lake at sunset with snow-capped peaks reflected in still water, surrounded by pine trees',
      title: 'Mountain Lake Reflection',
      metadata: {
        description: 'A peaceful evening scene at a high-altitude mountain lake, perfect for nature lovers and photographers. The image captures the golden hour lighting with perfect reflections.',
        tags: ['nature', 'landscape', 'mountains', 'lake', 'sunset']
      }
    },
    {
      id: 'accessible-image-2',
      src: '/gallery/urban-architecture.jpg',
      alt: 'Modern glass skyscraper with geometric patterns and blue sky reflection, shot from ground level looking up',
      title: 'Contemporary Architecture',
      metadata: {
        description: 'An architectural study of modern urban design, showcasing the interplay between glass, steel, and natural light in contemporary city buildings.',
        tags: ['architecture', 'urban', 'modern', 'building', 'geometric']
      }
    },
    {
      id: 'accessible-image-3',
      src: '/gallery/cultural-scene.jpg',
      alt: 'Traditional Japanese garden with red maple trees, stone lantern, and wooden bridge over koi pond in autumn',
      title: 'Japanese Garden in Autumn',
      metadata: {
        description: 'A traditional Japanese garden captured during peak autumn colors, featuring classic elements of Japanese landscape design including carefully placed stones, water features, and seasonal plantings.',
        tags: ['culture', 'japanese', 'garden', 'autumn', 'traditional']
      }
    }
  ],
  
  // Accessibility-first configuration
  autoPlay: false,  // Start paused for accessibility
  interactive: true,
  
  // Sufficient timing for content consumption
  autoPlayInterval: 10000,  // 10 seconds minimum per WCAG
  
  // Always pause on interaction
  pauseOnHover: true,
  pauseOnFocus: true,
  pauseOnInteraction: true,
  
  // Gentle transitions
  duration: 800,
  easing: 'power1.out',
  
  // Respect motion preferences
  physics: {
    transitionDuration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.1 : 0.8,
    scaleIntensity: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.05
  },
  
  // Comprehensive accessibility configuration
  accessibility: {
    screenReader: true,
    keyboardNavigation: true,
    
    // Auto-detect user preferences
    reduceMotion: null,      // Will use CSS media query
    highContrast: null,      // Will use CSS media query
    
    // Focus management
    focusManagement: {
      autoFocus: true,
      trapFocus: false,
      outlineStyle: '3px solid #005fcc'  // High contrast focus outline
    },
    
    // Comprehensive ARIA labels
    ariaLabels: {
      sliderLabel: 'Accessible image gallery showcasing nature, architecture, and cultural photography',
      slideLabel: 'Image {index} of {total}: {title}. {description}',
      previousButton: 'Go to previous image in gallery',
      nextButton: 'Go to next image in gallery',
      playPauseButton: 'Start or stop automatic slideshow playback'
    }
  },
  
  // Full keyboard support
  input: {
    enableKeyboard: true,
    enableMouse: true,
    enableTouch: true
    // Keyboard controls:
    // Arrow Left/Right: Navigate slides
    // Home: First slide
    // End: Last slide
    // Space: Play/Pause
    // Escape: Stop slideshow
  }
};
```

### Screen Reader Optimized

```typescript
const screenReaderOptimizedConfig: SliderConfig = {
  slides: [
    {
      id: 'news-article-1',
      src: '/news/climate-report.jpg',
      alt: 'Infographic showing global temperature trends over the past 50 years with rising trend line highlighted in red',
      title: 'Climate Change Report 2023',
      metadata: {
        description: 'Latest climate research shows accelerating temperature increases globally. The report includes data from over 500 weather stations worldwide and projects continued warming trends through 2030.',
        data: {
          articleType: 'news',
          readingTime: '5 minutes',
          author: 'Dr. Sarah Climate',
          publishDate: '2023-09-15'
        }
      }
    },
    {
      id: 'news-article-2',
      src: '/news/tech-innovation.jpg',
      alt: 'Diagram of new quantum computer chip architecture with labeled components and data flow arrows',
      title: 'Quantum Computing Breakthrough',
      metadata: {
        description: 'Scientists achieve new milestone in quantum computing with 1000-qubit processor. This advancement could revolutionize cryptography, drug discovery, and financial modeling within the next decade.',
        data: {
          articleType: 'technology',
          readingTime: '3 minutes',
          author: 'Tech News Team',
          publishDate: '2023-09-12'
        }
      }
    }
  ],
  
  // Screen reader optimized settings
  autoPlay: false,         // Never auto-play for screen readers
  interactive: true,
  
  // No visual effects that might confuse screen readers
  effects: {
    opacity: 1.0,
    blur: { enabled: false },
    particles: { enabled: false }
  },
  
  // Instant transitions for screen readers
  duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300,
  
  // Maximum accessibility
  accessibility: {
    screenReader: true,
    keyboardNavigation: true,
    
    // Detailed ARIA labels
    ariaLabels: {
      sliderLabel: 'Latest news articles. Use arrow keys to navigate between articles.',
      slideLabel: 'Article {index} of {total}: {title}. {description}. Reading time: {readingTime}. Author: {author}.',
      previousButton: 'Read previous news article',
      nextButton: 'Read next news article'
    },
    
    // Focus management for screen readers
    focusManagement: {
      autoFocus: true,
      trapFocus: true,  // Keep focus within slider
      outlineStyle: '4px solid #0066cc'
    }
  },
  
  // Enhanced keyboard navigation
  input: {
    enableKeyboard: true,
    enableMouse: false,    // Focus on keyboard for screen readers
    enableTouch: false
  }
};
```

---

## Performance Templates

### Large Gallery Optimization (500+ Images)

```typescript
const largeGalleryConfig: SliderConfig = {
  slides: generateLargeSlideArray(500), // Helper function to generate slides
  
  // Critical performance optimizations
  enableVirtualization: true,  // Essential for large galleries
  preloadCount: 1,            // Minimal preloading
  
  // Aggressive memory management
  memoryManagement: {
    maxMemoryUsage: 128,      // Conservative limit
    autoGarbageCollection: true,
    cleanupThreshold: 0.5,    // Clean up early
    textureCacheSize: 5       // Small cache
  },
  
  // Performance-first rendering
  rendering: {
    width: 1024,              // Moderate resolution
    height: 768,
    antialias: false,         // Disable for performance
    resolution: 1,            // Standard resolution only
    backgroundColor: 0x000000
  },
  
  // Optimized animations
  duration: 200,              // Fast transitions
  easing: 'power1.out',       // Simple easing
  
  // Minimal physics
  physics: {
    transitionDuration: 0.2,
    scaleIntensity: 0,        // Disable scale effects
    momentumDamping: 0.95
  },
  
  // Disable expensive features
  effects: {
    blur: { enabled: false },
    particles: { enabled: false },
    colorAdjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0
    }
  },
  
  // Performance monitoring
  performance: {
    enabled: true,
    metrics: ['fps', 'memory', 'renderTime'],
    logging: false,  // Disable logging in production
    warnings: {
      fpsWarning: 30,
      memoryWarning: 100,
      renderTimeWarning: 16
    }
  },
  
  // Basic accessibility without performance impact
  accessibility: {
    screenReader: true,
    keyboardNavigation: true,
    ariaLabels: {
      sliderLabel: 'Large image gallery',
      slideLabel: 'Image {index} of {total}'
    }
  }
};

// Helper function to generate large slide arrays
function generateLargeSlideArray(count: number): SlideConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `image-${i + 1}`,
    src: `/images/gallery/image-${String(i + 1).padStart(4, '0')}.jpg`,
    alt: `Gallery image ${i + 1}`,
    loading: {
      lazy: true,
      priority: i < 10 ? 'high' : 'low'  // High priority for first 10 images
    }
  }));
}
```

### High-Quality Display Optimization

```typescript
const highQualityConfig: SliderConfig = {
  slides: [
    {
      id: 'hq-image-1',
      src: '/hq-images/artwork-4k-1.jpg',
      alt: 'High-resolution digital artwork with intricate details',
      title: 'Digital Masterpiece 1',
      loading: {
        priority: 'high',
        timeout: 10000  // Allow more time for large files
      }
    },
    {
      id: 'hq-image-2',
      src: '/hq-images/artwork-4k-2.jpg',
      alt: 'High-resolution digital artwork with vibrant colors',
      title: 'Digital Masterpiece 2',
      loading: {
        priority: 'high',
        timeout: 10000
      }
    }
  ],
  
  // High-quality rendering
  rendering: {
    width: 2560,              // 4K-ready
    height: 1440,
    antialias: true,          // Enable for quality
    resolution: Math.min(window.devicePixelRatio || 1, 3), // Up to 3x
    backgroundColor: 0x1a1a1a // Dark background for artwork
  },
  
  // Generous memory allocation
  memoryManagement: {
    maxMemoryUsage: 2048,     // 2GB for high-res images
    autoGarbageCollection: true,
    cleanupThreshold: 0.8,    // Allow higher usage
    textureCacheSize: 100
  },
  
  // Quality-focused settings
  preloadCount: 2,            // Preload adjacent images
  
  // Smooth, cinematic transitions
  duration: 1000,
  easing: 'power2.inOut',
  
  // Enhanced physics
  physics: {
    transitionDuration: 1.0,
    transitionEase: 'power2.inOut',
    scaleIntensity: 0.03,     // Subtle scale for quality viewing
    momentumDamping: 0.92
  },
  
  // Visual enhancements
  effects: {
    colorAdjustments: {
      brightness: 0.02,       // Slight brightness boost
      contrast: 0.05,         // Enhanced contrast
      saturation: 0.03        // Richer colors
    }
  },
  
  // Performance monitoring for quality assurance
  performance: {
    enabled: true,
    metrics: ['fps', 'memory', 'renderTime'],
    warnings: {
      fpsWarning: 50,         // Higher threshold for quality
      memoryWarning: 1500,    // Allow high memory usage
      renderTimeWarning: 25   // Allow longer render times
    }
  }
};
```

---

## Responsive Templates

### Mobile-First Responsive Gallery

```typescript
const mobileFirstConfig: SliderConfig = {
  slides: [
    { id: 'responsive-1', src: '/images/mobile/img1.jpg', alt: 'Mobile optimized image 1' },
    { id: 'responsive-2', src: '/images/mobile/img2.jpg', alt: 'Mobile optimized image 2' },
    { id: 'responsive-3', src: '/images/mobile/img3.jpg', alt: 'Mobile optimized image 3' }
  ],
  
  // Base configuration optimized for mobile
  duration: 300,
  autoPlay: false,  // Let mobile users control
  preloadCount: 1,  // Conservative mobile preloading
  
  // Mobile-optimized physics
  physics: {
    swipeThreshold: 30,       // Easy swiping on small screens
    momentumDamping: 0.9,
    scaleIntensity: 0.02,     // Subtle effects on mobile
    transitionDuration: 0.3
  },
  
  // Mobile-optimized rendering
  rendering: {
    width: 375,               // iPhone base width
    height: 667,              // iPhone base height
    resolution: 1,            // Standard resolution on mobile
    antialias: false          // Better performance
  },
  
  // Conservative memory management
  memoryManagement: {
    maxMemoryUsage: 64,       // Limited mobile memory
    autoGarbageCollection: true,
    cleanupThreshold: 0.7
  },
  
  // Responsive breakpoints
  responsive: {
    enabled: true,
    strategy: 'mobile-first',
    breakpoints: [
      {
        name: 'large-mobile',
        minWidth: 414,
        config: {
          rendering: { width: 414, height: 736 },
          memoryManagement: { maxMemoryUsage: 96 }
        }
      },
      {
        name: 'tablet-portrait',
        minWidth: 768,
        config: {
          preloadCount: 2,
          rendering: { 
            width: 768, 
            height: 1024,
            resolution: 1.5
          },
          memoryManagement: { maxMemoryUsage: 128 },
          physics: { swipeThreshold: 40 }
        }
      },
      {
        name: 'tablet-landscape',
        minWidth: 1024,
        config: {
          preloadCount: 3,
          autoPlay: true,
          autoPlayInterval: 5000,
          rendering: { 
            width: 1024, 
            height: 768,
            resolution: 2,
            antialias: true
          },
          memoryManagement: { maxMemoryUsage: 256 },
          physics: { 
            swipeThreshold: 50,
            scaleIntensity: 0.05
          }
        }
      },
      {
        name: 'desktop',
        minWidth: 1200,
        config: {
          preloadCount: 4,
          duration: 600,
          rendering: { 
            width: 1440, 
            height: 900,
            resolution: Math.min(window.devicePixelRatio || 1, 2)
          },
          memoryManagement: { maxMemoryUsage: 512 },
          physics: { 
            swipeThreshold: 60,
            scaleIntensity: 0.08,
            transitionDuration: 0.6
          },
          effects: {
            colorAdjustments: {
              contrast: 0.02,
              saturation: 0.02
            }
          }
        }
      }
    ]
  },
  
  // Touch-optimized input
  input: {
    enableTouch: true,
    enableMouse: true,
    enableKeyboard: true,
    dragThreshold: 5,         // Low threshold for responsive touch
    swipeThreshold: 30
  },
  
  // Mobile accessibility
  accessibility: {
    screenReader: true,
    keyboardNavigation: true,
    ariaLabels: {
      sliderLabel: 'Responsive image gallery',
      slideLabel: 'Image {index} of {total}'
    }
  }
};
```

### Desktop-First Responsive Template

```typescript
const desktopFirstConfig: SliderConfig = {
  slides: [
    { id: 'desktop-1', src: '/images/desktop/img1.jpg', alt: 'Desktop optimized image 1' },
    { id: 'desktop-2', src: '/images/desktop/img2.jpg', alt: 'Desktop optimized image 2' },
    { id: 'desktop-3', src: '/images/desktop/img3.jpg', alt: 'Desktop optimized image 3' }
  ],
  
  // Base configuration optimized for desktop
  autoPlay: true,
  autoPlayInterval: 4000,
  duration: 800,
  preloadCount: 5,
  
  // Desktop-optimized physics
  physics: {
    swipeThreshold: 80,
    momentumDamping: 0.85,
    scaleIntensity: 0.1,
    transitionDuration: 0.8
  },
  
  // High-quality desktop rendering
  rendering: {
    width: 1920,
    height: 1080,
    resolution: 2,
    antialias: true
  },
  
  // Generous desktop memory
  memoryManagement: {
    maxMemoryUsage: 1024,
    autoGarbageCollection: true,
    cleanupThreshold: 0.8
  },
  
  // Desktop-first responsive breakpoints
  responsive: {
    enabled: true,
    strategy: 'desktop-first',
    breakpoints: [
      {
        name: 'desktop',
        minWidth: 1200,
        config: {
          // Base desktop configuration applies here
        }
      },
      {
        name: 'laptop',
        maxWidth: 1199,
        minWidth: 992,
        config: {
          rendering: { width: 1366, height: 768 },
          preloadCount: 3,
          memoryManagement: { maxMemoryUsage: 512 }
        }
      },
      {
        name: 'tablet',
        maxWidth: 991,
        minWidth: 768,
        config: {
          autoPlay: false,
          preloadCount: 2,
          rendering: { 
            width: 768, 
            height: 1024,
            resolution: 1.5,
            antialias: false
          },
          memoryManagement: { maxMemoryUsage: 256 },
          physics: { 
            swipeThreshold: 50,
            scaleIntensity: 0.05
          }
        }
      },
      {
        name: 'mobile',
        maxWidth: 767,
        config: {
          autoPlay: false,
          preloadCount: 1,
          duration: 300,
          rendering: { 
            width: 375, 
            height: 667,
            resolution: 1,
            antialias: false
          },
          memoryManagement: { 
            maxMemoryUsage: 64,
            cleanupThreshold: 0.6
          },
          physics: { 
            swipeThreshold: 30,
            scaleIntensity: 0.02,
            transitionDuration: 0.3
          }
        }
      }
    ]
  }
};
```

---

## Advanced Templates

### Multi-Media Gallery with Lazy Loading

```typescript
const multiMediaConfig: SliderConfig = {
  slides: [
    {
      id: 'image-slide-1',
      src: '/media/image-high-res.jpg',
      alt: 'High resolution landscape photograph',
      title: 'Mountain Vista',
      loading: {
        lazy: true,
        priority: 'high',
        fallback: '/media/image-low-res.jpg',
        timeout: 8000
      },
      metadata: {
        tags: ['landscape', 'photography'],
        data: { type: 'image', filesize: '2.5MB' }
      }
    },
    {
      id: 'video-slide-1',
      src: '/media/video-poster.jpg',  // Poster image for video
      alt: 'Video thumbnail showing time-lapse of city traffic',
      title: 'City Time-lapse',
      loading: {
        lazy: true,
        priority: 'normal',
        timeout: 5000
      },
      metadata: {
        tags: ['video', 'timelapse', 'urban'],
        data: { 
          type: 'video',
          videoSrc: '/media/city-timelapse.mp4',
          duration: '30s'
        }
      }
    },
    {
      id: 'document-slide-1',
      src: '/media/document-preview.jpg',
      alt: 'Preview of research document first page',
      title: 'Research Paper',
      loading: {
        lazy: true,
        priority: 'low',
        timeout: 3000
      },
      metadata: {
        tags: ['document', 'research'],
        data: { 
          type: 'document',
          documentSrc: '/media/research-paper.pdf',
          pages: 25
        }
      }
    }
  ],
  
  // Optimized for mixed media
  preloadCount: 1,  // Conservative due to varied file sizes
  enableVirtualization: false,  // Small set, virtualization not needed
  
  // Adaptive loading based on slide type
  memoryManagement: {
    maxMemoryUsage: 512,
    autoGarbageCollection: true,
    cleanupThreshold: 0.7,
    textureCacheSize: 30
  },
  
  // Performance monitoring
  performance: {
    enabled: true,
    metrics: ['loadTime', 'memory', 'renderTime'],
    warnings: {
      memoryWarning: 400,
      loadTimeWarning: 5000  // 5 seconds max load time
    }
  },
  
  // Responsive for different media types
  rendering: {
    width: 1200,
    height: 800,
    antialias: true,
    resolution: 1.5
  },
  
  // Enhanced accessibility for mixed content
  accessibility: {
    screenReader: true,
    keyboardNavigation: true,
    ariaLabels: {
      sliderLabel: 'Mixed media gallery with images, videos, and documents',
      slideLabel: 'Media item {index} of {total}: {title}. Type: {type}',
      previousButton: 'Previous media item',
      nextButton: 'Next media item'
    }
  }
};
```

### Performance-Monitored Production Gallery

```typescript
const productionGalleryConfig: SliderConfig = {
  slides: [
    // Production slides would be loaded here
    { id: 'prod-1', src: '/prod/image1.jpg', alt: 'Production image 1' },
    { id: 'prod-2', src: '/prod/image2.jpg', alt: 'Production image 2' },
    { id: 'prod-3', src: '/prod/image3.jpg', alt: 'Production image 3' }
  ],
  
  // Production-optimized settings
  autoPlay: true,
  autoPlayInterval: 6000,
  loop: true,
  preloadCount: 2,
  
  // Memory management for production
  memoryManagement: {
    maxMemoryUsage: 256,
    autoGarbageCollection: true,
    cleanupThreshold: 0.75,
    textureCacheSize: 50
  },
  
  // Production rendering
  rendering: {
    width: 1440,
    height: 900,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2)
  },
  
  // Comprehensive performance monitoring
  performance: {
    enabled: true,
    metrics: ['fps', 'memory', 'renderTime', 'loadTime', 'animationTime'],
    logging: false,  // Disable console logging in production
    warnings: {
      fpsWarning: 45,
      memoryWarning: 200,
      renderTimeWarning: 16,
      loadTimeWarning: 3000,
      animationTimeWarning: 1000
    }
  },
  
  // Production error handling
  debug: false,  // Disable debug mode
  
  // Accessibility compliance
  accessibility: {
    screenReader: true,
    keyboardNavigation: true,
    reduceMotion: null,  // Auto-detect user preference
    highContrast: null,  // Auto-detect user preference
    ariaLabels: {
      sliderLabel: 'Featured content gallery',
      slideLabel: 'Content {index} of {total}',
      previousButton: 'Previous content',
      nextButton: 'Next content',
      playPauseButton: 'Play or pause content slideshow'
    }
  },
  
  // Responsive production settings
  responsive: {
    enabled: true,
    strategy: 'mobile-first',
    breakpoints: [
      {
        name: 'mobile',
        minWidth: 0,
        maxWidth: 767,
        config: {
          autoPlayInterval: 8000,  // Longer on mobile
          preloadCount: 1,
          rendering: { resolution: 1 },
          memoryManagement: { maxMemoryUsage: 128 }
        }
      },
      {
        name: 'tablet',
        minWidth: 768,
        maxWidth: 1023,
        config: {
          preloadCount: 2,
          rendering: { resolution: 1.5 },
          memoryManagement: { maxMemoryUsage: 192 }
        }
      },
      {
        name: 'desktop',
        minWidth: 1024,
        config: {
          preloadCount: 3,
          rendering: { resolution: 2 },
          memoryManagement: { maxMemoryUsage: 256 }
        }
      }
    ]
  }
};

// Production initialization with error handling
async function initializeProductionSlider() {
  try {
    const slider = new KineticSlider();
    
    // Monitor performance events
    slider.on('performance:warning', (data) => {
      // Send to analytics/monitoring service
      console.warn('Performance warning:', data);
      
      // Automatic performance adjustments
      if (data.metric === 'memory' && data.value > 200) {
        slider.updateConfig({
          preloadCount: 1,
          memoryManagement: { maxMemoryUsage: 128 }
        });
      }
    });
    
    slider.on('error', (error) => {
      // Error reporting for production
      console.error('Slider error:', error);
      // Report to error tracking service
    });
    
    await slider.initialize(productionGalleryConfig, document.getElementById('production-gallery'));
    
  } catch (error) {
    console.error('Failed to initialize production slider:', error);
    // Fallback to basic HTML gallery
  }
}
```

---

## Usage Instructions

### 1. Copy and Customize

Choose the template that best matches your use case and copy it to your project. Customize the slides array and configuration options to match your content and requirements.

### 2. Validation

Always validate your configuration before deployment:

```typescript
import { ConfigValidator } from 'kinetic-slider';

const validator = new ConfigValidator();
const result = validator.validateConfig(yourConfig);

if (!result.isValid) {
  console.error('Configuration errors:', result.errors);
}
```

### 3. Testing

Test your configuration across different devices and screen sizes:

```typescript
// Test responsive breakpoints
const testBreakpoints = [375, 768, 1024, 1440];
testBreakpoints.forEach(width => {
  // Resize window and test slider behavior
  window.resizeTo(width, 800);
  // Verify configuration applies correctly
});
```

### 4. Performance Monitoring

Enable performance monitoring in development:

```typescript
const developmentConfig = {
  ...yourConfig,
  performance: {
    enabled: true,
    metrics: ['fps', 'memory', 'loadTime'],
    logging: true
  },
  debug: true
};
```

### 5. Production Deployment

For production, use optimized settings:

```typescript
const productionConfig = {
  ...yourConfig,
  debug: false,
  performance: {
    enabled: true,
    logging: false  // Disable console logging
  }
};
```

---

## Template Customization Guide

### Modifying Slides

```typescript
// Add slides dynamically
const dynamicSlides = await fetchSlidesFromAPI();
config.slides = [...config.slides, ...dynamicSlides];

// Update individual slide properties
config.slides[0] = {
  ...config.slides[0],
  title: 'Updated Title',
  metadata: { ...config.slides[0].metadata, priority: 1 }
};
```

### Responsive Customization

```typescript
// Add custom breakpoint
config.responsive.breakpoints.push({
  name: 'large-desktop',
  minWidth: 1800,
  config: {
    preloadCount: 5,
    rendering: { width: 2560, height: 1440 }
  }
});
```

### Performance Tuning

```typescript
// Adjust for specific hardware
const isLowEndDevice = navigator.hardwareConcurrency <= 2;
if (isLowEndDevice) {
  config.preloadCount = 1;
  config.rendering.resolution = 1;
  config.memoryManagement.maxMemoryUsage = 64;
}
```

These templates provide a solid foundation for any KineticSlider implementation. Choose the template that best matches your use case, customize it for your content, and test thoroughly across different devices and user scenarios.
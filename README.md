# KineticSlider

A high-performance, WebGL-powered slider component using PIXI.js for stunning visual effects and smooth transitions. Features displacement effects, pixi filters, animations, and more - all optimized for modern web applications with React support.

[![npm version](https://img.shields.io/npm/v/kinetic-slider.svg)](https://www.npmjs.com/package/kinetic-slider)
[![License](https://img.shields.io/npm/l/kinetic-slider.svg)](https://github.com/yourusername/kinetic-slider/blob/main/LICENSE)

## Features

- WebGL-powered rendering with PIXI.js
- Advanced displacement effects for interactive cursor and transitions
- Customizable filters for both images and text
- Touch swipe and mouse drag support
- Keyboard navigation support
- Optimized performance with texture atlas support
- Responsive design
- TypeScript support

## Installation

```bash
npm install kinetic-slider
# or
yarn add kinetic-slider
```

## Usage

```jsx
import React from 'react';
import { KineticSlider } from 'kinetic-slider';
import 'kinetic-slider/dist/styles.css'; // If using the extracted CSS

const MySlider = () => {
  const images = [
    '/images/slide1.jpg',
    '/images/slide2.jpg',
    '/images/slide3.jpg',
  ];
  
  const texts = [
    ['Title 1', 'Subtitle for slide 1'],
    ['Title 2', 'Subtitle for slide 2'],
    ['Title 3', 'Subtitle for slide 3'],
  ];
  
  return (
    <KineticSlider
      images={images}
      texts={texts}
      cursorImgEffect={true}
      cursorTextEffect={true}
      cursorScaleIntensity={0.65}
      cursorMomentum={0.14}
    />
  );
};

export default MySlider;
```

## Advanced Configuration

The KineticSlider component accepts many configuration options:

```jsx
<KineticSlider
  // Content sources
  images={['slide1.jpg', 'slide2.jpg']}
  texts={[['Title 1', 'Subtitle 1'], ['Title 2', 'Subtitle 2']]}
  slidesBasePath="/images/"
  
  // Displacement settings
  backgroundDisplacementSpriteLocation="/images/background-displace.jpg"
  cursorDisplacementSpriteLocation="/images/cursor-displace.png"
  cursorImgEffect={true}
  cursorTextEffect={true}
  cursorScaleIntensity={0.65}
  cursorMomentum={0.14}
  
  // Text styling
  textTitleColor="white"
  textTitleSize={64}
  textTitleLetterspacing={2}
  textSubTitleColor="white"
  textSubTitleSize={24}
  textSubTitleLetterspacing={1}
  
  // Navigation settings
  externalNav={false}
  navElement={{ prev: '.main-nav.prev', next: '.main-nav.next' }}
  
  // Custom filters
  imageFilters={[
    { type: 'displacement', intensity: 0.1 },
    { type: 'blur', intensity: 0.5 }
  ]}
  textFilters={[
    { type: 'glow', intensity: 0.8 }
  ]}
/>
```

## Using Texture Atlases

For better performance, KineticSlider supports texture atlases:

```jsx
<KineticSlider
  // Same props as above
  useSlidesAtlas={true}
  slidesAtlas="slides-atlas"
  useEffectsAtlas={true}
  effectsAtlas="effects-atlas"
/>
```

You can generate texture atlases using the included script:

```bash
node src/scripts/generateAtlas.cjs --input=public/images/slides --name=slides-atlas
```

## API Reference

See [our documentation](https://github.com/yourusername/kinetic-slider) for a complete API reference.

## License

MIT © [Your Name]

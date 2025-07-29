/**
 * @fileoverview Interactive Filter Showcase
 *
 * Comprehensive filter demonstration interface that allows users to explore
 * all available filters with real-time preview and configuration options.
 *
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Application, Sprite, Assets } from 'pixi.js';
import { EffectPresets } from './effect-presets';
import { AdvancedFilterPresets } from './advanced-filter-presets';
import { FilterBrowserCompatibility } from './filter-browser-compatibility';
import type { PresetIntensity } from './effect-presets';

/**
 * Filter category for organization
 */
type FilterCategory = 
  | 'Core PIXI' 
  | 'Blur Effects' 
  | 'Color Effects' 
  | 'Distortion Effects' 
  | 'Artistic Effects' 
  | 'Special Effects';

/**
 * Filter information for showcase
 */
interface FilterInfo {
  name: string;
  category: FilterCategory;
  description: string;
  intensity: PresetIntensity;
  enabled: boolean;
}

/**
 * Props for FilterShowcase component
 */
interface FilterShowcaseProps {
  imageUrl?: string;
  width?: number;
  height?: number;
}

/**
 * FilterShowcase - Interactive filter demonstration interface
 *
 * Provides a comprehensive UI for exploring and testing all available filters
 * with real-time preview, performance metrics, and browser compatibility info.
 */
export const FilterShowcase: React.FC<FilterShowcaseProps> = ({
  imageUrl = '/images/slides/1.jpg',
  width = 800,
  height = 600,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const spriteRef = useRef<Sprite | null>(null);
  const effectPresetsRef = useRef<EffectPresets | null>(null);
  const advancedPresetsRef = useRef<AdvancedFilterPresets | null>(null);

  const [filters, setFilters] = useState<FilterInfo[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [filterIntensity, setFilterIntensity] = useState<PresetIntensity>('moderate');
  const [isLoading, setIsLoading] = useState(true);
  const [fps, setFps] = useState(60);
  const [browserInfo, setBrowserInfo] = useState<ReturnType<typeof FilterBrowserCompatibility.detectBrowser> | null>(null);

  // Initialize PIXI application
  useEffect(() => {
    const initApp = async (): Promise<void> => {
      if (!canvasRef.current) return;

      // Create PIXI application
      const app = new Application();
      await app.init({
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
      });

      canvasRef.current.appendChild(app.canvas);
      appRef.current = app;

      // Load image texture
      const texture = await Assets.load(imageUrl);
      const sprite = new Sprite(texture);
      
      // Scale sprite to fit
      const scale = Math.min(width / sprite.texture.width, height / sprite.texture.height);
      sprite.scale.set(scale);
      sprite.anchor.set(0.5);
      sprite.position.set(width / 2, height / 2);
      
      app.stage.addChild(sprite);
      spriteRef.current = sprite;

      // Initialize filter systems
      effectPresetsRef.current = new EffectPresets();
      advancedPresetsRef.current = new AdvancedFilterPresets();

      // Load displacement texture for displacement-based effects
      try {
        const displacementTexture = await Assets.load('/images/effects/background-displace.jpg');
        effectPresetsRef.current.setDisplacementTexture(displacementTexture);
        advancedPresetsRef.current.setDisplacementTexture(displacementTexture);
      } catch {
        // Failed to load displacement texture - filters will work without it
      }

      // Get browser info
      setBrowserInfo(FilterBrowserCompatibility.detectBrowser());

      // Initialize filter list
      initializeFilters();
      
      setIsLoading(false);

      // Start FPS monitoring
      let lastTime = performance.now();
      app.ticker.add(() => {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTime;
        const currentFps = Math.round(1000 / deltaTime);
        setFps(currentFps);
        lastTime = currentTime;
      });
    };

    initApp();

    return (): void => {
      if (appRef.current) {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, [imageUrl, width, height]);

  // Initialize filter list
  const initializeFilters = (): void => {
    const filterList: FilterInfo[] = [
      // Core PIXI Filters
      { name: 'blur', category: 'Core PIXI', description: 'Standard blur effect', intensity: 'moderate', enabled: false },
      { name: 'alpha', category: 'Core PIXI', description: 'Alpha transparency', intensity: 'moderate', enabled: false },
      { name: 'colorMatrix', category: 'Core PIXI', description: 'Color matrix transformations', intensity: 'moderate', enabled: false },
      { name: 'displacement', category: 'Core PIXI', description: 'Displacement mapping', intensity: 'moderate', enabled: false },
      
      // Blur Effects
      { name: 'motionBlur', category: 'Blur Effects', description: 'Directional motion blur', intensity: 'moderate', enabled: false },
      { name: 'kawaseBlur', category: 'Blur Effects', description: 'High-quality Kawase blur', intensity: 'moderate', enabled: false },
      { name: 'radialBlur', category: 'Blur Effects', description: 'Radial blur effect', intensity: 'moderate', enabled: false },
      { name: 'zoomBlur', category: 'Blur Effects', description: 'Zoom blur effect', intensity: 'moderate', enabled: false },
      
      // Color Effects
      { name: 'vintage', category: 'Color Effects', description: 'Vintage color grading', intensity: 'moderate', enabled: false },
      { name: 'cyberpunk', category: 'Color Effects', description: 'Cyberpunk color palette', intensity: 'moderate', enabled: false },
      { name: 'blackAndWhite', category: 'Color Effects', description: 'Black and white conversion', intensity: 'moderate', enabled: false },
      { name: 'adjustment', category: 'Color Effects', description: 'Color adjustments', intensity: 'moderate', enabled: false },
      
      // Distortion Effects
      { name: 'wave', category: 'Distortion Effects', description: 'Wave distortion', intensity: 'moderate', enabled: false },
      { name: 'twist', category: 'Distortion Effects', description: 'Twist distortion', intensity: 'moderate', enabled: false },
      { name: 'bulgePinch', category: 'Distortion Effects', description: 'Bulge and pinch', intensity: 'moderate', enabled: false },
      { name: 'shockwave', category: 'Distortion Effects', description: 'Shockwave ripple', intensity: 'moderate', enabled: false },
      
      // Artistic Effects
      { name: 'pixelate', category: 'Artistic Effects', description: 'Pixelation effect', intensity: 'moderate', enabled: false },
      { name: 'ascii', category: 'Artistic Effects', description: 'ASCII art conversion', intensity: 'moderate', enabled: false },
      { name: 'dot', category: 'Artistic Effects', description: 'Halftone dots', intensity: 'moderate', enabled: false },
      { name: 'crt', category: 'Artistic Effects', description: 'CRT monitor simulation', intensity: 'moderate', enabled: false },
      { name: 'crosshatch', category: 'Artistic Effects', description: 'Cross-hatch pattern', intensity: 'moderate', enabled: false },
      
      // Special Effects
      { name: 'glow', category: 'Special Effects', description: 'Glow effect', intensity: 'moderate', enabled: false },
      { name: 'outline', category: 'Special Effects', description: 'Outline stroke', intensity: 'moderate', enabled: false },
      { name: 'emboss', category: 'Special Effects', description: 'Emboss relief', intensity: 'moderate', enabled: false },
      { name: 'glitch', category: 'Special Effects', description: 'Digital glitch', intensity: 'moderate', enabled: false },
      { name: 'godray', category: 'Special Effects', description: 'God ray lighting', intensity: 'moderate', enabled: false },
    ];

    setFilters(filterList);
  };

  // Apply filter to sprite
  const applyFilter = useCallback((filterName: string, intensity: PresetIntensity) => {
    if (!spriteRef.current || !effectPresetsRef.current || !advancedPresetsRef.current) return;

    try {
      // Clear existing filters
      if (spriteRef.current.filters) {
        spriteRef.current.filters = [];
      }

      // Try to create the filter
      let effect;
      try {
        effect = effectPresetsRef.current.createEffect(filterName, {
          intensity,
          duration: 0.5,
          ease: 'power2.out',
        });
      } catch {
        // Try advanced presets
        try {
          effect = advancedPresetsRef.current.createEffect(filterName, {
            intensity,
            duration: 0.5,
            ease: 'power2.out',
          });
        } catch {
          // Filter not found in advanced presets - skip silently
          return;
        }
      }

      // Apply the filter
      effect.applyTo(spriteRef.current);

      // Update state
      setFilters((prev) =>
        prev.map((f) => ({
          ...f,
          enabled: f.name === filterName,
          intensity: f.name === filterName ? intensity : f.intensity,
        }))
      );
      setSelectedFilter(filterName);
    } catch {
      // Filter application failed - error handled silently
    }
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    if (!spriteRef.current) return;
    
    spriteRef.current.filters = [];
    setFilters((prev) => prev.map((f) => ({ ...f, enabled: false })));
    setSelectedFilter(null);
  }, []);

  // Handle filter toggle
  const handleFilterToggle = (filterName: string): void => {
    const filter = filters.find((f) => f.name === filterName);
    if (!filter) return;

    if (filter.enabled) {
      clearFilters();
    } else {
      applyFilter(filterName, filterIntensity);
    }
  };

  // Render filter button
  const renderFilterButton = (filter: FilterInfo): React.JSX.Element => {
    const isCompatible = browserInfo && FilterBrowserCompatibility['getFilterCompatibility'](
      filter.name,
      browserInfo
    ).status !== 'none';

    return (
      <button
        key={filter.name}
        onClick={() => handleFilterToggle(filter.name)}
        disabled={!isCompatible}
        style={{
          padding: '8px 16px',
          margin: '4px',
          background: filter.enabled ? '#4CAF50' : isCompatible ? '#2196F3' : '#9E9E9E',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isCompatible ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          transition: 'all 0.3s',
          opacity: filter.enabled ? 1 : 0.8,
        }}
        title={`${filter.description}${!isCompatible ? ' (Not supported in your browser)' : ''}`}
      >
        {filter.name}
        {!isCompatible && ' ⚠️'}
      </button>
    );
  };

  // Group filters by category
  const filtersByCategory = filters.reduce((acc, filter) => {
    if (!acc[filter.category]) {
      acc[filter.category] = [];
    }
    acc[filter.category].push(filter);
    return acc;
  }, {} as Record<FilterCategory, FilterInfo[]>);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎨 Interactive Filter Showcase</h1>
      
      {/* Performance and Browser Info */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
        <span style={{ marginRight: '20px' }}>FPS: <strong>{fps}</strong></span>
        <span style={{ marginRight: '20px' }}>
          Browser: <strong>{browserInfo?.name} {browserInfo?.version}</strong>
        </span>
        <span>
          WebGL2: <strong>{browserInfo?.webgl2 ? '✅' : '❌'}</strong>
        </span>
      </div>

      {/* Canvas Container */}
      <div 
        ref={canvasRef} 
        style={{ 
          marginBottom: '20px',
          border: '2px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'inline-block',
        }}
      />

      {/* Controls */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>
          Intensity:
          <select
            value={filterIntensity}
            onChange={(e) => {
              const intensity = e.target.value as PresetIntensity;
              setFilterIntensity(intensity);
              if (selectedFilter) {
                applyFilter(selectedFilter, intensity);
              }
            }}
            style={{ marginLeft: '5px', padding: '5px' }}
          >
            <option value="subtle">Subtle</option>
            <option value="moderate">Moderate</option>
            <option value="strong">Strong</option>
            <option value="intense">Intense</option>
          </select>
        </label>
        
        <button
          onClick={clearFilters}
          style={{
            padding: '8px 16px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '10px',
          }}
        >
          Clear All Filters
        </button>
      </div>

      {/* Filter Categories */}
      {isLoading ? (
        <div>Loading filters...</div>
      ) : (
        Object.entries(filtersByCategory).map(([category, categoryFilters]) => (
          <div key={category} style={{ marginBottom: '20px' }}>
            <h3>{category}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {categoryFilters.map(renderFilterButton)}
            </div>
          </div>
        ))
      )}

      {/* Selected Filter Info */}
      {selectedFilter && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#e3f2fd', 
          borderRadius: '8px',
          border: '1px solid #2196F3',
        }}>
          <h3>Active Filter: {selectedFilter}</h3>
          <p>{filters.find((f) => f.name === selectedFilter)?.description}</p>
          <p>Intensity: <strong>{filterIntensity}</strong></p>
        </div>
      )}
    </div>
  );
};
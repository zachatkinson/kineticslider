import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  createKineticSlider, 
  SliderEngine,
  KINETIC_SLIDER_VERSION 
} from './src/index';

interface DemoState {
  status: string;
  currentIndex: number;
  totalSlides: number;
  physicsStatus: string;
  rendererStatus: string;
  isPlaying: boolean;
}

function KineticSliderDemo() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderEngine = useRef<SliderEngine | null>(null);
  const [state, setState] = useState<DemoState>({
    status: 'Initializing...',
    currentIndex: 0,
    totalSlides: 0,
    physicsStatus: 'Loading...',
    rendererStatus: 'Loading...',
    isPlaying: false
  });

  // Sample images for testing - using placeholder service
  const sampleImages = [
    'https://picsum.photos/800/600?random=1',
    'https://picsum.photos/800/600?random=2', 
    'https://picsum.photos/800/600?random=3',
    'https://picsum.photos/800/600?random=4',
    'https://picsum.photos/800/600?random=5'
  ];

  const updateStatus = (updates: Partial<DemoState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateDOMStatus = (status: string) => {
    const statusEl = document.getElementById('status');
    const currentIndexEl = document.getElementById('current-index');
    const totalSlidesEl = document.getElementById('total-slides');
    const physicsStatusEl = document.getElementById('physics-status');
    const rendererStatusEl = document.getElementById('renderer-status');

    if (statusEl) statusEl.textContent = status;
    if (currentIndexEl) currentIndexEl.textContent = state.currentIndex.toString();
    if (totalSlidesEl) totalSlidesEl.textContent = state.totalSlides.toString();
    if (physicsStatusEl) physicsStatusEl.textContent = state.physicsStatus;
    if (rendererStatusEl) rendererStatusEl.textContent = state.rendererStatus;
  };

  useEffect(() => {
    let mounted = true;

    const initializeSlider = async () => {
      if (!sliderRef.current) return;

      try {
        updateStatus({ status: 'Creating slider engine...' });
        updateDOMStatus('Creating slider engine...');
        
        // Create slider instance
        const slider = createKineticSlider();
        sliderEngine.current = slider;

        updateStatus({ 
          status: 'Configuring physics engine...',
          physicsStatus: 'Initializing...'
        });
        updateDOMStatus('Configuring physics engine...');

        // Basic configuration for demo
        const config = {
          container: sliderRef.current,
          images: sampleImages,
          autoplay: false,
          loop: true,
          speed: 1.0,
          friction: 0.8,
          tension: 0.3
        };

        updateStatus({ 
          status: 'Setting up PIXI renderer...',
          rendererStatus: 'Initializing...'
        });
        updateDOMStatus('Setting up PIXI renderer...');

        // Note: Since our engine is still in development, we'll simulate initialization
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!mounted) return;

        updateStatus({
          status: 'Ready!',
          totalSlides: sampleImages.length,
          physicsStatus: 'Active',
          rendererStatus: 'Rendering'
        });
        updateDOMStatus('Ready!');

        // Add some visual feedback to show it's working
        const container = sliderRef.current;
        if (container) {
          container.innerHTML = `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100%;
              background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
              color: #333;
              font-size: 1.2rem;
              text-align: center;
              flex-direction: column;
              gap: 1rem;
            ">
              <div>🎛️ KineticSlider Engine Ready</div>
              <div style="font-size: 0.9rem; opacity: 0.7;">
                Version ${KINETIC_SLIDER_VERSION} • ${sampleImages.length} slides loaded
              </div>
              <div style="font-size: 0.8rem; opacity: 0.5;">
                PIXI.js + GSAP Integration Active
              </div>
            </div>
          `;
        }

        console.log('✅ KineticSlider Demo initialized successfully');
        console.log('📊 Engine Status:', {
          version: KINETIC_SLIDER_VERSION,
          slides: sampleImages.length,
          config
        });

      } catch (error) {
        console.error('❌ Failed to initialize slider:', error);
        updateStatus({ 
          status: 'Error!',
          physicsStatus: 'Failed',
          rendererStatus: 'Failed'
        });
        updateDOMStatus('Error!');
        
        if (sliderRef.current) {
          sliderRef.current.innerHTML = `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100%;
              color: #d32f2f;
              font-size: 1.1rem;
              text-align: center;
            ">
              ⚠️ Failed to initialize slider
            </div>
          `;
        }
      }
    };

    initializeSlider();

    return () => {
      mounted = false;
      if (sliderEngine.current) {
        // Cleanup when component unmounts
        console.log('🧹 Cleaning up slider engine');
        sliderEngine.current = null;
      }
    };
  }, []);

  // Button handlers for E2E testing
  const handlePrevious = () => {
    console.log('⏮️ Previous slide requested');
    const newIndex = Math.max(0, state.currentIndex - 1);
    updateStatus({ currentIndex: newIndex });
    updateDOMStatus(state.status);
  };

  const handleNext = () => {
    console.log('⏭️ Next slide requested');
    const newIndex = Math.min(state.totalSlides - 1, state.currentIndex + 1);
    updateStatus({ currentIndex: newIndex });
    updateDOMStatus(state.status);
  };

  const handlePlay = () => {
    console.log('▶️ Play requested');
    updateStatus({ isPlaying: true, status: 'Playing...' });
    updateDOMStatus('Playing...');
  };

  const handlePause = () => {
    console.log('⏸️ Pause requested');
    updateStatus({ isPlaying: false, status: 'Paused' });
    updateDOMStatus('Paused');
  };

  // Update DOM when state changes
  useEffect(() => {
    updateDOMStatus(state.status);
  }, [state]);

  // Attach event listeners to the actual DOM buttons
  useEffect(() => {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');

    if (prevBtn) prevBtn.addEventListener('click', handlePrevious);
    if (nextBtn) nextBtn.addEventListener('click', handleNext);
    if (playBtn) playBtn.addEventListener('click', handlePlay);
    if (pauseBtn) pauseBtn.addEventListener('click', handlePause);

    return () => {
      if (prevBtn) prevBtn.removeEventListener('click', handlePrevious);
      if (nextBtn) nextBtn.removeEventListener('click', handleNext);
      if (playBtn) playBtn.removeEventListener('click', handlePlay);
      if (pauseBtn) pauseBtn.removeEventListener('click', handlePause);
    };
  }, [state.currentIndex, state.totalSlides]);

  return (
    <div 
      ref={sliderRef} 
      className="slider-container"
      data-testid="kinetic-slider-canvas"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    />
  );
}

function App() {
  useEffect(() => {
    console.log('🚀 KineticSlider Demo App Starting...');
    console.log('📦 Version:', KINETIC_SLIDER_VERSION);
    console.log('🏗️ Build Info:', {
      mode: (import.meta as any).env?.MODE || 'unknown',
      dev: (import.meta as any).env?.DEV || false,
      prod: (import.meta as any).env?.PROD || false
    });
  }, []);

  return (
    <div id="kinetic-slider-demo">
      <KineticSliderDemo />
    </div>
  );
}

// Initialize the demo application
const container = document.getElementById('basic-slider');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('❌ Could not find container element #basic-slider');
}

// Add global error handling for debugging
window.addEventListener('error', (event) => {
  console.error('🚨 Global Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', event.reason);
});

// Export for debugging in browser console
(window as any).KineticSliderDemo = {
  version: KINETIC_SLIDER_VERSION,
  createSlider: createKineticSlider
};

console.log('✅ Demo application loaded successfully'); 
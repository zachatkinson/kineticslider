import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { KineticSliderProps } from './types';

export const KineticSlider: React.FC<KineticSliderProps> = ({
  children,
  className = '',
  style,
  duration = 0.5,
  ease = 'power2.out',
  enableGestures = true,
  onChange,
  initialIndex = 0,
  infinite = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Initialize GSAP context
    const ctx = gsap.context(() => {}, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`kinetic-slider ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div className="kinetic-slider__container">
        {children}
      </div>
    </div>
  );
}; 
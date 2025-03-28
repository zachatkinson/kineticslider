import { KineticSlider } from '../KineticSlider';

export const BasicExample = () => {
  const handleSlideChange = (index: number) => {
    console.log(`Slide changed to index: ${index}`);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>KineticSlider Basic Example</h1>
      
      {/* 
        KineticSlider with default settings:
        - Smooth GSAP animations
        - Touch/mouse gesture support
        - Keyboard navigation (arrow keys)
        - Infinite looping
        - Accessible navigation buttons
      */}
      <KineticSlider
        duration={0.5}
        ease="power2.out"
        enableGestures={true}
        onChange={handleSlideChange}
        infinite={true}
      >
        <div
          style={{
            height: '300px',
            background: '#e3f2fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            borderRadius: '8px',
          }}
        >
          Slide 1
        </div>
        <div
          style={{
            height: '300px',
            background: '#bbdefb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            borderRadius: '8px',
          }}
        >
          Slide 2
        </div>
        <div
          style={{
            height: '300px',
            background: '#90caf9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            borderRadius: '8px',
          }}
        >
          Slide 3
        </div>
      </KineticSlider>
    </div>
  );
};

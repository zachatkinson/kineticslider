import { KineticSlider } from '../KineticSlider';

export const BasicExample = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>KineticSlider Basic Example</h1>
      <KineticSlider>
        <div
          style={{
            height: '300px',
            background: '#e3f2fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
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
          }}
        >
          Slide 3
        </div>
      </KineticSlider>
    </div>
  );
};

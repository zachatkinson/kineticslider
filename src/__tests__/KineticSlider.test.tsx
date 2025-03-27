import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KineticSlider } from '../KineticSlider';

describe('KineticSlider', () => {
  it('renders children correctly', () => {
    render(
      <KineticSlider>
        <div>Slide 1</div>
        <div>Slide 2</div>
        <div>Slide 3</div>
      </KineticSlider>
    );

    expect(screen.getByText('Slide 1')).toBeInTheDocument();
    expect(screen.getByText('Slide 2')).toBeInTheDocument();
    expect(screen.getByText('Slide 3')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <KineticSlider className="custom-class">
        <div>Slide</div>
      </KineticSlider>
    );

    const slider = screen.getByText('Slide').closest('.kinetic-slider');
    expect(slider).toHaveClass('custom-class');
  });
}); 
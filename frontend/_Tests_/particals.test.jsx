import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Particles from '../src/assets/Particals';
import '@testing-library/jest-dom';

// Mock ogl classes and methods
vi.mock('ogl', () => ({
  Renderer: vi.fn().mockImplementation(() => ({
    gl: {
      canvas: document.createElement('canvas'),
      clearColor: vi.fn(),
      width: 100,
      height: 100,
    },
    setSize: vi.fn(),
    render: vi.fn(),
  })),
  Camera: vi.fn().mockImplementation(() => ({
    position: { set: vi.fn() },
    perspective: vi.fn(),
  })),
  Geometry: vi.fn(),
  Program: vi.fn().mockImplementation(() => ({
    uniforms: {
      uTime: { value: 0 },
      uSpread: { value: 0 },
      uBaseSize: { value: 0 },
      uSizeRandomness: { value: 0 },
      uAlphaParticles: { value: 0 },
    },
  })),
  Mesh: vi.fn().mockImplementation(() => ({
    position: { x: 0, y: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  })),
}));

describe('Particles', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders a container div', () => {
    render(<Particles />);
    // Find the first div with a canvas child
    const container = document.querySelector('div > div > canvas')?.parentElement;
    expect(container).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Particles className="my-custom-class" />);
    expect(document.querySelector('.my-custom-class')).toBeInTheDocument();
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(<Particles />);
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  it('renders with custom props', () => {
    render(
      <Particles
        particleCount={10}
        particleSpread={5}
        speed={0.5}
        particleColors={['#ff0000', '#00ff00']}
        moveParticlesOnHover={true}
        particleHoverFactor={2}
        alphaParticles={true}
        particleBaseSize={50}
        sizeRandomness={0.5}
        cameraDistance={10}
        disableRotation={true}
        className="test-class"
      />
    );
    expect(document.querySelector('.test-class')).toBeInTheDocument();
  });
});
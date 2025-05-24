import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Aurora from '../src/assets/Aurora.jsx';
import { vi, describe, it, expect } from 'vitest';




vi.mock('ogl', async () => {
  const original = await vi.importActual('ogl');
  return {
    ...original,
    Renderer: vi.fn(() => ({
      gl: {
        clearColor: vi.fn(),
        enable: vi.fn(),
        blendFunc: vi.fn(),
        canvas: document.createElement('canvas'),
        getExtension: vi.fn(() => ({ loseContext: vi.fn() }))
      },
      setSize: vi.fn(),
      render: vi.fn()
    })),
    Program: vi.fn(() => ({ uniforms: { uResolution: { value: [] }, uTime: {}, uAmplitude: {}, uBlend: {}, uColorStops: {} } })),
    Mesh: vi.fn(),
    Triangle: vi.fn(() => ({ attributes: {} })),
    Color: vi.fn((hex) => ({ r: 1, g: 1, b: 1 }))
  };
});

global.fetch = vi.fn();

describe('Aurora', () => {
  it('renders the canvas container without crashing', () => {
    const { container } = render(<Aurora />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
});

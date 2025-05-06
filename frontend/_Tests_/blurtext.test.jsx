import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BlurText from '../src/assets/BlurText';
import { act } from 'react-dom/test-utils';

describe('BlurText', () => {
  let observeMock;
  let unobserveMock;
  let disconnectMock;

  beforeEach(() => {
    observeMock = vi.fn();
    unobserveMock = vi.fn();
    disconnectMock = vi.fn();

    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb) {
        this.cb = cb;
      }
      observe = observeMock;
      unobserve = unobserveMock;
      disconnect = disconnectMock;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders with default props', () => {
    render(<BlurText text="Hello world" />);
    expect(screen.getByText(/hello/i)).to.exist;

    expect(screen.getByText(/world/i)).to.exist;

  });

  it('renders characters individually when animateBy is set to letters', () => {
    render(<BlurText text="Hi" animateBy="letters" />);
    expect(screen.getByText('H')).to.exist;
    expect(screen.getByText('i')).to.exist; 
  });

  it('triggers intersection observer and animation when in view', () => {
    render(<BlurText text="Reveal this" />);
    expect(observeMock).toHaveBeenCalled();

    act(() => {
      const instance = observeMock.mock.instances[0];
      instance.cb([{ isIntersecting: true }]);
    });

    expect(unobserveMock).toHaveBeenCalled();
  });
});

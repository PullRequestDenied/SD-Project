import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ShinyText from '../src/assets/ShinyText';
import '@testing-library/jest-dom/vitest';

describe('ShinyText component', () => {
  it('renders the provided text', () => {
    render(<ShinyText text="Shiny Hello" />);
    expect(screen.getByText('Shiny Hello')).toBeInTheDocument();
  });

  it('applies the disabled class when disabled is true', () => {
    render(<ShinyText text="Disabled Text" disabled={true} />);
    const element = screen.getByText('Disabled Text');
    expect(element).toHaveClass('disabled');
  });

  it('does not apply the disabled class when disabled is false', () => {
    render(<ShinyText text="Active Text" disabled={false} />);
    const element = screen.getByText('Active Text');
    expect(element).not.toHaveClass('disabled');
  });

  it('applies the custom className', () => {
    render(<ShinyText text="Styled Text" className="extra-style" />);
    const element = screen.getByText('Styled Text');
    expect(element).toHaveClass('extra-style');
  });

  it('sets correct animationDuration based on speed prop', () => {
    render(<ShinyText text="Speed Test" speed={3} />);
    const element = screen.getByText('Speed Test');
    expect(element).toHaveStyle({ animationDuration: '3s' });
  });
});

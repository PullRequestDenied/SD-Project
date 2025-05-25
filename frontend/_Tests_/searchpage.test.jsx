import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchPage from '../src/components/SearchPage';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../src/context/DarkModeContext', () => ({
  useDarkMode: () => ({ 
    darkMode: false,
    toggleDarkMode: vi.fn() }),
}));

vi.mock('../src/assets/Particals', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-particals" />
}));

beforeAll(() => {
  global.IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('SearchPage', () => {
  it('renders search input', () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/Ask a question.../i)).toBeInTheDocument();
  });

  it('updates input value on change', () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );
    const input = screen.getByPlaceholderText(/Ask a question.../i);
    fireEvent.change(input, { target: { value: 'test query' } });
    expect(input.value).toBe('test query');
  });
});
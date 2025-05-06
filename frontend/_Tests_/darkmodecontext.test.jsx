import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { DarkModeProvider, useDarkMode } from '../src/context/DarkModeContext';
import '@testing-library/jest-dom';
import React from 'react';

// Helper test component
const TestComponent = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div>
      <span data-testid="mode">{darkMode ? 'dark' : 'light'}</span>
      <button onClick={toggleDarkMode}>Toggle</button>
    </div>
  );
};

describe('DarkModeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to dark mode if no localStorage value', () => {
    render(
      <DarkModeProvider>
        <TestComponent />
      </DarkModeProvider>
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('uses localStorage value if present', () => {
    localStorage.setItem('darkMode', 'false');
    render(
      <DarkModeProvider>
        <TestComponent />
      </DarkModeProvider>
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles from dark to light mode and updates localStorage & DOM', async () => {
    render(
      <DarkModeProvider>
        <TestComponent />
      </DarkModeProvider>
    );

    await act(async () => {
      screen.getByText('Toggle').click();
    });

    expect(screen.getByTestId('mode')).toHaveTextContent('light');
    expect(localStorage.getItem('darkMode')).toBe('false');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles back to dark mode', async () => {
    localStorage.setItem('darkMode', 'false');
    render(
      <DarkModeProvider>
        <TestComponent />
      </DarkModeProvider>
    );

    await act(async () => {
      screen.getByText('Toggle').click();
    });

    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(localStorage.getItem('darkMode')).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});

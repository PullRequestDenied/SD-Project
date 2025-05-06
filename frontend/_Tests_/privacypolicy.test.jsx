import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PrivacyPolicy from '../src/components/PrivacyPolicy';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

// ✅ Mock DarkModeContext
vi.mock('../src/context/DarkModeContext', () => ({
  useDarkMode: () => ({
    darkMode: false,
    toggleDarkMode: vi.fn()
  })
}));

describe('PrivacyPolicy component', () => {
  it('renders the main title and all policy sections', () => {
    render(
      <MemoryRouter>
        <PrivacyPolicy />
      </MemoryRouter>
    );

    // Check main title
    expect(screen.getByRole('heading', { name: /privacy policy/i })).toBeInTheDocument();

    // Check all section headings
    const sections = [
      /information we collect/i,
      /use of information/i,
      /third-party services/i,
      /data sharing/i,
      /data security/i,
      /cookies/i,
      /your rights/i,
      /changes to this policy/i,
      /contact/i
    ];

    for (const heading of sections) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    }
  });

  it('renders a working back to home link', () => {
    render(
      <MemoryRouter>
        <PrivacyPolicy />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /back to home/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('displays contact email link correctly', () => {
    render(
      <MemoryRouter>
        <PrivacyPolicy />
      </MemoryRouter>
    );

    const emailLink = screen.getByRole('link', { name: /constitutionalarchive@gmail.com/i });
    expect(emailLink).toHaveAttribute('href', 'mailto:constitutionalarchive@gmail.com');
  });
});

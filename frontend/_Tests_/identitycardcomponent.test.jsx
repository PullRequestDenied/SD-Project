import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

describe('IdentityCardComponent', () => {
    beforeEach(() => {
        vi.resetModules(); // Important: reset module cache before each test
        vi.clearAllMocks();
    });

    it('renders the provider name when identity is provided', async () => {
        vi.doMock('../src/context/DarkModeContext', () => ({
            useDarkMode: () => ({ darkMode: false }),
        }));
        const { default: IdentityCardComponent } = await import('../src/components/IdentityCardComponent');
        render(<IdentityCardComponent identity={{ provider: 'google' }} />);
        expect(screen.getByText('google')).toBeInTheDocument();
    });

    it('renders nothing for provider if identity is undefined', async () => {
        vi.doMock('../src/context/DarkModeContext', () => ({
            useDarkMode: () => ({ darkMode: false }),
        }));
        const { default: IdentityCardComponent } = await import('../src/components/IdentityCardComponent');
        render(<IdentityCardComponent />);
        expect(screen.queryByText(/.+/)).not.toBeInTheDocument();
    });

    it('applies light mode styles when darkMode is false', async () => {
        vi.doMock('../src/context/DarkModeContext', () => ({
            useDarkMode: () => ({ darkMode: false }),
        }));
        const { default: IdentityCardComponent } = await import('../src/components/IdentityCardComponent');
        render(<IdentityCardComponent identity={{ provider: 'test' }} />);
        const section = screen.getByText('test').closest('section');
        expect(section).toHaveClass('bg-white');
        expect(section).toHaveClass('border-gray-200');
    });

    it('applies dark mode styles when darkMode is true', async () => {
        vi.doMock('../src/context/DarkModeContext', () => ({
            useDarkMode: () => ({ darkMode: true }),
        }));
        const { default: IdentityCardComponent } = await import('../src/components/IdentityCardComponent');
        render(<IdentityCardComponent identity={{ provider: 'test' }} />);
        const section = screen.getByText('test').closest('section');
        expect(section).toHaveClass('bg-gray-700');
        expect(section).toHaveClass('border-gray-700');
    });
});
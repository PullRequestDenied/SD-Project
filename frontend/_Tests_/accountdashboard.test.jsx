import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import AccountDashboard from '../src/components/AccountDashboard';
import { MemoryRouter } from 'react-router-dom';

// Mock the context hooks
vi.mock('../src/context/DarkModeContext', () => ({
  useDarkMode: () => ({ 
    darkMode: false,
    toggleDarkMode: vi.fn() }),
}));

vi.mock('../src/components/AccountInfoComponent', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="identity-card">Mocked AccountInfo</div>)
}));
vi.mock('../src/components/ChangePasswordComponent', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="identity-card">Mocked ChangePassword</div>)
}));
vi.mock('../src/components/IdentitiesComponent', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="identity-card">Mocked Identities</div>)
}));

describe('Account Dashboard Component', () => {

    it('renders the dashboard correctly', () => {
        render(
            <MemoryRouter>
              <AccountDashboard />
            </MemoryRouter>
        );

        expect(screen.getByRole('heading', { name: /Account Information/i })).toBeInTheDocument();
        expect(screen.getByText(/Mocked AccountInfo/i)).toBeInTheDocument();
        expect(screen.getByText(/Mocked ChangePassword/i)).toBeInTheDocument();
        expect(screen.getByText(/Mocked Identities/i)).toBeInTheDocument();
    });
});
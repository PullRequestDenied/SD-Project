import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RestrictedRoute from '../src/components/RestrictedRoute';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import { UserAuth } from '../src/context/AuthContext';

// ✅ Mock UserAuth
vi.mock('../src/context/AuthContext', () => ({
    UserAuth: vi.fn()
}));
  
describe('PrivateRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders children if user is not authenticated', () => {
        UserAuth.mockReturnValue({
            session: null,
            loading: false
        });

        render(
            <MemoryRouter>
                <RestrictedRoute>
                    <div>Auth Content</div>
                </RestrictedRoute>
            </MemoryRouter>
        );

        expect(screen.getByText('Auth Content')).toBeInTheDocument();
    });

    it('redirects if user is authenticated', () => {
        UserAuth.mockReturnValue({
            session: "mock-session",
            loading: false
        });

        render(
            <MemoryRouter>
                <RestrictedRoute>
                    <div>Auth Content</div>
                </RestrictedRoute>
            </MemoryRouter>
        );

        expect(screen.queryByText('Auth Content')).not.toBeInTheDocument();
    });
});
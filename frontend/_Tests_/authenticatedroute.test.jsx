import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthenticatedRoute from '../src/components/AuthenticatedRoute';
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

    it('renders children if user is authenticated', () => {
        UserAuth.mockReturnValue({
            session: "mock-session",
            loading: false
        });

        render(
            <MemoryRouter>
                <AuthenticatedRoute>
                    <div>Auth Content</div>
                </AuthenticatedRoute>
            </MemoryRouter>
        );

        expect(screen.getByText('Auth Content')).toBeInTheDocument();
    });

    it('redirects if user is not authenticated', () => {
        UserAuth.mockReturnValue({
            session: null,
            loading: false
        });

        render(
            <MemoryRouter>
                <AuthenticatedRoute>
                    <div>Auth Content</div>
                </AuthenticatedRoute>
            </MemoryRouter>
        );

        expect(screen.queryByText('Auth Content')).not.toBeInTheDocument();
    });
});
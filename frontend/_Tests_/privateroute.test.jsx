import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PrivateRoute from '../src/components/PrivateRoute';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

// ✅ Mock jwtDecode
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn()
}));

// ✅ Mock UserAuth
vi.mock('../src/context/AuthContext', () => ({
  UserAuth: vi.fn()
}));

import { UserAuth } from '../src/context/AuthContext';
import { jwtDecode } from 'jwt-decode';

describe('PrivateRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children if user is admin', () => {
    UserAuth.mockReturnValue({
      session: {
        access_token: 'mock-token'
      },
      loading: false
    });

    jwtDecode.mockReturnValue({ user_role: 'admin' });

    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Admin Content</div>
        </PrivateRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects if user is not admin', () => {
    UserAuth.mockReturnValue({
      session: {
        access_token: 'mock-token'
      },
      loading: false
    });

    jwtDecode.mockReturnValue({ user_role: 'user' });

    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Admin Content</div>
        </PrivateRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('shows loading when loading is true', () => {
    UserAuth.mockReturnValue({
      session: null,
      loading: true
    });

    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Admin Content</div>
        </PrivateRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading')).toBeInTheDocument();
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Signin from '../src/components/Signin';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

// ✅ Mocks
vi.mock('../src/context/AuthContext', () => ({
  UserAuth: vi.fn()
}));

vi.mock('../src/context/DarkModeContext', () => ({
  useDarkMode: () => ({ darkMode: false })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

import { UserAuth } from '../src/context/AuthContext';

describe('Signin component', () => {
  let mockSignIn;

  beforeEach(() => {
    mockSignIn = vi.fn().mockResolvedValue({ success: true });
    UserAuth.mockImplementation(() => ({
      signInUser: mockSignIn
    }));
  });

  it('renders the Signin form correctly', () => {
    render(
      <MemoryRouter>
        <Signin />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('submits the form and calls signInUser', async () => {
    render(
      <MemoryRouter>
        <Signin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows error if signInUser fails', async () => {
    mockSignIn.mockResolvedValue({
      success: false,
      error: { message: 'Invalid credentials' }
    });

    render(
      <MemoryRouter>
        <Signin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'bad@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});

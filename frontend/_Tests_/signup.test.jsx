import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Signup from '../src/components/Signup';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

// ✅ Mocks
vi.mock('../src/context/AuthContext', () => ({
  UserAuth: vi.fn()
}));

vi.mock('../src/context/DarkModeContext', () => ({
  useDarkMode: () => ({ darkMode: false, toggleDarkMode: vi.fn() })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

import { UserAuth } from '../src/context/AuthContext';

describe('Signup component', () => {
  let mockSignUp;

  beforeEach(() => {
    mockSignUp = vi.fn().mockResolvedValue({ success: true });
    UserAuth.mockImplementation(() => ({
      session: null,
      signUpNewUser: mockSignUp
    }));
  });

  it('renders the Signup form correctly', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/bob@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log in with GitHub/i })).toBeInTheDocument();
  });

  it('submits the form and calls signUpNewUser', async () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByPlaceholderText(/bob@example.com/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'testuser')
    );
  });

  it('shows error if signUpNewUser fails', async () => {
    mockSignUp.mockResolvedValue({
      success: false,
      error: { message: 'Signup failed' }
    });

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByPlaceholderText(/bob@example.com/i), {
      target: { value: 'bad@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/signup failed/i)).toBeInTheDocument();
    });
  });

  it('calls signInWithGithub', async () => {
    let mockSignInWithGithub = vi.fn().mockResolvedValue({ success: true });
    UserAuth.mockImplementation(() => ({
      signInWithGithub: mockSignInWithGithub
    }));

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Log in with GitHub/i }));

    await waitFor(() => {
      expect(mockSignInWithGithub).toHaveBeenCalled();
    });
  });
});

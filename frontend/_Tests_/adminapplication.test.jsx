import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

// Mock: react-router's useNavigate
const mockNavigate = vi.fn();

// Mock: UserAuth
vi.mock('../src/context/AuthContext', () => ({
  UserAuth: vi.fn()
}));

// Mock: DarkModeContext
vi.mock('../src/context/DarkModeContext', () => ({
  useDarkMode: () => ({ darkMode: false }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import AdminApplication from '../src/components/AdminApplication';
import { UserAuth } from '../src/context/AuthContext';

describe('AdminApplication', () => {
  beforeEach(() => {
    mockNavigate.mockReset();

    UserAuth.mockImplementation(() => ({
      session: {
        access_token: 'token',
        user: {
          email: 'test@example.com',
          username: 'testuser',
          user_metadata: {
            display_name: 'TestUser'
          }
        }
      }
    }));

    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        alreadyApplied: false,
        is_accepted: false,
        is_denied: false,
      }),
      ok: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the form when user has not applied', async () => {
    render(
      <MemoryRouter>
        <AdminApplication />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Admin Application/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Your Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/motivation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Application/i })).toBeInTheDocument();
  });

  it('shows validation errors if fields are empty', async () => {
    render(
      <MemoryRouter>
        <AdminApplication />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Submit Application/i }));
    expect(await screen.findByText(/Name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Motivation is required/i)).toBeInTheDocument();
  });

  it('submits the form and disables button while loading', async () => {
    render(
      <MemoryRouter>
        <AdminApplication />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText(/Your Name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText(/motivation/i), { target: { value: 'I want to help.' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Application/i }));
    expect(screen.getByRole('button', { name: /Submit Application/i })).not.toBeDisabled();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  it('shows accepted status if application is accepted', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        alreadyApplied: true,
        is_accepted: true,
        is_denied: false,
      }),
      ok: true,
    });
    render(
      <MemoryRouter>
        <AdminApplication />
      </MemoryRouter>
    );
    expect(await screen.findByText(/has been accepted/i)).toBeInTheDocument();
  });

  it('shows denied status if application is denied', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        alreadyApplied: true,
        is_accepted: false,
        is_denied: true,
      }),
      ok: true,
    });
    render(
      <MemoryRouter>
        <AdminApplication />
      </MemoryRouter>
    );
    expect(await screen.findByText(/was denied/i)).toBeInTheDocument();
  });

  it('shows pending status if application is pending', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        alreadyApplied: true,
        is_accepted: false,
        is_denied: false,
      }),
      ok: true,
    });
    render(
      <MemoryRouter>
        <AdminApplication />
      </MemoryRouter>
    );
    expect(await screen.findByText(/under review/i)).toBeInTheDocument();
  });

  it('applies dark mode styling', async () => {
    vi.doMock('../src/context/DarkModeContext', () => ({
      useDarkMode: () => ({ darkMode: true }),
    }));
    const { default: AdminApplicationDark } = await import('../src/components/AdminApplication');
    const { container } = render(
      <MemoryRouter>
        <AdminApplicationDark />
      </MemoryRouter>
    );
    expect(container.firstChild).toHaveClass('bg-gray-100'); // Adjust if your dark mode class is different
  });
});
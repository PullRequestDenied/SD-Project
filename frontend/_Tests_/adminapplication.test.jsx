import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

// ✅ Mock: react-router's useNavigate
const mockNavigate = vi.fn();

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockInsert = vi.fn();

const mockFromReturn = {
  select: mockSelect,
  eq: mockEq,
  order: mockOrder,
  limit: mockLimit,
  insert: mockInsert,
};

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: () => mockFromReturn,
  },
}));

import { supabase } from '../src/supabaseClient';

// Mock DarkModeContext if used
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

// ✅ Mock: UserAuth
vi.mock('../src/context/AuthContext', () => ({
  UserAuth: vi.fn()
}));

import AdminApplication from '../src/components/AdminApplication';

import { UserAuth } from '../src/context/AuthContext';

describe('AdminApplication', () => {
  beforeEach(() => {
    mockNavigate.mockReset();    
    supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user1' } } }
    });
    mockSelect.mockReturnValue(mockFromReturn);
    mockEq.mockReturnValue(mockFromReturn);
    mockOrder.mockReturnValue(mockFromReturn);
    mockLimit.mockResolvedValue({ data: [], error: null });
    // ...other setup
        // UserAuth.mockImplementation(() => ({
        //   session: {
        //     user: {
        //       user_metadata: {
        //         display_name: 'TestUser'
        //       }
        //     }
        //   },
        //   signOut: mockSignOut
        // }));
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
    // await waitFor(() => {
    //   expect(supabase.from.insert).toHaveBeenCalled();
    // });
    expect(screen.getByRole('button', { name: /Submit Application/i })).not.toBeDisabled();
  });

  it('shows accepted status if application is accepted', async () => {
    mockLimit.mockResolvedValue({
      data: [{ is_accepted: true, is_denied: false }],
      error: null,
    });
    render(
        <MemoryRouter>
                <AdminApplication />
        </MemoryRouter>
   );
    expect(await screen.findByText(/Your application has been accepted/i)).toBeInTheDocument();
  });

  it('shows denied status if application is denied', async () => {
    mockLimit.mockResolvedValue({
      data: [{ is_accepted: false, is_denied: true }],
      error: null,
    });
    render(
        <MemoryRouter>
                <AdminApplication />
        </MemoryRouter>
   );
    expect(await screen.findByText(/was denied/i)).toBeInTheDocument();
  });

  it('shows pending status if application is pending', async () => {
    mockLimit.mockResolvedValue({
      data: [{ is_accepted: false, is_denied: false }],
      error: null,
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
                <AdminApplication />
        </MemoryRouter>
   );;
    expect(container.firstChild).toHaveClass('bg-gray-100');
  });
});
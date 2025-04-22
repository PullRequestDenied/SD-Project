import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthContextProvider, UserAuth } from '../src/context/AuthContext';
import '@testing-library/jest-dom/vitest';

// Mock supabase
vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn()
    }
  }
}));

import { supabase } from '../src/supabaseClient';

// Dummy consumer component
const Consumer = () => {
  const { session, loading, signUpNewUser, signInUser, signOut } = UserAuth();
  return (
    <div>
      <p>Session: {session ? 'yes' : 'no'}</p>
      <p>Loading: {loading ? 'yes' : 'no'}</p>
      <button onClick={() => signUpNewUser('a@test.com', '123', 'test')}>SignUp</button>
      <button onClick={() => signInUser('a@test.com', '123')}>SignIn</button>
      <button onClick={signOut}>SignOut</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    supabase.auth.onAuthStateChange.mockImplementation(() => {});
  });

  it('initializes context with default session = null and loading = false', async () => {
    render(
      <AuthContextProvider>
        <Consumer />
      </AuthContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Session: no/i)).toBeInTheDocument();
      expect(screen.getByText(/Loading: no/i)).toBeInTheDocument();
    });
  });

  it('calls signUpNewUser correctly', async () => {
    supabase.auth.signUp.mockResolvedValue({ data: {}, error: null });

    render(
      <AuthContextProvider>
        <Consumer />
      </AuthContextProvider>
    );

    screen.getByText('SignUp').click();

    await waitFor(() =>
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'a@test.com',
        password: '123',
        options: { data: { display_name: 'test' } }
      })
    );
  });

  it('calls signInUser correctly', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });

    render(
      <AuthContextProvider>
        <Consumer />
      </AuthContextProvider>
    );

    screen.getByText('SignIn').click();

    await waitFor(() =>
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'a@test.com',
        password: '123'
      })
    );
  });

  it('calls signOut correctly and clears session', async () => {
    supabase.auth.signOut.mockResolvedValue({ error: null });

    render(
      <AuthContextProvider>
        <Consumer />
      </AuthContextProvider>
    );

    screen.getByText('SignOut').click();

    await waitFor(() =>
      expect(supabase.auth.signOut).toHaveBeenCalled()
    );
  });
});

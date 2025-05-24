import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AdminManager from '../src/components/AdminManager';
import '@testing-library/jest-dom/vitest';

// Mock dependencies
vi.mock('../src/context/DarkModeContext', () => ({
  useDarkMode: () => ({ darkMode: false }),
}));
vi.mock('../src/context/AuthContext', () => ({
  UserAuth: vi.fn(),
}));
vi.mock('../src/components/AdminUserCard', () => ({
  __esModule: true,
  default: ({ name, email, isAdmin, onToggle, onReject, motivation }) => (
    <div>
      <span>{name}</span>
      <span>{email}</span>
      <span>{isAdmin ? 'Admin' : 'User'}</span>
      <button onClick={onToggle}>{isAdmin ? 'Demote' : 'Promote'}</button>
      {onReject && <button onClick={onReject}>Reject</button>}
      {motivation && <span>{motivation}</span>}
    </div>
  ),
}));

import { UserAuth } from '../src/context/AuthContext';

describe('AdminManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    UserAuth.mockImplementation(() => ({
      session: {
        access_token: 'token',
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          user_metadata: { display_name: 'AdminUser' },
        },
      },
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading and then fallback when no users', async () => {
    global.fetch = vi.fn()
      // getAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      // getRoles
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(<AdminManager />);
    expect(screen.getByText(/loading users/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });
  });

  it('renders admin and non-admin users', async () => {
    global.fetch = vi.fn()
      // getAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { user_id: '1', user_name: 'Alice', is_denied: false, motivation: 'mot1' },
          { user_id: '2', user_name: 'Bob', is_denied: false, motivation: 'mot2' },
        ],
      })
      // getRoles
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { user_id: '1', role: 'admin' },
          { user_id: '2', role: 'user' },
        ],
      });

    render(<AdminManager />);
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getAllByText(/mot/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('shows error if fetching users fails', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<AdminManager />);
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching users:', 'Failed to fetch users from API'
      );
    });
    errorSpy.mockRestore();
  });

  it('shows error if fetching roles fails', async () => {
    global.fetch = vi.fn()
      // getAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { user_id: '1', user_name: 'Alice', is_denied: false },
        ],
      })
      // getRoles
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<AdminManager />);
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching user_roles:', 'Failed to fetch user roles from API'
      );
    });
    errorSpy.mockRestore();
  });

  it('promotes a user to admin', async () => {
    global.fetch = vi.fn()
      // getAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { user_id: '2', user_name: 'Bob', is_denied: false },
        ],
      })
      // getRoles
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      // add-admin
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<AdminManager />);
    const promoteBtn = await screen.findByText('Promote');
    fireEvent.click(promoteBtn);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/add-admin'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'token' }),
        })
      );
    });
  });

  it('demotes an admin to user', async () => {
    global.fetch = vi.fn()
      // getAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { user_id: '1', user_name: 'Alice', is_denied: false },
        ],
      })
      // getRoles
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { user_id: '1', role: 'admin' },
        ],
      })
      // remove-admin
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<AdminManager />);
    const demoteBtn = await screen.findByText('Demote');
    fireEvent.click(demoteBtn);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/remove-admin'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'token' }),
        })
      );
    });
  });

  it('rejects a user', async () => {
    global.fetch = vi.fn()
      // getAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { user_id: '2', user_name: 'Bob', is_denied: false },
        ],
      })
      // getRoles
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      // reject-user
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<AdminManager />);
    const rejectBtn = await screen.findByText('Reject');
    fireEvent.click(rejectBtn);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/reject-user'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({ Authorization: 'token' }),
        })
      );
    });
  });
});
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../src/components/Dashboard';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

class NoopXHR {
  open() {}
  send() { this.onload?.(); }
  setRequestHeader() {}
  abort() {}
  get status() { return 200; }
  get responseText() { return ''; }
}
  

global.XMLHttpRequest = NoopXHR;
// ✅ Mock: react-router's useNavigate
const mockNavigate = vi.fn();

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

// ✅ Mock: FileManager
vi.mock('../src/components/FileManager', () => ({
  default: () => <div>Mocked FileManager</div>
}));

import { UserAuth } from '../src/context/AuthContext';

describe('Dashboard component', () => {
  const mockSignOut = vi.fn();

  beforeEach(() => {
    mockNavigate.mockReset();
    mockSignOut.mockReset();

    UserAuth.mockImplementation(() => ({
      session: {
        user: {
          user_metadata: {
            display_name: 'TestUser'
          }
        }
      },
      signOut: mockSignOut
    }));
  });

  it('renders the dashboard with user name and FileManager', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    //expect(screen.getByText(/Admin Manager/i)).toBeInTheDocument();
    expect(screen.getByText(/welcome, TestUser/i)).toBeInTheDocument();
  });

  it('calls signOut and navigates on sign out click', async () => {
    const page = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const signoutBtn = page.container.querySelector('#signoutBtn');
    fireEvent.click(signoutBtn);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/signin');
    });
  });
});

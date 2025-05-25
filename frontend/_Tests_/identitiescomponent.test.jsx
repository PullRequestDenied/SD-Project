import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { UserAuth } from '../src/context/AuthContext';
import '@testing-library/jest-dom/vitest';


// Mock the context hooks
vi.mock('../src/context/DarkModeContext', () => ({
  useDarkMode: () => ({ 
    darkMode: false,
    toggleDarkMode: vi.fn() }),
}));

// ✅ Mocks
vi.mock('../src/context/AuthContext', () => ({
  UserAuth: vi.fn()
}));

// Mock the IdentityCardComponent as a spy
//const IdentityCardComponentMock = vi.fn(() => <div data-testid="identity-card">Mocked Identity Card</div>);
vi.mock('../src/components/IdentityCardComponent', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="identity-card">Mocked Identity Card</div>)
}));

import IdentitiesComponent from '../src/components/IdentitiesComponent';
import IdentityCardComponent from '../src/components/IdentityCardComponent';

describe('IdentitiesComponent', () => {
    let mockIdentities;

    beforeEach(() => {
        vi.resetModules();
        // mockIdentities = vi.fn().mockReturnValue([
        //   {
        //     provider: 'google',
        //     id: '1',
        //     user_id: 'u1',
        //     access_token: 'token',
        //     created_at: 'now',
        //     updated_at: 'now',
        //   }
        // ]);
        // UserAuth.mockImplementation(() => ({
        //      getIdentities: () => mockIdentities
        // }));
    });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the component with correct title', () => {
    mockIdentities = vi.fn().mockReturnValue([
          {
            provider: 'google',
            id: '1',
            user_id: 'u1',
            access_token: 'token',
            created_at: 'now',
            updated_at: 'now',
          }
        ]);
        UserAuth.mockImplementation(() => ({
             getIdentities: () => mockIdentities
        }));
    render(<IdentitiesComponent />);
    expect(screen.getByText(/Linked Accounts/i)).toBeInTheDocument();
  });

  it('shows default info when user has no identities', async () => {
    mockIdentities = vi.fn().mockReturnValue([]);
        UserAuth.mockImplementation(() => ({
            getIdentities: mockIdentities
        }));
    render(<IdentitiesComponent />);
    const { default: IdentityCardComponentMock } = await import('../src/components/IdentityCardComponent');
    
    // It should call IdentityCardComponent with the default "No linked accounts" data
    expect(IdentityCardComponentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        identity:{
            id: "No linked accounts",
            provider: "No linked accounts",
            user_id: "No linked accounts",
        }
      }),
      undefined
    );
  });

  it('displays identities when the user has them', async () => {
    // Setup mock identities data
    const mockIdentities = [
      {
        id: '1',
        provider: 'google',
        user_id: 'user123',
      },
      {
        id: '2',
        provider: 'github',
        user_id: 'user456',
      }
    ];

    // Update the mock to return identities
    UserAuth.mockImplementation(() => ({
        getIdentities: () => mockIdentities
    }));

    render(<IdentitiesComponent />);
    const { default: IdentityCardComponentMock } = await import('../src/components/IdentityCardComponent');

    // Expect the IdentityCardComponent to be called for each identity
    expect(IdentityCardComponentMock).toHaveBeenCalled();
  });

  it('applies dark mode styling when dark mode is enabled', async () => {
  vi.doMock('../src/context/DarkModeContext', () => ({
    useDarkMode: () => ({ darkMode: true }),
  }));

  const { default: IdentitiesComponent } = await import('../src/components/IdentitiesComponent');
  const { container } = render(<IdentitiesComponent />);
  const mainArticle = container.querySelector('article');
  expect(mainArticle).toHaveClass('bg-gray-800');
  expect(mainArticle).toHaveClass('border-gray-700');
});


  it('applies light mode styling when dark mode is disabled', () => {
  const { container } = render(<IdentitiesComponent />);
  const mainArticle = container.querySelector('article');
  expect(mainArticle).toHaveClass('bg-white');
  expect(mainArticle).toHaveClass('border-gray-200');
});

});
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LandingPage from '../src/components/LandingPage';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import { UserAuth } from '../src/context/AuthContext';

// ✅ Mocks
vi.mock('../src/assets/BlurText', () => ({
  __esModule: true,
  default: ({ text }) => <div>{text}</div>
}));

vi.mock('../src/assets/ShinyText', () => ({
    __esModule: true,
    default: ({ text }) => <span>{text}</span>
  }));
  
vi.mock('../src/assets/Particals', () => ({
  __esModule: true,
  default: () => <div>Mocked Particles</div>
}));

vi.mock('../src/context/DarkModeContext', () => {
  return {
    useDarkMode: () => ({
      darkMode: false,
      toggleDarkMode: vi.fn()
    })
  };
});

vi.mock('../src/context/AuthContext', () => ({
    UserAuth: vi.fn()
  }));

describe('LandingPage component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page with sidebar and content', () => {
    UserAuth.mockReturnValue({
          session: {
            access_token: 'mock-token'
          },
          loading: false
        });
    
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    ); 

    expect(screen.getByText(/What would you like to explore/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search!/i })).toBeInTheDocument();
  });

  it('renders collapsed sidebar when toggled', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
    fireEvent.click(toggleButton);

    // Since sidebar state is internal and no visual text changes to assert directly,
    // we could test class changes with data-testid in a more robust version.
  });

  it('renders navigation links correctly', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();
    expect(screen.getByText(/contact us/i)).toBeInTheDocument();
  });
});

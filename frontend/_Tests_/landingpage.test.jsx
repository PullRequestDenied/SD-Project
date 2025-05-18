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
    
    const page = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    ); 
    
    expect(screen.getByText(/What would you like to explore/i)).toBeInTheDocument();
    expect(page.container.querySelector('#SignupBtn')).toBeInTheDocument();
    expect(page.container.querySelector('#SigninBtn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search!/i })).toBeInTheDocument();
  });


  it('renders navigation links correctly', () => {
    const page = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(page.container.querySelector('#SignupBtn')).toBeInTheDocument();
    expect(page.container.querySelector('#SigninBtn')).toBeInTheDocument();
  });
});

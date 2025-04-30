import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPassword from '../src/components/ForgotPassword';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import { UserAuth } from '../src/context/AuthContext';

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

describe('ForgotPassword component', () => {
    let mockRequestReset;
  
    beforeEach(() => {
      mockRequestReset = vi.fn().mockResolvedValue({ success: true });
      UserAuth.mockImplementation(() => ({
        requestReset: mockRequestReset
      }));
    });

    it('renders the ForgotPassword form correctly', () => {
        render(
            <MemoryRouter>
            <ForgotPassword />
            </MemoryRouter>
        );

        expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('submits the form and calls requestReset', async () => {
        render(
            <MemoryRouter>
            <ForgotPassword />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
            target: { value: 'test@example.com' },
        });

        fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

        await waitFor(() => {
            expect(mockRequestReset).toHaveBeenCalledWith('test@example.com');
        });
    });

    it('Confirmation Text Shows when form is submitted', async () => {
        render(
            <MemoryRouter>
            <ForgotPassword />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
            target: { value: 'test@example.com' },
        });

        fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

        await waitFor(() => {
            expect(screen.getByText(/reset link sent/i)).toBeInTheDocument();
        });
    });

    it('Shows error if reset fails', async () => {
        mockRequestReset.mockResolvedValue({
            success: false,
            error: { message: 'failed to send reset link' }
        });

        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
            target: { value: 'test@example.com' },
        });

        fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

        await waitFor(() => {
            expect(screen.getByText(/failed to send reset link/i)).toBeInTheDocument();
        });
    });
});
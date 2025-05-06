import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResetPassword from '../src/components/ResetPassword';
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
    let mockResetPassword;
  
    beforeEach(() => {
        mockResetPassword = vi.fn().mockResolvedValue({ success: true });
      UserAuth.mockImplementation(() => ({
        changePassword: mockResetPassword
      }));
    });

    it('renders the ForgotPassword form correctly', () => {
        render(
            <MemoryRouter>
                <ResetPassword />
            </MemoryRouter>
        );

        expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Confirm Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Change Password/i })).toBeInTheDocument();
    });

    it('submits the form and calls changePassword', async () => {
        render(
            <MemoryRouter>
                <ResetPassword />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Password"), {
            target: { value: '12345678' },
        });

        fireEvent.change(screen.getByPlaceholderText(/Confirm Password/i), {
            target: { value: '12345678' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

        await waitFor(() => {
            expect(mockResetPassword).toHaveBeenCalledWith('12345678');
        });
    });

    it('shows error if passwords do not match', async () => {
        render(
            <MemoryRouter>
                <ResetPassword />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Password"), {
            target: { value: '12345678' },
        });

        fireEvent.change(screen.getByPlaceholderText(/Confirm Password/i), {
            target: { value: '12345679' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

        await waitFor(() => {
            expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
        });
    });

    it('shows error if passwords do not match', async () => {
        mockResetPassword.mockResolvedValue({
            success: false,
            error: { message: 'failed to reset password' }
        });

        render(
            <MemoryRouter>
                <ResetPassword />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Password"), {
            target: { value: '12345678' },
        });

        fireEvent.change(screen.getByPlaceholderText(/Confirm Password/i), {
            target: { value: '12345678' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

        await waitFor(() => {
            expect(screen.getByText(/failed to reset password/i)).toBeInTheDocument();
        });
    });
});
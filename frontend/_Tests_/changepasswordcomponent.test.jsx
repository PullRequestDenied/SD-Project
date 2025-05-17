import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChangePasswordComponent from '../src/components/ChangePasswordComponent';
import '@testing-library/jest-dom/vitest';

// ✅ Mocks
vi.mock('../src/context/AuthContext', () => ({
  UserAuth: vi.fn()
}));

vi.mock('../src/context/DarkModeContext', () => ({
  useDarkMode: () => ({ darkMode: false })
}));

import { UserAuth } from '../src/context/AuthContext';

describe('ChangePassword Component', () => {
    let mockChangePassword;
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        mockChangePassword = vi.fn().mockResolvedValue({ success: true });
        UserAuth.mockImplementation(() => ({
          changePassword: mockChangePassword
        }));
    });

    it('renders the Signin form correctly', () => {
    render(
        <ChangePasswordComponent />
    );

        expect(screen.getByRole('heading', { name: /Change Password/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Change Password/i })).toBeInTheDocument();
    });

  it('submits the form and calls updateUsernameAndEmail', async () => {
    render(
      <ChangePasswordComponent />
    );

    fireEvent.change(screen.getByLabelText(/New Password/i), { 
      target: { value: '12345678' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: '12345678' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith('12345678');
    });
  });

    it('shows error if passwords do not match', async () => {
        render(<ChangePasswordComponent />)
        fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: 'abc123' } })
        fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'different' } })
        fireEvent.click(screen.getByRole('button', { name: /Change Password/i }))
        expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument()
        expect(mockChangePassword).not.toHaveBeenCalled()
    })

    it('shows error message from changePassword', async () => {
        mockChangePassword.mockResolvedValue({ success: false, error: { message: 'Server error' } })
        render(<ChangePasswordComponent />)
        fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: 'abc123' } })
        fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'abc123' } })
        fireEvent.click(screen.getByRole('button', { name: /Change Password/i }))
        expect(await screen.findByText(/Server error/i)).toBeInTheDocument()
    })

    it('applies dark mode styling when dark mode is enabled', async () => {
        // Mock dark mode to be true
        vi.doMock('../src/context/DarkModeContext', () => ({
                useDarkMode: () => ({ darkMode: true }),
        }));

        const { default: ChangePasswordComponent } = await import('../src/components/ChangePasswordComponent');
        const { container } = render(<ChangePasswordComponent />);
        
        // Check for dark mode classes
        const mainSection = container.querySelectorAll('section')[1];
        expect(mainSection).toHaveClass('bg-gray-800');
        expect(mainSection).toHaveClass('border-gray-700');
    });

  it('applies light mode styling when dark mode is disabled', () => {
        vi.doMock('../src/context/DarkModeContext', () => ({
                useDarkMode: () => ({ darkMode: false }),
        }));
    const { container } = render(<ChangePasswordComponent />);
    
    // Check for light mode classes
    const mainSection = container.querySelectorAll('section')[1];
    expect(mainSection).toHaveClass('bg-white');
    expect(mainSection).toHaveClass('border-gray-200');
  });
});
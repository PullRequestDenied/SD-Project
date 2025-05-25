import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock DarkModeContext
vi.mock('../src/context/DarkModeContext', () => ({
  useDarkMode: () => ({ darkMode: false }),
}));

// ✅ Mock: UserAuth
vi.mock('../src/context/AuthContext', () => ({
  UserAuth: vi.fn()
}));
const mockUpdateUsernameAndEmail = vi.fn();

import AccountInfoComponent from '../src/components/AccountInfoComponent';
import { UserAuth } from '../src/context/AuthContext';

describe('AccountInfoComponent', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        UserAuth.mockImplementation(() => ({
            session: {
                user: {
                    email: 'test@example.com',
                    username: 'testuser',
                    user_metadata: {
                        display_name: 'TestUser'
                    }
                }
            },
            updateUsernameAndEmail: mockUpdateUsernameAndEmail,
        }));
  });

  it('renders user email and username', () => {
    render(<AccountInfoComponent />);
    expect(screen.getByPlaceholderText(/test@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/testuser/i)).toBeInTheDocument();
  });

it('applies light mode styling', () => {
  const { container } = render(<AccountInfoComponent />);
  const mainArticle = container.querySelector('article');
  expect(mainArticle).toHaveClass('bg-white');
});


  it('applies dark mode styling', async () => {
  vi.doMock('../src/context/DarkModeContext', () => ({
    useDarkMode: () => ({ darkMode: true }),
  }));
  const { default: AccountInfoComponentDark } = await import('../src/components/AccountInfoComponent');
  const { container } = render(<AccountInfoComponentDark />);
  const mainArticle = container.querySelector('article');
  expect(mainArticle).toHaveClass('bg-gray-800');
});

  it('calls updateUsernameAndEmail with current username and email when both are filled', async () => {
        render(<AccountInfoComponent />);
        // Click Edit
        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        // Change username and email
        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'NewUser' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });

        // Click Save
        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(mockUpdateUsernameAndEmail).toHaveBeenCalledWith('NewUser', 'new@example.com');
        });
    });

    it('restores username if left empty before saving', async () => {
        render(<AccountInfoComponent />);
        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        // Clear username
        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: '' } }); 
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(mockUpdateUsernameAndEmail).toHaveBeenCalledWith('TestUser', 'new@example.com');
        });
    });

    it('restores email if left empty before saving', async () => {
        render(<AccountInfoComponent />);
        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'NewUser' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: '' } });

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(mockUpdateUsernameAndEmail).toHaveBeenCalledWith('NewUser', 'test@example.com');
        });
    });

    it('toggles edit mode after saving', async () => {
        render(<AccountInfoComponent />);
        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        // After saving, Edit button should be visible again
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
        });
    });

    it('handles errors in updateUsernameAndEmail gracefully', async () => {
        mockUpdateUsernameAndEmail.mockImplementationOnce(() => {
            throw new Error('Update failed');
        });
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<AccountInfoComponent />);
        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        fireEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith('Error updating user info:', expect.any(Error));
            expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
        });
        errorSpy.mockRestore();
    });
});
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock DarkModeContext if used
vi.mock('../src/context/DarkModeContext', () => ({
  useDarkMode: () => ({ darkMode: false }),
}));

const mockUser = {
    name: 'adminuser',
    email: 'admin@example.com',
    isAdmin: 'true'
};

const mockonToggle = vi.fn();
const mockonReject = vi.fn();

import AdminUserCard from '../src/components/AdminUserCard';

describe('AdminUserCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user info', () => {
    render(
      <AdminUserCard
        name= 'adminuser'
        email= 'admin@example.com'
        isAdmin= {true}
        onToggle={mockonToggle}
        onReject={mockonReject}
      />
    );
    expect(screen.getByText(/admin@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/adminuser/i)).toBeInTheDocument();
  });

  it('calls remove when remove button is clicked', () => {
    render(
      <AdminUserCard
        name= 'adminuser'
        email= 'admin@example.com'
        isAdmin= {true}
        onToggle={mockonToggle}
        onReject={mockonReject}
      />
    );
    const editBtn = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(editBtn);
    expect(mockonToggle).toHaveBeenCalled();
  });

  it('calls mockonReject when delete button is clicked', () => {
    render(
      <AdminUserCard
        name= 'adminuser'
        email= 'admin@example.com'
        isAdmin= {false}
        onToggle={mockonToggle}
        onReject={mockonReject}
      />
    );
    const deleteBtn = screen.getByRole('button', { name: /Reject/i });
    fireEvent.click(deleteBtn);
    expect(mockonReject).toHaveBeenCalled();
  });

  // it('applies dark mode styling', async () => {
  //   vi.doMock('../src/context/DarkModeContext', () => ({
  //     useDarkMode: () => ({ darkMode: true }),
  //   }));
  //   const { default: AdminUserCardDark } = await import('../src/components/AdminUserCard');
  //   const { container } = render(
  //     <AdminUserCardDark
  //       name= 'adminuser'
  //       email= 'admin@example.com'
  //       isAdmin= {false}
  //       onToggle={mockonToggle}
  //       onReject={mockonReject}
  //     />
  //   );
  //   expect(container.firstChild).toHaveClass('bg-gray-800');
  // });

  it('applies light mode styling', async () => {
    vi.doMock('../src/context/DarkModeContext', () => ({
      useDarkMode: () => ({ darkMode: false }),
    }));
    const { default: AdminUserCardDark } = await import('../src/components/AdminUserCard');
    const { container } = render(
      <AdminUserCardDark
        name= 'adminuser'
        email= 'admin@example.com'
        isAdmin= {false} 
        onToggle={mockonToggle}
        onReject={mockonReject}
      />
    );
    expect(container.firstChild).toHaveClass('bg-white');
  });
});
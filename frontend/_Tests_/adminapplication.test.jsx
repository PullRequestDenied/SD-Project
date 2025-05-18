import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock DarkModeContext if used
vi.mock('../src/context/DarkModeContext', () => ({
  useDarkMode: () => ({ darkMode: false }),
}));

// Example mock data and handlers
const mockApplication = {
  id: 'app1',
  name: 'Test Application',
  owner: 'adminuser',
  status: 'pending',
};

const mockOnApprove = vi.fn();
const mockOnReject = vi.fn();

import AdminApplication from '../src/components/AdminApplication';

describe('AdminApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders application info', () => {
    render(
      <AdminApplication
        application={mockApplication}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );
    expect(screen.getByText(/Test Application/i)).toBeInTheDocument();
    expect(screen.getByText(/adminuser/i)).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('calls onApprove when approve button is clicked', () => {
    render(
      <AdminApplication
        application={mockApplication}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );
    const approveBtn = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveBtn);
    expect(mockOnApprove).toHaveBeenCalledWith(mockApplication);
  });

  it('calls onReject when reject button is clicked', () => {
    render(
      <AdminApplication
        application={mockApplication}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );
    const rejectBtn = screen.getByRole('button', { name: /reject/i });
    fireEvent.click(rejectBtn);
    expect(mockOnReject).toHaveBeenCalledWith(mockApplication);
  });

  it('applies dark mode styling', async () => {
    vi.doMock('../src/context/DarkModeContext', () => ({
      useDarkMode: () => ({ darkMode: true }),
    }));
    const { default: AdminApplicationDark } = await import('../src/components/AdminApplication');
    const { container } = render(
      <AdminApplicationDark
        application={mockApplication}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );
    expect(container.firstChild).toHaveClass('bg-gray-800');
  });
});
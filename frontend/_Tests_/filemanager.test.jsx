import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FileManager from '../src/components/FileManager';
import '@testing-library/jest-dom/vitest';

// ✅ Mock UserAuth
vi.mock('../src/context/AuthContext', () => ({
  UserAuth: vi.fn()
}));

// ✅ Mock Supabase client
vi.mock('../src/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null })
      })
    }
  }
}));

import { supabase } from '../src/supabaseClient';
import { UserAuth } from '../src/context/AuthContext';

describe('FileManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    UserAuth.mockImplementation(() => ({
      session: {
        user: {
          id: 'test-user-id'
        }
      }
    }));

    supabase.from.mockImplementation((table) => {
      if (table === 'folders') {
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null })
        };
      }
      if (table === 'files') {
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockResolvedValue({ error: null })
        };
      }
    });
  });

  it('renders inputs and buttons', () => {
    render(<FileManager />);
    expect(screen.getByPlaceholderText(/folder name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create folder/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
  });

  it('handles empty folder name error on create', async () => {
    UserAuth.mockImplementation(() => ({
      session: {
        user: {
          id: 'test-user-id'
        }
      }
    }));

    render(<FileManager />);
    fireEvent.click(screen.getByRole('button', { name: /create folder/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter a folder name/i)).toBeInTheDocument();
    });
  });

  it('displays success message after uploading a file', async () => {
    const file = new File(['file content'], 'test.txt', { type: 'text/plain' });

    render(<FileManager />);

    fireEvent.change(screen.getByPlaceholderText(/folder name/i), {
      target: { value: 'test-folder' }
    });

    fireEvent.change(screen.getByTestId('file-input'), {
        target: { files: [file] }
      });

    fireEvent.click(screen.getByRole('button', { name: /upload file/i }));

    await waitFor(() => {
      expect(screen.getByText(/file uploaded successfully/i)).toBeInTheDocument();
    });
  });
});

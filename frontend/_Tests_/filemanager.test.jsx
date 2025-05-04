import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, vi } from 'vitest';
import FileManager from '../src/components/FileManager';

// Mock AuthContext
vi.mock('../src/context/AuthContext', () => ({
  UserAuth: () => ({
    session: {
      user: { id: 'test-user-id' }
    }
  })
}));

// Mock Supabase
vi.mock('../src/supabaseClient', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  }
}));

describe('FileManager UI Tests', () => {
  it('renders essential UI elements', () => {
    render(<FileManager />);
    expect(screen.getByText(/file manager/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/folder name/i)).toBeInTheDocument();
    expect(screen.getByText(/create folder/i)).toBeInTheDocument();
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
    expect(screen.getByText(/upload file/i)).toBeInTheDocument();
  });

  it('simulates file upload', async () => {
    render(<FileManager />);

    // Set folder name so upload is enabled
    fireEvent.change(screen.getByPlaceholderText(/folder name/i), {
      target: { value: 'test-folder' },
    });

    // Create fake file
    const file = new File(['dummy content'], 'example.txt', { type: 'text/plain' });

    // Simulate file selection
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, {
      target: { files: [file] },
    });

    // Click upload
    fireEvent.click(screen.getByText(/upload file/i));

    // Expect success message
    await waitFor(() => {
      expect(screen.getByText(/uploaded/i)).toBeInTheDocument();
    });
  });
});

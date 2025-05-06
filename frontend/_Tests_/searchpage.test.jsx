import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchPage from '../src/components/SearchPage'; // Adjust path if needed
import '@testing-library/jest-dom/vitest';

// ✅ Mock Supabase
vi.mock('../src/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        textSearch: vi.fn(),
      }),
    }),
  },
}));

import { supabase } from '../src/supabaseClient';

describe('SearchPage component', () => {
  let textSearchMock;

  beforeEach(() => {
    textSearchMock = vi.fn();
    supabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        textSearch: textSearchMock,
      })),
    }));
  });

  it('renders the search input and button', () => {
    render(<SearchPage />);
    expect(screen.getByPlaceholderText(/search files/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('displays error when search term is empty', () => {
    render(<SearchPage />);
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    expect(screen.getByText(/please enter a search term/i)).toBeInTheDocument();
  });

  it('displays results when search is successful', async () => {
    textSearchMock.mockResolvedValue({
      data: [
        { id: 1, filename: 'example.txt', type: 'txt', size: 1234 },
        { id: 2, filename: 'doc.pdf', type: 'pdf', size: 4567 },
      ],
      error: null,
    });

    render(<SearchPage />);
    fireEvent.change(screen.getByPlaceholderText(/search files/i), {
      target: { value: 'example' },
    });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/found 2 result/i)).toBeInTheDocument();
      expect(screen.getByText(/example.txt/i)).toBeInTheDocument();
      expect(screen.getByText(/doc.pdf/i)).toBeInTheDocument();
    });
  });

  it('displays an error message when the search fails', async () => {
    textSearchMock.mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    render(<SearchPage />);
    fireEvent.change(screen.getByPlaceholderText(/search files/i), {
      target: { value: 'fail' },
    });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/search failed: server error/i)).toBeInTheDocument();
    });
  });
});

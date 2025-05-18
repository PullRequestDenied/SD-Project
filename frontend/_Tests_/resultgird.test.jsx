import { render, screen, fireEvent } from '@testing-library/react';
import ResultsGrid from '../src/components/ResultsGrid';
import { describe, it, expect, vi } from 'vitest';

describe('ResultsGrid Component', () => {
  it('renders "No results found" when results array is empty', () => {
    render(<ResultsGrid results={[]} onSummarize={vi.fn()} />);
expect(screen.getByText(/no results found/i)).not.toBeNull();

  });

  it('renders document cards when results are provided', () => {
    const mockResults = [
      {
        id: '1',
        filename: 'test-image.jpg',
        publicUrl: 'http://example.com/test-image.jpg',
        created_at: new Date().toISOString(),
        type: 'image/jpeg',
      },
      {
        id: '2',
        filename: 'document.pdf',
        created_at: new Date().toISOString(),
        type: 'application/pdf',
      }
    ];

    render(<ResultsGrid results={mockResults} onSummarize={vi.fn()} />);

    expect(screen.getByText('test-image.jpg')).not.toBeNull();
    expect(screen.getByText('document.pdf')).not.toBeNull();
    expect(screen.getAllByRole('button', { name: /download/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /summarize/i })).toHaveLength(2);
  });

  it('calls onSummarize with correct ID when "Summarize" is clicked', () => {
    const mockSummarize = vi.fn();
    const mockResults = [
      {
        id: '123',
        filename: 'summary-test.pdf',
        created_at: new Date().toISOString(),
        type: 'application/pdf'
      }
    ];

    render(<ResultsGrid results={mockResults} onSummarize={mockSummarize} />);
    const button = screen.getByRole('button', { name: /summarize/i });

    fireEvent.click(button);
    expect(mockSummarize).toHaveBeenCalledWith('123');
  });
});

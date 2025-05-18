import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchPageLayout from '../src/components/SearchPage';
import { vi, describe, it, expect } from 'vitest';

vi.mock('react-select/async', () => ({
  default: ({ loadOptions, onChange }) => {
    return (
      <input
        data-testid="search-input"
        onChange={async (e) => {
          const options = await loadOptions(e.target.value);
          onChange(options[0]);
        }}
      />
    );
  }
}));

vi.mock('@mui/x-date-pickers/LocalizationProvider', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    LocalizationProvider: ({ children }) => <div>{children}</div>
  };
});

vi.mock('@mui/x-date-pickers/AdapterDateFns', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual
  };
});

vi.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ label, onChange }) => (
    <input
      aria-label={label}
      type="date"
      onChange={(e) => onChange(new Date(e.target.value))}
    />
  )
}));

global.fetch = vi.fn();

describe('SearchPageLayout', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input and buttons', () => {
    render(<SearchPageLayout token="dummy" />);

    expect(screen.getByTestId('search-input')).not.toBeNull();
    expect(screen.getByRole('button', { name: /filters/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /search/i })).not.toBeNull();
  });

  it('calls search API and displays results', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [{ id: '1', filename: 'file.txt', created_at: new Date().toISOString() }] })
      })
    );

    render(<SearchPageLayout token="dummy" />);
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('file.txt')).not.toBeNull();
    });
  });

  it('displays summary when summarize button clicked', async () => {
    fetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [{ id: '1', filename: 'file.txt', created_at: new Date().toISOString() }] })
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ summary: 'Mock summary text.' })
        })
      );

    render(<SearchPageLayout token="dummy" />);
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => screen.getByText('file.txt'));

    fireEvent.click(screen.getByRole('button', { name: /summarize/i }));

    await waitFor(() => screen.getByText(/summary for file.txt/i));
    expect(screen.getByText('Mock summary text.')).not.toBeNull();
  });
});

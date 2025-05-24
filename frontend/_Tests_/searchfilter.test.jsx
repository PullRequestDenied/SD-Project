import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchPageLayout from '../src/components/SearchPage';
import SearchFilters from '../src/components/SearchFilters';
import { vi, describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';

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

describe('SearchFilters', () => {
  it('renders inputs and calls onSearch with correct params', async () => {
    const onSearch = vi.fn();
    render(<SearchFilters token="dummy" onSearch={onSearch} />);

    const fromInput = screen.getByLabelText('From');
    const toInput = screen.getByLabelText('To');
    const searchButton = screen.getByRole('button', { name: /search/i });

    await userEvent.type(fromInput, '2024-01-01');
    await userEvent.type(toInput, '2024-01-31');

    fireEvent.mouseDown(screen.getByLabelText('Type'));
    const option = await screen.findByText('PDF');
    fireEvent.click(option);

    await userEvent.click(searchButton);

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          term: '',
          from: expect.any(String),
          to: expect.any(String),
        })
      );
    });
  });
});
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchPageLayout from '../src/components/SearchPage';
import SearchFilters from '../src/components/SearchFilters';
import AdminManager from '../src/components/AdminManager';
import Aurora from '../src/assets/Aurora.jsx';
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

vi.mock('../src/context/DarkModeContext', () => ({
  useDarkMode: () => ({ darkMode: false })
}));

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ error: null })),
      delete: vi.fn(() => Promise.resolve({ error: null })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      eq: vi.fn().mockReturnThis()
    }))
  }
}));

vi.mock('ogl', async () => {
  const original = await vi.importActual('ogl');
  return {
    ...original,
    Renderer: vi.fn(() => ({
      gl: {
        clearColor: vi.fn(),
        enable: vi.fn(),
        blendFunc: vi.fn(),
        canvas: document.createElement('canvas'),
        getExtension: vi.fn(() => ({ loseContext: vi.fn() }))
      },
      setSize: vi.fn(),
      render: vi.fn()
    })),
    Program: vi.fn(() => ({ uniforms: { uResolution: { value: [] }, uTime: {}, uAmplitude: {}, uBlend: {}, uColorStops: {} } })),
    Mesh: vi.fn(),
    Triangle: vi.fn(() => ({ attributes: {} })),
    Color: vi.fn((hex) => ({ r: 1, g: 1, b: 1 }))
  };
});

global.fetch = vi.fn();

describe('SearchPageLayout', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input and buttons', () => {
    render(<SearchPageLayout token="dummy" />);

    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
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
      expect(screen.getByText('file.txt')).toBeInTheDocument();
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
    expect(screen.getByText('Mock summary text.')).toBeInTheDocument();
  });
});

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

describe('AdminManager', () => {
  it('renders loading initially and then shows fallback when no users', async () => {
    render(<AdminManager />);
    expect(screen.getByText(/loading users/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });
  });
});

describe('Aurora', () => {
  it('renders the canvas container without crashing', () => {
    const { container } = render(<Aurora />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
});

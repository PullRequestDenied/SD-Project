import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import Layout from '../src/components/layout'
import { MemoryRouter } from 'react-router-dom';

describe('layout component', () => {
    it('renders the layout component', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    //expect(screen.getByText(/Admin Manager/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
    //expect(screen.getByText(/Upload Test/i)).toBeInTheDocument(); no longer upload test
    expect(screen.getByText(/Contact Us/i)).toBeInTheDocument();
  });
});
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

// ✅ Mock dark mode context
vi.mock('../src/context/DarkModeContext', () => ({
  useDarkMode: () => ({ darkMode: false })
}));

// Mock emailjs
vi.mock('@emailjs/browser', () => ({
  __esModule: true,
  default: {
    sendForm: vi.fn(),
  },
  sendForm: vi.fn(),
}));

import ContactForm from '../src/components/ContactForm';
import emailjs from '@emailjs/browser';

describe('ContactForm (partial test)', () => {

  beforeEach(() => {
    // Reset mocks before each test
    emailjs.sendForm.mockReset();
  });

  it('renders the form inputs and heading', () => {
    render(
      <MemoryRouter>
        <ContactForm />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /contact us/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('shows validation errors on empty submission', async () => {
    render(
      <MemoryRouter>
        <ContactForm />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/message is required/i)).toBeInTheDocument();
  });

  it('shows validation errors when fields are empty', async () => {
    render(
      <MemoryRouter>
        <ContactForm />
      </MemoryRouter>
    );
  
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
  
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/message is required/i)).toBeInTheDocument();
  });

  it('calls emailjs.sendForm with correct arguments and shows Sent! on success', async () => {
    emailjs.sendForm.mockResolvedValueOnce();

    render(
      <MemoryRouter>
        <ContactForm />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText(/Your Name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText(/Your Email/i), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Your Message/i), { target: { value: 'Hello there!' } });

    fireEvent.click(screen.getByRole('button', { name: /Send/i }));

    await waitFor(() => {
      expect(emailjs.sendForm).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /Sent!/i })).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    render(
      <MemoryRouter>
        <ContactForm />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText(/Your Name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText(/Your Email/i), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByPlaceholderText(/Your Message/i), { target: { value: 'Hello!' } });
    fireEvent.click(screen.getByRole('button', { name: /Send/i }));
    expect(await screen.findByText(/Email is invalid/i)).toBeInTheDocument();
    expect(emailjs.sendForm).not.toHaveBeenCalled();
  });

  it('shows alert on sendForm failure', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    emailjs.sendForm.mockRejectedValueOnce({ text: 'Network error' });

    render(
      <MemoryRouter>
        <ContactForm />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText(/Your Name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText(/Your Email/i), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Your Message/i), { target: { value: 'Hello!' } });
    fireEvent.click(screen.getByRole('button', { name: /Send/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to send message. Network error'));
    });

    alertSpy.mockRestore();
  });

});

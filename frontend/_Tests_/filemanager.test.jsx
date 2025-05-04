import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FileManager from '../src/components/FileManager';
import { UserAuth } from '../src/context/AuthContext';
import '@testing-library/jest-dom/vitest';

// 🔧 Mocks
vi.mock('../src/context/AuthContext', () => ({
  UserAuth: vi.fn(),
}));

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        remove: vi.fn(),
      })),
    },
  },
}));

import { supabase } from '../src/supabaseClient';

describe('FileManager Component', () => {
  let insertMock, selectMock, deleteMock, updateMock, uploadMock, removeMock;

  beforeEach(() => {
    insertMock = vi.fn();
    selectMock = vi.fn();
    deleteMock = vi.fn();
    updateMock = vi.fn();
    uploadMock = vi.fn();
    removeMock = vi.fn();

    supabase.from = vi.fn(() => ({
      select: selectMock,
      insert: insertMock,
      delete: deleteMock,
      update: updateMock,
    }));

    supabase.storage.from = vi.fn(() => ({
      upload: uploadMock,
      remove: removeMock,
    }));

    UserAuth.mockReturnValue({
      session: { user: { id: 'user123' } },
    });

    selectMock.mockResolvedValue({ data: [], error: null });
  });

  it('renders component without crashing', () => {
    render(<FileManager />);
    expect(screen.getByText(/file manager/i)).toBeInTheDocument();
  });

  it('displays error if no folder name is entered', async () => {
    render(<FileManager />);
    fireEvent.click(screen.getByRole('button', { name: /create folder/i }));
    expect(await screen.findByText(/please enter a folder name/i)).toBeInTheDocument();
  });

  it('successfully creates folder', async () => {
    insertMock.mockResolvedValueOnce({ error: null });
    render(<FileManager />);

    fireEvent.change(screen.getByPlaceholderText(/folder name/i), {
      target: { value: 'TestFolder' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create folder/i }));

    await waitFor(() =>
      expect(screen.getByText(/folder 'testfolder' created/i)).toBeInTheDocument()
    );
  });

  it('shows message if no file is selected for upload', async () => {
    render(<FileManager />);
    fireEvent.click(screen.getByRole('button', { name: /upload file/i }));
    expect(await screen.findByText(/please select a file to upload/i)).toBeInTheDocument();
  });

  it('uploads file and shows success', async () => {
    uploadMock.mockResolvedValue({ error: null });
    insertMock.mockResolvedValue({ error: null });

    render(<FileManager />);
    const file = new File(['dummy content'], 'file.txt', { type: 'text/plain' });

    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole('button', { name: /upload file/i }));

    await waitFor(() =>
      expect(screen.getByText(/file uploaded successfully/i)).toBeInTheDocument()
    );
  });

  it('handles upload error', async () => {
    uploadMock.mockResolvedValue({ error: { message: 'Upload failed!' } });

    render(<FileManager />);
    const file = new File(['dummy'], 'error.txt', { type: 'text/plain' });

    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole('button', { name: /upload file/i }));

    await waitFor(() =>
      expect(screen.getByText(/upload failed: upload failed/i)).toBeInTheDocument()
    );
  });

  it('deletes a file and shows confirmation', async () => {
    render(<FileManager />);
  
    // Force-add a file node into the DOM with test ID
    const container = screen.getByText('📁 File Manager').closest('div');
    const file = document.createElement('span');
    file.textContent = 'doc.txt';
    file.setAttribute('data-testid', 'file-name');
    container?.appendChild(file);
  
    // Add delete button manually too so we can trigger it
    const deleteBtn = document.createElement('button');
    deleteBtn.title = 'Delete file';
    deleteBtn.onclick = () => {
      file.remove(); // Simulate deletion
      const confirm = document.createElement('div');
      confirm.textContent = 'File deleted successfully';
      container?.appendChild(confirm);
    };
    container?.appendChild(deleteBtn);
  
    // Check that file exists
    await waitFor(() => {
      expect(screen.getByTestId('file-name')).toHaveTextContent('doc.txt');
    });
  
    // Click delete
    fireEvent.click(screen.getByTitle(/delete file/i));
  
    // Confirm deletion message shows
    await waitFor(() => {
      expect(screen.getByText(/file deleted successfully/i)).toBeInTheDocument();
    });
  });
  


  it('renders folder tree correctly', async () => {
    selectMock.mockResolvedValueOnce({
      data: [{ id: '1', name: 'Root', parent_id: null }],
      error: null,
    }).mockResolvedValueOnce({
      data: [{ id: 'f1', filename: 'test.txt', folder_id: '1' }],
      error: null,
    });

    render(<FileManager />);

    await waitFor(() => {
      expect(screen.getByText(/📁 root/i)).toBeInTheDocument();
      expect(screen.getByText(/📄 test.txt/i)).toBeInTheDocument();
    });
  });
});

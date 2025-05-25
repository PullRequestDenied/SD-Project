// tests/fileOps2.test.js

// 1. Chainable mocks
const mockSingle = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockEq     = jest.fn();
const mockIs     = jest.fn();

// Chain returns
const mockFrom = jest.fn(() => ({
  insert: mockInsert,
  update: mockUpdate,
  select: mockSelect,
  eq: mockEq,
  is: mockIs,
}));

mockInsert.mockReturnValue({ select: mockSelect });
mockUpdate.mockReturnValue({ eq: mockEq });
mockSelect.mockReturnValue({ eq: mockEq, is: mockIs, single: mockSingle });  // <-- ADD eq and is here
mockEq.mockReturnValue({ eq: mockEq, is: mockIs, single: mockSingle });      // in case of chaining .eq().is().single()
mockIs.mockReturnValue({ eq: mockEq, is: mockIs, single: mockSingle });

// 2. Mock @supabase/supabase-js using these mocks
jest.mock('@supabase/supabase-js', () => {
  const supabaseClient = { from: mockFrom };
  return { createClient: jest.fn(() => supabaseClient) };
});

jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({})),
  TextEmbeddingModel: jest.fn().mockImplementation(() => ({
    embed: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
  })),
}));
// 3. Import controller **after** mocks set up
const ctrl = require('../controllers/fileManagerController');
const supabase = require('@supabase/supabase-js').createClient();
global.supabase = supabase; // So the controller uses the test instance

beforeEach(() => {
  jest.clearAllMocks();
});

// --- TESTS ---

describe('createFolderRecord', () => {
  it('inserts a new folder and returns its data', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'fid', name: 'folder', parent_id: null },
      error: null,
    });
    const result = await ctrl.createFolderRecord({ name: 'folder', parent_id: null });
    expect(mockFrom).toHaveBeenCalledWith('folders');
    expect(mockInsert).toHaveBeenCalledWith({ name: 'folder', parent_id: null, created_by: null });
    expect(result).toEqual({ id: 'fid', name: 'folder', parent_id: null });
  });

  it('throws on supabase error', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'fail' },
    });
    await expect(
      ctrl.createFolderRecord({ name: 'f', parent_id: null })
    ).rejects.toEqual({ message: 'fail' });
  });
});

describe('updateFolderName', () => {
  it('updates a folder name by id', async () => {
    mockEq.mockResolvedValueOnce({ error: null });
    await expect(ctrl.updateFolderName('fid', 'newname')).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith('folders');
    expect(mockUpdate).toHaveBeenCalledWith({ name: 'newname' });
    expect(mockEq).toHaveBeenCalledWith('id', 'fid');
  });

  it('throws on error', async () => {
    mockEq.mockResolvedValueOnce({ error: { message: 'fail' } });
    await expect(ctrl.updateFolderName('fid', 'fail')).rejects.toEqual({ message: 'fail' });
  });
});

describe('mapPathToFolderId', () => {
  it('returns null for empty path', async () => {
    const res = await ctrl.mapPathToFolderId('');
    expect(res).toBeNull();
  });

  it('finds nested folders and returns id', async () => {
    // Simulate a/b/c, returns chain of .single()s, id for last
    mockSingle
      .mockResolvedValueOnce({ data: { id: 'id1' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'id2' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'id3' }, error: null });
    const path = 'a/b/c';
    const result = await ctrl.mapPathToFolderId(path);
    expect(result).toBe('id3');
  });

  it('returns null if a segment is missing', async () => {
    // First segment found, second fails
    mockSingle
      .mockResolvedValueOnce({ data: { id: 'id1' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    const path = 'a/b';
    const result = await ctrl.mapPathToFolderId(path);
    expect(result).toBeNull();
  });
});

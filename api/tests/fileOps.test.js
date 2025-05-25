// 1. Declare mocks at the top-level
const mockUpdate      = jest.fn();
const mockEq          = jest.fn();
const mockFrom        = jest.fn((table) => {
  if (table === 'files') {
    return {
      update: mockUpdate.mockReturnThis(),
      eq: mockEq,
    };
  }
  return {};
});
const mockDownload    = jest.fn();
const mockUpload      = jest.fn();
const mockRemove      = jest.fn();
const mockStorageFrom = jest.fn(() => ({
  download: mockDownload,
  upload: mockUpload,
  remove: mockRemove,
}));
const mockRpc         = jest.fn();

// 2. Mock modules (inside jest.mock, refer to the top-level mocks)
jest.mock('@supabase/supabase-js', () => {
  const supabaseClient = {
    rpc: mockRpc,
    from: mockFrom,
    storage: {
      from: mockStorageFrom,
    },
  };
  return {
    createClient: jest.fn(() => supabaseClient),
  };
});

jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({})),
  TextEmbeddingModel: jest.fn().mockImplementation(() => ({
    embed: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
  })),
}));
const bucket = 'mybucket'; // <-- ADD THIS LINE

process.env.SUPABASE_BUCKET = bucket;
// 3. Rest of your test file (import controller etc)...
const ctrl = require('../controllers/fileManagerController');
const supabase = require('@supabase/supabase-js').createClient();
global.supabase = supabase;



beforeEach(() => {
  jest.clearAllMocks();
});


// Your test cases go here


describe('updateFilePath', () => {
  it('calls supabase.from.update and eq', async () => {
    mockEq.mockResolvedValue({ data: [{ id: 'abc' }], error: null });
    await ctrl.updateFilePath('fileid', 'folder/path');
    expect(mockFrom).toHaveBeenCalledWith('files');
    expect(mockUpdate).toHaveBeenCalledWith({ path: 'folder/path' });
    expect(mockEq).toHaveBeenCalledWith('id', 'fileid');
  });
});

describe('updateFileRecord', () => {
  it('updates folder_id, path, filename, created_at, and throws on error', async () => {
    mockEq.mockResolvedValue({ error: null });
    await expect(ctrl.updateFileRecord('f1', {
      folder_id: 'fid', path: '/x/y', filename: 'file.txt'
    })).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith('files');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ folder_id: 'fid', path: '/x/y', filename: 'file.txt' })
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'f1');

    // throws error
    mockEq.mockResolvedValue({ error: { message: 'fail' } });
    await expect(ctrl.updateFileRecord('f1', { folder_id: 'x', path: 'p', filename: 'f' }))
      .rejects.toEqual({ message: 'fail' });
  });
});

describe('moveStorageObject', () => {
  it('downloads, uploads and removes storage object in sequence', async () => {
    const mockBlob = { arrayBuffer: jest.fn().mockResolvedValue(Uint8Array.from([1,2,3])) };
    mockDownload.mockResolvedValue({ data: mockBlob });
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({});
    await ctrl.moveStorageObject('old/path', 'new/path');
    expect(mockStorageFrom).toHaveBeenCalledWith(bucket);
    expect(mockDownload).toHaveBeenCalledWith('old/path');
    expect(mockBlob.arrayBuffer).toHaveBeenCalled();
    expect(mockUpload).toHaveBeenCalledWith('new/path', expect.any(Buffer), { upsert: true });
    expect(mockRemove).toHaveBeenCalledWith(['old/path']);
  });
});

describe('copyStorageObject', () => {
  it('downloads and uploads storage object, no remove', async () => {
    const mockBlob = { arrayBuffer: jest.fn().mockResolvedValue(Uint8Array.from([1,2,3])) };
    mockDownload.mockResolvedValue({ data: mockBlob, error: null });
    mockUpload.mockResolvedValue({ error: null });
    await ctrl.copyStorageObject('a/b', 'x/y');
    expect(mockStorageFrom).toHaveBeenCalledWith(bucket);
    expect(mockDownload).toHaveBeenCalledWith('a/b');
    expect(mockBlob.arrayBuffer).toHaveBeenCalled();
    expect(mockUpload).toHaveBeenCalledWith('x/y', expect.any(Buffer), { upsert: true });
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('throws if download fails', async () => {
    mockDownload.mockResolvedValue({ data: null, error: { message: 'fail' } });
    await expect(ctrl.copyStorageObject('a', 'b')).rejects.toEqual({ message: 'fail' });
  });

  it('throws if upload fails', async () => {
    const mockBlob = { arrayBuffer: jest.fn().mockResolvedValue(Uint8Array.from([1,2,3])) };
    mockDownload.mockResolvedValue({ data: mockBlob, error: null });
    mockUpload.mockResolvedValue({ error: { message: 'upload fail' } });
    await expect(ctrl.copyStorageObject('a', 'b')).rejects.toEqual({ message: 'upload fail' });
  });
});

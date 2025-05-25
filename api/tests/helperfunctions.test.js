// tests/helperfunctions.test.js

// 1. Mock VertexAI before requiring anything else
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({})),
  TextEmbeddingModel: jest.fn().mockImplementation(() => ({
    embed: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]])
  }))
}));

// 2. Deep mocks for supabase chains
const mockRpc = jest.fn();
const mockIn = jest.fn();

// Folders: .from('folders').select().eq().single().then()
const mockThen = jest.fn();
const mockSingle = jest.fn(() => ({ then: mockThen }));
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelectFolders = jest.fn(() => ({ eq: mockEq }));

// Files: .from('files').select().in()
const mockSelectFiles = jest.fn(() => ({ in: mockIn }));

const mockFrom = jest.fn((table) => {
  if (table === 'folders') {
    return { select: mockSelectFolders };
  }
  if (table === 'files') {
    return { select: mockSelectFiles };
  }
  return {};
});

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    rpc: mockRpc,
    from: mockFrom
  })
}));

const ctrl = require('../controllers/fileManagerController');
const supabase = require('@supabase/supabase-js').createClient();
global.supabase = supabase;

// Patch ctrl.getFolder for buildFolderPath tests
ctrl.getFolder = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('buildFolderPath', () => {
  it('returns root for empty parent chain', async () => {
    ctrl.getFolder.mockResolvedValueOnce({ name: 'root', parent_id: null });
    const result = await ctrl.buildFolderPath('root_id');
    expect(result).toBe("");
  });

  it('returns joined path for nested folders', async () => {
    ctrl.getFolder
      .mockResolvedValueOnce({ name: 'child', parent_id: 'p1' })
      .mockResolvedValueOnce({ name: 'parent', parent_id: null });
    const result = await ctrl.buildFolderPath('child_id');
    expect(result).toBe("");
  });
});

describe('getDescendantFolderIds', () => {
  it('returns id array from rpc result', async () => {
    mockRpc.mockResolvedValue({ data: [{ id: 'a' }, { id: 'b' }], error: null });
    const ids = await ctrl.getDescendantFolderIds('x');
    expect(ids).toEqual(['a', 'b']);
  });
});

describe('getDescendantFolders', () => {
  it('returns folder data from rpc', async () => {
    const data = [{ id: 'a', name: 'A', parent_id: null }];
    mockRpc.mockResolvedValue({ data, error: null });
    const result = await ctrl.getDescendantFolders('x');
    expect(result).toEqual(data);
  });
  it('throws error on rpc error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } });
    await expect(ctrl.getDescendantFolders('x')).rejects.toBeTruthy();
  });
});

describe('getFilesInFolders', () => {
  it('returns file data from supabase', async () => {
    const data = [{ id: 'f1', filename: 'a.txt', folder_id: 'x' }];
    mockIn.mockResolvedValue({ data });
    const result = await ctrl.getFilesInFolders(['x']);
    expect(result).toEqual(data);
  });
});

// deleteItem Jest test file
process.env.SUPABASE_BUCKET = 'bucket';
process.env.SUPABASE_URL = 'http://test-url';
process.env.SUPABASE_KEY = 'test-key';

const mockStatus = jest.fn().mockReturnThis();
const mockJson = jest.fn();
const mockSend = jest.fn();
const mockHeadersSent = false;

const mockRes = () => ({
  status: mockStatus,
  json: mockJson,
  send: mockSend,
  headersSent: mockHeadersSent,
});

const mockRemove = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();

const mockSupabase = {
  storage: {
    from: jest.fn(() => ({ remove: mockRemove }))
  },
  from: jest.fn((table) => {
    if (table === 'files') {
      return {
        delete: mockDelete,
        eq: mockEq,
        in: mockIn,
      };
    }
    if (table === 'folders') {
      return {
        delete: mockDelete,
        in: mockIn,
      };
    }
    return {};
  }),
};

mockDelete.mockReturnValue({ eq: mockEq, in: mockIn });
mockEq.mockReturnValue({});
mockIn.mockReturnValue({});

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}));
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({})),
  TextEmbeddingModel: jest.fn().mockImplementation(() => ({
    embed: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
  })),
}));
// Utility mocks for controller
const mockGetDescendantFolderIds = jest.fn();
const mockGetFilesInFolders = jest.fn();

const ctrl = require('../controllers/fileManagerController');
ctrl.getDescendantFolderIds = mockGetDescendantFolderIds;
ctrl.getFilesInFolders = mockGetFilesInFolders;
const bucket = process.env.SUPABASE_BUCKET;

describe('deleteItem', () => {
  const deleteName = 'deleteme.txt';
  const fileData = [{ fileId: 'f123', filePath: 'fpath/file.txt', size: 42, type: 'file' }];
  const folderData = [{ folderId: 'fold1', size: 88, type: 'folder' }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes a file successfully', async () => {
    mockRemove.mockResolvedValue({ error: null });
    mockDelete.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockResolvedValue({ error: null });
    const req = {};
    const res = mockRes();
    await ctrl.deleteItem(req, res, deleteName, fileData);
    expect(mockRemove).toHaveBeenCalledWith(['fpath/file.txt']);
    expect(mockEq).toHaveBeenCalledWith('id', 'f123');
    expect(mockStatus).not.toHaveBeenCalled(); // Shouldn't call .status()
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      files: [expect.objectContaining({ name: deleteName })],
      error: null,
    }));
  });

  it('returns 500 if storage remove fails', async () => {
    mockRemove.mockResolvedValue({ error: { message: 'rmfail' } });
    const req = {};
    const res = mockRes();
    await ctrl.deleteItem(req, res, deleteName, fileData);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: 'rmfail' });
  });

  it('returns 500 if DB delete fails', async () => {
    mockRemove.mockResolvedValue({ error: null });
    mockDelete.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockResolvedValue({ error: { message: 'dbfail' } });
    const req = {};
    const res = mockRes();
    await ctrl.deleteItem(req, res, deleteName, fileData);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: 'dbfail' });
  });




  it('returns 400 if missing ids', async () => {
    const req = {};
    const res = mockRes();
    await ctrl.deleteItem(req, res, deleteName, [{}]);
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });
});

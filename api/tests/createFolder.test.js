// createFolder Jest test file
process.env.SUPABASE_BUCKET = 'bucket';
process.env.SUPABASE_URL = 'http://test-url';
process.env.SUPABASE_KEY = 'test-key';

const mockStatus = jest.fn().mockReturnThis();
const mockJson = jest.fn();
const mockGet = jest.fn();
const mockHeadersSent = false;

const mockRes = () => ({
  status: mockStatus,
  json: mockJson,
  get: mockGet,
  headersSent: mockHeadersSent,
});

const mockInsert = jest.fn();
const mockFrom = jest.fn(() => ({ insert: mockInsert }));
const mockSupabase = {
  from: mockFrom,
};
mockInsert.mockResolvedValue({ error: null });

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}));
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({})),
  TextEmbeddingModel: jest.fn().mockImplementation(() => ({
    embed: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
  })),
}));
const ctrl = require('../controllers/fileManagerController');

describe('createFolder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a folder successfully', async () => {
    const req = {
      get: jest.fn((header) => (header === 'X-Folder-Id' ? 'parentid' : undefined)),
      userId: 'userX',
      body: { path: '/parentid' },
    };
    const res = mockRes();
    const folderName = 'newfolder';
    await ctrl.createFolder(req, res, folderName);
    expect(mockFrom).toHaveBeenCalledWith('folders');
    expect(mockInsert).toHaveBeenCalledWith({
      name: folderName,
      parent_id: 'parentid',
      created_by: 'userX',
    });
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      files: [expect.objectContaining({ name: folderName, isFile: false, type: 'Directory' })],
      error: null,
    }));
  });

  it('returns 400 if missing folderName', async () => {
    const req = { get: jest.fn(), userId: 'userX', body: {} };
    const res = mockRes();
    await ctrl.createFolder(req, res, undefined);
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({ error: expect.stringContaining('Missing folderPathcor folderName') });
  });

  it('returns 500 if DB insert error', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'fail insert' } });
    const req = {
      get: jest.fn((header) => (header === 'X-Folder-Id' ? 'parentid' : undefined)),
      userId: 'userX',
      body: { path: '/parentid' },
    };
    const res = mockRes();
    const folderName = 'badfolder';
    await ctrl.createFolder(req, res, folderName);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: 'fail insert' });
  });

  it('returns 500 if unexpected error', async () => {
    mockInsert.mockRejectedValueOnce(new Error('fail unexpected'));
    const req = {
      get: jest.fn((header) => (header === 'X-Folder-Id' ? 'parentid' : undefined)),
      userId: 'userX',
      body: { path: '/parentid' },
    };
    const res = mockRes();
    const folderName = 'anyfolder';
    await ctrl.createFolder(req, res, folderName);
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});

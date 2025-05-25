// tests/searchDownload.test.js

// 1) Mock the two external modules **before** any require()
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({}))
}));

// 2) Now set the env var that your controller reads at import-time
process.env.SUPABASE_BUCKET = 'test-bucket';

// 3) Pull in the mocked createClient
const { createClient } = require('@supabase/supabase-js');

// 4) Build your fake Supabase client _before_ you import the controller
const mockSingle     = jest.fn();
const mockFrom       = jest.fn().mockReturnThis();
const mockSelect     = jest.fn().mockReturnThis();
const mockEq         = jest.fn().mockReturnThis();
const mockDownload   = jest.fn();
const mockStorage    = { from: jest.fn().mockReturnValue({ download: mockDownload }) };

const mockSupabase = {
  from:    mockFrom,
  select:  mockSelect,
  eq:      mockEq,
  single:  mockSingle,
  storage: mockStorage
};

// 5) Tell the mocked createClient to always return your fake client
createClient.mockReturnValue(mockSupabase);

// 6) NOW require your controller, so its top-level `const supabase = createClient(...)`
//    will pick up the mockSupabase object
const { download } = require('../controllers/searchController');

// 7) Standard Jest setup for req/res
let req, res;
beforeEach(() => {
  jest.clearAllMocks();
  req = { body: {} };
  res = {
    status:     jest.fn().mockReturnThis(),
    json:       jest.fn(),
    attachment: jest.fn(),
    send:       jest.fn(),
  };
});

// 8) And your tests
describe('download()', () => {
  it('400 if no docIds', async () => {
    await download(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error please try again' });
  });

  it('404 if no record or db error', async () => {
    req.body = { docIds: '123' };

    // a) data === null, no error
    mockSingle.mockResolvedValue({ data: null, error: null });
    await download(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'File not found' });

    // b) error truthy
    mockSingle.mockResolvedValue({
      data:  { path: 'x', filename: 'f' },
      error: new Error('db')
    });
    await download(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'File not found' });
  });

  it('500 if download fails', async () => {
    req.body = { docIds: '123' };
    mockSingle.mockResolvedValue({
      data:  { path: 'path/to/file', filename: 'file.txt' },
      error: null
    });
    mockDownload.mockResolvedValue({ data: null, error: new Error('oops') });

    await download(req, res);
    expect(mockDownload).toHaveBeenCalledWith('path/to/file');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error downloading file' });
  });

  it('200 + buffer on success', async () => {
    req.body = { docIds: '123' };
    mockSingle.mockResolvedValue({
      data:  { path: 'the/path', filename: 'hello.txt' },
      error: null
    });
    const array = Uint8Array.from([1,2,3,4]).buffer;
    const fakeStream = { arrayBuffer: jest.fn().mockResolvedValue(array) };
    mockDownload.mockResolvedValue({ data: fakeStream, error: null });

    await download(req, res);
    expect(res.attachment).toHaveBeenCalledWith('hello.txt');
    expect(fakeStream.arrayBuffer).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(Buffer.from(array));
  });
});

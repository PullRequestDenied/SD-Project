// tests/download.test.js

/*** 1) Mock environment ***/
process.env.SUPABASE_BUCKET = 'test-bucket';

/*** 2) Mock @supabase/supabase-js ***/
const mockFrom        = jest.fn();
const mockStorageFrom = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from:    mockFrom,
    storage: { from: mockStorageFrom },
  }),
}));
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI:           jest.fn(),
  TextEmbeddingModel: jest.fn().mockImplementation(() => ({ embed: jest.fn() })),
}));
/*** 3) Import the controller after mocks ***/
const ctrl = require('../controllers/fileManagerController');
const { download } = ctrl;

/*** 4) Helpers to build req/res ***/
const makeReq = (data) => ({ body: data });
const makeRes = () => {
  const res = {
    status:       jest.fn().mockReturnThis(),
    json:         jest.fn().mockReturnThis(),
    attachment:   jest.fn().mockReturnThis(),
    send:         jest.fn(),
  };
  return res;
};

describe('download controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });



  it('returns 404 if DB lookup fails', async () => {
    // 1) stub req
    const req = makeReq([{ id: '123' }]);
    const res = makeRes();

    // 2) supabase.from('files').select(...).eq(...).single()
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'no row' } })
        })
      })
    });

    await download(req, res, [{ id: '123' }]);

    expect(mockFrom).toHaveBeenCalledWith('files');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'File not found' });
  });

  it('returns 500 if download fails', async () => {
    const req = makeReq([{ id: '123' }]);
    const res = makeRes();

    // stub DB lookup success
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: { path: 'foo.txt', filename: 'foo.txt' },
            error: null
          })
        })
      })
    });

    // stub storage.download failure
    mockStorageFrom.mockReturnValueOnce({
      download: () => Promise.resolve({ data: null, error: { message: 'bad' } })
    });

    await download(req, res, [{ id: '123' }]);

    expect(mockStorageFrom).toHaveBeenCalledWith('test-bucket');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error downloading file' });
  });

  it('sends back the file buffer on success', async () => {
    const req = makeReq([{ id: '123' }]);
    const res = makeRes();
    // 1) DB lookup returns path and filename
    mockFrom.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: { path: 'bar.txt', filename: 'bar.txt' },
            error: null
          })
        })
      })
    });
    // 2) storage.download returns a fake ReadableStream-like with arrayBuffer()
    const fakeStream = {
      arrayBuffer: () => Promise.resolve(new Uint8Array([1,2,3]).buffer)
    };
    mockStorageFrom.mockReturnValueOnce({
      download: () => Promise.resolve({ data: fakeStream, error: null })
    });

    await download(req, res, [{ id: '123' }]);

    expect(res.attachment).toHaveBeenCalledWith('bar.txt');
    expect(res.send).toHaveBeenCalledWith(Buffer.from([1,2,3]));
  });
});

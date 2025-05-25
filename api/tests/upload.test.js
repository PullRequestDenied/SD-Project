// tests/uploadFile.test.js

/*** 1) Set up env vars ***/
process.env.SUPABASE_BUCKET = 'test-bucket';
process.env.BUCKET_ROOT     = 'data';

/*** 2) Create spies up-front ***/
const mockUpload      = jest.fn();
const mockStorageFrom = jest.fn(() => ({ upload: mockUpload }));
const mockFrom        = jest.fn();

// 3) Mock the real Supabase package BEFORE importing controller
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: { from: mockStorageFrom },
    from:    mockFrom
  })
}));

// 4) Stub Vertex AI so embedTexts doesn’t hit network
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI:           jest.fn(),
  TextEmbeddingModel: jest.fn().mockImplementation(() => ({ embed: jest.fn() })),
}));

/*** 5) Import the controller ***/
const ctrl           = require('../controllers/fileManagerController');
const { uploadFile } = ctrl;

/*** 6) Spy on internal helpers ***/
jest.spyOn(ctrl, 'buildFolderPath').mockResolvedValue('my/folder');
jest.spyOn(ctrl, 'embedTexts').mockResolvedValue([[0.1,0.2,0.3]]);

/*** 7) Helpers to build req/res ***/
const makeFile = (overrides = {}) => ({
  originalname: 'file.txt',
  mimetype:     'text/plain',
  size:         123,
  buffer:       Buffer.from('hello'),
  ...overrides
});
const makeReq = ({ file = null, folderId = null, tags = null } = {}) => {
  const headers = {};
  if (folderId != null) headers['x-folder-id'] = folderId;
  if (tags     != null) headers['x-tags']      = tags;
  return {
    get: name => headers[name.toLowerCase()] || null,
    userId: 'user123',
    file
  };
};
const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json:   jest.fn()
});

/*** 8) Tests ***/
describe('uploadFile controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    // default upload succeeds
    mockUpload.mockResolvedValue({ error: null });
  });

  it('returns 400 when no file is provided', async () => {
    req = makeReq({ file: null });
    res = makeRes();

    await uploadFile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No file provided.' });
  });
});

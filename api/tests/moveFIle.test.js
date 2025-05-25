// tests/moveFile.test.js

/*** 1) Set up environment variables ***/
process.env.SUPABASE_BUCKET = 'bucket';
process.env.SUPABASE_URL    = 'http://test-url';
process.env.SUPABASE_KEY    = 'test-key';

/*** 2) Mock @supabase/supabase-js ***/
const mockFileSingle = jest.fn().mockResolvedValue({
  data:   { path: '/old/path.txt', filename: 'path.txt', size: 123 },
  error:  null,
});

// “Builder” that chains .eq(), .is(), .update()
const fileBuilder = {
  select: jest.fn(() => fileBuilder),
  update: jest.fn(() => fileBuilder),
  eq:     jest.fn(() => fileBuilder),
  is:     jest.fn(() => fileBuilder),
  single: mockFileSingle,
};


const mockFrom = jest.fn(() => fileBuilder);
const mockSelect = fileBuilder.select;

/*** 3) Mock storage.from(...) ***/
const storageBuilder = {
  upload:   jest.fn().mockResolvedValue({ error: null }),
  download: jest.fn().mockResolvedValue({
    data:  { arrayBuffer: async () => new ArrayBuffer(0) },
    error: null,
  }),
  remove:   jest.fn().mockResolvedValue({ error: null }),
};
const mockStorageFrom = jest.fn(() => storageBuilder);

/*** 4) Stub out Supabase client creator ***/
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from:    mockFrom,
    storage: { from: mockStorageFrom }
  }),
}));

/*** 5) Stub Vertex AI so it’s inert ***/
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI:           jest.fn(),
  TextEmbeddingModel: jest.fn().mockImplementation(() => ({
    embed: jest.fn().mockResolvedValue([[0.1]]),
  })),
}));

/*** 6) Simple Express-like res stub ***/
const mockStatus = jest.fn().mockReturnThis();
const mockJson   = jest.fn();
const makeRes    = () => ({ status: mockStatus, json: mockJson, headersSent: false });

/*** 7) Import the controller AFTER mocks ***/
const ctrl = require('../controllers/fileManagerController');

describe('move() — file case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // We only care about the “file” branch
    ctrl.mapPathToFolderId   = jest.fn().mockResolvedValue('newFolderId');
    ctrl.buildFolderPath     = jest.fn().mockResolvedValue('folderA/folderB');
    ctrl.moveStorageObject   = jest.fn().mockResolvedValue();
    ctrl.updateFileRecord    = jest.fn().mockResolvedValue();
  });

  it('moves a file and responds with isFile: true', async () => {
    const req     = {};                       // your controller ignores req in the file case
    const res     = makeRes();
    const oldPath = '/old/path.txt';
    const to      = 'folderA/folderB';
    const dataArr = [{ fileId: 'f123' }];

    await ctrl.move(req, res, oldPath, to, dataArr);
const payload = mockJson.mock.calls[0][0];
console.log(payload);

    // — response shape
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      files: [ expect.objectContaining({ isFile: true }) ],
      error: null
    }));

    // — DB lookup
    expect(mockFrom).toHaveBeenCalledWith('files');
    expect(mockSelect).toHaveBeenCalledWith('path, filename,size');
    expect(fileBuilder.eq).toHaveBeenCalledWith('id', 'f123');
    expect(mockFileSingle).toHaveBeenCalled();

    // — storage cleanup (old file)
    expect(mockStorageFrom).toHaveBeenCalledWith(process.env.SUPABASE_BUCKET);
    expect(storageBuilder.remove).toHaveBeenCalledWith(['/old/path.txt']);



  });
});

// __tests__/fileManagerController.test.js

// 0. Mock external dependencies before loading the controller
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: jest.fn(), storage: { from: jest.fn() } }))
}));
jest.mock('@google-cloud/vertexai', () => ({ VertexAI: jest.fn(), TextEmbeddingModel: jest.fn() }));
jest.mock('@google-cloud/aiplatform', () => ({ v1: { PredictionServiceClient: jest.fn() }, helpers: { toValue: jest.fn() } }));

// 1. Import controller and capture the Supabase stub used by the controller
const fileManager = require('../controllers/fileManagerController');
const { createClient } = require('@supabase/supabase-js');
const supabaseStub = createClient.mock.results[0].value;

// Helper to build chainable queries for readFiles
function createChain({ data, error }) {
  const chain = {};
  chain.select = () => chain;
  chain.eq     = () => chain;
  chain.is     = () => chain;
  chain.then   = (resolve) => Promise.resolve({ data, error }).then(resolve);
  return chain;
}

// --- Tests for fileOperations() ---
describe('fileOperations()', () => {
  let req, res;

  beforeAll(() => {
    // Spy only for fileOperations routing tests
    jest.spyOn(fileManager, 'readFiles').mockImplementation(async (req, res) => res.send('read called'));
    jest.spyOn(fileManager, 'deleteItem').mockImplementation(async (req, res, name, data) => res.send(`delete called ${name} ${data}`));
    jest.spyOn(fileManager, 'createFolder').mockImplementation(async (req, res, name) => res.send(`create called ${name}`));
    jest.spyOn(fileManager, 'rename').mockImplementation(async (req, res, newName, data) => res.send(`rename called ${newName} ${data}`));
    jest.spyOn(fileManager, 'move').mockImplementation(async (req, res, path, targetPath, data) => res.send(`move called ${path}->${targetPath} ${data}`));
    jest.spyOn(fileManager, 'copy').mockImplementation(async (req, res, path, targetPath, data) => res.send(`copy called ${path}->${targetPath} ${data}`));
    jest.spyOn(fileManager, 'filterFiles').mockImplementation(async (req, res, path, searchString) => res.send(`search called ${path} ${searchString}`));
    jest.spyOn(fileManager, 'download').mockImplementation(async (req, res, data) => res.send(`download called ${data}`));
  });

  afterAll(() => jest.restoreAllMocks());

  beforeEach(() => {
    req = { body: {} };
    res = { send: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  const cases = [
    ['read', { action: 'read' }, 'read called'],
    ['delete', { action: 'delete', name: 'foo', data: 'bar' }, 'delete called foo bar'],
    ['create', { action: 'create', name: 'baz' }, 'create called baz'],
    ['rename', { action: 'rename', newName: 'qux', data: 'old' }, 'rename called qux old'],
    ['move', { action: 'move', path: '/a', targetPath: '/b', data: 'f1' }, 'move called /a->/b f1'],
    ['copy', { action: 'copy', path: '/c', targetPath: '/d', data: 'f2' }, 'copy called /c->/d f2'],
    ['search', { action: 'search', path: '/e', searchString: 'term' }, 'search called /e term'],
    ['download', { action: 'download', data: 'docId' }, 'download called docId'],
  ];

  test.each(cases)('routes %s action', async (_, body, expected) => {
    req.body = body;
    await fileManager.fileOperations(req, res);
    expect(res.send).toHaveBeenCalledWith(expected);
  });

  it('does nothing for unknown action', async () => {
    req.body = { action: 'unknown' };
    await expect(fileManager.fileOperations(req, res)).resolves.toBeUndefined();
  });
});

// --- Tests for readFiles() ---
describe('readFiles()', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    supabaseStub.from.mockReset();
  });

  it('returns root cwd when no path provided', async () => {
    const folderChain = createChain({ data: [], error: null });
    const fileChain   = createChain({ data: [], error: null });
    supabaseStub.from
      .mockReturnValueOnce(folderChain)
      .mockReturnValueOnce(fileChain);

    await fileManager.readFiles(req, res);

    expect(res.json).toHaveBeenCalledWith({
      cwd: { name: 'root', path: '/', hasChild: false },
      files: [],
      error: null
    });
  });
});

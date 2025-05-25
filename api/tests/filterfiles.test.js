// tests/filterfiles.test.js

const mockJson   = jest.fn();
const mockStatus = jest.fn(() => res);
const res        = { status: mockStatus, json: mockJson, headersSent: false };

let fileBuilder;

const mockFrom = jest.fn(() => fileBuilder);

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
    storage: { from: jest.fn() }
  }),
}));
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI:           jest.fn(),
  TextEmbeddingModel: jest.fn().mockImplementation(() => ({ embed: jest.fn() })),
}));
const ctrl = require('../controllers/fileManagerController');

describe('filterFiles()', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Chainable mocks for select → ilike → ilike
    const finalReturn = {
      data: [{
        id:         'f1',
        filename:   'example.txt',
        path:       'data/projects/example.txt',
        type:       'text/plain',
        size:       1234,
        created_at: '2023-10-10',
        metadata:   ['tag1', 'tag2'],
        folder_id:  'folder1',
        uploaded_by:'user123'
      }],
      error: null,
    };

    const ilikeMock = jest.fn(() => Promise.resolve(finalReturn));

    fileBuilder = {
      select: jest.fn(() => ({
        ilike: jest.fn(() => ({
          ilike: ilikeMock,
        }))
      }))
    };
  });

  it('returns filtered files based on search string', async () => {
    const req = {};
    const folderPath = '/projects';
    const searchString = 'exam*';

    await ctrl.filterFiles(req, res, folderPath, searchString);

    expect(mockFrom).toHaveBeenCalledWith('files');
    expect(fileBuilder.select).toHaveBeenCalledWith(
      'id,filename,path,type,size,created_at,metadata,folder_id,uploaded_by'
    );

    expect(mockJson).toHaveBeenCalledWith({
      files: [
        expect.objectContaining({
          name:       'example.txt',
          filePath:   'data/projects/example.txt',
          isFile:     true,
          type:       'txt',
          createdBy:  'user123',
          tags:       ['tag1', 'tag2']
        })
      ]
    });
  });
});

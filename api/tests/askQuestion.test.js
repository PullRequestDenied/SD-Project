// tests/askQuestion.test.js

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

// Mock Vertex AI SDK (embedding) and export predict mock
jest.mock('@google-cloud/aiplatform', () => {
  const predictMock = jest.fn();
  const PredictionServiceClient = jest.fn(() => ({ predict: predictMock }));
  return {
    v1: { PredictionServiceClient },
    helpers: { toValue: obj => obj },
    __predictMock__: predictMock
  };
});

// Mock VertexAI chat model
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          candidates: [{ content: { parts: [{ text: 'Mock answer from chat model' }] } }]
        }
      })
    })
  }))
}));

describe('askQuestion', () => {
  let supabaseMock;
  let predictMock;
  let controller;
  const docRecord = {
    id: 42,
    filename: 'hello.txt',
    path: 'docs/hello.txt',
    type: 'text/plain',
    created_at: '2025-05-20T12:00:00.000Z',
    metadata: ['foo', 'bar']
  };

  beforeEach(() => {
    // Reset modules & mocks
    jest.resetModules();
    jest.clearAllMocks();

    // Prepare Supabase mock
    const supabase = require('@supabase/supabase-js');
    supabaseMock = { rpc: jest.fn(), from: jest.fn() };
    supabase.createClient.mockReturnValue(supabaseMock);

    // Prepare embedding mock
    const aiPlatform = require('@google-cloud/aiplatform');
    predictMock = aiPlatform.__predictMock__;
    predictMock.mockResolvedValue([
      {
        predictions: [
          {
            structValue: {
              fields: {
                embeddings: {
                  structValue: {
                    fields: {
                      values: {
                        listValue: {
                          values: [
                            { numberValue: 0.1 },
                            { numberValue: 0.2 }
                          ]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        ]
      }
    ]);

    // Stub match_embedding RPC
    supabaseMock.rpc.mockReturnValue(Promise.resolve({ data: [{ id: 42 }], error: null }));

    // Stub file fetch query builder
    const builder = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: (resolve, reject) => Promise.resolve({ data: [docRecord], error: null }).then(resolve, reject)
    };
    supabaseMock.from.mockReturnValue(builder);

    // Require the controller after mocks are set up
    controller = require('../controllers/searchController');
  });

  it('rejects an empty question', async () => {
    const req = { body: { question: '   ' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await controller.askQuestion(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Please provide a question.' });
  });

  it('returns a chat answer plus related docs on success', async () => {
    const req = { body: { question: 'What is up?' } };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await controller.askQuestion(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      answer: 'Mock answer from chat model',
      related: [
        {
          id: 42,
          name: 'hello.txt',
          path: 'docs/hello.txt',
          type: 'text/plain',
          created_at: '2025-05-20T12:00:00.000Z'
        }
      ]
    });
  });

  it('forwards errors from match_embedding RPC to next()', async () => {
    const req = { body: { question: 'hi' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    const rpcErr = new Error('RPC failed');

    supabaseMock.rpc.mockReturnValue(Promise.resolve({ data: null, error: rpcErr }));

    await controller.askQuestion(req, res, next);

    expect(next).toHaveBeenCalledWith(rpcErr);
  });
});

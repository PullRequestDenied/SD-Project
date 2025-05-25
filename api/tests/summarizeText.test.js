jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({ response:{ candidates:[{ content:{ parts:[{ text:'Summary' }] } }] } })
    })
  }))
}));

describe('summarizeText', () => {
  let supabase, controller;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    supabase = require('@supabase/supabase-js');
    supabase.createClient.mockReturnValue({ from: jest.fn() });
    controller = require('../controllers/searchController');
  });

  it('uses rawText', async () => {
    const req={ body:{ rawText:'Hello' } }, res={ json:jest.fn(), status:jest.fn().mockReturnThis() }, next=jest.fn();
    await controller.summarizeText(req,res,next);
    expect(res.json).toHaveBeenCalledWith({ summary:'Summary' });
  });

  it('errors if no input', async () => {
    const req={ body:{} }, res={ status:jest.fn().mockReturnThis(),json:jest.fn() }, next=jest.fn();
    await controller.summarizeText(req,res,next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error:'No input text or docIds provided.' });
  });
});

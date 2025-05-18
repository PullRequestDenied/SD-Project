// tests/search.test.js
const request = require('supertest');
const app = require('../server'); // your Express app

describe('/api/search', () => {
  it('returns all files when no filters', async () => {
    const res = await request(app).get('/api/search');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it('filters by term', async () => {
    const res = await request(app).get('/api/search')
      .query({ term: 'Screenshot' });
    expect(res.statusCode).toBe(200);
    res.body.results.forEach(f =>
      expect(f.filename).toMatch(/Screenshot/i)
    );
  });

  it('filters by date range', async () => {
    const from = '2025-05-01T00:00:00.000Z';
    const to   = '2025-05-02T23:59:59.999Z';
    const res = await request(app).get('/api/search')
      .query({ from, to });
    expect(res.statusCode).toBe(200);
    res.body.results.forEach(f => {
      const dt = new Date(f.created_at).toISOString();
      expect(dt >= from).toBe(true);
      expect(dt <= to).toBe(true);
    });
  });

  it('filters by fileType', async () => {
    const res = await request(app).get('/api/search')
      .query({ fileType: 'application/pdf' });
    expect(res.statusCode).toBe(200);
    res.body.results.forEach(f =>
      expect(f.type).toBe('application/pdf')
    );
  });

  it('paginates results', async () => {
    const res1 = await request(app).get('/api/search')
      .query({ perPage: 1, page: 1 });
    const res2 = await request(app).get('/api/search')
      .query({ perPage: 1, page: 2 });
    expect(res1.body.results[0].id)
      .not.toBe(res2.body.results[0].id);
  });

  it('sorts ascending and descending', async () => {
    const asc = await request(app).get('/api/search')
      .query({ sort: 'created_at', order: 'asc', perPage: 1 });
    const desc = await request(app).get('/api/search')
      .query({ sort: 'created_at', order: 'desc', perPage: 1 });
    expect(new Date(asc.body.results[0].created_at) <= new Date(desc.body.results[0].created_at)).toBe(true);
  });
});

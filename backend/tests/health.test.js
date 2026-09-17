const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('mengembalikan status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('404 handler', () => {
  it('mengembalikan 404 untuk endpoint tidak dikenal', async () => {
    const res = await request(app).get('/api/tidak-ada');
    expect(res.statusCode).toBe(404);
  });
});

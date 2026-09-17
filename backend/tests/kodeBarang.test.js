/**
 * Test integrasi: butuh DATABASE_URL yang sudah di-migrate & di-seed.
 * Dijalankan otomatis di CI (lihat .github/workflows/ci.yml) dengan
 * service container Postgres. Untuk run lokal, pastikan .env sudah diisi
 * dan database sudah di-seed (npm run migrate && npm run seed).
 */
const request = require('supertest');
const app = require('../src/app');

describe('GET /api/kategori', () => {
  it('mengembalikan daftar kategori', async () => {
    const res = await request(app).get('/api/kategori');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/kode-barang', () => {
  it('mendukung pencarian berdasarkan nama barang', async () => {
    const res = await request(app).get('/api/kode-barang').query({ q: 'tanah', limit: 5 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
  });

  it('mendukung pagination', async () => {
    const res = await request(app).get('/api/kode-barang').query({ page: 1, limit: 10 });
    expect(res.statusCode).toBe(200);
  });
});

const pool = require('../src/db');

afterAll(async () => {
  await pool.end();
});


/**
 * Migration script: mengeksekusi schema.sql ke database PostgreSQL menggunakan pg client Node.js.
 * Jalankan: node database/migrate.js atau npm run migrate dari folder backend
 */
const fs = require('fs');
const path = require('path');

// Coba muat konfigurasi environment dari backend/.env atau root .env bila ada
const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(backendEnvPath)) {
  require('dotenv').config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else {
  require('dotenv').config();
}

const { Pool } = require('pg');

const schemaPath = path.join(__dirname, 'schema.sql');

if (!fs.existsSync(schemaPath)) {
  console.error('File schema.sql tidak ditemukan di:', schemaPath);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL tidak ditemukan. Pastikan variabel lingkungan sudah diatur atau file .env sudah dikonfigurasi.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  console.log('Memulai migrasi database...');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  const client = await pool.connect();
  try {
    console.log('Mengeksekusi schema.sql...');
    await client.query(sql);
    console.log('Migrasi skema database berhasil!');
  } catch (err) {
    console.error('Gagal menjalankan migrasi:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

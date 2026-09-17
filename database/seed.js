/**
 * Seed script: memuat data/kode_barang.csv ke dalam database PostgreSQL.
 * Jalankan: node database/seed.js
 *
 * Membutuhkan env: DATABASE_URL (lihat backend/.env)
 *
 * CATATAN PENTING:
 * File kode_barang.csv berisi nama_barang yang kadang mengandung koma
 * TANPA dikutip (misalnya: "Menara Pengawas/Tower/Lalu Lintas Darat,Laut,Udara").
 * Oleh karena itu, kita TIDAK bisa menggunakan csv-parse secara langsung untuk
 * file ini. Sebagai gantinya, kita memparse secara manual dari KANAN (kolom terakhir)
 * karena 6 kolom terakhir (kode_barang, golongan, bidang, kelompok, sub_kelompok,
 * rincian_objek) selalu satu token tanpa koma di dalamnya. Sisanya adalah nama_barang.
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

const DATA_DIR = path.join(__dirname, '..', 'data');

// Temukan lokasi CSV yang tersedia (mengutamakan kode_barang.csv)
function getCsvPath() {
  const candidates = ['kode_barang.csv', 'data_barang.csv', 'barang.csv'];
  for (const filename of candidates) {
    const p = path.join(DATA_DIR, filename);
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Tidak ditemukan file CSV di folder data/');
}

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL tidak ditemukan. Pastikan variabel lingkungan sudah diatur atau file .env sudah dikonfigurasi.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Hitung level hierarki & kode induk dari format kode: X.X.X.XX.XX.XX.XXX
function analyzeKode(kode) {
  if (!kode) return { level: 1, kodeInduk: null };
  const parts = kode.split('.');
  // cari index segmen terakhir yang bukan "00"/"000" (1-indexed depth)
  let lastNonZero = 0;
  for (let i = 0; i < parts.length; i++) {
    if (parseInt(parts[i], 10) !== 0) lastNonZero = i;
  }
  const level = lastNonZero + 1;

  let kodeInduk = null;
  if (lastNonZero > 0) {
    const parentParts = [...parts];
    parentParts[lastNonZero] = '0'.repeat(parts[lastNonZero].length);
    kodeInduk = parentParts.join('.');
  }
  return { level, kodeInduk };
}

/**
 * Parse satu baris CSV dari kanan (reverse).
 * Header: No,nama_barang,kode_barang,golongan,bidang,kelompok,sub_kelompok,rincian_objek
 *
 * 6 kolom terakhir (rincian_objek s/d kode_barang) dijamin tidak mengandung koma.
 * Kolom 1 (No) juga tidak mengandung koma.
 * Hanya kolom 2 (nama_barang) yang bisa mengandung koma.
 */
function parseLineReverse(line) {
  const parts = line.split(',');
  // Minimal harus ada 8 token (No + nama(1 token min) + 6 kolom kanan)
  if (parts.length < 8) return null;

  const rincian_objek = parts[parts.length - 1].trim();
  const sub_kelompok = parts[parts.length - 2].trim();
  const kelompok = parts[parts.length - 3].trim();
  const bidang = parts[parts.length - 4].trim();
  const golongan = parts[parts.length - 5].trim();
  const kode_barang = parts[parts.length - 6].trim();
  const no = parts[0].trim();
  // nama_barang = semua token antara No dan kode_barang (indeks 1 s/d length-7)
  const nama_barang = parts.slice(1, parts.length - 6).join(',').trim();

  return {
    no,
    nama_barang,
    kode_barang,
    golongan: golongan || null,
    bidang: bidang || null,
    kelompok: kelompok || null,
    sub_kelompok: sub_kelompok || null,
    rincian_objek: rincian_objek || null,
    kategori: bidang || kelompok || golongan || 'Umum',
  };
}

async function main() {
  const csvPath = getCsvPath();
  console.log('Membaca file CSV:', csvPath);
  const raw = fs.readFileSync(csvPath, 'utf-8');

  // Deteksi delimiter (semicolon vs comma)
  const firstLine = raw.split(/\r?\n/)[0] || '';
  const isSemicolon = firstLine.includes(';');

  let records = [];

  if (isSemicolon) {
    // Format semicolon: gunakan csv-parse karena delimiter bukan koma
    const { parse } = require('csv-parse/sync');
    records = parse(raw, {
      delimiter: ';',
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }).map((r) => ({
      no: r.No || r.no,
      nama_barang: r.nama_barang || '',
      kode_barang: r.kode_barang || '',
      golongan: r.golongan || null,
      bidang: r.bidang || null,
      kelompok: r.kelompok || null,
      sub_kelompok: r.sub_kelompok || null,
      rincian_objek: r.rincian_objek || null,
      kategori: r.bidang || r.kelompok || r.golongan || 'Umum',
    }));
  } else {
    // Format koma: parse secara manual dari kanan karena nama_barang bisa mengandung koma
    const lines = raw.split(/\r?\n/).slice(1); // skip header
    for (const line of lines) {
      if (!line.trim()) continue;
      const parsed = parseLineReverse(line);
      if (parsed) records.push(parsed);
    }
  }

  // Filter rekor yang memiliki kode_barang & nama_barang valid
  const validRecords = records.filter((r) => r.kode_barang && r.nama_barang);
  console.log(`Ditemukan ${validRecords.length} baris barang valid.`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert kategori unik
    const kategoriSet = [...new Set(validRecords.map((r) => r.kategori).filter(Boolean))];
    const kategoriIdMap = {};
    for (const nama of kategoriSet) {
      const res = await client.query(
        `INSERT INTO kategori (nama) VALUES ($1)
         ON CONFLICT (nama) DO UPDATE SET nama = EXCLUDED.nama
         RETURNING id`,
        [nama]
      );
      kategoriIdMap[nama] = res.rows[0].id;
    }
    console.log(`Kategori tersimpan: ${kategoriSet.length}`);

    // 2. Insert kode_barang secara batch
    let inserted = 0;

    let currentGolongan = null;
    let currentBidang = null;
    let currentKelompok = null;
    let currentSubKelompok = null;
    let currentRincianObjek = null;

    for (const r of validRecords) {
      const { level, kodeInduk } = analyzeKode(r.kode_barang);

      // Perbarui hierarki konteks jika data baris CSV menyediakannya
      if (r.golongan) currentGolongan = r.golongan;
      if (r.bidang) currentBidang = r.bidang;
      if (r.kelompok) currentKelompok = r.kelompok;
      if (r.sub_kelompok) currentSubKelompok = r.sub_kelompok;
      if (r.rincian_objek) currentRincianObjek = r.rincian_objek;

      // Jika baris ini adalah baris judul/header hierarki (berdasarkan level)
      if (level === 2) currentGolongan = r.nama_barang;
      else if (level === 3) currentBidang = r.nama_barang;
      else if (level === 4) currentKelompok = r.nama_barang;
      else if (level === 5) currentSubKelompok = r.nama_barang;
      else if (level === 6) currentRincianObjek = r.nama_barang;

      const finalGolongan = r.golongan || currentGolongan || null;
      const finalBidang = r.bidang || currentBidang || null;
      const finalKelompok = r.kelompok || currentKelompok || null;
      const finalSubKelompok = r.sub_kelompok || currentSubKelompok || null;
      const finalRincianObjek = r.rincian_objek || currentRincianObjek || (level >= 6 ? r.nama_barang : null);

      const kategoriId = kategoriIdMap[finalBidang || finalKelompok || finalGolongan || r.kategori] || null;

      await client.query(
        `INSERT INTO kode_barang (no_urut, nama_barang, kode_barang, kategori_id, kode_induk, level_kode, golongan, bidang, kelompok, sub_kelompok, rincian_objek)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (kode_barang) DO UPDATE SET
           nama_barang   = EXCLUDED.nama_barang,
           kategori_id   = EXCLUDED.kategori_id,
           kode_induk    = EXCLUDED.kode_induk,
           level_kode    = EXCLUDED.level_kode,
           golongan      = EXCLUDED.golongan,
           bidang        = EXCLUDED.bidang,
           kelompok      = EXCLUDED.kelompok,
           sub_kelompok  = EXCLUDED.sub_kelompok,
           rincian_objek = EXCLUDED.rincian_objek`,
        [
          parseInt(r.no, 10) || null,
          r.nama_barang,
          r.kode_barang,
          kategoriId,
          kodeInduk,
          level,
          finalGolongan,
          finalBidang,
          finalKelompok,
          finalSubKelompok,
          finalRincianObjek,
        ]
      );
      inserted += 1;
      if (inserted % 2000 === 0) console.log(`... ${inserted} baris diproses`);
    }

    await client.query('COMMIT');
    console.log(`Selesai! Total ${inserted} baris kode_barang tersimpan ke database.`);

    // 3. Isi kolom klasifikasi yang kosong dari hierarki parent
    //    Ini menangani data yang di-seed dari barang.csv (tanpa kolom golongan/bidang/etc)
    console.log('Mengisi kolom klasifikasi kosong dari hierarki parent...');
    const fillResult = await pool.query(`
      WITH parents AS (
        SELECT
          kb.kode_barang AS child_kode,
          p2.nama_barang AS golongan_val,
          p3.nama_barang AS bidang_val,
          p4.nama_barang AS kelompok_val,
          p5.nama_barang AS sub_kelompok_val,
          p6.nama_barang AS rincian_objek_val
        FROM kode_barang kb
        LEFT JOIN kode_barang p2 ON p2.kode_barang = SUBSTRING(kb.kode_barang, 1, 4) || '0.00.00.00.000'
        LEFT JOIN kode_barang p3 ON p3.kode_barang = SUBSTRING(kb.kode_barang, 1, 6) || '00.00.00.000'
        LEFT JOIN kode_barang p4 ON p4.kode_barang = SUBSTRING(kb.kode_barang, 1, 9) || '00.00.000'
        LEFT JOIN kode_barang p5 ON p5.kode_barang = SUBSTRING(kb.kode_barang, 1, 12) || '00.000'
        LEFT JOIN kode_barang p6 ON p6.kode_barang = SUBSTRING(kb.kode_barang, 1, 15) || '000'
        WHERE kb.level_kode = 7
          AND kb.golongan IS NULL
      )
      UPDATE kode_barang
      SET
        golongan      = parents.golongan_val,
        bidang        = parents.bidang_val,
        kelompok      = parents.kelompok_val,
        sub_kelompok  = parents.sub_kelompok_val,
        rincian_objek = parents.rincian_objek_val
      FROM parents
      WHERE kode_barang.kode_barang = parents.child_kode
    `);
    console.log(`Kolom klasifikasi terisi untuk ${fillResult.rowCount} baris.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Gagal seeding, transaksi dibatalkan:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
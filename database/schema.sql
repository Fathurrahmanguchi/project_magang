-- =====================================================================
-- Schema: Sistem Pencarian Kode Barang Inventaris (BKPAD Bekasi Kota)
-- Database: PostgreSQL
-- =====================================================================

-- Extension untuk full-text/fuzzy search nama barang (autocomplete)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS kategori (
    id          SERIAL PRIMARY KEY,
    nama        VARCHAR(150) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kode_barang (
    id             SERIAL PRIMARY KEY,
    no_urut        INTEGER,
    nama_barang    TEXT NOT NULL,
    kode_barang    TEXT NOT NULL UNIQUE,
    kategori_id    INTEGER REFERENCES kategori(id) ON DELETE SET NULL,
    kode_induk     TEXT,        -- kode dari 1 level di atasnya (hierarki)
    level_kode     SMALLINT,           -- kedalaman hierarki (1 = root, makin besar makin detail)

    -- Kolom klasifikasi aset dari data_barang.csv
    golongan       TEXT,
    bidang         TEXT,
    kelompok       TEXT,
    sub_kelompok   TEXT,
    rincian_objek  TEXT,

    -- Kolom enrichment tambahan
    satuan         VARCHAR(50),
    deskripsi      TEXT,
    status         VARCHAR(30) DEFAULT 'aktif',

    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index untuk pencarian cepat (nama barang & kode barang)
CREATE INDEX IF NOT EXISTS idx_kode_barang_nama_trgm
    ON kode_barang USING gin (nama_barang gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_kode_barang_kode
    ON kode_barang (kode_barang);

CREATE INDEX IF NOT EXISTS idx_kode_barang_kategori
    ON kode_barang (kategori_id);

CREATE INDEX IF NOT EXISTS idx_kode_barang_induk
    ON kode_barang (kode_induk);

-- Trigger untuk update updated_at otomatis
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_kode_barang_updated_at ON kode_barang;
CREATE TRIGGER trg_kode_barang_updated_at
    BEFORE UPDATE ON kode_barang
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

const pool = require('../db');

// Kamus sinonim kata pencarian barang inventaris (Dibersihkan dari bentrokan)
const SYNONYMS = {
  komputer: ['komputer', 'computer', 'personal computer'],
  computer: ['computer', 'komputer', 'personal computer'],
  pc: ['pc', 'p.c', 'p.c. unit', 'pc unit'],
  laptop: ['laptop', 'notebook', 'note book'],
  notebook: ['notebook', 'note book', 'laptop'],
  printer: ['printer', 'cetak'],
  hardware: ['hardware'],
  manufaktur: ['manufaktur', 'mesin'],
  kantor: ['kantor', 'biro'],
  logistik: ['logistik', 'angkutan', 'kendaraan'],
  // Sinonim AC
  ac: ['a.c', 'ac', 'a.c.', 'pendingin', 'air conditioner', 'pendingin ruangan', 'pendingin udara'],
  'a.c.': ['a.c', 'ac', 'pendingin', 'air conditioner'],
  'a.c': ['a.c.', 'ac', 'pendingin', 'air conditioner'],
};

/**
 * Menerjemahkan pencarian agar mencocokkan sinonim yang tepat
 */
function getSynonyms(query) {
  const clean = query.toLowerCase().trim();
  const results = new Set();

  // Ambil sinonim jika kata cocok langsung dengan Key
  if (SYNONYMS[clean]) {
    SYNONYMS[clean].forEach((s) => results.add(s));
  } else {
    // Jika tidak ada di Key, cari yang mencocokkan Kata Utuh di dalam Array Value
    for (const [key, list] of Object.entries(SYNONYMS)) {
      if (list.includes(clean)) {
        results.add(key);
        list.forEach((s) => results.add(s));
      }
    }
  }

  return Array.from(results);
}

/*
 Fungsi bantu untuk membuat kondisi pencarian dengan Word Boundary Regex (Kueri kata utuh)
 */
function buildWordBoundaryCond(paramIdx) {
  return `(
    kb.nama_barang ILIKE '%' || $${paramIdx} || '%'
    OR REPLACE(LOWER(kb.nama_barang), '.', '') ILIKE '%' || LOWER($${paramIdx}) || '%'
    OR kb.kode_barang ILIKE '%' || $${paramIdx} || '%'
    OR k.nama ILIKE '%' || $${paramIdx} || '%'
  )`;
}

/*
 Cari kode barang berdasarkan nama barang, kode barang, atau kategori.
 */
async function searchKodeBarang({ q, kategoriId, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [
    `kb.kode_barang NOT LIKE '%.00.00.000'`,
    `kb.kode_barang NOT LIKE '%.00.000'`,
    `kb.kode_barang NOT LIKE '%.000'`
  ];

  let orderByClause = 'ORDER BY kb.level_kode ASC, kb.kode_barang ASC';

  if (q && q.trim()) {
    const qClean = q.trim().toLowerCase();
    const qRaw = q.trim();
    const qMatchGroup = [];

    // 1. Match kata dasar utuh
    params.push(qRaw);
    const fullPhraseIdx = params.length;
    qMatchGroup.push(buildWordBoundaryCond(fullPhraseIdx));

    // 1. Identifikasi tipe kueri secara terpisah
    const isPcQuery = ['pc unit', 'pc', 'p.c', 'p.c unit', 'p.c. unit'].includes(qClean);
    const isKomputerQuery = ['komputer', 'computer'].includes(qClean);
    const isAcQuery = ['ac', 'a.c', 'a.c.'].includes(qClean);

    if (isPcQuery) {
      // Prioritaskan P.C Unit / PC Unit di urutan teratas
      orderByClause = `
        ORDER BY 
          CASE 
            WHEN REPLACE(LOWER(kb.nama_barang), '.', '') = 'pc unit' THEN 1
            WHEN REPLACE(LOWER(kb.nama_barang), '.', '') LIKE 'pc unit%' THEN 2
            WHEN LOWER(kb.nama_barang) LIKE '%p.c%unit%' OR LOWER(kb.nama_barang) LIKE '%pc%unit%' THEN 3
            WHEN LOWER(kb.nama_barang) = 'personal computer' THEN 4
            WHEN LOWER(kb.nama_barang) LIKE 'personal computer%' OR LOWER(kb.nama_barang) LIKE 'personal komputer%' THEN 5
            ELSE 6
          END ASC,
          kb.level_kode DESC,
          kb.kode_barang ASC
      `;
    } else if (isKomputerQuery) {
      orderByClause = `
        ORDER BY 
          CASE 
            WHEN LOWER(kb.nama_barang) = 'personal computer' THEN 1
            WHEN LOWER(kb.nama_barang) = 'personal komputer' THEN 2
            WHEN LOWER(kb.nama_barang) LIKE 'personal computer%' OR LOWER(kb.nama_barang) LIKE 'personal komputer%' THEN 3
            WHEN LOWER(kb.nama_barang) LIKE '%personal%' THEN 4
            WHEN LOWER(kb.nama_barang) = 'komputer' THEN 5
            ELSE 6
          END ASC,
          kb.level_kode DESC,
          kb.kode_barang ASC
      `;
    } else if (isAcQuery) {
      // Prioritaskan AC Split, Window, dan Sentral di paling atas
      orderByClause = `
        ORDER BY 
          CASE 
            WHEN LOWER(kb.nama_barang) LIKE '%split%' THEN 1
            WHEN LOWER(kb.nama_barang) LIKE '%window%' THEN 2
            WHEN LOWER(kb.nama_barang) LIKE '%sentral%' THEN 3
            WHEN LOWER(kb.nama_barang) LIKE '%a.c%' THEN 4
            WHEN LOWER(kb.nama_barang) LIKE '%ac%' THEN 5
            WHEN LOWER(kb.nama_barang) LIKE '%pendingin%' THEN 6
            ELSE 7
          END ASC,
          kb.level_kode ASC,
          kb.kode_barang ASC
      `;
    } else {
      orderByClause = `
        ORDER BY 
          CASE 
            WHEN LOWER(kb.nama_barang) = LOWER($${fullPhraseIdx}::text) THEN 1
            WHEN LOWER(kb.nama_barang) LIKE LOWER($${fullPhraseIdx}::text || '%') THEN 2
            WHEN LOWER(kb.nama_barang) LIKE LOWER('%' || $${fullPhraseIdx}::text || '%') THEN 3
            ELSE 4
          END ASC,
          kb.level_kode ASC,
          kb.kode_barang ASC
      `;
    }

    // 2. Match sinonim spesifik
    const synonyms = getSynonyms(qClean);
    if (synonyms.length > 0) {
      const synConds = [];
      for (const syn of synonyms) {
        if (syn !== qClean) {
          params.push(syn);
          const idx = params.length;
          synConds.push(buildWordBoundaryCond(idx));
        }
      }
      if (synConds.length > 0) {
        qMatchGroup.push(`(${synConds.join(' OR ')})`);
      }
    }

    conditions.push(`(${qMatchGroup.join(' OR ')})`);
  }

  if (kategoriId) {
    params.push(kategoriId);
    conditions.push(`kb.kategori_id = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit);
  params.push(offset);

  const dataQuery = `
    SELECT kb.id, kb.no_urut, kb.nama_barang, kb.kode_barang, kb.kode_induk,
           kb.level_kode, kb.satuan, kb.deskripsi, kb.status,
           kb.golongan, kb.bidang, kb.kelompok, kb.sub_kelompok, kb.rincian_objek,
           k.id AS kategori_id, k.nama AS kategori_nama
    FROM kode_barang kb
    LEFT JOIN kategori k ON k.id = kb.kategori_id
    ${whereClause}
    ${orderByClause}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM kode_barang kb
    LEFT JOIN kategori k ON k.id = kb.kategori_id
    ${whereClause}
  `;

  const [dataResult, countResult] = await Promise.all([
    pool.query(dataQuery, params),
    pool.query(countQuery, params.slice(0, params.length - 2)),
  ]);

  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
    page: Number(page),
    limit: Number(limit),
  };
}

async function getByKode(kode) {
  const result = await pool.query(
    `SELECT kb.*, k.nama AS kategori_nama
     FROM kode_barang kb
     LEFT JOIN kategori k ON k.id = kb.kategori_id
     WHERE kb.kode_barang = $1`,
    [kode]
  );
  return result.rows[0] || null;
}

async function getAnakKode(kodeIndukValue) {
  const result = await pool.query(
    `SELECT kb.id, kb.nama_barang, kb.kode_barang, kb.level_kode
     FROM kode_barang kb
     WHERE kb.kode_induk = $1
     ORDER BY kb.kode_barang`,
    [kodeIndukValue]
  );
  return result.rows;
}

async function getAllKategori() {
  const result = await pool.query(`SELECT id, nama FROM kategori ORDER BY nama`);
  return result.rows;
}

module.exports = {
  searchKodeBarang,
  getByKode,
  getAnakKode,
  getAllKategori,
};
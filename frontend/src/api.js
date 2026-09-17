const BASE_URL = '/api';

export async function searchKodeBarang({ q, kategoriId, page = 1, limit = 20 }) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (kategoriId) params.set('kategori_id', kategoriId);
  params.set('page', page);
  params.set('limit', limit);

  const res = await fetch(`${BASE_URL}/kode-barang?${params.toString()}`);
  if (!res.ok) throw new Error('Gagal mengambil data kode barang');
  return res.json();
}

export async function getKategoriList() {
  const res = await fetch(`${BASE_URL}/kategori`);
  if (!res.ok) throw new Error('Gagal mengambil daftar kategori');
  return res.json();  
}

export async function getDetailKodeBarang(kode) {
  const res = await fetch(`${BASE_URL}/kode-barang/${encodeURIComponent(kode)}`);
  if (!res.ok) throw new Error('Kode barang tidak ditemukan');
  return res.json();
}

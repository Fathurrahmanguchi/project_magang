const kodeBarangService = require('../services/kodeBarang.service');

async function search(req, res, next) {
  try {
    const { q, kategori_id: kategoriId, page, limit } = req.query;
    const result = await kodeBarangService.searchKodeBarang({
      q,
      kategoriId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 20,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const item = await kodeBarangService.getByKode(req.params.kode);
    if (!item) {
      return res.status(404).json({ message: 'Kode barang tidak ditemukan' });
    }
    const anak = await kodeBarangService.getAnakKode(item.kode_barang);
    res.json({ ...item, anak });
  } catch (err) {
    next(err);
  }
}

async function daftarKategori(req, res, next) {
  try {
    const kategori = await kodeBarangService.getAllKategori();
    res.json(kategori);
  } catch (err) {
    next(err);
  }
}

module.exports = { search, detail, daftarKategori };

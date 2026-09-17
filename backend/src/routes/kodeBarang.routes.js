const express = require('express');
const controller = require('../controllers/kodeBarang.controller');

const router = express.Router();

router.get('/kategori', controller.daftarKategori);
router.get('/kode-barang', controller.search);
router.get('/kode-barang/:kode', controller.detail);

module.exports = router;

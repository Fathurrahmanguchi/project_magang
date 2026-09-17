require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const kodeBarangRoutes = require('./routes/kodeBarang.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'bkpad-inventaris-backend' });
});

app.use('/api', kodeBarangRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

app.use(errorHandler);

module.exports = app;

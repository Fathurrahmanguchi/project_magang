import React from 'react';

function getKeterangan(item) {
  const parts = [
    item.bidang || item.golongan,
    item.kelompok,
    item.sub_kelompok,
    item.rincian_objek,
  ].filter(Boolean);

  const uniqueParts = parts.filter(
    (val, idx, arr) => idx === 0 || val.trim().toLowerCase() !== arr[idx - 1].trim().toLowerCase()
  );

  if (uniqueParts.length > 0) {
    return `JENIS : - ${uniqueParts.map((p) => p.toUpperCase()).join(' - ')}`;
  }

  if (item.keterangan) return item.keterangan;
  if (item.deskripsi) return item.deskripsi;

  return '-';
}

export default function DetailModal({ item, onClose, onCopyKode, copiedKode }) {
  if (!item) return null;

  const isCopied = copiedKode === item.kode_barang;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-label">Detail Kode Barang</div>
            <h3 className="modal-title">{item.nama_barang}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <span className="modal-label">Kode Barang</span>
            <div style={{ marginTop: '4px' }}>
              <div className="kode-badge-container">
                <span className="kode-badge" style={{ fontSize: '15px', padding: '6px 12px' }}>
                  {item.kode_barang}
                </span>
                <button
                  className={`copy-btn ${isCopied ? 'copied' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                  onClick={() => onCopyKode(item.kode_barang)}
                  title="Salin Kode Barang"
                >
                  {isCopied ? (
                    <>
                      <span>✓</span>
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {item.golongan && (
            <div className="modal-field">
              <span className="modal-label">Golongan Aset</span>
              <span className="modal-value">{item.golongan}</span>
            </div>
          )}

          {item.bidang && (
            <div className="modal-field">
              <span className="modal-label">Bidang</span>
              <span className="modal-value">{item.bidang}</span>
            </div>
          )}

          {item.kelompok && (
            <div className="modal-field">
              <span className="modal-label">Kelompok</span>
              <span className="modal-value">{item.kelompok}</span>
            </div>
          )}

          {item.sub_kelompok && (
            <div className="modal-field">
              <span className="modal-label">Sub Kelompok</span>
              <span className="modal-value">{item.sub_kelompok}</span>
            </div>
          )}

          {item.rincian_objek && (
            <div className="modal-field">
              <span className="modal-label">Rincian Objek</span>
              <span className="modal-value">{item.rincian_objek}</span>
            </div>
          )}

          <div className="modal-field">
            <span className="modal-label">Level Hierarki</span>
            <span className="modal-value">Level {item.level_kode || 1}</span>
          </div>

          <div className="modal-field">
            <span className="modal-label">Deskripsi / Keterangan</span>
            <span className="modal-value">{getKeterangan(item)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

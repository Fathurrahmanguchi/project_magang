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

export default function ResultTable({
  results,
  total,
  page,
  limit,
  onPageChange,
  onSelectItem,
  onCopyKode,
  copiedKode,
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Generates page numbers array with range around current page
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Kode Barang</th>
              <th>Nama Barang</th>
              <th>Bidang / Kelompok</th>
              <th>Rincian Objek</th>
              <th>Keterangan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  Tidak ada data kode barang yang ditemukan.
                </td>
              </tr>
            ) : (
              results.map((item) => {
                const isCopied = copiedKode === item.kode_barang;
                return (
                  <tr key={item.id} onClick={() => onSelectItem(item)}>
                    <td>
                      <div className="kode-badge-container">
                        <span className="kode-badge">{item.kode_barang || '-'}</span>
                        <button
                          className={`copy-btn ${isCopied ? 'copied' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyKode(item.kode_barang);
                          }}
                          title="Salin Kode Barang"
                        >
                          {isCopied ? (
                            <>
                              <span>✓</span>
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="item-name-cell">{item.nama_barang || '-'}</td>
                    <td>
                      <span className="category-tag">
                        {item.bidang || 'Umum'}
                      </span>

                      {item.kelompok ? (
                        <div className="secondary-cell" style={{ marginTop: '6px' }}>
                          {item.kelompok}
                        </div>
                      ) : (
                        <div className="secondary-cell" style={{ marginTop: '6px' }}>-</div>
                      )}
                    </td>
                    <td className="secondary-cell detail-cell">
                      {item.rincian_objek ||
                        item.sub_kelompok ||
                        item.kelompok ||
                        '-'}
                    </td>
                    <td className="secondary-cell description-cell">
                      {getKeterangan(item) || '-'}
                    </td>
                    <td>
                      <button
                        className="detail-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(item);
                        }}
                      >
                        👁️ Detail
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="pagination-container">
          <span className="pagination-info">
            Menampilkan data <strong>{(page - 1) * limit + 1}</strong> -{' '}
            <strong>{Math.min(page * limit, total)}</strong> dari <strong>{total}</strong> barang
          </span>

          <div className="pagination-buttons">
            <button
              className="page-btn"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Sebelumnya
            </button>

            {getPageNumbers().map((pNum) => (
              <button
                key={pNum}
                className={`page-btn ${pNum === page ? 'active' : ''}`}
                onClick={() => onPageChange(pNum)}
              >
                {pNum}
              </button>
            ))}

            <button
              className="page-btn"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

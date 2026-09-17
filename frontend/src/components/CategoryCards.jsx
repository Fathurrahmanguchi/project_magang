import React from 'react';

const CATEGORY_ITEMS = [
  {
    id: 'tanah',
    title: 'Tanah',
    desc: 'Bidang tanah perkantoran, fasilitas umum, & lahan daerah.',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    ),
    searchTerm: 'Tanah',
  },
  {
    id: 'peralatan-mesin',
    title: 'Peralatan Mesin',
    desc: 'Mesin, kendaraan, komputer, alat kantor, & perkakas.',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    ),
    searchTerm: 'Peralatan',
  },
  {
    id: 'gedung-bangunan',
    title: 'Gedung dan Bangunan',
    desc: 'Gedung kantor, bangunan tempat kerja, & tempat ibadah.',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
        <line x1="9" y1="6" x2="9" y2="6.01"></line>
        <line x1="15" y1="6" x2="15" y2="6.01"></line>
        <line x1="9" y1="10" x2="9" y2="10.01"></line>
        <line x1="15" y1="10" x2="15" y2="10.01"></line>
        <line x1="9" y1="14" x2="9" y2="14.01"></line>
        <line x1="15" y1="14" x2="15" y2="14.01"></line>
        <path d="M10 22v-4h4v4"></path>
      </svg>
    ),
    searchTerm: 'Gedung',
  },
  {
    id: 'jalan-irigasi-jaringan',
    title: 'Jalan Irigasi dan Jaringan',
    desc: 'Jalan raya, jembatan, bangunan irigasi, & jaringan listrik.',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
      </svg>
    ),
    searchTerm: 'Jalan',
  },
];

export default function CategoryCards({ onCategoryClick, onViewAllCategories }) {
  return (
    <section className="section-container">
      <div className="section-header">
        <div className="section-title-group">
          <h2>Barang yang sering dicari</h2>
          <p>Kategori Utama Pendataan Kelompok Barang</p>s
        </div>

        <span className="section-link" onClick={onViewAllCategories}>
          Lihat Semua Kategori →
        </span>
      </div>

      <div className="category-cards-grid">
        {CATEGORY_ITEMS.map((item) => (
          <div
            key={item.id}
            className="category-card"
            onClick={() => onCategoryClick(item.searchTerm)}
          >
            <div>
              <div className="card-icon-box">{item.icon}</div>
              <h3 className="card-title">{item.title}</h3>
              <p className="card-desc">{item.desc}</p>
            </div>

            <div className="card-action-btn">
              <span>Jelajahi</span>
              <span>→</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import CategoryCards from './components/CategoryCards';
import ResultTable from './components/ResultTable';
import DetailModal from './components/DetailModal';
import { searchKodeBarang } from './api';

export default function App() {
  const [query, setQuery] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedKode, setCopiedKode] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const limit = 15;

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSearchTerm, page]);

  async function fetchResults() {
    try {
      const res = await searchKodeBarang({
        q: activeSearchTerm,
        page,
        limit,
      });
      setResults(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    }
  }

  const handleSearchSubmit = (searchTerm) => {
    setActiveSearchTerm(searchTerm);
    setPage(1);
    setIsSearching(true);
  };

  const handleResetSearch = () => {
    setQuery('');
    setActiveSearchTerm('');
    setPage(1);
    setIsSearching(false);
  };

  const handleCategoryClick = (categoryTerm) => {
    setQuery(categoryTerm);
    setActiveSearchTerm(categoryTerm);
    setPage(1);
    setIsSearching(true);
  };

  const handleViewAllCategories = () => {
    setQuery('');
    setActiveSearchTerm('');
    setPage(1);
    setIsSearching(true);
  };

  const handleCopyKode = (kodeBarang) => {
    if (!kodeBarang) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(kodeBarang).catch(console.error);
    } else {
      // Fallback
      const el = document.createElement('textarea');
      el.value = kodeBarang;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }

    setCopiedKode(kodeBarang);
    setToastMessage(`Kode Barang ${kodeBarang} berhasil disalin!`);

    setTimeout(() => {
      setCopiedKode('');
    }, 2000);

    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };  

  return (
    <div>
      {/* Top Navigation */}
      <Navbar onLogoClick={handleResetSearch} />

      <main className="main-wrapper">
        {/* Hero & Search Section */}
        <section className="hero-section">
          <h1 className="hero-title">
            Temukan Kode Barang<br />Inventaris Pemerintah
          </h1>
          <p className="hero-subtitle">
            Cari kode barang menurut nama barang atau sistem kode untuk kelengkapan
            administrasi inventaris daerah.
          </p>

          <SearchBar
            query={query}
            setQuery={setQuery}
            onSearchSubmit={handleSearchSubmit}
            onSelectSuggestion={(item) => {
              setQuery(item.nama_barang);
              handleSearchSubmit(item.nama_barang);
            }}
          />
        </section>

        {/* Content Section: Either Landing View or Search Results */}
        {!isSearching ? (
          /* Landing View: Popular Categories Cards */
          <CategoryCards
            onCategoryClick={handleCategoryClick}
            onViewAllCategories={handleViewAllCategories}
          />
        ) : (
          /* Search Results View */
          <section className="section-container" style={{ marginTop: '20px' }}>
            <div className="results-header-container">
              <div>
                <h2 className="results-title">
                  {activeSearchTerm
                    ? `Hasil Pencarian "${activeSearchTerm}"`
                    : 'Semua Kode Barang Inventaris'}
                </h2>
                <p className="results-subtitle">
                  Menampilkan {total} barang yang sesuai
                </p>
              </div>

              <button className="back-to-home-btn" onClick={handleResetSearch}>
                ← Beranda
              </button>
            </div>

            <ResultTable
              results={results}
              total={total}
              page={page}
              limit={limit}
              onPageChange={(newPage) => setPage(newPage)}
              onSelectItem={(item) => setSelectedItem(item)}
              onCopyKode={handleCopyKode}
              copiedKode={copiedKode}
            />
          </section>
        )}
      </main>

      {/* Item Detail Modal */}
      <DetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onCopyKode={handleCopyKode}
        copiedKode={copiedKode}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <div className="toast-icon">✓</div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

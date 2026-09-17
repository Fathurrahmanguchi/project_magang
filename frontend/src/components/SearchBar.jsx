import React, { useEffect, useRef, useState } from 'react';
import { searchKodeBarang } from '../api';

const QUICK_TAGS = ['Komputer', 'Meja Sekolah', 'Kursi Lipat', 'Notebook', 'Printer'];

export default function SearchBar({ query, setQuery, onSearchSubmit, onSelectSuggestion }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await searchKodeBarang({ q: query, limit: 6 });
        setSuggestions(result.data);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setShowDropdown(false);
    onSearchSubmit(query);
  };

  const handleChipClick = (tag) => {
    setQuery(tag);
    setShowDropdown(false);
    onSearchSubmit(tag);
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-input-wrapper">
        <svg className="search-icon-left" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        <input
          type="text"
          className="search-input"
          placeholder="Cari Nama, Kode Barang, Kategori..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />

        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => {
              setQuery('');
              setShowDropdown(false);
            }}
            title="Hapus Pencarian"
          >
            ✕
          </button>
        )}

        <button type="submit" className="search-submit-btn">
          Cari
        </button>

        {showDropdown && suggestions.length > 0 && (
          <ul className="autocomplete-dropdown">
            {suggestions.map((item) => (
              <li
                key={item.id}
                className="autocomplete-item"
                onMouseDown={() => {
                  setQuery(item.nama_barang);
                  setShowDropdown(false);
                  onSelectSuggestion(item);
                }}
              >
                <span className="autocomplete-item-nama">{item.nama_barang}</span>
                <span className="autocomplete-item-kode">{item.kode_barang}</span>
              </li>
            ))}
          </ul>
        )}
      </form>

      <div className="quick-chips-wrapper">
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`chip-btn ${query.toLowerCase() === tag.toLowerCase() ? 'active' : ''}`}
            onClick={() => handleChipClick(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

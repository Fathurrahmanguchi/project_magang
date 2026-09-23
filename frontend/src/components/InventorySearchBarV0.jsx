import React, { useEffect, useRef, useCallback, useState } from "react";
import { searchKodeBarang } from "../api";
import { cn } from "@/lib/utils";
import {
  Search,
  ArrowUp,
  Laptop,
  Monitor,
  Printer,
  Armchair,
  FolderTree,
  SlidersHorizontal,
  X,
} from "lucide-react";

// Auto resize hook inspired by v0-ai-chat
function useAutoResizeTextarea({ minHeight = 48, maxHeight = 160 }) {
  const textareaRef = useRef(null);

  const adjustHeight = useCallback(
    (reset = false) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

const QUICK_ACTIONS = [
  { label: "Komputer", query: "Komputer", icon: Laptop },
  { label: "Notebook", query: "Notebook", icon: Monitor },
  { label: "Printer", query: "Printer", icon: Printer },
  { label: "Kursi Lipat", query: "Kursi Lipat", icon: Armchair },
  { label: "Meja Sekolah", query: "Meja", icon: FolderTree },
];

export default function InventorySearchBarV0({
  query,
  setQuery,
  onSearchSubmit,
  onSelectSuggestion,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 140,
  });

  // Autocomplete fetch with debounce
  useEffect(() => {
    if (!query || !query.trim()) {
      setSuggestions([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await searchKodeBarang({ q: query, limit: 6 });
        setSuggestions(result.data || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Autocomplete search error:", err);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExecuteSearch = (searchTerm) => {
    const term = searchTerm !== undefined ? searchTerm : query;
    setShowDropdown(false);
    if (onSearchSubmit) {
      onSearchSubmit(term);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleExecuteSearch();
    }
  };

  const handleClear = () => {
    setQuery("");
    setShowDropdown(false);
    adjustHeight(true);
  };

  return (
    <div ref={containerRef} className="v0-search-container">
      {/* Main Search Floating Card (v0 style) */}
      <div className="v0-search-box">
        {/* Top Input Area */}
        <div className="v0-search-input-area">
          <Search className="v0-search-icon" size={20} />
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              adjustHeight();
            }}
            onFocus={() => query.trim() && setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Cari nama barang, sistem kode, atau spesifikasi (contoh: Komputer PC, Meja Rapat)..."
            className="v0-search-textarea"
            rows={1}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="v0-clear-btn"
              title="Hapus pencarian"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <ul className="v0-autocomplete-dropdown">
            <div className="v0-autocomplete-header">Saran Pencarian Terkait</div>
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onMouseDown={() => {
                    setQuery(item.nama_barang);
                    setShowDropdown(false);
                    if (onSelectSuggestion) {
                      onSelectSuggestion(item);
                    } else {
                      handleExecuteSearch(item.nama_barang);
                    }
                  }}
                  className="v0-autocomplete-item"
                >
                  <span className="v0-autocomplete-nama">{item.nama_barang}</span>
                  <span className="v0-autocomplete-kode">{item.kode_barang}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Bottom Toolbar & Action Bar */}
        <div className="v0-toolbar">
          <div className="v0-toolbar-left">
            <button
              type="button"
              className="v0-tool-btn"
              title="Filter aset"
              onClick={() => handleExecuteSearch()}
            >
              <SlidersHorizontal size={14} />
              <span>Inventaris Daerah</span>
            </button>
          </div>

          <div className="v0-toolbar-right">
            <span className="v0-kbd-hint">
              Tekan <kbd className="v0-kbd">Enter ↵</kbd>
            </span>
            <button
              type="button"
              onClick={() => handleExecuteSearch()}
              disabled={!query.trim()}
              className={cn(
                "v0-send-btn",
                query.trim() ? "active" : "inactive"
              )}
              title="Cari"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Suggestion Chips */}
      <div className="v0-chips-wrapper">
        <span className="v0-chips-label">Pencarian Cepat:</span>
        {QUICK_ACTIONS.map(({ label, query: tagQuery, icon: Icon }) => {
          const isActive = query.toLowerCase() === tagQuery.toLowerCase();
          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                setQuery(tagQuery);
                handleExecuteSearch(tagQuery);
              }}
              className={cn("v0-chip", isActive && "active")}
            >
              <Icon className="v0-chip-icon" size={14} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

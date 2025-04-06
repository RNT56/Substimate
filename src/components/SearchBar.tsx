import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';

interface Props {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { displayCurrency } = useCurrency();
  const isBTC = displayCurrency === 'BTC';

  // Debounce search to avoid too many re-renders
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  const handleSearch = (value: string) => {
    setQuery(value);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full md:w-80">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search subscriptions..."
          className={`w-full themed-input search-bar-input rounded-lg pl-10 pr-10 py-2.5 text-theme-primary focus:outline-none focus:ring-2 ${
            isBTC ? 'focus:ring-[#f7931a]' : 'focus:ring-emerald-500'
          }`}
        />
        <Search 
          size={18} 
          className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-theme-secondary"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-theme-secondary hover:text-theme-primary transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
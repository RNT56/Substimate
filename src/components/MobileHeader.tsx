import React from 'react';
import { Menu, X, ChevronUp, ChevronDown } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { CurrencySelector } from './CurrencySelector';
import { SearchBar } from './SearchBar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface Props {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onSearch: (query: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenAuthModal: () => void;
}

export function MobileHeader({ 
  isMenuOpen, 
  onToggleMenu, 
  onSearch, 
  isExpanded,
  onToggleExpand,
  onOpenAuthModal 
}: Props) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { displayCurrency } = useCurrency();
  const isBTC = displayCurrency === 'BTC';

  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      <header className={`backdrop-blur-md border-b ${
        theme === 'light' 
          ? 'bg-white/30 border-gray-200/20' 
          : 'bg-gray-900/30 border-gray-700/20'
      }`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Substimate
            </h1>
            {user && !isMenuOpen && (
              <button
                onClick={onToggleExpand}
                className="neumorphic-button p-2 rounded-lg text-theme-secondary"
              >
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <button
                onClick={onToggleMenu}
                className="neumorphic-button p-2 rounded-lg text-theme-secondary"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className={`neumorphic-button px-4 py-2 rounded-lg ${
                  isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
                }`}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>
      {user && !isMenuOpen && (
        <div className={`backdrop-blur-md border-b transition-all duration-300 ${
          theme === 'light'
            ? 'bg-white/30 border-gray-200/20'
            : 'bg-gray-900/30 border-gray-700/20'
          } ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 border-b-0'} overflow-hidden`}
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col gap-3">
              <CurrencySelector />
              <SearchBar onSearch={onSearch} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

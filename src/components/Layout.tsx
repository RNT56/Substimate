import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDevice } from '../hooks/useDevice';
import { MobileHeader } from './MobileHeader';
import { MobileMenu } from './MobileMenu';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { CurrencySelector } from './CurrencySelector';
import { SearchBar } from './SearchBar';
import { PlusCircle, Menu } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { AddSubscriptionModal } from './AddSubscriptionModal';
import { AuthModal } from './AuthModal';
import { useSubscriptions } from '../contexts/SubscriptionContext';

export default function Layout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  
  const { user, loading: authLoading } = useAuth();
  const { isMobile } = useDevice();
  const { displayCurrency, convertAmount, formatAmount } = useCurrency();
  const { subscriptions, addSubscription } = useSubscriptions();

  // Memoize search filtering
  const filteredSubscriptions = React.useMemo(() => {
    if (!searchQuery) return subscriptions;
    
    const query = searchQuery.toLowerCase();
    return subscriptions.filter(sub => 
      sub.name.toLowerCase().includes(query) ||
      sub.category.toLowerCase().includes(query) ||
      sub.paymentMethod.toLowerCase().includes(query) ||
      sub.billingPeriod.toLowerCase().includes(query)
    );
  }, [subscriptions, searchQuery]);

  // Handle mobile menu state
  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  // Handle auth state changes
  useEffect(() => {
    if (!user) {
      setIsModalOpen(false);
      setIsAuthModalOpen(false);
      setIsMobileMenuOpen(false);
      setIsSidebarOpen(false);
      setSearchQuery('');
    }
  }, [user]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setIsAuthModalOpen(false);
        setIsMobileMenuOpen(false);
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const totalMonthlyCost = filteredSubscriptions.reduce((sum, sub) => {
    return sum + (sub.monthlyCost || 0);
  }, 0);

  const formattedTotalCost = formatAmount(
    convertAmount(totalMonthlyCost, 'EUR', displayCurrency),
    displayCurrency
  );

  // Pass filteredSubscriptions to child components through context
  const outletContext = React.useMemo(() => ({
    filteredSubscriptions
  }), [filteredSubscriptions]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen text-gray-100 ${isMobile ? 'pb-8' : 'p-8'}`}>
      {isMobile ? (
        <>
          <MobileHeader
            isMenuOpen={isMobileMenuOpen}
            onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            onSearch={setSearchQuery}
            isExpanded={isHeaderExpanded}
            onToggleExpand={() => setIsHeaderExpanded(!isHeaderExpanded)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
          <MobileMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            onAddSubscription={() => setIsModalOpen(true)}
            totalMonthlyCost={formattedTotalCost}
            onSearch={setSearchQuery}
          />
          <div className="container mx-auto px-4 pt-20">
            <div className={`transition-all duration-300 ${isHeaderExpanded ? 'pt-24' : 'pt-0'}`}>
              <Outlet context={outletContext} />
            </div>
          </div>
        </>
      ) : (
        <div className="container mx-auto px-4">
          <div className="flex items-center mb-8">
            <div className="flex-1">
              <Link 
                to="/" 
                className="flex items-center gap-2 transition-all duration-300 ease-out hover:brightness-105"
              >
                <img src="/substimate_logo.svg" alt="Substimate Logo" className="w-12 h-12" />
                <h1 className="text-3xl font-bold mb-2 title-gradient">Substimate</h1>
              </Link>
              {user && (
                <p className="text-theme-secondary">
                  Total Monthly Cost: <span className={`font-semibold ${displayCurrency === 'BTC' ? 'text-[#f7931a]' : 'text-emerald-400'}`}>
                    {formattedTotalCost}
                  </span>
                </p>
              )}
            </div>

            {user && (
              <div className="flex-1 flex justify-center items-center gap-8">
                <div className="flex items-center gap-4">
                  <CurrencySelector />
                  <SearchBar onSearch={setSearchQuery} />
                </div>
              </div>
            )}

            <div className="flex-1 flex justify-end items-center gap-4">
              <ThemeToggle />
              {user ? (
                <>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className={`themed-button flex items-center gap-2 px-6 py-3 rounded-xl ${
                      displayCurrency === 'BTC' ? 'text-[#f7931a]' : 'text-emerald-400'
                    }`}
                  >
                    <PlusCircle size={20} />
                    Add Subscription
                  </button>
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="themed-button p-3 rounded-xl text-theme-secondary hover:text-theme-primary"
                    title="Toggle Menu"
                  >
                    <Menu size={20} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className={`themed-button px-6 py-3 rounded-xl ${
                    displayCurrency === 'BTC' ? 'text-[#f7931a]' : 'text-emerald-400'
                  }`}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          <Outlet context={outletContext} />
        </div>
      )}

      <AddSubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addSubscription}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {user && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(!isSidebarOpen)}
          totalMonthlyCost={formattedTotalCost}
        />
      )}
    </div>
  );
}

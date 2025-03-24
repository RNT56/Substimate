import React from 'react';
import { LogOut, PlusCircle, CreditCard, Calculator, BarChart2, Settings, Upload, Wallet, Calendar, Bitcoin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Link, useLocation } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddSubscription: () => void;
  onSearch: (query: string) => void;
  totalMonthlyCost: string;
}

const navItems = [
  { icon: CreditCard, label: 'Subscriptions', href: '/' },
  { icon: Wallet, label: 'Finance', href: '/finance' },
  { icon: BarChart2, label: 'Cost Tracker', href: '/cost-tracker' },
  { icon: Calendar, label: 'Payday Calendar', href: '/payday-calendar' },
  { icon: Bitcoin, label: 'Sats Calculator', href: '/calculator' }
];

const bottomNavItems = [
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: Upload, label: 'Import Data', href: '/import' }
];

export function MobileMenu({ isOpen, onClose, onAddSubscription, onSearch, totalMonthlyCost }: Props) {
  const { signOut } = useAuth();
  const { theme } = useTheme();
  const { displayCurrency } = useCurrency();
  const location = useLocation();
  const isBTC = displayCurrency === 'BTC';

  if (!isOpen) return null;

  const handleNavClick = () => {
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-30 backdrop-blur-md ${
      theme === 'light'
        ? 'bg-white/50'
        : 'bg-black/50'
    }`}>
      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-theme-secondary">Total Monthly Cost</p>
            <p className={`text-2xl font-bold ${isBTC ? 'text-[#f7931a]' : 'text-emerald-400'}`}>
              {totalMonthlyCost}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                onAddSubscription();
                onClose();
              }}
              className={`neumorphic-button flex items-center justify-center gap-2 px-6 py-3 rounded-xl ${
                isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
              }`}
            >
              <PlusCircle size={20} />
              Add Subscription
            </button>

            <div className="h-px bg-gray-700/50" />

            {/* Main Navigation */}
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.href
                      ? isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
                      : 'text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="h-px bg-gray-700/50" />

            {/* Bottom Navigation */}
            <nav className="space-y-2">
              {bottomNavItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={handleNavClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-theme-secondary hover:text-theme-primary transition-colors"
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="h-px bg-gray-700/50" />

            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="neumorphic-button flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-red-400"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { 
  CreditCard, 
  Calculator, 
  BarChart2, 
  Settings, 
  Upload, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  Wallet,
  Calendar,
  Bitcoin
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Link, useLocation } from 'react-router-dom';
import { useDevice } from '../hooks/useDevice';

interface Props {
  isOpen: boolean;
  onClose: () => void;
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

export function Sidebar({ isOpen, onClose, totalMonthlyCost }: Props) {
  const { signOut } = useAuth();
  const { theme } = useTheme();
  const { displayCurrency } = useCurrency();
  const location = useLocation();
  const { isMobile } = useDevice();
  const isBTC = displayCurrency === 'BTC';

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full neumorphic-card rounded-l-xl p-6 flex flex-col">
          {/* Toggle Button - Only show on desktop */}
          {!isMobile && (
            <button
              onClick={() => onClose()}
              className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 neumorphic-button p-2 rounded-l-xl text-theme-secondary hover:text-theme-primary"
            >
              {isOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
            </button>
          )}

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-theme-primary">Navigation</h2>
            <p className="text-theme-secondary mt-2">
              Total Monthly Cost: <span className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'}>
                {totalMonthlyCost}
              </span>
            </p>
          </div>

          {/* Main Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
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

          {/* Bottom Navigation */}
          <div className="mt-auto space-y-2">
            {bottomNavItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
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

            <button
              onClick={signOut}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 transition-colors w-full"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
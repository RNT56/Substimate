import React, { useState, useEffect } from 'react';
import { RefreshCw, Bitcoin } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { fetchBitcoinPrices } from '../lib/marketData';

interface ExchangeRates {
  EUR: number;
  USD: number;
}

const SATS_PER_BTC = 100000000; // 1 BTC = 100,000,000 satoshis

export function CalculatorPage() {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'EUR' | 'USD'>('EUR');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { displayCurrency } = useCurrency();
  const isBTC = displayCurrency === 'BTC';

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchBitcoinPrices(['eur', 'usd']);
      setExchangeRates({
        EUR: data.eur,
        USD: data.usd
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exchange rates');
    } finally {
      setLoading(false);
    }
  };

  const calculateSats = () => {
    if (!exchangeRates || !amount) return null;

    const fiatAmount = parseFloat(amount);
    if (isNaN(fiatAmount)) return null;

    const btcPrice = exchangeRates[currency];
    const btcAmount = fiatAmount / btcPrice;
    return Math.round(btcAmount * SATS_PER_BTC);
  };

  const formatFiatAmount = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatSats = (sats: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0
    }).format(sats);
  };

  const satsAmount = calculateSats();
  const btcPrice = exchangeRates?.[currency];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 title-gradient">Sats Calculator</h1>
        <p className="text-theme-secondary">Convert fiat currency to satoshis (sats)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="themed-card rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-lg ${isBTC ? 'bg-[#f7931a]/10' : 'bg-emerald-500/10'}`}>
              <Bitcoin 
                size={24} 
                className={isBTC ? 'text-[#f7931a]' : 'text-emerald-400'} 
              />
            </div>
            <h2 className="text-xl font-bold text-theme-primary">Sats Calculator</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-theme-secondary">
                Enter Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full themed-input rounded-lg px-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-theme-secondary">
                Currency
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setCurrency('EUR')}
                  className={`themed-button px-4 py-3 rounded-lg transition-colors ${
                    currency === 'EUR'
                      ? isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
                      : 'text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  EUR (€)
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`themed-button px-4 py-3 rounded-lg transition-colors ${
                    currency === 'USD'
                      ? isBTC ? 'text-[#f7931a]' : 'text-emerald-400'
                      : 'text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>

            <button
              onClick={fetchExchangeRates}
              disabled={loading}
              className="w-full themed-button px-4 py-3 rounded-lg text-theme-secondary hover:text-theme-primary flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Refresh Rates
            </button>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="themed-card rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6 text-theme-primary">Results</h2>
          
          <div className="space-y-6">
            {btcPrice && (
              <div>
                <p className="text-theme-secondary mb-2">Current BTC Price</p>
                <p className={`text-3xl font-bold ${isBTC ? 'text-[#f7931a]' : 'text-emerald-400'}`}>
                  {formatFiatAmount(btcPrice)}
                </p>
              </div>
            )}

            <div className="h-px bg-gray-700" />

            <div>
              <p className="text-theme-secondary mb-2">Satoshis (sats)</p>
              <p className={`text-3xl font-bold ${isBTC ? 'text-[#f7931a]' : 'text-emerald-400'}`}>
                {satsAmount ? `${formatSats(satsAmount)} sats` : '-'}
              </p>
            </div>

            <div className="h-px bg-gray-700" />

            <div>
              <p className="text-theme-secondary mb-2">Bitcoin</p>
              <p className={`text-3xl font-bold ${isBTC ? 'text-[#f7931a]' : 'text-emerald-400'}`}>
                {satsAmount ? `${(satsAmount / SATS_PER_BTC).toFixed(8)} BTC` : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

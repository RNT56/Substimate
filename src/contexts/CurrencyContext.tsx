import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { Currency, CurrencyPreference } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { SATS_PER_BTC } from '../lib/constants';
import { fetchBitcoinPrices, fetchEurUsdRate } from '../lib/marketData';

interface CurrencyContextType {
  displayCurrency: Currency;
  setDisplayCurrency: (currency: Currency) => Promise<void>;
  convertAmount: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;
  formatAmount: (amount: number, currency: Currency) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const DEFAULT_EXCHANGE_RATES: Record<Currency, number> = {
  EUR: 1,
  USD: 1.08,
  BTC: 0.000023
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<CurrencyPreference>({
    displayCurrency: 'EUR',
    exchangeRates: DEFAULT_EXCHANGE_RATES,
    lastUpdated: new Date().toISOString()
  });
  const { user } = useAuth();
  const updateInProgress = useRef(false);

  const updateUserPreference = useCallback(async (newPreference: CurrencyPreference) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('currency_preferences')
        .upsert({
          user_id: user.id,
          display_currency: newPreference.displayCurrency,
          exchange_rates: newPreference.exchangeRates,
          last_updated: newPreference.lastUpdated
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating currency preference:', error);
      throw error;
    }
  }, [user]);

  const fetchUserPreference = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('currency_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreference({
          displayCurrency: (data.display_currency as Currency) || 'EUR',
          exchangeRates: {
            ...DEFAULT_EXCHANGE_RATES,
            ...(data.exchange_rates as Partial<Record<Currency, number>>)
          },
          lastUpdated: data.last_updated
        });
      } else {
        const defaultPreference = {
          displayCurrency: 'EUR' as const,
          exchangeRates: DEFAULT_EXCHANGE_RATES,
          lastUpdated: new Date().toISOString()
        };
        await updateUserPreference(defaultPreference);
        setPreference(defaultPreference);
      }
    } catch (error) {
      console.error('Error fetching currency preference:', error);
    }
  }, [user, updateUserPreference]);

  useEffect(() => {
    if (user) {
      void fetchUserPreference();
    } else {
      setPreference({
        displayCurrency: 'EUR',
        exchangeRates: DEFAULT_EXCHANGE_RATES,
        lastUpdated: new Date().toISOString()
      });
    }
  }, [user, fetchUserPreference]);

  useEffect(() => {
    // Update data-currency attribute on root element
    document.documentElement.setAttribute('data-currency', preference.displayCurrency);
  }, [preference.displayCurrency]);

  useEffect(() => {
    // Update exchange rates every hour
    const updateRates = async () => {
      if (!user || updateInProgress.current) return;

      try {
        updateInProgress.current = true;

        // Check if we need to update (only update if last update was more than 1 hour ago)
        const lastUpdate = new Date(preference.lastUpdated);
        const now = new Date();
        const hoursSinceLastUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastUpdate < 1) {
          updateInProgress.current = false;
          return;
        }

        // Fetch current rates from database first
        const { data: currentData } = await supabase
          .from('currency_preferences')
          .select('last_updated')
          .eq('user_id', user.id)
          .maybeSingle();

        if (currentData) {
          const dbLastUpdate = new Date(currentData.last_updated);
          const hoursSinceDbUpdate = (now.getTime() - dbLastUpdate.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceDbUpdate < 1) {
            // Another instance has already updated the rates recently
            await fetchUserPreference();
            updateInProgress.current = false;
            return;
          }
        }

        const [bitcoinPrices, eurUsdRate] = await Promise.all([
          fetchBitcoinPrices(['eur']),
          fetchEurUsdRate()
        ]);
        const btcEurRate = 1 / bitcoinPrices.eur; // Convert to BTC/EUR rate

        const newRates = {
          EUR: 1,
          USD: eurUsdRate,
          BTC: btcEurRate
        };

        const newPreference = {
          ...preference,
          exchangeRates: newRates,
          lastUpdated: now.toISOString()
        };

        // Update database with new rates
        const { error: updateError } = await supabase
          .from('currency_preferences')
          .upsert({
            user_id: user.id,
            display_currency: newPreference.displayCurrency,
            exchange_rates: newPreference.exchangeRates,
            last_updated: newPreference.lastUpdated
          }, {
            onConflict: 'user_id'
          });

        if (updateError) throw updateError;

        // Update local state
        setPreference(newPreference);
      } catch (error) {
        console.error('Error updating exchange rates:', error);
        // On error, keep using existing rates
      } finally {
        updateInProgress.current = false;
      }
    };

    // Initial update
    updateRates();

    // Set up interval for updates
    const intervalId = window.setInterval(updateRates, 60000); // Check every minute, but only update if needed

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [user, preference, fetchUserPreference]);

  const setDisplayCurrency = useCallback(async (currency: Currency) => {
    try {
      const newPreference = {
        ...preference,
        displayCurrency: currency
      };

      // Update local state first for immediate UI feedback
      setPreference(newPreference);

      if (user) {
        await updateUserPreference(newPreference);
      }
    } catch (error) {
      console.error('Error updating display currency:', error);
      // Revert on error
      setPreference(preference);
      throw error;
    }
  }, [preference, updateUserPreference, user]);

  const convertAmount = useCallback((amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = preference.exchangeRates[fromCurrency] || DEFAULT_EXCHANGE_RATES[fromCurrency];
    const toRate = preference.exchangeRates[toCurrency] || DEFAULT_EXCHANGE_RATES[toCurrency];
    if (!Number.isFinite(amount) || !fromRate || !toRate) return 0;

    // Convert to EUR first (base currency)
    const amountInEUR = fromCurrency === 'EUR' 
      ? amount 
      : amount / fromRate;

    // Convert from EUR to target currency
    return toCurrency === 'EUR'
      ? amountInEUR
      : amountInEUR * toRate;
  }, [preference.exchangeRates]);

  const formatAmount = useCallback((amount: number, currency: Currency): string => {
    switch (currency) {
      case 'EUR':
        return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount);
      case 'USD':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount);
      case 'BTC': {
        // Convert BTC amount to satoshis for display
        const sats = Math.round(amount * SATS_PER_BTC);
        return `${new Intl.NumberFormat('en-US', {
          maximumFractionDigits: 0
        }).format(sats)} sats`;
      }
      default:
        return amount.toFixed(2);
    }
  }, []);

  return (
    <CurrencyContext.Provider value={{
      displayCurrency: preference.displayCurrency,
      setDisplayCurrency,
      convertAmount,
      formatAmount
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

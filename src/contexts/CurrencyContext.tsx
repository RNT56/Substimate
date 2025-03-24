import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Currency, CurrencyPreference } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { SATS_PER_BTC } from '../lib/constants';

interface CurrencyContextType {
  displayCurrency: Currency;
  setDisplayCurrency: (currency: Currency) => Promise<void>;
  convertAmount: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;
  formatAmount: (amount: number, currency: Currency) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const DEFAULT_EXCHANGE_RATES = {
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

  useEffect(() => {
    if (user) {
      fetchUserPreference();
    } else {
      // Reset to defaults when user logs out
      setPreference({
        displayCurrency: 'EUR',
        exchangeRates: DEFAULT_EXCHANGE_RATES,
        lastUpdated: new Date().toISOString()
      });
    }
  }, [user]);

  useEffect(() => {
    // Update data-currency attribute on root element
    document.documentElement.setAttribute('data-currency', preference.displayCurrency);
  }, [preference.displayCurrency]);

  useEffect(() => {
    let intervalId: number;

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
          .single();

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

        // Fetch BTC/EUR rate from CoinGecko
        const coingeckoResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur&x_cg_api_key=${import.meta.env.VITE_COINGECKO_API_KEY}`
        );
        const coingeckoData = await coingeckoResponse.json();
        const btcEurRate = 1 / coingeckoData.bitcoin.eur; // Convert to BTC/EUR rate

        // Fetch EUR/USD rate from Exchange Rate API
        const exchangeRateResponse = await fetch(
          `https://v6.exchangerate-api.com/v6/${import.meta.env.VITE_EXCHANGE_RATE_API_KEY}/latest/EUR`
        );
        const exchangeRateData = await exchangeRateResponse.json();
        const eurUsdRate = exchangeRateData.conversion_rates.USD;

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
    intervalId = window.setInterval(updateRates, 60000); // Check every minute, but only update if needed

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [user, preference.lastUpdated]);

  const fetchUserPreference = async () => {
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
          displayCurrency: data.display_currency,
          exchangeRates: data.exchange_rates,
          lastUpdated: data.last_updated
        });
      } else {
        // Create default preference if none exists
        const defaultPreference = {
          displayCurrency: 'EUR',
          exchangeRates: DEFAULT_EXCHANGE_RATES,
          lastUpdated: new Date().toISOString()
        };
        await updateUserPreference(defaultPreference);
        setPreference(defaultPreference);
      }
    } catch (error) {
      console.error('Error fetching currency preference:', error);
    }
  };

  const updateUserPreference = async (newPreference: CurrencyPreference) => {
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
  };

  const setDisplayCurrency = async (currency: Currency) => {
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
  };

  const convertAmount = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) return amount;

    // Convert to EUR first (base currency)
    const amountInEUR = fromCurrency === 'EUR' 
      ? amount 
      : amount / preference.exchangeRates[fromCurrency];

    // Convert from EUR to target currency
    return toCurrency === 'EUR'
      ? amountInEUR
      : amountInEUR * preference.exchangeRates[toCurrency];
  };

  const formatAmount = (amount: number, currency: Currency): string => {
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
  };

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
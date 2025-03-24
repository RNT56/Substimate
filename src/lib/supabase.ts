import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Get validated environment variables
const getEnvVars = () => {
  const requiredVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_COINGECKO_API_KEY: import.meta.env.VITE_COINGECKO_API_KEY,
    VITE_EXCHANGE_RATE_API_KEY: import.meta.env.VITE_EXCHANGE_RATE_API_KEY
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env file.'
    );
  }

  return {
    supabase: {
      url: requiredVars.VITE_SUPABASE_URL,
      anonKey: requiredVars.VITE_SUPABASE_ANON_KEY
    },
    api: {
      coingecko: requiredVars.VITE_COINGECKO_API_KEY,
      exchangeRate: requiredVars.VITE_EXCHANGE_RATE_API_KEY
    }
  };
};

const env = getEnvVars();

// Create and configure Supabase client
export const supabase = createClient<Database>(
  env.supabase.url,
  env.supabase.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Handle auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    // Clear any cached data
    localStorage.removeItem('subscriptions');
    localStorage.removeItem('categories');
    localStorage.removeItem('dashboard_layout');
  }
});

// Export API keys
export const apiKeys = {
  coingecko: env.api.coingecko,
  exchangeRate: env.api.exchangeRate
};

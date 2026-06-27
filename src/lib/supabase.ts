import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Get validated environment variables
const getEnvVars = () => {
  const requiredVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    missingVars,
    supabase: {
      url: requiredVars.VITE_SUPABASE_URL || 'https://missing-config.supabase.co',
      anonKey: requiredVars.VITE_SUPABASE_ANON_KEY || 'missing-anon-key'
    }
  };
};

const env = getEnvVars();
export const supabaseConfigError = env.missingVars.length > 0
  ? `Missing required environment variables: ${env.missingVars.join(', ')}. Please check your .env file.`
  : null;

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
if (!supabaseConfigError) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      // Clear any cached data
      localStorage.removeItem('subscriptions');
      localStorage.removeItem('categories');
      localStorage.removeItem('dashboard_layout');
    }
  });
}

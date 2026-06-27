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

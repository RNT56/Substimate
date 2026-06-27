import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import Layout from './components/Layout';
import { FinancePage } from './pages/FinancePage';
import { CostTrackerPage } from './pages/CostTrackerPage';
import { PaydayCalendarPage } from './pages/PaydayCalendarPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { SettingsPage } from './pages/SettingsPage';
import { ImportDataPage } from './pages/ImportDataPage';
import { SubscriptionList } from './components/SubscriptionList';
import { SubscriptionAnalytics } from './components/SubscriptionAnalytics';
import { UsageStatistics } from './components/UsageStatistics';
import { LandingPage } from './components/LandingPage';
import { useAuth } from './contexts/AuthContext';
import { useSubscriptions } from './contexts/SubscriptionContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ToastProvider } from './contexts/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { supabaseConfigError } from './lib/supabase';
import type { Subscription } from './types';

interface LayoutContext {
  filteredSubscriptions: Subscription[];
  openAuthModal: () => void;
}

function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { updateSubscription, reorderSubscriptions } = useSubscriptions();
  const { filteredSubscriptions, openAuthModal } = useOutletContext<LayoutContext>();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Authenticating...</div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onGetStarted={openAuthModal} />;
  }

  return (
    <>
      <SubscriptionList
        subscriptions={filteredSubscriptions}
        onUpdate={updateSubscription}
        onReorder={reorderSubscriptions}
      />
      {filteredSubscriptions.length > 0 && (
        <>
          <SubscriptionAnalytics 
            subscriptions={filteredSubscriptions}
          />
          <UsageStatistics subscriptions={filteredSubscriptions} />
        </>
      )}
    </>
  );
}

function App() {
  const { user, loading } = useAuth();

  // Handle errors globally
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      // You could send this to an error reporting service
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route 
          path="finance" 
          element={user ? <FinancePage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="cost-tracker" 
          element={user ? <CostTrackerPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="payday-calendar" 
          element={user ? <PaydayCalendarPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="calculator" 
          element={user ? <CalculatorPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="settings" 
          element={user ? <SettingsPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="import" 
          element={user ? <ImportDataPage /> : <Navigate to="/" replace />} 
        />
      </Route>
    </Routes>
  );
}

function MissingConfigurationPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center px-6">
      <div className="max-w-lg rounded-lg border border-white/10 bg-white/[0.03] p-6">
        <h1 className="text-2xl font-semibold mb-3">Supabase Configuration Required</h1>
        <p className="text-gray-300 mb-4">{message}</p>
        <p className="text-gray-400 text-sm">
          Create a local `.env` file from `.env.example` and set the public Supabase URL and anon key before running the app.
        </p>
      </div>
    </div>
  );
}

export default function AppWithProviders() {
  if (supabaseConfigError) {
    return <MissingConfigurationPage message={supabaseConfigError} />;
  }

  return (
    <BrowserRouter>
      <ErrorBoundary fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-red-400">Something went wrong. Please try refreshing the page.</div>
        </div>
      }>
        <AuthProvider>
          <ThemeProvider>
            <CurrencyProvider>
              <SubscriptionProvider>
                <ToastProvider>
                  <App />
                </ToastProvider>
              </SubscriptionProvider>
            </CurrencyProvider>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

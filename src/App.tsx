import React, { useEffect } from 'react';
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
import { useFinancialData } from './hooks/useFinancialData';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ToastProvider } from './contexts/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { Subscription } from './types';
import { supabase } from './lib/supabase';

interface LayoutContext {
  filteredSubscriptions: Subscription[];
}

function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { subscriptions, updateSubscription, deleteSubscription, reorderSubscriptions } = useSubscriptions();
  const { 
    fixedExpenses,
    variableExpenses,
    incomeSources,
    loading: financialDataLoading 
  } = useFinancialData();
  const { filteredSubscriptions } = useOutletContext<LayoutContext>();

  // Handle auth session recovery
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Auth token refreshed');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Authenticating...</div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onGetStarted={() => {}} />;
  }

  if (financialDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading financial data...</div>
      </div>
    );
  }

  return (
    <>
      <SubscriptionList
        subscriptions={filteredSubscriptions}
        onUpdate={updateSubscription}
        onDelete={deleteSubscription}
        onReorder={reorderSubscriptions}
      />
      {filteredSubscriptions.length > 0 && (
        <>
          <SubscriptionAnalytics 
            subscriptions={filteredSubscriptions}
            fixedExpenses={fixedExpenses}
            variableExpenses={variableExpenses}
            incomeSources={incomeSources}
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

export default function AppWithProviders() {
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
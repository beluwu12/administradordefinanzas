import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TagsProvider } from './context/TagsContext';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './components/layout/MainLayout';
import SyncIndicator from './components/SyncIndicator';
import BiometricGate from './components/BiometricGate';

// Lazy load pages for code splitting
const DashboardHelper = lazy(() => import('./pages/DashboardHelper'));
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const TagsPage = lazy(() => import('./pages/TagsPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const GoalDetailPage = lazy(() => import('./pages/GoalDetailPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Auth Pages - Keep eager load for fast initial render
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

/**
 * Loading spinner for Suspense fallback
 */
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

/**
 * ProtectedRoute - Wraps authenticated routes
 * TagsProvider moved INSIDE protected routes so it only fetches when authenticated
 */
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // TagsProvider only renders when user is authenticated
  return (
    <TagsProvider>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </TagsProvider>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <BiometricGate>
        <SyncIndicator />
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected App Routes - TagsProvider is inside ProtectedRoute now */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout><Outlet /></MainLayout>}>
                  <Route path="/" element={<DashboardHelper />} />
                  <Route path="/transactions" element={<TransactionsPage />} />
                  <Route path="/tags" element={<TagsPage />} />
                  <Route path="/budget" element={<BudgetPage />} />
                  <Route path="/goals" element={<GoalsPage />} />
                  <Route path="/goals/:id" element={<GoalDetailPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </AuthProvider>
      </BiometricGate>
    </ErrorBoundary>
  );
}

export default App;


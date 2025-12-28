import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TagsProvider } from './context/TagsContext';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './components/layout/MainLayout';
import DashboardHelper from './pages/DashboardHelper';
import BudgetPage from './pages/BudgetPage';
import TagsPage from './pages/TagsPage';
import TransactionsPage from './pages/TransactionsPage';
import GoalsPage from './pages/GoalsPage';
import GoalDetailPage from './pages/GoalDetailPage';
import SettingsPage from './pages/SettingsPage';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

/**
 * ProtectedRoute - Wraps authenticated routes
 * FIX: TagsProvider moved INSIDE protected routes so it only fetches when authenticated
 */
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // TagsProvider only renders when user is authenticated
  return (
    <TagsProvider>
      <Outlet />
    </TagsProvider>
  );
};

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;

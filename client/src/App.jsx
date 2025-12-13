import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import DashboardHelper from './pages/DashboardHelper';
import BudgetPage from './pages/BudgetPage';
import TagsPage from './pages/TagsPage';

import TransactionsPage from './pages/TransactionsPage';
import GoalsPage from './pages/GoalsPage';
import GoalDetailPage from './pages/GoalDetailPage';

// Auth Pages
import UserSelectionPage from './pages/auth/UserSelectionPage';
import PinEntryPage from './pages/auth/PinEntryPage';
import CreateUserPage from './pages/auth/CreateUserPage';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null; // Or a spinner
  return user ? <Outlet /> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<UserSelectionPage />} />
          <Route path="/pin" element={<PinEntryPage />} />
          <Route path="/create-user" element={<CreateUserPage />} />

          {/* Protected App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout><Outlet /></MainLayout>}>
              <Route path="/" element={<DashboardHelper />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/tags" element={<TagsPage />} />
              <Route path="/budget" element={<BudgetPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/goals/:id" element={<GoalDetailPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import PendingPage from './pages/PendingPage';
import DashboardPage from './pages/DashboardPage';
import { PendingUsersPage, ApprovedUsersPage, RejectedUsersPage } from './pages/UsersPage';
import IncidentsPage from './pages/IncidentsPage';
import NotificationsPage from './pages/NotificationsPage';
import AuditLogsPage from './pages/AuditLogsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.status === 'PENDING' || user?.status === 'REJECTED') {
    return <Navigate to="/pending" replace />;
  }

  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/pending" element={<PendingPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="users/pending"
          element={
            <ProtectedRoute adminOnly>
              <PendingUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/approved"
          element={
            <ProtectedRoute adminOnly>
              <ApprovedUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/rejected"
          element={
            <ProtectedRoute adminOnly>
              <RejectedUsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute adminOnly>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              style: {
                background: '#16161f',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#f0f0ff',
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;

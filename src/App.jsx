import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { FaultLensProvider, useFaultLens } from './context/FaultLensContext';

// Layout
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Developer Pages
import { DashboardPage } from './pages/developer/DashboardPage';
import { WebsitesPage } from './pages/developer/WebsitesPage';
import { WebsiteDetailsPage } from './pages/developer/WebsiteDetailsPage';
import { ApiDetailsPage } from './pages/developer/ApiDetailsPage';
import { IncidentsPage } from './pages/developer/IncidentsPage';
import { IncidentDetailsPage } from './pages/developer/IncidentDetailsPage';
import { DeploymentsPage } from './pages/developer/DeploymentsPage';
import { LogsPage } from './pages/developer/LogsPage';
import { SettingsPage } from './pages/developer/SettingsPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminWebsitesPage } from './pages/admin/AdminWebsitesPage';
import { AdminIncidentsPage } from './pages/admin/AdminIncidentsPage';
import { AdminSystemHealthPage } from './pages/admin/AdminSystemHealthPage';

/**
 * Protected dashboard wrapper: requires active authenticated session
 */
const ProtectedDashboard = () => {
  const { currentUser, isLoading } = useFaultLens();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#080B12] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium tracking-wide">Validating session...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout />;
};

/**
 * Admin role guard
 */
const AdminOnlyRoute = ({ children }) => {
  const { role } = useFaultLens();
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/**
 * Public route wrapper that redirects already-authenticated users
 */
const PublicAuthRoute = ({ children }) => {
  const { currentUser, isLoading, role } = useFaultLens();
  if (isLoading) return null;
  if (currentUser) {
    return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
};

export function App() {
  return (
    <ToastProvider>
      <FaultLensProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={
                <PublicAuthRoute>
                  <LoginPage />
                </PublicAuthRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicAuthRoute>
                  <RegisterPage />
                </PublicAuthRoute>
              }
            />

            {/* Authenticated Dashboard Layout Routes */}
            <Route element={<ProtectedDashboard />}>
              {/* Developer Observability Routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/websites" element={<WebsitesPage />} />
              <Route path="/websites/:websiteId" element={<WebsiteDetailsPage />} />
              <Route path="/websites/:websiteId/apis/:apiId" element={<ApiDetailsPage />} />
              <Route path="/incidents" element={<IncidentsPage />} />
              <Route path="/incidents/:incidentId" element={<IncidentDetailsPage />} />
              <Route path="/deployments" element={<DeploymentsPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Admin Multi-Tenant Routes */}
              <Route
                path="/admin"
                element={
                  <AdminOnlyRoute>
                    <AdminDashboardPage />
                  </AdminOnlyRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminOnlyRoute>
                    <AdminUsersPage />
                  </AdminOnlyRoute>
                }
              />
              <Route
                path="/admin/websites"
                element={
                  <AdminOnlyRoute>
                    <AdminWebsitesPage />
                  </AdminOnlyRoute>
                }
              />
              <Route
                path="/admin/incidents"
                element={
                  <AdminOnlyRoute>
                    <AdminIncidentsPage />
                  </AdminOnlyRoute>
                }
              />
              <Route
                path="/admin/system-health"
                element={
                  <AdminOnlyRoute>
                    <AdminSystemHealthPage />
                  </AdminOnlyRoute>
                }
              />

              {/* Catch-all unknown routes inside dashboard */}
              <Route path="/dashboard/*" element={<NotFoundPage inDashboard={true} />} />
            </Route>

            {/* Global Fallback for unknown URLs */}
            <Route path="*" element={<NotFoundPage inDashboard={false} />} />
          </Routes>
        </BrowserRouter>
      </FaultLensProvider>
    </ToastProvider>
  );
}

export default App;

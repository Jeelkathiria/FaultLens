import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { FaultLensProvider } from './context/FaultLensContext';

// Layout
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

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

export function App() {
  return (
    <ToastProvider>
      <FaultLensProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Dashboard Layout Routes */}
            <Route element={<DashboardLayout />}>
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
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/websites" element={<AdminWebsitesPage />} />
              <Route path="/admin/incidents" element={<AdminIncidentsPage />} />
              <Route path="/admin/system-health" element={<AdminSystemHealthPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </FaultLensProvider>
    </ToastProvider>
  );
}

export default App;

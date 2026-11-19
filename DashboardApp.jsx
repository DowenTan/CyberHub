import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminCopilot from './components/AdminCopilot.jsx';
import AppShell from './components/AppShell.jsx';
import EnvironmentBanner from './components/EnvironmentBanner.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuthStore } from './store/useAuthStore.js';
import { useDashboardStore } from './store/useDashboardStore.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// Lazy loaded page components
const Login = lazy(() => import('./pages/Login.jsx'));
const CommandCenter = lazy(() => import('./pages/CommandCenter.jsx'));
const SmartOrders = lazy(() => import('./pages/SmartOrders.jsx'));
const Technicians = lazy(() => import('./pages/Technicians.jsx'));
const Customers = lazy(() => import('./pages/Customers.jsx'));
const Admins = lazy(() => import('./pages/Admins.jsx'));
const Logs = lazy(() => import('./pages/Logs.jsx'));
const Chats = lazy(() => import('./pages/Chats.jsx'));
const AiDiagnostics = lazy(() => import('./pages/AiDiagnostics.jsx'));
const ServiceAnalytics = lazy(() => import('./pages/ServiceAnalytics.jsx'));
const PriceSettings = lazy(() => import('./pages/PriceSettings.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

export default function DashboardApp() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const session = useAuthStore((state) => state.session);
  const fetchSupabaseData = useDashboardStore((state) => state.fetchSupabaseData);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (typeof fetchSupabaseData === 'function') {
      fetchSupabaseData().catch((err) => console.warn('Supabase fetch notice:', err));
    }
  }, [fetchSupabaseData, session]);

  return (
    <QueryClientProvider client={queryClient}>
      <EnvironmentBanner />
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public authentication route */}
            <Route path="/login" element={<Login />} />

            {/* Protected staff dashboard layout with left navigation & right activity/alerts sidebars */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<CommandCenter />} />
              <Route
                path="/smart-orders"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'admin', 'executive', 'technician']}>
                    <SmartOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/technicians"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'admin', 'hr_manager', 'executive']}>
                    <Technicians />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'admin', 'executive', 'hr_manager']}>
                    <Customers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admins"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'admin', 'executive', 'hr_manager']}>
                    <Admins />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/logs"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'admin', 'executive']}>
                    <Logs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chats"
                element={
                  <ProtectedRoute>
                    <Chats />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-diagnostics"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'admin', 'executive', 'technician']}>
                    <AiDiagnostics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/service-analytics"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'admin', 'executive']}>
                    <ServiceAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/price-settings"
                element={
                  <ProtectedRoute allowedRoles={['super_admin', 'admin', 'executive']}>
                    <PriceSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        {session && <AdminCopilot />}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

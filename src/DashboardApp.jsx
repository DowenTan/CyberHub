import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminCopilot from './components/AdminCopilot.jsx';

const CommandCenter = lazy(() => import('./pages/LegacyCommandCenter.jsx'));
const SmartOrders = lazy(() => import('./pages/LegacySmartOrders.jsx'));
const Technicians = lazy(() => import('./pages/LegacyTechnicians.jsx'));
const AiDiagnostics = lazy(() => import('./pages/LegacyAiDiagnostics.jsx'));
const ServiceAnalytics = lazy(() => import('./pages/LegacyServiceAnalytics.jsx'));
const PriceSettings = lazy(() => import('./pages/LegacyPriceSettings.jsx'));

export default function DashboardApp() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<CommandCenter />} />
          <Route path="/smart-orders" element={<SmartOrders />} />
          <Route path="/technicians" element={<Technicians />} />
          <Route path="/ai-diagnostics" element={<AiDiagnostics />} />
          <Route path="/service-analytics" element={<ServiceAnalytics />} />
          <Route path="/price-settings" element={<PriceSettings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <AdminCopilot />
    </BrowserRouter>
  );
}

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CommandCenter from './pages/CommandCenter.jsx';
import SmartOrders from './pages/SmartOrders.jsx';
import Technicians from './pages/Technicians.jsx';
import Customers from './pages/Customers.jsx';
import Admins from './pages/Admins.jsx';
import Logs from './pages/Logs.jsx';
import AiDiagnostics from './pages/AiDiagnostics.jsx';
import ServiceAnalytics from './pages/ServiceAnalytics.jsx';
import PriceSettings from './pages/PriceSettings.jsx';
import Settings from './pages/Settings.jsx';
import Chats from './pages/Chats.jsx';
import AdminCopilot from './components/AdminCopilot.jsx';
import AppShell from './components/AppShell.jsx';
import { useDashboardStore } from './store/useDashboardStore.js';

export default function App() {
  const fetchSupabaseData = useDashboardStore((state) => state.fetchSupabaseData);

  useEffect(() => {
    fetchSupabaseData();
  }, [fetchSupabaseData]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<CommandCenter />} />
          <Route path="/smart-orders" element={<SmartOrders />} />
          <Route path="/technicians" element={<Technicians />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/admins" element={<Admins />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/ai-diagnostics" element={<AiDiagnostics />} />
          <Route path="/service-analytics" element={<ServiceAnalytics />} />
          <Route path="/price-settings" element={<PriceSettings />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/chats/customers" element={<Chats defaultTab="customers" />} />
        </Route>
      </Routes>
      <AdminCopilot />
    </BrowserRouter>
  );
}

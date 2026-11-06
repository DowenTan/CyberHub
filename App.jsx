import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AdminCopilot from './components/AdminCopilot';
import CommandCenter from './pages/CommandCenter';
import SmartOrders from './pages/SmartOrders';
import Technicians from './pages/Technicians';
import PriceSettings from './pages/PriceSettings';

const DashboardLayout = () => (
  <div className="app-container">
    <Sidebar />
    <div className="app-main">
      {/* Only this inner area changes when switching tabs! */}
      <Outlet />
    </div>
    {/* Persistent AI Assistant stays mounted at all times */}
    <AdminCopilot />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<CommandCenter />} />
          <Route path="/smart-orders" element={<SmartOrders />} />
          <Route path="/technicians" element={<Technicians />} />
          <Route path="/price-settings" element={<PriceSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
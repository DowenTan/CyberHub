import { BrowserRouter, Routes, Route, Outlet, NavLink } from 'react-router-dom';
import CommandCenter from './pages/CommandCenter.jsx';
import SmartOrders from './pages/SmartOrders.jsx';
import Technicians from './pages/Technicians.jsx';
import AiDiagnostics from './pages/AiDiagnostics.jsx';
import ServiceAnalytics from './pages/ServiceAnalytics.jsx';
import PriceSettings from './pages/PriceSettings.jsx';
import Settings from './pages/Settings.jsx';
import AdminCopilot from './components/AdminCopilot.jsx';
import { useDashboardStore } from './store/useDashboardStore.js';

const NAV_ITEMS = [
  { path: '/', label: 'Command Center' },
  { path: '/smart-orders', label: 'Smart Orders' },
  { path: '/technicians', label: 'Technicians' },
  { path: '/ai-diagnostics', label: 'AI Diagnostics' },
  { path: '/service-analytics', label: 'Service Analytics' },
  { path: '/price-settings', label: 'Price Settings' },
  { path: '/settings', label: 'User Settings ⚙️' },
];

const Sidebar = () => {
  const { userProfile } = useDashboardStore();

  return (
    <aside className="ch-sidebar">
      <div className="ch-logo">
        <img
          src="/image/MainLogo.png"
          alt="CyberHub"
          style={{ height: '28px', width: 'auto' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <span>CyberHub</span>
      </div>

      <nav className="ch-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `ch-nav-link ${isActive ? 'active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Clicking this navigates directly to /settings */}
      <NavLink
        to="/settings"
        className={({ isActive }) => `ch-sidebar-profile ${isActive ? 'active-profile' : ''}`}
      >
        <div className={`ch-avatar-wrapper frame-${userProfile.avatarFrame} small`}>
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.username}
            className="ch-avatar-img"
            onError={(e) => {
              e.currentTarget.src = 'https://ui-avatars.com/api/?name=CA&background=ff7300&color=fff';
            }}
          />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {userProfile.username}
          </div>
          <div style={{ fontSize: '11px', color: '#ff7300' }}>User Settings →</div>
        </div>
      </NavLink>
    </aside>
  );
};

const DashboardLayout = () => (
  <div className="ch-app-shell">
    {/* Left Sidebar sticks flush to far-left edge */}
    <Sidebar />

    {/* Center Main Content expands to fill maximum middle space with dedicated scrollbar */}
    <main className="ch-main-viewport">
      <Outlet />
    </main>

    {/* Right AI Copilot Sidebar sticks flush to far-right edge */}
    <AdminCopilot />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<CommandCenter />} />
          <Route path="/smart-orders" element={<SmartOrders />} />
          <Route path="/technicians" element={<Technicians />} />
          <Route path="/ai-diagnostics" element={<AiDiagnostics />} />
          <Route path="/service-analytics" element={<ServiceAnalytics />} />
          <Route path="/price-settings" element={<PriceSettings />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
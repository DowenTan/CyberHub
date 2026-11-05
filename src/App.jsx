import { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link, useLocation } from 'react-router-dom';
import CommandCenter from './pages/LegacyCommandCenter.jsx';
import SmartOrders from './pages/LegacySmartOrders.jsx';
import Technicians from './pages/LegacyTechnicians.jsx';
import AiDiagnostics from './pages/LegacyAiDiagnostics.jsx';
import ServiceAnalytics from './pages/LegacyServiceAnalytics.jsx';
import PriceSettings from './pages/LegacyPriceSettings.jsx';
import AdminCopilot from './components/AdminCopilot.jsx';

const NAV_LINKS = [
  {
    path: '/',
    label: 'Command Center',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    path: '/smart-orders',
    label: 'Smart Orders',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    path: '/technicians',
    label: 'Technicians',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: '/ai-diagnostics',
    label: 'AI Diagnostics',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
      </svg>
    ),
  },
  {
    path: '/service-analytics',
    label: 'Service Analytics',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    path: '/price-settings',
    label: 'Price Settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

// Retained during the incremental migration as a reference for the former React shell.
// eslint-disable-next-line no-unused-vars
const DashboardLayout = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-container">
      {/* 1:1 Original Left Sidebar (.app-left) */}
      <div className={`app-left ${menuOpen ? 'show' : ''}`}>
        <button className="close-menu" onClick={() => setMenuOpen(false)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="app-logo">
          <img
            src="/image/MainLogo.png"
            alt="CyberHub"
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polygon points="13 8 9 13 12 13 11 17 15 11 12 11 13 8" />
          </svg>
          <span>CyberHub</span>
        </div>

        <ul className="nav-list">
          {NAV_LINKS.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <li key={item.path} className={`nav-list-item ${isActive ? 'active' : ''}`}>
                <Link className="nav-list-link" to={item.path} onClick={() => setMenuOpen(false)}>
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 1:1 Original Main Area (.app-main) */}
      <div className="app-main">
        <Outlet />
      </div>

      {/* Persistent Bottom-Right AI Copilot */}
      <AdminCopilot />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CommandCenter />} />
        <Route path="/smart-orders" element={<SmartOrders />} />
        <Route path="/technicians" element={<Technicians />} />
        <Route path="/ai-diagnostics" element={<AiDiagnostics />} />
        <Route path="/service-analytics" element={<ServiceAnalytics />} />
        <Route path="/price-settings" element={<PriceSettings />} />
      </Routes>
    </BrowserRouter>
  );
}

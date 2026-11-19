import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useTechChatStore } from '../store/useTechChatStore.js';
import { getNavKeybinds } from '../lib/navKeybinds.js';
import TechnicianChatModal from './TechnicianChatModal.jsx';
import TechCallOverlay from './TechCallOverlay.jsx';
import Customer360Card from './Customer360Card.jsx';
import FieldServiceReportsModal from './FieldServiceReportsModal.jsx';

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Command Center',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18" />
      </svg>
    ),
  },
  {
    path: '/smart-orders',
    label: 'Smart Orders',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    path: '/technicians',
    label: 'Technicians',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: '/customers',
    label: 'Customers',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: '/admins',
    label: 'Admins',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    path: '/logs',
    label: 'Logs',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    path: '/chats',
    label: 'Chats',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    path: '/ai-diagnostics',
    label: 'AI Diagnostics',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    ),
  },
  {
    path: '/service-analytics',
    label: 'Service Analytics',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
      </svg>
    ),
  },
  {
    path: '/price-settings',
    label: 'Price Settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function AppShell() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const role = useAuthStore((state) => state.role);
  const signOut = useAuthStore((state) => state.signOut);
  const userProfile = useDashboardStore((state) => state.userProfile);
  const selectedRecord = useDashboardStore((state) => state.selectedRecord);
  const clearSelectedRecord = useDashboardStore((state) => state.clearSelectedRecord);
  const deleteOrder = useDashboardStore((state) => state.deleteOrder);
  const deleteTechnician = useDashboardStore((state) => state.deleteTechnician);
  const deleteSparePart = useDashboardStore((state) => state.deleteSparePart);
  const openChatWithTech = useTechChatStore((state) => state.openChatWithTech);
  const startCall = useTechChatStore((state) => state.startCall);

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [supportExpanded, setSupportExpanded] = useState(false);
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const [orderReportModal, setOrderReportModal] = useState(null);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [rightProfileDropdownOpen, setRightProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const rightProfileDropdownRef = useRef(null);

  // Global Navigation Keybinds (1 to 7)
  const [keybinds, setKeybinds] = useState(getNavKeybinds);

  useEffect(() => {
    const handleUpdate = () => setKeybinds(getNavKeybinds());
    window.addEventListener('cyberhub:keybinds-updated', handleUpdate);
    return () => window.removeEventListener('cyberhub:keybinds-updated', handleUpdate);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in form inputs, textareas, selects, or editable content
      const activeEl = document.activeElement;
      const tagName = activeEl?.tagName?.toUpperCase();
      const isEditable =
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        activeEl?.isContentEditable;

      if (isEditable) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const pressedKey = e.key.toLowerCase();
      const match = keybinds.find((kb) => kb.key && kb.key.toLowerCase() === pressedKey);

      if (match && match.path) {
        e.preventDefault();
        navigate(match.path);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keybinds, navigate]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (rightProfileDropdownRef.current && !rightProfileDropdownRef.current.contains(e.target)) {
        setRightProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen || rightProfileDropdownOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [profileDropdownOpen, rightProfileDropdownOpen]);

  useEffect(() => {
    if (selectedRecord) {
      setRightCollapsed(false);
    }
  }, [selectedRecord]);

  const displayUsername =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    userProfile?.username ||
    user?.email?.split('@')[0] ||
    'Super Admin';

  const displayRole = profile?.is_super_admin
    ? 'Superadmin'
    : role
    ? role
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : userProfile?.role || 'Superadmin';

  const avatarUrl =
    userProfile?.avatarUrl ||
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80';

  const avatarFrame = userProfile?.avatarFrame || 'neon-orange';

  const handleLogout = async () => {
    try {
      await signOut('user_initiated');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div
      className={`app-container ch-app-shell ${leftCollapsed ? 'left-sidebar-collapsed' : ''} ${
        rightCollapsed ? 'right-sidebar-collapsed' : ''
      }`}
    >
      {/* 1. Left Sidebar Navigation */}
      <aside className="app-left ch-left-sidebar" aria-label="Main Navigation">
        <button
          type="button"
          className="close-menu"
          onClick={() => setLeftCollapsed(true)}
          title="Close Navigation Menu"
          aria-label="Close Navigation Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="app-logo ch-logo">
          <img
            src="/image/MainLogo.png"
            height="56px"
            alt="CyberHub Logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <ul className="nav-list ch-nav">
          {NAV_ITEMS.map((item) => {
            const kb = keybinds.find((k) => k.path === item.path);
            return (
              <li key={item.path} className="nav-list-item">
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-list-link ch-nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.icon}
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {kb?.key && (
                    <kbd
                      style={{
                        fontSize: '9.5px',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        
                        
                        color: '#94a3b8',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        marginLeft: 'auto',
                      }}
                      title={`Press '${kb.key}' to navigate`}
                    >
                      {kb.key.toUpperCase()}
                    </kbd>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Encrypted Technician Radio Launcher */}
        <div style={{ padding: '0 12px 6px 12px', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={() => openChatWithTech({ code: 'T-001', name: 'Sarah Izzah', zone: 'Klang Valley' })}
            title="Open Encrypted Technician Radio Chat"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              background: 'linear-gradient(135deg, rgba(255, 115, 0, 0.18), rgba(5, 19, 64, 0.7))',
              border: '1px solid rgba(255, 115, 0, 0.4)',
              borderRadius: '8px',
              color: '#ff7300',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff7300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Tech Radio (E2EE)</span>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2ed573', marginLeft: 'auto', boxShadow: '0 0 6px #2ed573' }} />
          </button>
        </div>

        {/* User profile card at bottom of left sidebar: slightly moved up ch-sidebar-profile across all pages */}
        <div style={{ position: 'relative' }}>
          <div
            className="ch-sidebar-profile"
            title="Click avatar for account options"
            style={{
              margin: '14px 12px 26px 12px',
              cursor: 'pointer',
            }}
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
          >
            <div
              className={`ch-avatar-wrapper frame-${avatarFrame} small`}
              title="Click for options"
            >
              <img
                src={avatarUrl}
                alt={displayUsername}
                className="ch-avatar-img"
                onError={(e) => {
                  e.currentTarget.src = 'https://ui-avatars.com/api/?name=SA&background=ff7300&color=fff';
                }}
              />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {displayUsername}
              </div>
              <div style={{ fontSize: '11px', color: '#ff7300', fontWeight: 600 }}>{displayRole}</div>
            </div>
          </div>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div
              className="ch-user-profile-dropdown"
              ref={profileDropdownRef}
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '12px',
                marginBottom: '8px',
                background: '#07112c',
                border: '1px solid rgba(255, 115, 0, 0.45)',
                borderRadius: '8px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.85), 0 0 16px rgba(255, 115, 0, 0.25)',
                zIndex: 2000,
                width: '210px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '4px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayUsername}
                </div>
                <div style={{ fontSize: '10.5px', color: '#ff7300', fontWeight: 600, textTransform: 'uppercase' }}>
                  {displayRole}
                </div>
              </div>
              <button
                type="button"
                className="ch-dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileDropdownOpen(false);
                  navigate('/settings');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#e5e7eb',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span style={{ flex: 1 }}>User Settings</span>
                {keybinds.find((k) => k.id === 'user-settings')?.key && (
                  <kbd
                    style={{
                      fontSize: '9.5px',
                      padding: '1px 5px',
                      
                      color: '#ff7300',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                    title="Press shortcut key to open Settings"
                  >
                    {keybinds.find((k) => k.id === 'user-settings')?.key?.toUpperCase()}
                  </kbd>
                )}
              </button>
              <button
                type="button"
                className="ch-dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileDropdownOpen(false);
                  handleLogout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ff4757',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Left Sticky Pull-Tab Button */}
      <button
        type="button"
        className="ch-sidebar-stick-btn ch-stick-left"
        onClick={() => setLeftCollapsed((c) => !c)}
        title={leftCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar'}
        aria-label="Toggle Left Sidebar"
      >
        <svg className="icon-open" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <svg className="icon-closed" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* 3. Center Main Viewport */}
      <main className="app-main ch-main-viewport">
        <Outlet />
      </main>

      {/* 4. Right Sticky Pull-Tab Button */}
      <button
        type="button"
        className="ch-sidebar-stick-btn ch-stick-right"
        onClick={() => setRightCollapsed((c) => !c)}
        title={rightCollapsed ? 'Expand Activity & Alerts Panel' : 'Collapse Activity & Alerts Panel'}
        aria-label="Toggle Right Sidebar"
      >
        <svg className="icon-open" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <svg className="icon-closed" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* 5. Right Activity & Dispatch Feed Sidebar */}
      <aside className={`app-right ${rightCollapsed ? 'closed' : ''}`} aria-label="Activity & Alerts">
        <button
          type="button"
          className="close-right"
          onClick={() => setRightCollapsed(true)}
          title="Close Activity Drawer"
          aria-label="Close Activity Drawer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* 5. Right Sidebar: Shows Authentic CyberHub Detail Inspector when a Smart Table row is clicked, else Activity Feed with Joined Profile Box */}
        {selectedRecord ? (
          <div className="app-right-record-inspector" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span className="ai-badge" style={{ textTransform: 'uppercase', fontSize: '10.5px' }}>
                {selectedRecord.type === 'order' ? 'AI Order Telemetry' : selectedRecord.type === 'technician' ? 'Technician Live Radar' : 'Pricing Matrix Inspector'}
              </span>
              <button
                type="button"
                className="close-btn"
                onClick={clearSelectedRecord}
                style={{ background: 'none', border: 'none', color: '#ff7300', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Return to Feed"
              >
                ✕ Close
              </button>
            </div>

            {/* Technician Profile Details Panel (Authentic technicians.html app-right) */}
            {selectedRecord.type === 'technician' && (() => {
              const t = selectedRecord.data;
              const certList = Array.isArray(t.certifications) && t.certifications.length > 0
                ? t.certifications.map((c) => (typeof c === 'string' ? c : c.title || c.name || '')).filter(Boolean)
                : (typeof t.certifications === 'string' && t.certifications.trim()
                  ? t.certifications.split(/[,•|]/).map((s) => s.trim()).filter(Boolean)
                  : (t.certs ? String(t.certs).split(/[,•|]/).map((s) => s.trim()).filter(Boolean) : ['HVAC Level 3', 'Smart Inverters', 'Refrigeration & Coolant']));
              const fixRateNum = parseInt(String(t.firstFixRate || '95').replace(/\D/g, ''), 10) || 95;
              const ratingPct = Math.min(100, Math.round(((Number(t.rating) || 4.8) / 5) * 100));

              return (
                <div>
                  <div className="profile-box" style={{ marginTop: '12px', textAlign: 'center' }}>
                    <div className="profile-photo-wrapper" style={{ width: '72px', height: '72px', margin: '0 auto 8px' }}>
                      <img
                        src={t.avatar_url || t.avatar || 'https://images.unsplash.com/photo-1543965170-4c01a586684e?auto=format&fit=crop&w=300&q=80'}
                        alt={t.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <p className="profile-text" style={{ fontSize: '17px', margin: '0 0 2px' }}>{t.name}</p>
                    <p className="profile-subtext" style={{ fontSize: '11.5px', color: '#9ca3af', margin: '0 0 8px' }}>
                      {t.specialty || 'Master Technician'} • <strong style={{ color: '#ff7300' }}>{t.code}</strong>
                    </p>
                    <span className={`status-pill ${(t.status || 'AVAILABLE').toLowerCase()}`} style={{ display: 'inline-block' }}>
                      {t.status === 'AVAILABLE' ? 'Available • Standby' : t.status === 'ON_JOB' ? 'On Site • In Progress' : t.status}
                    </span>
                  </div>

                  <div className="app-right-content">
                    {/* Verified Certifications */}
                    <div className="app-right-section">
                      <div className="app-right-section-header">
                        <h2>Verified Certifications</h2>
                      </div>
                      <div className="cert-tags" style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {certList.map((cName) => (
                          <span className="cert-tag" key={cName}>{cName}</span>
                        ))}
                      </div>
                    </div>

                    {/* Performance Analytics */}
                    <div className="app-right-section">
                      <div className="app-right-section-header">
                        <h2>Performance Analytics</h2>
                      </div>
                      <div style={{ padding: '8px 16px' }}>
                        <div className="progress-bar-info" style={{ marginTop: 0 }}>
                          <span className="progress-type">First-Time Fix Rate</span>
                          <span className="progress-amount">{t.firstFixRate || '95%'}</span>
                        </div>
                        <div className="acquisitions-bar" style={{ marginTop: '6px', marginBottom: '14px', background: 'rgba(255,255,255,0.05)' }}>
                          <span className="bar-progress on-hold" style={{ width: `${fixRateNum}%`, backgroundColor: '#2ed573' }} />
                        </div>

                        <div className="progress-bar-info" style={{ marginTop: 0 }}>
                          <span className="progress-type">Customer Satisfaction</span>
                          <span className="progress-amount">{Number(t.rating || 4.8).toFixed(1)} / 5.0</span>
                        </div>
                        <div className="acquisitions-bar" style={{ marginTop: '6px', marginBottom: '14px', background: 'rgba(255,255,255,0.05)' }}>
                          <span className="bar-progress" style={{ width: `${ratingPct}%`, backgroundColor: '#ffa502' }} />
                        </div>
                      </div>
                    </div>

                    {/* Truck Spare Parts Inventory Section */}
                    <div className="app-right-section">
                      <div className="app-right-section-header">
                        <h2>Truck Spare Parts Stock</h2>
                        <span className="truck-stock-tag in-stock">Van Stocked</span>
                      </div>
                      <div style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <span className="van-part-chip">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ed573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          R410A Freon (4kg)
                        </span>
                        <span className="van-part-chip">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ed573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          Universal Inverter Board
                        </span>
                        <span className="van-part-chip">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ed573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          DC Fan Motor
                        </span>
                      </div>
                    </div>

                    {/* Google Maps Live Tracking */}
                    <div className="app-right-section">
                      <div className="app-right-section-header">
                        <h2>Google Maps Live Tracking</h2>
                        <span className="live-radar-badge" style={{ fontSize: '10px', padding: '2px 8px' }}>
                          <span className="radar-ping" /> Live GPS
                        </span>
                      </div>
                      <div style={{ padding: '10px 16px' }}>
                        <div className="tech-map-live-container" style={{ borderRadius: '8px', overflow: 'hidden', height: '140px', marginBottom: '8px' }}>
                          <iframe
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(t.zone || 'Mont Kiara, Kuala Lumpur, Malaysia')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                            loading="lazy"
                            title="Technician Live Tracking"
                            style={{ width: '100%', height: '100%', border: 0 }}
                          />
                        </div>
                        <div className="tech-live-telemetry">
                          <div className="telemetry-item">
                            <span>Current Area</span>
                            <strong>{t.zone || 'Klang Valley'}</strong>
                          </div>
                          <div className="telemetry-item">
                            <span>ETA</span>
                            <strong style={{ color: '#2ed573' }}>12 mins</strong>
                          </div>
                          <div className="telemetry-item">
                            <span>Speed</span>
                            <strong>42 km/h</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Review */}
                    <div className="app-right-section">
                      <div className="app-right-section-header">
                        <h2>Verified Customer Review</h2>
                        <span style={{ color: '#f1c40f', fontWeight: 700, fontSize: '12px' }}>★ {Number(t.rating || 5.0).toFixed(1)}</span>
                      </div>
                      <div style={{ padding: '8px 16px 14px', fontStyle: 'italic', color: '#e2e8f0', fontSize: '11.5px', lineHeight: 1.5 }}>
                        "{t.customerComment || 'Arrived precisely on schedule with the required inverter board in stock. Diagnostic was fast and refrigerator chilled immediately.'}"
                        <div style={{ textAlign: 'right', marginTop: '6px', fontSize: '10.5px', color: '#ff7300', fontStyle: 'normal' }}>
                          — {t.customerCommentAuthor || 'Verified Customer (Bangsar)'}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ padding: '10px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        type="button"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          fontSize: '12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: 'linear-gradient(135deg, rgba(255, 115, 0, 0.25), rgba(5, 19, 64, 0.9))',
                          border: '1px solid #ff7300',
                          color: '#ff7300',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 0 10px rgba(255, 115, 0, 0.25)',
                        }}
                        onClick={() => openChatWithTech(t)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff7300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span>Encrypted Tech Chat (AES-256)</span>
                      </button>

                      {/* WebRTC Voice & Video Call Buttons */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                          type="button"
                          style={{
                            padding: '8px',
                            fontSize: '11.5px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: 'rgba(46, 213, 115, 0.15)',
                            border: '1px solid #2ed573',
                            color: '#2ed573',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                          }}
                          onClick={() => startCall(t, 'audio')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ed573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span>Voice Call</span>
                        </button>
                        <button
                          type="button"
                          style={{
                            padding: '8px',
                            fontSize: '11.5px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid #38bdf8',
                            color: '#38bdf8',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                          }}
                          onClick={() => startCall(t, 'video')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                          </svg>
                          <span>Video Call</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        style={{
                          width: '100%',
                          padding: '8px',
                          fontSize: '12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: 'rgba(255, 71, 87, 0.16)',
                          border: '1px solid #ff4757',
                          color: '#ff4757',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                        onClick={() => {
                          if (window.confirm(`Delete technician ${t.name} (${t.code})?`)) {
                            deleteTechnician(t.code);
                            clearSelectedRecord();
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Delete Technician Record</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Smart Order Details Panel (Authentic smart-orders.html app-right) */}
            {selectedRecord.type === 'order' && (() => {
              const o = selectedRecord.data;
              const rawTech = o.matchedTech || o.assignedTech;
              const techName = (!rawTech || /auto[- ]?dispatched/i.test(rawTech)) ? 'Satou Kenji' : rawTech;

              return (
                <div className="smart-order-inspector">
                  <div className="order-sidebar-title" style={{ padding: '18px 20px 10px' }}>
                    <h2 style={{ fontSize: '16px', margin: '0 0 4px', color: '#fff' }}>AI Match Recommendations</h2>
                    <span className="ai-badge">Auto-Solver Active</span>
                  </div>

                  <div className="ai-insight-box" style={{ margin: '0 20px 16px', padding: '14px 16px' }}>
                    <div className="ai-insight-header">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                      <span>Skill Match Optimization</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11.5px', lineHeight: 1.5, color: '#cbd5e1' }}>
                      Route grouping saved an estimated <strong>24.8 km</strong> of driving and <strong>5.6 kg CO₂</strong> emissions across Klang Valley.
                    </p>
                  </div>

                  {/* Customer 360 Brief (D7) */}
                  <Customer360Card
                    order={o}
                    customer={{ name: o.customer, phone: o.phone, location: o.location }}
                  />

                  <div className="app-right-content">
                    <div className="app-right-section" style={{ marginBottom: '16px' }}>
                      <div className="app-right-section-header" style={{ padding: '0 20px', marginBottom: '8px' }}>
                        <h2>Work Order #{o.id}</h2>
                        <span className={`status-pill ${(o.status || 'PENDING').toLowerCase().replace('_', '-')}`}>{o.status}</span>
                      </div>

                      <div style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Client & Location</div>
                          <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff', marginTop: '3px' }}>{o.customer || 'Customer'}</div>
                          <div style={{ fontSize: '12px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{o.location || 'Klang Valley'}</span>
                          </div>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Appliance & Fault</div>
                          <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#ff7300', marginTop: '3px' }}>{o.appliance || 'Home Appliance'}</div>
                          <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>{o.issue || 'Diagnostic Request'}</div>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Matched Field Specialist</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={o.matchedTechAvatar || '/logo1.png'}
                                alt="Tech"
                                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #ff7300' }}
                              />
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{techName}</div>
                                <div style={{ fontSize: '11px', color: '#2ed573' }}>98% Match • Van Stock Ready</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openChatWithTech({
                                code: o.matchedTechCode || 'T-001',
                                name: techName,
                                avatar: o.matchedTechAvatar,
                                zone: o.matchedTechZone || o.location,
                              })}
                              style={{
                                padding: '5px 10px',
                                fontSize: '11.5px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                background: 'rgba(56, 189, 248, 0.15)',
                                border: '1px solid #38bdf8',
                                color: '#38bdf8',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                              title="Open Encrypted Chat with Assigned Technician"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              Chat
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>AI ESTIMATE</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#2ed573', marginTop: '3px' }}>RM {(Number(o.aiEstimate) || 165).toFixed(2)}</div>
                          </div>
                          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>VAN STOCK</div>
                            <span className="truck-stock-tag in-stock" style={{ display: 'inline-block', marginTop: '5px', fontSize: '10px' }}>Ready</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          style={{
                            marginTop: '12px',
                            padding: '10px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: 'rgba(255, 71, 87, 0.16)',
                            border: '1px solid #ff4757',
                            color: '#ff4757',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                          onClick={() => {
                            if (window.confirm(`Delete order #${o.id}?`)) {
                              deleteOrder(o.id);
                              clearSelectedRecord();
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span>Delete Order</span>
                        </button>

                        <button
                          type="button"
                          style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: '11.5px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid #38bdf8',
                            color: '#38bdf8',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            marginTop: '8px',
                          }}
                          onClick={() => setOrderReportModal(o)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                          <span>Field Service Reports (FSR)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Spare Part Details Panel (Authentic price-settings.html app-right) */}
            {selectedRecord.type === 'part' && (() => {
              const p = selectedRecord.data;
              const cost = Number(p.cost ?? p.supplier_cost ?? 0);
              const markup = Number(p.markup ?? p.markup_percentage ?? 0);
              const finalPrice = Number(p.finalPrice ?? p.final_price ?? (cost * (1 + markup / 100)));

              return (
                <div>
                  <div className="order-sidebar-title" style={{ padding: '14px 16px 8px' }}>
                    <h2 style={{ fontSize: '16px', margin: '0 0 4px', color: '#fff' }}>Pricing Intelligence</h2>
                    <span className="ai-badge">AI Active</span>
                  </div>

                  <div className="ai-insight-box" style={{ margin: '0 16px 12px' }}>
                    <div className="ai-insight-header">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 6l-9.5 9.5-5-5L1 18" /><polyline points="16 6 23 6 23 13" /></svg>
                      <span>Margin Optimization Suggestion</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11px', lineHeight: 1.4, color: '#cbd5e1' }}>
                      Cost margin calibrated for <strong>{p.category}</strong>. Automatically synced with Copilot quote engine.
                    </p>
                  </div>

                  <div className="app-right-content">
                    <div className="app-right-section">
                      <div className="app-right-section-header">
                        <h2>{p.name}</h2>
                        <span className="mono accent-text">{p.sku}</span>
                      </div>

                      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Category</div>
                          <span className="appliance-tag" style={{ display: 'inline-block', marginTop: '4px', fontSize: '11px' }}>{p.category}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '4px' }}>
                          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#9ca3af' }}>COST</div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>RM {cost.toFixed(2)}</div>
                          </div>
                          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#9ca3af' }}>MARKUP</div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffa502', marginTop: '2px' }}>{markup}%</div>
                          </div>
                          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#9ca3af' }}>RETAIL</div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#2ed573', marginTop: '2px' }}>RM {finalPrice.toFixed(2)}</div>
                          </div>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '6px' }}>
                          <span className="truck-stock-tag in-stock" style={{ fontSize: '10px' }}>Catalog Synced</span>
                          <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '8px' }}>Active in AI Price Engine</span>
                        </div>

                        <button
                          type="button"
                          style={{
                            marginTop: '8px',
                            padding: '8px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: 'rgba(255, 71, 87, 0.16)',
                            border: '1px solid #ff4757',
                            color: '#ff4757',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                          onClick={() => {
                            if (window.confirm(`Delete spare part ${p.name} (${p.sku})?`)) {
                              deleteSparePart(p.sku);
                              clearSelectedRecord();
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span>Delete Part</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
        /* Feed Content with Joined Profile Box */
        <div className="app-right-content">
          {/* Profile Box joined with app-right-content */}
          <div className="profile-box" style={{ position: 'relative', marginTop: '12px', marginBottom: '14px' }}>
            <div
              className={`profile-photo-wrapper frame-${avatarFrame}`}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setRightProfileDropdownOpen((prev) => !prev);
              }}
              title="Click avatar for account options"
            >
              <img
                src={avatarUrl}
                alt={displayUsername}
                onError={(e) => {
                  e.currentTarget.src = 'https://ui-avatars.com/api/?name=SA&background=ff7300&color=fff';
                }}
              />
            </div>
            <p className="profile-text">{displayUsername}</p>
            <p className="profile-subtext">{displayRole}</p>

            {/* Right Profile Dropdown Menu */}
            {rightProfileDropdownOpen && (
              <div
                className="ch-user-profile-dropdown"
                ref={rightProfileDropdownRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: '8px',
                  background: '#07112c',
                  border: '1px solid rgba(255, 115, 0, 0.45)',
                  borderRadius: '8px',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.85), 0 0 16px rgba(255, 115, 0, 0.25)',
                  zIndex: 2000,
                  width: '200px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayUsername}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#ff7300', fontWeight: 600, textTransform: 'uppercase' }}>
                    {displayRole}
                  </div>
                </div>
                <button
                  type="button"
                  className="ch-dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRightProfileDropdownOpen(false);
                    navigate('/settings');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#e5e7eb',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span style={{ flex: 1 }}>User Settings</span>
                {keybinds.find((k) => k.id === 'user-settings')?.key && (
                  <kbd
                    style={{
                      fontSize: '9.5px',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      
                      
                      color: '#ff7300',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                    title="Press shortcut key to open Settings"
                  >
                    {keybinds.find((k) => k.id === 'user-settings')?.key?.toUpperCase()}
                  </kbd>
                )}
                </button>
                <button
                  type="button"
                  className="ch-dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRightProfileDropdownOpen(false);
                    handleLogout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ff4757',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
          {/* Customer Support Feed */}
          <div className="app-right-section">
            <div className="app-right-section-header">
              <h2>Customer Support Feed</h2>
              <span className="notification-active">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
            </div>

            <div className="message-line">
              <img
                src="https://images.unsplash.com/photo-1562159278-1253a58da141?ixid=MXwxMjA3fDB8MHxzZWFyY2h8MzB8fHBvcnRyYWl0JTIwbWFufGVufDB8MHwwfA%3D%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=900&q=60"
                alt="David Lee"
              />
              <div className="message-text-wrapper">
                <p className="message-text">David Lee</p>
                <p className="message-subtext">Approved AI quote for inverter replacement.</p>
              </div>
            </div>

            <div className="message-line">
              <img
                src="https://images.unsplash.com/photo-1604004555489-723a93d6ce74?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&auto=format&fit=crop&w=934&q=80"
                alt="Jessica Wong"
              />
              <div className="message-text-wrapper">
                <p className="message-text">Jessica Wong</p>
                <p className="message-subtext">Uploaded video diagnostics of leaking drum.</p>
              </div>
            </div>

            <div className="message-line">
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2250&q=80"
                alt="Amira Hassan"
              />
              <div className="message-text-wrapper">
                <p className="message-text">Amira Hassan</p>
                <p className="message-subtext">Order #4401 marked complete via e-Wallet.</p>
              </div>
            </div>

            {/* Expandable Customer Messages */}
            <div className={`feed-expandable ${supportExpanded ? 'expanded' : ''}`}>
              <div className="message-line">
                <img
                  src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80"
                  alt="Kenzo Tan"
                />
                <div className="message-text-wrapper">
                  <p className="message-text">Kenzo Tan</p>
                  <p className="message-subtext">Requested rescheduling for Order #5031 (Mont Kiara) to 3 PM.</p>
                </div>
              </div>
              <div className="message-line">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
                  alt="Priya Sharma"
                />
                <div className="message-text-wrapper">
                  <p className="message-text">Priya Sharma</p>
                  <p className="message-subtext">Uploaded receipt & warranty card for Daikin VRV aircon.</p>
                </div>
              </div>
              <div className="message-line">
                <img
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80"
                  alt="Jason Lim"
                />
                <div className="message-text-wrapper">
                  <p className="message-text">Jason Lim</p>
                  <p className="message-subtext">Confirmed home availability for evening AC gas leak inspection.</p>
                </div>
              </div>
              <div className="message-line">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80"
                  alt="Sarah Rahman"
                />
                <div className="message-text-wrapper">
                  <p className="message-text">Sarah Rahman</p>
                  <p className="message-subtext">Approved parts quotation for Bosch Dishwasher float switch.</p>
                </div>
              </div>
            </div>

            {/* View More / Show Less Button */}
            <button
              type="button"
              className={`btn-more-feed ${supportExpanded ? 'active' : ''}`}
              onClick={() => setSupportExpanded((v) => !v)}
            >
              <span>{supportExpanded ? 'Show Less' : 'View More Inquiries (4)'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* Smart Order Alerts */}
          <div className="app-right-section">
            <div className="app-right-section-header">
              <h2>Smart Order Alerts</h2>
              <span className="notification-active">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span>
            </div>

            <div className="activity-line">
              <span className="activity-icon warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
              <div className="activity-text-wrapper">
                <p className="activity-text">Inventory low: <strong>R410A Refrigerant.</strong></p>
                <Link className="activity-link" to="/price-settings">Restock Now</Link>
              </div>
            </div>

            <div className="activity-line">
              <span className="activity-icon applicant">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
              <div className="activity-text-wrapper">
                <p className="activity-text">Smart dispatch: <strong>Satou matched</strong> to Job #5021.</p>
              </div>
            </div>

            <div className="activity-line">
              <span className="activity-icon draft">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <div className="activity-text-wrapper">
                <p className="activity-text">Real-time tracking active for <strong>Job #5019</strong>.</p>
              </div>
            </div>

            {/* Expandable System Alerts */}
            <div className={`feed-expandable ${alertsExpanded ? 'expanded' : ''}`}>
              <div className="activity-line">
                <span className="activity-icon warning" style={{ background: 'rgba(231, 76, 60, 0.2)', color: '#ff6b6b' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
                <div className="activity-text-wrapper">
                  <p className="activity-text">Emergency: <strong>Water valve flooding</strong> detected at Subang Jaya (#ORD-5030).</p>
                </div>
              </div>

              <div className="activity-line">
                <span className="activity-icon warning">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
                <div className="activity-text-wrapper">
                  <p className="activity-text">SLA Warning: <strong>30-min response threshold</strong> approaching for Mont Kiara (#ORD-5031).</p>
                </div>
              </div>

              <div className="activity-line">
                <span className="activity-icon applicant">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
                <div className="activity-text-wrapper">
                  <p className="activity-text">Inventory Arrived: <strong>4x Samsung Inverter PCB</strong> boards at Central Hub.</p>
                </div>
              </div>

              <div className="activity-line">
                <span className="activity-icon draft">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <div className="activity-text-wrapper">
                  <p className="activity-text">Customer read <strong>WhatsApp ETA notification</strong> for Job #5028.</p>
                </div>
              </div>
            </div>

            {/* View More / Show Less Button */}
            <button
              type="button"
              className={`btn-more-feed ${alertsExpanded ? 'active' : ''}`}
              onClick={() => setAlertsExpanded((v) => !v)}
            >
              <span>{alertsExpanded ? 'Show Less' : 'View More System Alerts (4)'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>
        )}
      </aside>

      {/* Encrypted Technician Radio & Chat Modal */}
      <TechnicianChatModal />

      {/* Voice & Video WebRTC E2EE Call Overlay */}
      <TechCallOverlay />

      {/* Field Service Reports Modal (FSR, Diagnostic, Maintenance, Quote, Invoice, Feedback) */}
      <FieldServiceReportsModal
        isOpen={Boolean(orderReportModal)}
        orderData={orderReportModal}
        onClose={() => setOrderReportModal(null)}
      />
    </div>
  );
}

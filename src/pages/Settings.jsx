import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore.js';

const AVATAR_FRAMES = [
  { id: 'none', name: 'No Frame', desc: 'Clean minimal border' },
  { id: 'neon-orange', name: 'Cyber Neon Orange', desc: 'Signature CyberHub plasma ring' },
  { id: 'emerald-pulse', name: 'Emerald Matrix', desc: 'Animated green telemetry glow' },
  { id: 'gold-exec', name: 'Royal Gold Executive', desc: 'Metallic prestige dual-ring' },
  { id: 'cyber-cyan', name: 'Plasma Cyan Glitch', desc: 'High-voltage electric blue aura' },
  { id: 'crimson-glow', name: 'Crimson Overlord', desc: 'Deep red tactical command ring' },
];

const PRESET_AVATARS = [
  {
    label: 'Command Center User',
    url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkfWqPyP7NACihrv0Co-eBcCSwXtcfzBBbrijdzccchojCUZ7t_M_oJrA&s=10',
  },
  { label: 'CyberHub Logo', url: '/image/MainLogo.png' },
  { label: 'Logo 1', url: '/image/Logo1.png' },
  { label: 'Logo 2', url: '/image/Logo2.png' },
  { label: 'Logo 3', url: '/image/Logo3.png' },
];

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Command Center',
    renderIcon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="feather feather-columns"
      >
        <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18" />
      </svg>
    ),
  },
  {
    path: '/smart-orders',
    label: 'Smart Orders',
    renderIcon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="feather feather-tool"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    path: '/technicians',
    label: 'Technicians',
    renderIcon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="feather feather-users"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: '/ai-diagnostics',
    label: 'AI Diagnostics',
    renderIcon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="feather feather-cpu"
      >
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
    renderIcon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="feather feather-pie-chart"
      >
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
      </svg>
    ),
  },
  {
    path: '/price-settings',
    label: 'Price Settings',
    renderIcon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="feather feather-settings"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    path: '/settings',
    label: 'User Settings',
    renderIcon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="feather feather-user"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    ),
  },
];

const DEFAULT_CMD_USER = {
  username: 'Tan Kia Yu',
  role: 'Lead Dispatch Supervisor',
  email: 'tan.kiayu@cyberhub.my',
  avatarUrl:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkfWqPyP7NACihrv0Co-eBcCSwXtcfzBBbrijdzccchojCUZ7t_M_oJrA&s=10',
  avatarFrame: 'neon-orange',
};

const Settings = () => {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile } = useDashboardStore();

  const [username, setUsername] = useState(userProfile?.username || DEFAULT_CMD_USER.username);
  const [email, setEmail] = useState(userProfile?.email || DEFAULT_CMD_USER.email);
  const [role, setRole] = useState(userProfile?.role || DEFAULT_CMD_USER.role);
  const [selectedFrame, setSelectedFrame] = useState(userProfile?.avatarFrame || 'neon-orange');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [autoDispatch, setAutoDispatch] = useState(true);
  const [slaAlerts, setSlaAlerts] = useState(true);
  const [whatsAppSync, setWhatsAppSync] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);

  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Sync state if store updates from Command Center or elsewhere
  useEffect(() => {
    if (userProfile?.username) setUsername(userProfile.username);
    if (userProfile?.email) setEmail(userProfile.email);
    if (userProfile?.role) setRole(userProfile.role);
    if (userProfile?.avatarFrame) setSelectedFrame(userProfile.avatarFrame);
  }, [userProfile]);

  const showToast = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateUserProfile({ avatarUrl: reader.result });
        showToast('Profile picture uploaded & synchronized with Command Center!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('Username cannot be empty.', 'error');
      return;
    }
    updateUserProfile({
      username: username.trim(),
      email: email.trim(),
      role: role.trim(),
      avatarFrame: selectedFrame,
    });
    showToast('Administrator profile & avatar synchronized with Command Center!');
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    const storedPass = userProfile.password || 'admin123';
    if (currentPassword !== storedPass) {
      showToast('Current password is incorrect (Default: admin123).', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match.', 'error');
      return;
    }
    updateUserProfile({ password: newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password updated successfully!');
  };

  const handleResetCache = () => {
    if (window.confirm('Reset all cached diagnostic telemetry and preferences?')) {
      updateUserProfile(DEFAULT_CMD_USER);
      showToast('Restored default Command Center supervisor user.');
    }
  };

  const activeAvatar = userProfile?.avatarUrl || DEFAULT_CMD_USER.avatarUrl;

  return (
    <div className="app-container">
      {/* Left Sidebar Navigation */}
      <aside className="app-left">
        <div
          className="app-logo"
          style={{ cursor: 'pointer', padding: '0 24px', marginBottom: '28px' }}
          onClick={() => navigate('/')}
        >
          <img
            src="/image/MainLogo.png"
            height="56px"
            alt="CyberHub Logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === '/settings';
            return (
              <li key={item.path} className={`nav-list-item ${isActive ? 'active' : ''}`}>
                <NavLink
                  to={item.path}
                  className="nav-list-link"
                  style={{ textDecoration: 'none' }}
                >
                  {item.renderIcon()}
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="app-main">
        <div
          className="main-header-line"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>User & Profile Settings</h1>
            <p style={{ margin: '4px 0 0 0', color: '#b8c4db', fontSize: '13px' }}>
              Command Center supervisor profile, credentials, holographic frames, and dispatch alert preferences.
            </p>
          </div>
          {statusMsg.text && (
            <div className={`settings-toast ${statusMsg.type}`} style={{ animation: 'fadeIn 0.2s ease-out' }}>
              {statusMsg.type === 'error' ? '⚠️ ' : '✓ '}
              {statusMsg.text}
            </div>
          )}
        </div>

        {/* Current Active Profile Banner (Synchronized with Command Center) */}
        <div
          className="ch-card"
          style={{
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            background: 'linear-gradient(135deg, #051340, #01081f)',
            border: '1px solid rgba(255, 115, 0, 0.35)',
            borderRadius: '14px',
            padding: '20px 24px',
          }}
        >
          <div className={`ch-avatar-wrapper frame-${selectedFrame} large`}>
            <img
              src={activeAvatar}
              alt="User Avatar"
              className="ch-avatar-img"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_CMD_USER.avatarUrl;
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <span className="status-pill completed" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
              COMMAND CENTER SUPERVISOR
            </span>
            <h2 style={{ margin: '8px 0 4px 0', fontSize: '22px' }}>{username}</h2>
            <p style={{ margin: 0, color: '#b8c4db', fontSize: '13px' }}>
              {role} • {email} • Active Frame:{' '}
              <strong style={{ color: '#ff7300' }}>
                {AVATAR_FRAMES.find((f) => f.id === selectedFrame)?.name || 'Custom'}
              </strong>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="btn-primary" style={{ textAlign: 'center', cursor: 'pointer', padding: '9px 16px' }}>
              📷 Upload Profile Picture
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {PRESET_AVATARS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="btn-small outline"
                  onClick={() => {
                    updateUserProfile({ avatarUrl: preset.url });
                    showToast(`Switched avatar to ${preset.label} (synced to Command Center)`);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Two Column Grid: Profile Settings & Password Change */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Card 1: Profile & Frame Selection */}
          <form
            className="ch-card stack-list"
            onSubmit={handleSaveProfile}
            style={{ background: '#01081f', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255, 115, 0, 0.2)' }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#ff7300' }}>Command Center Supervisor Details</h3>

            <div>
              <label className="kpi-label" style={{ color: '#b8c4db', fontSize: '12px' }}>Full Name (Command Center User)</label>
              <input
                type="text"
                className="ch-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ marginTop: '6px' }}
              />
            </div>

            <div>
              <label className="kpi-label" style={{ color: '#b8c4db', fontSize: '12px' }}>Email Address</label>
              <input
                type="email"
                className="ch-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ marginTop: '6px' }}
              />
            </div>

            <div>
              <label className="kpi-label" style={{ color: '#b8c4db', fontSize: '12px' }}>Role / Designation</label>
              <input
                type="text"
                className="ch-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ marginTop: '6px' }}
              />
            </div>

            <div>
              <label className="kpi-label" style={{ color: '#b8c4db', fontSize: '12px', marginBottom: '10px', display: 'block' }}>
                Select Holographic Avatar Frame
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                {AVATAR_FRAMES.map((frame) => (
                  <div
                    key={frame.id}
                    onClick={() => {
                      setSelectedFrame(frame.id);
                      updateUserProfile({ avatarFrame: frame.id });
                      showToast(`Avatar frame updated to ${frame.name} (synced across Command Center)!`);
                    }}
                    className={`frame-option-card ${selectedFrame === frame.id ? 'selected' : ''}`}
                    style={{
                      padding: '8px 10px',
                      background: selectedFrame === frame.id ? 'rgba(255, 115, 0, 0.15)' : '#051340',
                      border: selectedFrame === frame.id ? '1px solid #ff7300' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div className={`ch-avatar-wrapper frame-${frame.id} small`}>
                      <img
                        src={activeAvatar}
                        alt={frame.name}
                        className="ch-avatar-img"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_CMD_USER.avatarUrl;
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '12px' }}>{frame.name}</div>
                      <div style={{ fontSize: '10.5px', color: '#9ca3af' }}>{frame.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
              Save & Sync with Command Center
            </button>
          </form>

          {/* Card 2: Security & Password Update */}
          <form
            className="ch-card stack-list"
            onSubmit={handleSavePassword}
            style={{ background: '#01081f', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255, 115, 0, 0.2)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#ff7300' }}>Authentication & Security</h3>
              <button
                type="button"
                className="btn-small outline"
                onClick={() => setShowPasswords((p) => !p)}
              >
                {showPasswords ? '🙈 Hide' : '👁️ Show'}
              </button>
            </div>

            <div>
              <label className="kpi-label" style={{ color: '#b8c4db', fontSize: '12px' }}>
                Current Password <span style={{ color: '#ff9f43' }}>(Default: admin123)</span>
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                className="ch-input"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ marginTop: '6px' }}
              />
            </div>

            <div>
              <label className="kpi-label" style={{ color: '#b8c4db', fontSize: '12px' }}>New Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                className="ch-input"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ marginTop: '6px' }}
              />
            </div>

            <div>
              <label className="kpi-label" style={{ color: '#b8c4db', fontSize: '12px' }}>Confirm New Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                className="ch-input"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ marginTop: '6px' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
              Update Password
            </button>

            {/* Notification and Preferences Section */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#b8c4db' }}>Dispatch Preferences</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={autoDispatch}
                    onChange={(e) => setAutoDispatch(e.target.checked)}
                    style={{ accentColor: '#ff7300' }}
                  />
                  <span>AI Smart Dispatch Auto-Assignment</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={slaAlerts}
                    onChange={(e) => setSlaAlerts(e.target.checked)}
                    style={{ accentColor: '#ff7300' }}
                  />
                  <span>Critical SLA Response Threshold Warnings (30 min)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={whatsAppSync}
                    onChange={(e) => setWhatsAppSync(e.target.checked)}
                    style={{ accentColor: '#ff7300' }}
                  />
                  <span>Customer WhatsApp ETA & Invoice Notifications</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={soundEffects}
                    onChange={(e) => setSoundEffects(e.target.checked)}
                    style={{ accentColor: '#ff7300' }}
                  />
                  <span>Terminal Audio Chimes & Alert Tones</span>
                </label>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-small outline"
                  onClick={handleResetCache}
                  style={{ color: '#ff6b81', borderColor: 'rgba(255, 71, 87, 0.4)' }}
                >
                  Reset to Command Center Defaults
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Right Activity & Dispatch Feed (Matches Command Center exactly) */}
      <aside className="app-right">
        <div className="profile-box">
          <div className={`profile-photo-wrapper frame-${selectedFrame}`}>
            <img
              src={activeAvatar}
              alt="profile"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_CMD_USER.avatarUrl;
              }}
            />
          </div>
          <p className="profile-text">{username}</p>
          <p className="profile-subtext">{role}</p>
          <button
            className="btn-logout"
            onClick={() => showToast('Session locked. Re-authenticate to access dispatch.')}
            title="Log out of CyberHub"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-log-out"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log Out
          </button>
        </div>

        <div className="app-right-content">
          <div className="app-right-section">
            <div className="app-right-section-header">
              <h2>Customer Support Feed</h2>
              <span className="notification-active">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-message-square"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
            </div>
            <div className="message-line">
              <img src="https://images.unsplash.com/photo-1562159278-1253a58da141?auto=format&fit=crop&w=300&q=80" alt="profile" />
              <div className="message-text-wrapper">
                <p className="message-text">David Lee</p>
                <p className="message-subtext">Approved AI quote for inverter replacement.</p>
              </div>
            </div>
            <div className="message-line">
              <img src="https://images.unsplash.com/photo-1604004555489-723a93d6ce74?auto=format&fit=crop&w=300&q=80" alt="profile" />
              <div className="message-text-wrapper">
                <p className="message-text">Jessica Wong</p>
                <p className="message-subtext">Uploaded video diagnostics of leaking drum.</p>
              </div>
            </div>
          </div>

          <div className="app-right-section">
            <div className="app-right-section-header">
              <h2>System Security Logs</h2>
              <span className="notification-active">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-bell"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span>
            </div>
            <div className="activity-line">
              <span className="activity-icon applicant">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-check-circle"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
              <div className="activity-text-wrapper">
                <p className="activity-text">Active session authenticated for <strong>Tan Kia Yu</strong>.</p>
              </div>
            </div>
            <div className="activity-line">
              <span className="activity-icon draft">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-map-pin"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <div className="activity-text-wrapper">
                <p className="activity-text">Real-time GPS dispatch connected.</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Settings;

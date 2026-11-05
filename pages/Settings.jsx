import { useState } from 'react';
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
  { label: 'Main Logo', url: '/image/MainLogo.png' },
  { label: 'Logo 1', url: '/image/Logo1.png' },
  { label: 'Logo 2', url: '/image/Logo2.png' },
  { label: 'Logo 3', url: '/image/Logo3.png' },
];

const Settings = () => {
  const { userProfile, updateUserProfile } = useDashboardStore();

  const [username, setUsername] = useState(userProfile.username);
  const [email, setEmail] = useState(userProfile.email);
  const [selectedFrame, setSelectedFrame] = useState(userProfile.avatarFrame);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const showToast = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 3500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateUserProfile({ avatarUrl: reader.result });
        showToast('Profile picture updated!');
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
      avatarFrame: selectedFrame,
    });
    showToast('User profile and avatar frame saved!');
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (currentPassword !== userProfile.password) {
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

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>User Settings</h1>
          <p className="subtitle">
            Customize your profile picture, avatar frame, username, and password.
          </p>
        </div>
        {statusMsg.text && (
          <div className={`settings-toast ${statusMsg.type}`}>
            {statusMsg.type === 'error' ? '⚠️ ' : '✓ '}
            {statusMsg.text}
          </div>
        )}
      </div>

      {/* Live Profile Preview Card */}
      <div className="ch-card" style={{ marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <div className={`ch-avatar-wrapper frame-${selectedFrame} large`}>
          <img
            src={userProfile.avatarUrl}
            alt="User Avatar"
            className="ch-avatar-img"
            onError={(e) => {
              e.currentTarget.src = 'https://ui-avatars.com/api/?name=Cyber+Admin&background=ff7300&color=fff';
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <span className="status-pill completed">ADMINISTRATOR ACCOUNT</span>
          <h2 style={{ margin: '8px 0 4px 0' }}>{username || userProfile.username}</h2>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '13px' }}>
            {email} • Active Frame:{' '}
            <strong style={{ color: '#ff7300' }}>
              {AVATAR_FRAMES.find((f) => f.id === selectedFrame)?.name}
            </strong>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="btn-primary" style={{ textAlign: 'center', cursor: 'pointer' }}>
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
                  showToast(`Avatar set to ${preset.label}`);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="two-col-grid">
        {/* Username & Avatar Frame Form */}
        <form className="ch-card stack-list" onSubmit={handleSaveProfile}>
          <h3 style={{ margin: 0 }}>Username & Avatar Frame</h3>

          <div>
            <label className="kpi-label">Username</label>
            <input
              type="text"
              className="ch-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="kpi-label">Email Address</label>
            <input
              type="email"
              className="ch-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="kpi-label" style={{ marginBottom: '10px' }}>Choose Avatar Frame</label>
            <div className="frame-selector-grid">
              {AVATAR_FRAMES.map((frame) => (
                <div
                  key={frame.id}
                  onClick={() => setSelectedFrame(frame.id)}
                  className={`frame-option-card ${selectedFrame === frame.id ? 'selected' : ''}`}
                >
                  <div className={`ch-avatar-wrapper frame-${frame.id} small`}>
                    <img
                      src={userProfile.avatarUrl}
                      alt={frame.name}
                      className="ch-avatar-img"
                      onError={(e) => {
                        e.currentTarget.src = 'https://ui-avatars.com/api/?name=CA&background=051340&color=fff';
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '12.5px' }}>{frame.name}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{frame.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary">
            Save Username & Frame
          </button>
        </form>

        {/* Password Change Form */}
        <form className="ch-card stack-list" onSubmit={handleSavePassword}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Change Password</h3>
            <button
              type="button"
              className="btn-small outline"
              onClick={() => setShowPasswords((p) => !p)}
            >
              {showPasswords ? '🙈 Hide' : '👁️ Show'}
            </button>
          </div>

          <div>
            <label className="kpi-label">Current Password (Default: admin123)</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className="ch-input"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="kpi-label">New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className="ch-input"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="kpi-label">Confirm New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className="ch-input"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
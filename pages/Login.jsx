import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, signIn, verifyTotp, mfaRequired, loading, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated and staff, navigate to destination or dashboard
  useEffect(() => {
    if (session && profile?.is_staff) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [session, profile, navigate, location]);

  const searchParams = new URLSearchParams(location.search);
  const reason = searchParams.get('reason');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (mfaRequired) {
        if (!totpCode.trim()) {
          setFormError('Please enter your 6-digit TOTP authentication code.');
          setIsSubmitting(false);
          return;
        }
        await verifyTotp(totpCode);
      } else {
        if (!email.trim() || !password) {
          setFormError('Please enter both your email address and password.');
          setIsSubmitting(false);
          return;
        }
        await signIn(email, password);
      }
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(ellipse at 50% 20%, #0c1a40 0%, #01081f 75%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        color: '#e5e7eb',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(8, 20, 52, 0.75)',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 24px rgba(0, 229, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          padding: '36px 32px',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img
            src="/image/MainLogo.png"
            alt="CyberHub"
            style={{ height: '40px', width: 'auto', marginBottom: '12px' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
            Staff Operations Portal
          </div>
        </div>

        {/* Inactivity Notice */}
        {reason === 'idle_timeout' && (
          <div
            style={{
              background: 'rgba(255, 115, 0, 0.12)',
              border: '1px solid rgba(255, 115, 0, 0.35)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px',
              color: '#ffaa40',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⏱️</span>
            <span>You were signed out after 15 minutes of inactivity for security.</span>
          </div>
        )}

        {/* Error Alert */}
        {(formError || error) && (
          <div
            role="alert"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px',
              color: '#f87171',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>{formError || error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {!mfaRequired ? (
            <>
              <div style={{ marginBottom: '18px' }}>
                <label
                  htmlFor="staff-email"
                  style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}
                >
                  Staff Email Address
                </label>
                <input
                  id="staff-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@cyberhub.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(1, 8, 31, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#00e5ff')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)')}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  htmlFor="staff-password"
                  style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}
                >
                  Password
                </label>
                <input
                  id="staff-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(1, 8, 31, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#00e5ff')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)')}
                />
              </div>
            </>
          ) : (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#00e5ff' }}>
                  Two-Factor Authentication
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Enter the 6-digit TOTP code generated by your authenticator app
                </div>
              </div>
              <input
                id="totp-code"
                type="text"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'rgba(1, 8, 31, 0.6)',
                  border: '1px solid rgba(0, 229, 255, 0.4)',
                  borderRadius: '8px',
                  color: '#00e5ff',
                  fontSize: '22px',
                  fontWeight: 800,
                  letterSpacing: '6px',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #ff7300 0%, #e65c00 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isSubmitting || loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 20px rgba(255, 115, 0, 0.35)',
              opacity: isSubmitting || loading ? 0.7 : 1,
              transition: 'transform 0.1s, opacity 0.2s',
            }}
          >
            {isSubmitting || loading
              ? 'Authenticating...'
              : mfaRequired
              ? 'Verify & Sign In'
              : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Security Footer Notice */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '18px',
            borderTop: '1px solid rgba(148, 163, 184, 0.15)',
            textAlign: 'center',
            fontSize: '11px',
            color: '#64748b',
            lineHeight: 1.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Restricted system. Public registrations are disabled.</span>
          </div>
          <div>Contact system administration to obtain staff credentials.</div>
        </div>
      </div>
    </div>
  );
}

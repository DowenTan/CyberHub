import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useIdleTimeout } from '../hooks/useIdleTimeout.js';
import IdleTimeoutModal from './IdleTimeoutModal.jsx';
import LoadingScreen from './LoadingScreen.jsx';

export default function ProtectedRoute({ children, allowedRoles = null }) {
  const location = useLocation();
  const { session, profile, loading, signOut } = useAuthStore();

  const { isWarningOpen, secondsRemaining, staySignedIn, signOutNow } = useIdleTimeout();

  if (loading) {
    return <LoadingScreen welcomeHeading="Welcome to CyberHub Operations Control" />;
  }

  // Not logged in -> redirect to login
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but not staff -> access denied
  if (profile && !profile.is_staff) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#01081f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e5e7eb',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <h1 style={{ color: '#ef4444', fontSize: '24px', margin: '0 0 12px 0' }}>Access Denied</h1>
        <p style={{ maxWidth: '420px', color: '#9ca3af', fontSize: '14px', lineHeight: 1.5, margin: '0 0 24px 0' }}>
          Your account does not possess staff privileges. The CyberHub operations dashboard is restricted to authorized personnel.
        </p>
        <button
          onClick={() => signOut('access_denied')}
          style={{
            padding: '10px 20px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#f87171',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  // Specific role check if requested
  if (allowedRoles && profile) {
    const hasRole =
      profile.is_super_admin ||
      profile.roles?.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#01081f',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e5e7eb',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ffaa40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 style={{ color: '#ffaa40', fontSize: '22px', margin: '0 0 12px 0' }}>Role Restricted</h1>
          <p style={{ maxWidth: '420px', color: '#9ca3af', fontSize: '14px', lineHeight: 1.5, margin: '0 0 24px 0' }}>
            This section requires one of the following roles: <strong>{allowedRoles.join(', ')}</strong>.
          </p>
          <a
            href="/"
            style={{
              padding: '10px 20px',
              background: 'rgba(0, 229, 255, 0.2)',
              border: '1px solid rgba(0, 229, 255, 0.5)',
              color: '#00e5ff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Return to Dashboard
          </a>
        </div>
      );
    }
  }

  return (
    <>
      <IdleTimeoutModal
        isOpen={isWarningOpen}
        secondsRemaining={secondsRemaining}
        onStaySignedIn={staySignedIn}
        onSignOut={signOutNow}
      />
      {children || <Outlet />}
    </>
  );
}

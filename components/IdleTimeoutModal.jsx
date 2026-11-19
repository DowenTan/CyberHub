import React from 'react';

export default function IdleTimeoutModal({ isOpen, secondsRemaining, onStaySignedIn, onSignOut }) {
  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-timeout-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(1, 8, 31, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #07153b 0%, #030b20 100%)',
          border: '1px solid rgba(255, 115, 0, 0.4)',
          boxShadow: '0 0 35px rgba(255, 115, 0, 0.25)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '440px',
          padding: '28px',
          color: '#e5e7eb',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '38px', marginBottom: '12px' }}>⏱️</div>
        <h2
          id="idle-timeout-title"
          style={{
            margin: '0 0 10px 0',
            fontSize: '20px',
            fontWeight: 700,
            color: '#ff7300',
            letterSpacing: '0.5px',
          }}
        >
          Session Inactivity Warning
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#9ca3af', lineHeight: 1.5 }}>
          Your CyberHub staff session has been idle. For compliance and data security, your session will automatically terminate in:
        </p>

        <div
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            background: 'rgba(255, 115, 0, 0.1)',
            border: '1px solid rgba(255, 115, 0, 0.3)',
            borderRadius: '8px',
            fontSize: '28px',
            fontWeight: 800,
            fontFamily: 'monospace',
            color: '#ffaa40',
            marginBottom: '24px',
          }}
        >
          {timeFormatted}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onSignOut}
            style={{
              padding: '10px 18px',
              background: 'rgba(255, 255, 255, 0.05)',
              
              borderRadius: '6px',
              color: '#d1d5db',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Log Out Now
          </button>
          <button
            type="button"
            onClick={onStaySignedIn}
            style={{
              padding: '10px 22px',
              background: 'linear-gradient(135deg, #ff7300 0%, #e65c00 100%)',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(255, 115, 0, 0.4)',
              transition: 'transform 0.1s',
            }}
          >
            Stay Signed In
          </button>
        </div>
      </div>
    </div>
  );
}

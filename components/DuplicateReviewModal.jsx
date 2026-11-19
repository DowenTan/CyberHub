import React from 'react';

/**
 * Duplicate & Repeat-Fault Review Modal (D8).
 * Side-by-side comparison with safe cancel-and-link actions.
 * Zero emojis - pure SVG icons only.
 */
export default function DuplicateReviewModal({
  isOpen,
  onClose,
  finding,
  onResolve,
}) {
  if (!isOpen || !finding) return null;

  const { orderA, orderB, kind, confidencePct, signals, explanation } = finding;
  const isRepeat = kind === 'repeat_fault';

  return (
    <div
      className="ch-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="ch-modal-card"
        style={{
          width: '100%',
          maxWidth: '780px',
          background: '#040d21',
          border: '1px solid rgba(255, 115, 0, 0.35)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 115, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isRepeat ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${isRepeat ? 'rgba(234, 179, 8, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isRepeat ? '#eab308' : '#ef4444',
              }}
            >
              {isRepeat ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 600 }}>
                {isRepeat ? 'Repeat-Fault Review' : 'Potential Duplicate Order'}
              </h3>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#9ca3af' }}>
                Comparing <strong style={{ color: '#fff' }}>#{orderA?.id}</strong> and <strong style={{ color: '#fff' }}>#{orderB?.id}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 115, 0, 0.15)',
                color: '#ff7300',
                border: '1px solid rgba(255, 115, 0, 0.3)',
              }}
            >
              {confidencePct}% Match
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Matched Signals */}
        <div style={{ padding: '12px 20px', background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>
            Deterministic Match Signals
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {signals?.map((sig, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '6px',
                  color: '#38bdf8',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {sig}
              </span>
            ))}
          </div>
        </div>

        {/* Side-by-Side Comparison */}
        <div
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          {/* Order A Card */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>#{orderA?.id} (Flagged)</span>
              <span className={`status-pill ${(orderA?.status || 'PENDING').toLowerCase()}`}>
                {orderA?.status || 'PENDING'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#9ca3af' }}>Customer: </span>
                <strong style={{ color: '#fff' }}>{orderA?.customer}</strong>
              </div>
              <div>
                <span style={{ color: '#9ca3af' }}>Location: </span>
                <span style={{ color: '#cbd5e1' }}>{orderA?.location}</span>
              </div>
              <div>
                <span style={{ color: '#9ca3af' }}>Appliance: </span>
                <strong style={{ color: '#ff7300' }}>{orderA?.appliance}</strong>
              </div>
              <div>
                <span style={{ color: '#9ca3af' }}>Issue: </span>
                <div style={{ color: '#cbd5e1', marginTop: '2px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>
                  {orderA?.issue}
                </div>
              </div>
            </div>
          </div>

          {/* Order B Card */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                #{orderB?.id} ({isRepeat ? 'Original Job' : 'Existing Order'})
              </span>
              <span className={`status-pill ${(orderB?.status || 'PENDING').toLowerCase()}`}>
                {orderB?.status || 'PENDING'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#9ca3af' }}>Customer: </span>
                <strong style={{ color: '#fff' }}>{orderB?.customer}</strong>
              </div>
              <div>
                <span style={{ color: '#9ca3af' }}>Location: </span>
                <span style={{ color: '#cbd5e1' }}>{orderB?.location}</span>
              </div>
              <div>
                <span style={{ color: '#9ca3af' }}>Appliance: </span>
                <strong style={{ color: '#ff7300' }}>{orderB?.appliance}</strong>
              </div>
              <div>
                <span style={{ color: '#9ca3af' }}>Issue: </span>
                <div style={{ color: '#cbd5e1', marginTop: '2px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>
                  {orderB?.issue}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <button
            type="button"
            className="ch-btn ch-btn-ghost"
            style={{ fontSize: '12px', padding: '6px 14px' }}
            onClick={() => onResolve(finding, 'dismiss')}
          >
            Not a Duplicate
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {isRepeat ? (
              <button
                type="button"
                className="ch-btn ch-btn-warning"
                style={{
                  fontSize: '12px',
                  padding: '7px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#eab308',
                  color: '#000',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onClick={() => onResolve(finding, 'flag_repeat_fault')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Flag Repeat Warranty Callback
              </button>
            ) : (
              <button
                type="button"
                className="ch-btn ch-btn-danger"
                style={{
                  fontSize: '12px',
                  padding: '7px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onClick={() => onResolve(finding, 'link_and_cancel')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Cancel #{orderA?.id} & Link to #{orderB?.id}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

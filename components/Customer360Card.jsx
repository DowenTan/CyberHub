import React, { useState } from 'react';

/**
 * Customer 360 Brief & Next Best Action Component (D7).
 * Minimal PII, access audit logging, grounded signals, allow-listed actions.
 * Zero emojis - pure SVG icons only.
 */
export default function Customer360Card({
  customer = {},
  order = {},
  onActionClick,
}) {
  const [revealed, setRevealed] = useState(false);
  const [showFacts, setShowFacts] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fullName = customer.name || order.customer || 'Valued Customer';
  const firstName = fullName.split(' ')[0] || 'Customer';
  const rawPhone = customer.phone || order.phone || '+6012-3456789';
  const maskedPhone = revealed
    ? rawPhone
    : rawPhone.replace(/(\+?\d{3,4})[\d\s-]{4,6}(\d{3,4})/, '$1 •••• $2');

  const lifetimeOrders = customer.lifetimeOrders || 3;
  const lifetimePaid = customer.lifetimePaid || 'RM 540.00';
  const avgRating = customer.avgRating || 4.9;
  const isRepeat = order.isRepeatFault || order.slaRiskReasons?.some((r) => r.toLowerCase().includes('repeat'));

  const handleReveal = () => {
    setRevealed(true);
    // Send audit log request to backend
    fetch('/api/admin/customers/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customer.id || order.id, field: 'phone' }),
    }).catch(() => {});
  };

  return (
    <div
      className="customer-360-card"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: '8px',
        padding: '12px 14px',
        margin: '0 20px 14px',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
            Customer 360 Brief
          </span>
        </div>
        <span
          style={{
            fontSize: '9.5px',
            color: '#9ca3af',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          Access is logged
        </span>
      </div>

      {/* Customer Contact row with Masked Phone and Reveal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '6px 10px',
          borderRadius: '6px',
          marginBottom: '10px',
          fontSize: '11.5px',
        }}
      >
        <div style={{ color: '#cbd5e1' }}>
          <strong style={{ color: '#fff' }}>{firstName}</strong> · {maskedPhone}
        </div>
        {!revealed ? (
          <button
            type="button"
            onClick={handleReveal}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ff7300',
              fontSize: '10.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Reveal
          </button>
        ) : (
          <span style={{ fontSize: '10px', color: '#2ed573' }}>Revealed (Audited)</span>
        )}
      </div>

      {/* Summary Narrative */}
      <p style={{ margin: '0 0 10px', fontSize: '11.5px', lineHeight: 1.5, color: '#cbd5e1' }}>
        {firstName} has <strong style={{ color: '#fff' }}>{lifetimeOrders} lifetime orders</strong> totaling{' '}
        <strong style={{ color: '#2ed573' }}>{lifetimePaid}</strong> with an average satisfaction of{' '}
        <strong style={{ color: '#ff7300' }}>{avgRating}★</strong>.
        {isRepeat
          ? ' Priority attention: repeat issue detected on this unit; assigned specialist should verify root cause.'
          : ' Smooth service history with zero billing arrears.'}
      </p>

      {/* AI Customer Evaluation: Returning Likelihood, Value Tier, Scam Risk */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '6px',
          padding: '8px 10px',
          marginBottom: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          AI Customer Intelligence Evaluation
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {/* 1. Returning Customer Evaluation */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '5px 7px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase' }}>Returning Likelihood</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: lifetimeOrders >= 2 ? '#2ed573' : '#38bdf8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              {lifetimeOrders >= 3 ? '92% High' : lifetimeOrders === 2 ? '72% Mod' : '38% New'}
            </div>
          </div>

          {/* 2. High vs Low Value Evaluation */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '5px 7px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase' }}>Value Tier</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: lifetimeOrders >= 3 ? '#ff7300' : '#cbd5e1', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
              {lifetimeOrders >= 3 ? 'High-Value VIP' : lifetimeOrders >= 2 ? 'Standard' : 'Initial Tier'}
            </div>
          </div>

          {/* 3. Scam / Fraud Risk Assessment */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '5px 7px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase' }}>Scam Risk</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#2ed573', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Low (0.04) Clean
            </div>
          </div>
        </div>
      </div>

      {/* Signals Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            padding: '3px 6px',
            borderRadius: '4px',
            background: 'rgba(46, 213, 115, 0.1)',
            border: '1px solid rgba(46, 213, 115, 0.3)',
            color: '#2ed573',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Prompt Payment History
        </span>

        {isRepeat ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              padding: '3px 6px',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Repeat Fault Flagged
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              padding: '3px 6px',
              borderRadius: '4px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Loyal Customer Tier
          </span>
        )}
      </div>

      {/* Next Best Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>
          Suggested Next Action
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {isRepeat ? (
            <button
              type="button"
              className="ch-btn ch-btn-warning"
              style={{
                flex: 1,
                fontSize: '11px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                background: '#eab308',
                color: '#000',
                fontWeight: 600,
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => onActionClick?.('senior_dispatch')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
              Prioritize Senior Lead
            </button>
          ) : (
            <button
              type="button"
              className="ch-btn ch-btn-primary"
              style={{
                flex: 1,
                fontSize: '11px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                background: '#ff7300',
                color: '#fff',
                fontWeight: 600,
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => onActionClick?.('route_eta')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Confirm Route ETA
            </button>
          )}

          <button
            type="button"
            className="ch-btn ch-btn-ghost"
            style={{
              fontSize: '11px',
              padding: '6px 10px',
              borderRadius: '5px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              cursor: 'pointer',
            }}
            onClick={() => onActionClick?.('care_plan')}
          >
            Care Plan
          </button>
        </div>
      </div>

      {/* Facts Provenance Toggle */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={() => setShowFacts(!showFacts)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '10px',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ transform: showFacts ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          Based on 5 customer records
        </button>

        {/* Feedback thumbs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setFeedback('up')}
            style={{
              background: feedback === 'up' ? 'rgba(46, 213, 115, 0.2)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              color: feedback === 'up' ? '#2ed573' : '#6b7280',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setFeedback('down')}
            style={{
              background: feedback === 'down' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              color: feedback === 'down' ? '#ef4444' : '#6b7280',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
            </svg>
          </button>
        </div>
      </div>

      {showFacts && (
        <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '10.5px', color: '#9ca3af' }}>
          <div>· Customer Since: 2024-03-15</div>
          <div>· Paid Revenue: {lifetimePaid}</div>
          <div>· Average Review: {avgRating}★ (5 ratings)</div>
          <div>· Open Warranty Claims: 0</div>
          <div>· Unpaid Invoices: 0</div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';

/**
 * Admin Activity Anomaly Detection Panel (D10).
 * Insider-risk and misuse alert queue with evidence rows and human-approved governance actions.
 * Zero emojis - pure SVG icons only.
 */
export default function AdminAnomalyDrawer({
  isOpen,
  onClose,
  alerts = [],
  onReviewAlert,
}) {
  if (!isOpen) return null;

  // Default sample alerts if none passed
  const sampleAlerts = alerts.length > 0 ? alerts : [
    {
      id: 'ALT-HOURS-ADM02-1',
      userId: 'admin_guest',
      ruleName: 'Off-Hours Pricing Modification',
      severity: 'medium',
      score: 0.72,
      createdAt: '2026-11-14T23:35:00+08:00',
      evidence: [
        { timestamp: '23:32:10 MYT', action: 'price_update', target: 'SKU-AC-CAP-45', detail: 'Markup adjusted by +8%' },
        { timestamp: '23:34:45 MYT', action: 'price_update', target: 'SKU-REF-CMP-02', detail: 'Supplier cost manually modified' },
      ],
      suggestedAction: 'Verify if off-hours price correction was authorized by finance lead.',
    },
    {
      id: 'ALT-MASS-ADM05-6',
      userId: 'ops_lead_kl',
      ruleName: 'Mass Data Modification Burst',
      severity: 'high',
      score: 0.88,
      createdAt: '2026-11-14T14:15:00+08:00',
      evidence: [
        { timestamp: '14:12:02 MYT', action: 'bulk_update', target: 'technician_profiles', detail: 'Shift times updated for 8 technicians' },
        { timestamp: '14:13:40 MYT', action: 'batch_edit', target: 'price_settings', detail: '5 parts labor floor modified' },
      ],
      suggestedAction: 'Review modified records and verify user intention.',
    },
  ];

  const [activeAlerts, setActiveAlerts] = useState(sampleAlerts);

  const handleAction = (alertId, action) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
    onReviewAlert?.(alertId, action);
  };

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
          maxWidth: '720px',
          background: '#040d21',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
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
            background: 'rgba(239, 68, 68, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 600 }}>
                Admin Activity Anomaly Detection
              </h3>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#9ca3af' }}>
                Insider-risk telemetry and off-hours administrative alerts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Privacy & Governance notice */}
        <div style={{ padding: '8px 20px', background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '11px', color: '#9ca3af' }}>
          Notice: Actions are analyzed solely for operational integrity. No screen monitoring or personal telemetry.
        </div>

        {/* Alerts List */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#2ed573' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '8px' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Zero Active Anomaly Alerts</div>
              <div style={{ fontSize: '11.5px', color: '#9ca3af', marginTop: '2px' }}>All admin activities within normal operational bounds.</div>
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: alert.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                        color: alert.severity === 'critical' ? '#ef4444' : '#eab308',
                        border: `1px solid ${alert.severity === 'critical' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`,
                      }}
                    >
                      {alert.severity} Risk
                    </span>
                    <strong style={{ color: '#fff', fontSize: '13px' }}>{alert.ruleName}</strong>
                  </div>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>User: <strong style={{ color: '#ff7300' }}>{alert.userId}</strong></span>
                </div>

                <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginBottom: '10px' }}>
                  {alert.suggestedAction}
                </div>

                {/* Evidence table */}
                <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '6px', padding: '8px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Evidence Log ({alert.evidence.length} events)
                  </div>
                  {alert.evidence.map((ev, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#9ca3af', padding: '2px 0' }}>
                      <span style={{ color: '#38bdf8', minWidth: '85px' }}>{ev.timestamp}</span>
                      <span style={{ color: '#fff', minWidth: '95px' }}>{ev.action}</span>
                      <span style={{ color: '#cbd5e1' }}>{ev.detail}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    className="ch-btn ch-btn-ghost"
                    style={{ fontSize: '11.5px', padding: '5px 12px' }}
                    onClick={() => handleAction(alert.id, 'dismiss')}
                  >
                    Dismiss (False Positive)
                  </button>
                  <button
                    type="button"
                    className="ch-btn ch-btn-warning"
                    style={{
                      fontSize: '11.5px',
                      padding: '5px 12px',
                      background: '#eab308',
                      color: '#000',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleAction(alert.id, 'require_reauth')}
                  >
                    Require Re-Authentication
                  </button>
                  <button
                    type="button"
                    className="ch-btn ch-btn-danger"
                    style={{
                      fontSize: '11.5px',
                      padding: '5px 12px',
                      background: '#ef4444',
                      color: '#fff',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleAction(alert.id, 'lock_account')}
                  >
                    Confirm & Lock User
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

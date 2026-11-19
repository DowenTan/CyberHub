import { useState, useEffect } from 'react';
import { fetchMonthlyExecutiveReport, approveExecutiveReport } from '../lib/api.js';

export default function ExecutiveReportModal({ isOpen, onClose }) {
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchMonthlyExecutiveReport(selectedMonth);
        if (mounted) setReport(data);
      } catch (err) {
        console.error('Failed to fetch executive report:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [isOpen, selectedMonth]);

  const handleApprove = async () => {
    if (!report?.id || approving) return;
    setApproving(true);
    try {
      const res = await approveExecutiveReport(report.id, 'Super Admin');
      if (res && res.status === 'APPROVED') {
        setReport((prev) => ({
          ...prev,
          status: 'APPROVED',
          approved_by: res.approved_by,
          approved_at: res.approved_at,
        }));
      }
    } catch (err) {
      console.error('Failed to approve report:', err);
    } finally {
      setApproving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '900px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          background: '#030c2c',
          border: '1.5px solid rgba(255, 115, 0, 0.45)',
          borderRadius: '12px',
          boxShadow: '0 15px 45px rgba(0, 0, 0, 0.9)',
          overflowY: 'auto',
          padding: '28px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(255, 115, 0, 0.15)', color: '#ff7300', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: 700 }}>
                Monthly Operations Executive Report
              </h2>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Deterministic SQL facts · AI-assisted synthesis · Review & Export
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              className="ch-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ fontSize: '12px', padding: '4px 8px', height: '32px' }}
            >
              <option value="2026-11">November 2026</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
            </select>

            {report?.status === 'DRAFT' && (
              <button
                type="button"
                className="btn-small primary"
                onClick={handleApprove}
                disabled={approving}
                style={{
                  background: '#2ed573',
                  color: '#051340',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '32px',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {approving ? 'Approving...' : 'Approve Report'}
              </button>
            )}

            <button
              type="button"
              className="btn-small outline"
              onClick={handlePrint}
              style={{
                fontSize: '11.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                height: '32px',
                borderColor: 'rgba(255, 115, 0, 0.4)',
                color: '#fdba74',
              }}
              title="Print or export to PDF"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print / Export
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Report Content Body */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff7300', fontSize: '13px', margin: '40px 0' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin">
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            </svg>
            Synthesizing operations report and verifying metrics...
          </div>
        ) : report ? (
          <div style={{ position: 'relative' }}>
            {/* Watermark for DRAFT */}
            {report.status === 'DRAFT' && (
              <div
                style={{
                  position: 'absolute',
                  top: '40%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-30deg)',
                  fontSize: '72px',
                  fontWeight: 900,
                  color: 'rgba(239, 68, 68, 0.08)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  letterSpacing: '12px',
                }}
              >
                DRAFT
              </div>
            )}

            {/* Status Banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', background: report.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)', padding: '8px 14px', borderRadius: '6px', border: report.status === 'APPROVED' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: report.status === 'APPROVED' ? '#4ade80' : '#fbbf24' }}>
                  Status: {report.status}
                </span>
                {report.approved_by && (
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    · Approved by {report.approved_by} on {new Date(report.approved_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'monospace' }} title="SHA-256 Tamper Verification Hash">
                SHA: {report.sha256?.slice(0, 16)}...
              </div>
            </div>

            {/* Report Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {report.sections?.map((sec) => (
                <div
                  key={sec.id}
                  style={{
                    background: 'rgba(5, 19, 64, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '8px',
                    padding: '16px 20px',
                  }}
                >
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#ff7300', fontWeight: 700 }}>
                    {sec.title}
                  </h3>
                  <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: '#e2e8f0', lineHeight: '1.6' }}>
                    {sec.narrative}
                  </p>

                  {/* Cited Metrics Grid */}
                  {sec.metrics?.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                      {sec.metrics.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            background: 'rgba(15, 23, 42, 0.6)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{m.label}</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                            {m.unit === 'RM' ? `RM ${m.value.toLocaleString()}` : `${m.value} ${m.unit || ''}`}
                          </div>
                          {m.baseline && (
                            <div style={{ fontSize: '10px', color: '#2ed573', marginTop: '2px' }}>
                              {m.baseline}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {sec.recommendations?.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                        Recommended Next Actions:
                      </div>
                      {sec.recommendations.map((r, i) => (
                        <div key={i} style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.4' }}>
                          → {r}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Document Footer */}
            <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: '#64748b' }}>
              <span>CyberHub Telemetry Intelligence · Confidential Executive Report</span>
              <span>Generated {report.generated_at}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

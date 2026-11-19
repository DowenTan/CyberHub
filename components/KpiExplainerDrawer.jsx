import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { explainKpiMetric } from '../lib/api.js';

export default function KpiExplainerDrawer({ metric, isOpen, onClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!isOpen || !metric) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await explainKpiMetric(metric);
        if (mounted) setData(res);
      } catch (err) {
        console.error('Failed to load KPI explanation:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [isOpen, metric]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '450px',
          maxWidth: '90vw',
          height: '100%',
          background: '#030c2c',
          borderLeft: '1.5px solid rgba(255, 115, 0, 0.4)',
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.85)',
          overflowY: 'auto',
          padding: '24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#ff7300', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc', fontWeight: 700 }}>
              Why Did This Change?
            </h3>
          </div>
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
            title="Close panel"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff7300', fontSize: '13px', margin: '40px 0' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin">
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            </svg>
            Decomposing metric variance across dimensions...
          </div>
        ) : data ? (
          <>
            {/* Metric Title & Delta */}
            <div style={{ background: 'rgba(5, 19, 64, 0.7)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255, 115, 0, 0.25)' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Metric Analyzed</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                {data.metric}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: data.total_delta >= 0 ? '#4ade80' : '#f87171',
                    background: data.total_delta >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {data.total_delta >= 0 ? `+${data.total_delta_pct}%` : `${data.total_delta_pct}%`} ({data.unit} {Math.abs(data.total_delta).toLocaleString()})
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {data.period_a} → {data.period_b}
                </span>
              </div>
            </div>

            {/* Natural Summary */}
            <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.5', background: 'rgba(255, 115, 0, 0.05)', padding: '10px 12px', borderRadius: '6px', borderLeft: '3px solid #ff7300' }}>
              {data.summary}
            </div>

            {/* Waterfall Contribution Chart (Pure SVG) */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ff7300', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                Ranked Variance Drivers (Waterfall)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.drivers?.map((d, i) => (
                  <div key={d.id} style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#f1f5f9', fontWeight: 600 }}>
                      <span>#{i + 1} {d.label}</span>
                      <span style={{ color: d.contribution >= 0 ? '#4ade80' : '#f87171' }}>
                        {d.contribution >= 0 ? '+' : ''}{d.contribution.toLocaleString()} {data.unit} ({d.percentage}%)
                      </span>
                    </div>
                    {/* Bar visualization */}
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(5, d.percentage))}%`,
                          height: '100%',
                          background: d.contribution >= 0 ? 'linear-gradient(90deg, #ff7300, #2ed573)' : 'linear-gradient(90deg, #ff7300, #e74c3c)',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caveats & Statistical Notes */}
            {data.caveats?.length > 0 && (
              <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '6px', padding: '10px 12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Context Flags & Caveats
                </div>
                {data.caveats.map((c, i) => (
                  <div key={i} style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.4', marginTop: '2px' }}>
                    • {c}
                  </div>
                ))}
              </div>
            )}

            {/* Next Steps Links */}
            {data.next_steps?.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                  Suggested Next Actions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {data.next_steps.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(s.link);
                      }}
                      style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#7dd3fc',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{s.label}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback: Was this useful? */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Was this explanation useful?</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setFeedback('up')}
                  style={{
                    background: feedback === 'up' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: feedback === 'up' ? '#4ade80' : '#94a3b8',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setFeedback('down')}
                  style={{
                    background: feedback === 'down' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: feedback === 'down' ? '#f87171' : '#94a3b8',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                  </svg>
                  No
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

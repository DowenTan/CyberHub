import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOpsBriefing, regenerateOpsBriefing, submitBriefingFeedback } from '../lib/api.js';

export default function OpsBriefingCard({ orders = [], technicians = [], onActionTrigger = null }) {
  const navigate = useNavigate();
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showFacts, setShowFacts] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [feedbackFeedbackReason, setFeedbackReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await getOpsBriefing();
        if (mounted && data) {
          setBriefing(data);
        }
      } catch (err) {
        console.error('Failed to load daily ops briefing:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleRegenerate = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    try {
      const updated = await regenerateOpsBriefing({ orders, technicians });
      if (updated) {
        setBriefing(updated);
        setUserVote(null);
        setShowReasonInput(false);
      }
    } catch (err) {
      console.error('Failed to regenerate briefing:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleVote = async (vote) => {
    setUserVote(vote);
    if (vote === 'down') {
      setShowReasonInput(true);
    }
    if (briefing?.id) {
      await submitBriefingFeedback(briefing.id, vote);
    }
  };

  const handleSubmitReason = async () => {
    if (briefing?.id && feedbackFeedbackReason.trim()) {
      await submitBriefingFeedback(briefing.id, userVote || 'down', feedbackFeedbackReason.trim());
      setShowReasonInput(false);
    }
  };

  const handleExecuteAction = (action) => {
    if (!action) return;
    if (onActionTrigger) {
      onActionTrigger(action);
    }
    if (action.params?.path) {
      let dest = action.params.path;
      if (action.params?.filter) {
        dest += `?filter=${encodeURIComponent(action.params.filter)}`;
      }
      navigate(dest);
    }
  };

  if (loading) {
    return (
      <div
        className="ch-ops-briefing-card ch-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, rgba(5, 19, 64, 0.7) 0%, rgba(10, 25, 75, 0.5) 100%)',
          border: '1px solid rgba(255, 115, 0, 0.35)',
          borderRadius: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff7300', fontSize: '13px', fontWeight: 600 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          </svg>
          Loading Daily Operations Briefing...
        </div>
      </div>
    );
  }

  if (!briefing || !briefing.narrative) {
    return null;
  }

  const { narrative, facts = [], generated_at, is_stale } = briefing;

  return (
    <div
      className="ch-ops-briefing-card ch-card"
      style={{
        padding: '18px 22px',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, rgba(3, 12, 44, 0.95) 0%, rgba(8, 20, 60, 0.88) 100%)',
        border: '1.5px solid rgba(255, 115, 0, 0.4)',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        position: 'relative',
      }}
    >
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 115, 0, 0.15)',
              color: '#ff7300',
              border: '1px solid rgba(255, 115, 0, 0.35)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.2px' }}>
                Daily Operations Briefing
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                Generated 08:00 MYT · AI-assisted
              </span>
              {is_stale && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 600,
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  Stale &gt; 12h
                </span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Deterministic facts validated · {generated_at || 'Today'}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-small outline"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              padding: '4px 10px',
              color: '#fdba74',
              borderColor: 'rgba(255, 115, 0, 0.4)',
            }}
            title="Regenerate ops briefing"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isRegenerating ? 'spin' : ''}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isRegenerating ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Feedback thumbs */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => handleVote('up')}
              style={{
                background: userVote === 'up' ? 'rgba(34, 197, 94, 0.25)' : 'transparent',
                color: userVote === 'up' ? '#4ade80' : '#94a3b8',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              title="Helpful briefing"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleVote('down')}
              style={{
                background: userVote === 'down' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                color: userVote === 'down' ? '#f87171' : '#94a3b8',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              title="Not helpful / inaccurate"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Downvote Reason Input Modal / Popover */}
      {showReasonInput && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
          <input
            type="text"
            className="ch-input"
            placeholder="Tell us what was incorrect (optional)..."
            value={feedbackFeedbackReason}
            onChange={(e) => setFeedbackReason(e.target.value)}
            style={{ fontSize: '11.5px', height: '28px' }}
          />
          <button
            type="button"
            className="btn-small primary"
            onClick={handleSubmitReason}
            style={{ fontSize: '11px', padding: '3px 8px', height: '28px' }}
          >
            Submit
          </button>
          <button
            type="button"
            className="btn-small outline"
            onClick={() => setShowReasonInput(false)}
            style={{ fontSize: '11px', padding: '3px 8px', height: '28px' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Main Headline */}
      <div
        style={{
          fontSize: '13.5px',
          fontWeight: 600,
          color: '#e2e8f0',
          marginBottom: '14px',
          padding: '8px 12px',
          background: 'rgba(255, 115, 0, 0.07)',
          borderRadius: '6px',
          borderLeft: '3px solid #ff7300',
        }}
      >
        {narrative.headline}
      </div>

      {/* Action Priorities List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        {narrative.priorities.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '10px 14px',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#ff7300' }}>#{idx + 1}</span>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#f1f5f9' }}>{item.title}</span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: '#94a3b8', lineHeight: '1.4' }}>
                {item.why}
              </p>
            </div>

            {item.action && (
              <button
                type="button"
                className="btn-small"
                onClick={() => handleExecuteAction(item.action)}
                style={{
                  background: '#ff7300',
                  color: '#051340',
                  fontWeight: 600,
                  fontSize: '11px',
                  padding: '5px 12px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(255, 115, 0, 0.25)',
                }}
              >
                {item.action.label || 'Take Action'}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Watchlist & Good News Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', marginBottom: '12px' }}>
        {narrative.watchlist?.length > 0 && (
          <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '6px', padding: '8px 12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Watchlist
            </span>
            {narrative.watchlist.map((w, idx) => (
              <div key={idx} style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.35' }}>
                {w.text}
              </div>
            ))}
          </div>
        )}

        {narrative.good_news?.length > 0 && (
          <div style={{ background: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '6px', padding: '8px 12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Operational Highlights
            </span>
            {narrative.good_news.map((g, idx) => (
              <div key={idx} style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.35' }}>
                {g.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible Provenance: "Why am I seeing this?" */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px' }}>
        <button
          type="button"
          onClick={() => setShowFacts(!showFacts)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '11px',
            cursor: 'pointer',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: showFacts ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Why am I seeing this? ({facts.length} verified facts)
        </button>

        {showFacts && (
          <div
            style={{
              marginTop: '10px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '8px',
            }}
          >
            {facts.map((f) => (
              <div
                key={f.id}
                style={{
                  background: 'rgba(5, 19, 64, 0.5)',
                  padding: '8px 10px',
                  borderRadius: '5px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '11px',
                }}
              >
                <div style={{ color: '#94a3b8' }}>{f.label}</div>
                <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '12px', marginTop: '2px' }}>
                  {typeof f.value === 'number' && f.unit === 'RM'
                    ? `RM ${f.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `${f.value} ${f.unit || ''}`}
                </div>
                {f.baseline && <div style={{ color: '#64748b', fontSize: '10px', marginTop: '1px' }}>{f.baseline}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

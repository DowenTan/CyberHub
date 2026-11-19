import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useChatStore } from '../store/useChatStore.js';
import { useDashboardStore } from '../store/useDashboardStore.js';
import { apiFetch } from '../lib/api.js';
import './admin-copilot.css';

const API = '/api/admin/copilot';

const QUICK_COMMANDS = [
  'Check DB',
  'Show pending orders',
  'Available technicians',
  'Update PRT-045 markup to 55%',
  'Undo',
];

// **bold** only; everything else stays plain text
const Rich = ({ text }) =>
  String(text ?? '')
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
    );

const STATUS_TEXT = {
  applied: { cls: 'approved', text: '✓ Approved & Committed' },
  undone: { cls: 'undone', text: '↩ Reverted (original state restored)' },
  rejected: { cls: 'rejected', text: '✕ Discarded (no changes)' },
  stale: { cls: 'rejected', text: '⚠ Out of date (data changed), discarded' },
};

const AdminCopilot = () => {
  const location = useLocation();
  const { isOpen, toggleChat, messages, addMessage, clearHistory, deleteMessageTurn } = useChatStore();
  const fetchSupabaseData = useDashboardStore((state) => state.fetchSupabaseData);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSelfTesting, setIsSelfTesting] = useState(false);
  const [proposals, setProposals] = useState({}); // change id -> card from the server
  const [showHistory, setShowHistory] = useState(false);
  const [status, setStatus] = useState(null); // { model_online, model, sql_installed } | 'offline'
  const [historyPointer, setHistoryPointer] = useState(-1);
  const tempInputRef = useRef('');
  const messagesEndRef = useRef(null);

  const COPILOT_MIN_WIDTH = 360;
  const COPILOT_MIN_HEIGHT = 500;

  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberhub_copilot_pos');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [size, setSize] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberhub_copilot_size');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          width: Math.max(COPILOT_MIN_WIDTH, parsed.width || COPILOT_MIN_WIDTH),
          height: Math.max(COPILOT_MIN_HEIGHT, parsed.height || COPILOT_MIN_HEIGHT),
        };
      }
    } catch {
      /* ignore */
    }
    return { width: COPILOT_MIN_WIDTH, height: COPILOT_MIN_HEIGHT };
  });

  const widgetRef = useRef(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0, hasMoved: false });

  const handleResetPosition = (e) => {
    e?.stopPropagation();
    setPosition(null);
    try {
      localStorage.removeItem('cyberhub_copilot_pos');
    } catch {
      /* ignore */
    }
  };

  const handleResetSize = (e) => {
    e?.stopPropagation();
    setSize({ width: COPILOT_MIN_WIDTH, height: COPILOT_MIN_HEIGHT });
    try {
      localStorage.removeItem('cyberhub_copilot_size');
    } catch {
      /* ignore */
    }
  };

  const handleResizeMouseDown = (direction) => (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.width;
    const startH = size.height;
    const rect = widgetRef.current?.getBoundingClientRect();

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newW = startW;
      let newH = startH;

      if (direction === 'se') {
        newW = startW + dx;
        newH = startH + dy;
      } else if (direction === 'nw') {
        newW = startW - dx;
        newH = startH - dy;
        if (rect) {
          const nextX = Math.max(10, rect.left + dx);
          const nextY = Math.max(10, rect.top + dy);
          setPosition({ x: Math.round(nextX), y: Math.round(nextY) });
        }
      }

      const maxW = window.innerWidth - 40;
      const maxH = window.innerHeight - 40;
      const clampedW = Math.max(COPILOT_MIN_WIDTH, Math.min(maxW, Math.round(newW)));
      const clampedH = Math.max(COPILOT_MIN_HEIGHT, Math.min(maxH, Math.round(newH)));

      setSize({ width: clampedW, height: clampedH });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setSize((s) => {
        try {
          localStorage.setItem('cyberhub_copilot_size', JSON.stringify(s));
        } catch {
          /* ignore */
        }
        return s;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleHeaderMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('.ch-header-btns') || e.target.closest('.ch-chip')) return;
    e.preventDefault();
    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
      hasMoved: false,
    };

    const handleMouseMove = (moveEvent) => {
      if (!dragRef.current.isDragging) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragRef.current.hasMoved = true;
      }
      const widget = widgetRef.current;
      const width = widget ? widget.offsetWidth : 420;
      const height = widget ? widget.offsetHeight : 520;
      const maxX = Math.max(10, window.innerWidth - width - 10);
      const maxY = Math.max(10, window.innerHeight - height - 10);

      const nextX = Math.min(maxX, Math.max(10, dragRef.current.initialLeft + dx));
      const nextY = Math.min(maxY, Math.max(10, dragRef.current.initialTop + dy));

      setPosition({ x: Math.round(nextX), y: Math.round(nextY) });
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setPosition((pos) => {
        if (pos) {
          try {
            localStorage.setItem('cyberhub_copilot_pos', JSON.stringify(pos));
          } catch {
            /* ignore */
          }
        }
        return pos;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleFabMouseDown = (e) => {
    e.preventDefault();
    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
      hasMoved: false,
    };

    const handleMouseMove = (moveEvent) => {
      if (!dragRef.current.isDragging) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragRef.current.hasMoved = true;
      }
      const widget = widgetRef.current;
      const width = widget ? widget.offsetWidth : 160;
      const height = widget ? widget.offsetHeight : 45;
      const maxX = Math.max(10, window.innerWidth - width - 10);
      const maxY = Math.max(10, window.innerHeight - height - 10);

      const nextX = Math.min(maxX, Math.max(10, dragRef.current.initialLeft + dx));
      const nextY = Math.min(maxY, Math.max(10, dragRef.current.initialTop + dy));

      setPosition({ x: Math.round(nextX), y: Math.round(nextY) });
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (!dragRef.current.hasMoved) {
        toggleChat();
      } else {
        setPosition((pos) => {
          if (pos) {
            try {
              localStorage.setItem('cyberhub_copilot_pos', JSON.stringify(pos));
            } catch {
              /* ignore */
            }
          }
          return pos;
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const upsert = (card, extra = {}) =>
    setProposals((prev) => ({ ...prev, [card.id]: { ...prev[card.id], ...card, conflicts: undefined, ...extra } }));

  // Load backend status + change history (history survives page reloads because it lives in Supabase)
  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    Promise.all([apiFetch(`${API}/status`), apiFetch(`${API}/changes?limit=50`)])
      .then(([st, list]) => {
        if (cancelled) return;
        setStatus(st);
        // merge: anything already in memory (newer) wins over the loaded history
        setProposals((prev) => ({ ...Object.fromEntries(list.map((c) => [c.id, c])), ...prev }));
      })
      .catch(() => {
        if (!cancelled) setStatus('offline');
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading, proposals, showHistory]);

  const refreshApp = async () => {
    window.dispatchEvent(new Event('cyberhub:data-changed'));
    try {
      await fetchSupabaseData?.();
    } catch {
      /* pages will refresh on next load */
    }
  };

  const say = (content, extra = {}) => addMessage({ role: 'assistant', content, ...extra });

  const runSelfTest = async () => {
    setIsSelfTesting(true);
    say('Running Copilot database self-test pipeline…');
    try {
      const res = await apiFetch(`${API}/selftest`, { method: 'POST' });
      const statusIcon = res.ok ? '✓ PASS' : '❌ FAIL';
      const stepLines = (res.steps || []).map(
        (s) => `• ${s.ok ? '✓' : '✗'} **${s.name}** (${s.ms}ms): ${s.detail}`
      );
      say(`**Copilot Self-Test: ${statusIcon}** (${res.duration_ms}ms)\n\n` + stepLines.join('\n'));
    } catch (err) {
      say(`❌ Self-test failed: ${err.message}`);
    } finally {
      setIsSelfTesting(false);
    }
  };

  const handleApprove = async (id) => {
    const prop = proposals[id];
    if (!prop || prop.status !== 'pending') return;
    try {
      const card = await apiFetch(`${API}/changes/${id}/apply`, { method: 'POST' });
      let verifiedText = null;
      let verificationFailed = false;
      try {
        const check = await apiFetch(`${API}/changes/${id}/verify`);
        if (check && check.verified) {
          verifiedText = check.detail;
        } else if (check && !check.verified) {
          verificationFailed = true;
        }
      } catch {
        /* ignore */
      }
      upsert(card, { verifiedText, verificationFailed, errorMsg: null });
      await refreshApp();
      say(`✓ **Saved to Supabase:** ${prop.summary}.\nPress "Undo Change" on the card if you want to revert it.`, {
        triggers: [`COMMITTED: ${prop.actionType}`],
      });
    } catch (err) {
      const serverMsg = err.message || 'Unknown database error';
      upsert(prop, { errorMsg: serverMsg });
      if (err.status === 409) {
        upsert(prop, { status: 'stale', errorMsg: serverMsg });
        apiFetch(`${API}/changes/${id}/reject`, { method: 'POST' }).catch(() => {});
        say(`⚠️ ${serverMsg}`);
      } else {
        say(`❌ Could not apply the change: ${serverMsg}`);
      }
    }
  };

  const handleReject = async (id) => {
    const prop = proposals[id];
    if (!prop || prop.status !== 'pending') return;
    try {
      upsert(await apiFetch(`${API}/changes/${id}/reject`, { method: 'POST' }));
      say('✕ Proposal discarded. Nothing was changed in the database.');
    } catch (err) {
      say(`❌ ${err.message}`);
    }
  };

  const handleUndo = async (id, force = false) => {
    const prop = proposals[id];
    if (!prop || prop.status !== 'applied') return;
    try {
      const card = await apiFetch(`${API}/changes/${id}/undo`, { method: 'POST', body: JSON.stringify({ force }) });
      upsert(card);
      await refreshApp();
      say(`↩ **Change undone:** ${prop.summary}. The previous values are back in Supabase.`, {
        triggers: [`UNDONE: ${prop.actionType}`],
      });
    } catch (err) {
      if (err.status === 409 && err.detail?.conflicts) {
        upsert(prop, { conflicts: err.detail.conflicts });
        say('⚠️ Undo paused: some of these values were changed again after this edit. Review the list on the card, then choose "Undo anyway" or leave it.');
      } else {
        say(`❌ Could not undo: ${err.message}`);
      }
    }
  };

  const sendCommand = async (promptText) => {
    const text = (promptText ?? input).trim();
    if (!text || isLoading) return;
    setHistoryPointer(-1);
    tempInputRef.current = '';
    const userMsg = { role: 'user', content: text };
    addMessage(userMsg);
    setInput('');
    setShowHistory(false);
    setIsLoading(true);
    try {
      const history = [...messages, userMsg].slice(-10).map(({ role, content }) => ({ role, content }));
      const data = await apiFetch(`${API}/chat`, {
        method: 'POST',
        body: JSON.stringify({ messages: history, current_page: location.pathname }),
      });
      (data.proposals || []).forEach((card) => upsert(card));
      if ((data.proposals || []).some((p) => p.status === 'applied') || (data.ui_triggers && data.ui_triggers.length > 0)) {
        await refreshApp();
      }
      say(data.reply, {
        dbReport: data.db_report || undefined,
        table: data.table || undefined,
        proposalIds: (data.proposals || []).map((p) => p.id),
        triggers: data.ui_triggers || [],
      });
    } catch (err) {
      say(
        err.status
          ? `❌ ${err.message}`
          : '❌ I cannot reach the backend. Start it with:  cd backend  then  uvicorn main:app --reload --port 8000'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendCommand();
      return;
    }
    if (e.key === 'ArrowUp') {
      const userPrompts = messages.filter((m) => m.role === 'user').map((m) => m.content);
      if (userPrompts.length === 0) return;
      e.preventDefault();
      if (historyPointer === -1) {
        tempInputRef.current = input;
        const nextIdx = userPrompts.length - 1;
        setHistoryPointer(nextIdx);
        setInput(userPrompts[nextIdx] || '');
      } else if (historyPointer > 0) {
        const nextIdx = historyPointer - 1;
        setHistoryPointer(nextIdx);
        setInput(userPrompts[nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      if (historyPointer !== -1) {
        e.preventDefault();
        const userPrompts = messages.filter((m) => m.role === 'user').map((m) => m.content);
        if (historyPointer < userPrompts.length - 1) {
          const nextIdx = historyPointer + 1;
          setHistoryPointer(nextIdx);
          setInput(userPrompts[nextIdx] || '');
        } else {
          setHistoryPointer(-1);
          setInput(tempInputRef.current || '');
        }
      }
    }
  };

  const history = useMemo(
    () => Object.values(proposals).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))),
    [proposals]
  );

  const renderCard = (prop, compact = false) => (
    <div className="ch-proposal-card" key={prop.id}>
      <div className="ch-proposal-header">
        <span className={`ch-action-badge ${String(prop.actionType).toLowerCase()}`}>
          {prop.actionType} {prop.status === 'pending' ? 'PREVIEW' : ''}
        </span>
        <span className="ch-proposal-target">{compact ? prop.summary : prop.targetEntity}</span>
      </div>

      {!compact && (
        <table className="ch-diff-table">
          <tbody>
            {prop.diff.map((d, i) => (
              <tr key={i}>
                <td className="ch-diff-label">{d.label}</td>
                <td>
                  <div className="ch-diff-val">
                    <span className="ch-diff-old">{d.from}</span>
                    <span className="ch-diff-arrow">➔</span>
                    <span className="ch-diff-new">{d.to}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {prop.errorMsg && (
        <div style={{ color: '#ff4757', background: 'rgba(255, 71, 87, 0.12)', border: '1px solid rgba(255, 71, 87, 0.3)', borderRadius: 4, padding: '6px 10px', fontSize: 11, margin: '6px 0' }}>
          ⚠️ Server error: {prop.errorMsg}
        </div>
      )}

      {prop.status === 'pending' && (
        <div className="ch-proposal-actions">
          <button type="button" className="ch-btn-approve" onClick={() => handleApprove(prop.id)}>
            ✓ Approve & Apply Changes
          </button>
          <button type="button" className="ch-btn-reject" onClick={() => handleReject(prop.id)}>
            ✕ Reject
          </button>
        </div>
      )}

      {prop.status === 'applied' && (
        <div className="ch-proposal-status-bar" style={{ display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="ch-status-label approved">✓ Approved & Committed</span>
            <button type="button" className="ch-btn-undo" onClick={() => handleUndo(prop.id)} title="Revert to the previous values">
              ↩ Undo Change
            </button>
          </div>
          {prop.verifiedText && (
            <div style={{ color: '#2ed573', fontSize: 11, marginTop: 4, fontWeight: 500 }}>
              ✓ Verified in database: {prop.verifiedText}
            </div>
          )}
          {prop.verificationFailed && (
            <div style={{ color: '#ff4757', fontSize: 11, marginTop: 4, fontWeight: 500 }}>
              ⚠ Saved but not visible: check the data refresh
            </div>
          )}
        </div>
      )}

      {prop.status === 'applied' && prop.conflicts?.length > 0 && (
        <div className="ch-proposal-status-bar" style={{ display: 'block' }}>
          <div style={{ color: '#ffb173', fontWeight: 600, marginBottom: 4 }}>Changed since this edit:</div>
          {prop.conflicts.slice(0, 5).map((c, i) => (
            <div key={i} style={{ fontSize: 11, color: '#e5e7eb' }}>
              {c.table} {c.key ? `· ${String(c.key).slice(0, 12)}` : ''} {c.column ? `· ${c.column}` : ''}: expected{' '}
              {JSON.stringify(c.expected)}, now {JSON.stringify(c.actual)}
            </div>
          ))}
          <button type="button" className="ch-btn-undo" style={{ marginTop: 6 }} onClick={() => handleUndo(prop.id, true)}>
            ↩ Undo anyway (overwrite newer values)
          </button>
        </div>
      )}

      {STATUS_TEXT[prop.status] && prop.status !== 'applied' && (
        <div className="ch-proposal-status-bar">
          <span className={`ch-status-label ${STATUS_TEXT[prop.status].cls}`}>{STATUS_TEXT[prop.status].text}</span>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={widgetRef}
      className="ch-copilot-widget"
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : undefined,
        top: position ? `${position.y}px` : undefined,
        bottom: position ? 'auto' : '20px',
        right: position ? 'auto' : '20px',
        width: 'auto',
        height: 'auto',
        maxWidth: 'calc(100vw - 40px)',
        maxHeight: 'calc(100vh - 40px)',
        zIndex: 99999,
        pointerEvents: 'none',
        background: 'transparent',
        backgroundColor: 'transparent',
        border: 'none',
      }}
    >
      {!isOpen ? (
        <button
          className="ch-copilot-fab"
          onMouseDown={handleFabMouseDown}
          title="Drag to reposition or click to open CyberHub AI Copilot"
          style={{ cursor: 'grab', userSelect: 'none' }}
        >
          <span className="ch-pulse-dot"></span>
          <span>AI Admin Copilot</span>
        </button>
      ) : (
        <div
          className="ch-copilot-window"
          style={{
            width: `${size.width}px`,
            height: `${size.height}px`,
            minWidth: `${COPILOT_MIN_WIDTH}px`,
            minHeight: `${COPILOT_MIN_HEIGHT}px`,
          }}
        >
          <div
            className="ch-copilot-header"
            onMouseDown={handleHeaderMouseDown}
            style={{ cursor: 'grab', userSelect: 'none' }}
            title="Drag header to move Copilot"
          >
            <div className="ch-copilot-brand">
              <span
                style={{
                  cursor: 'grab',
                  opacity: 0.6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginRight: '2px',
                }}
                title="Drag to reposition"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="9" cy="6" r="1.5" fill="currentColor" />
                  <circle cx="15" cy="6" r="1.5" fill="currentColor" />
                  <circle cx="9" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="15" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="9" cy="18" r="1.5" fill="currentColor" />
                  <circle cx="15" cy="18" r="1.5" fill="currentColor" />
                </svg>
              </span>
              <span className="ch-pulse-dot"></span>
              <div>
                <h4>CyberHub AI Copilot</h4>
                <span className="ch-context-route">
                  {status === 'offline' ? (
                    <span style={{ color: '#ff4757' }}>● Backend unreachable</span>
                  ) : (
                    <>
                      <span style={{ color: '#2ed573' }}>● API OK</span> ·{' '}
                      <span style={{ color: status?.sql_installed ? '#2ed573' : '#ff4757' }}>
                        SQL {status?.sql_installed ? '✓' : '✗'}
                      </span> ·{' '}
                      <span>AI {status?.model_online ? 'online' : 'offline'}</span>
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className="ch-header-btns">
              <button
                type="button"
                className="ch-mini-btn"
                onClick={handleResetPosition}
                title="Reset Copilot position to default bottom-right"
              >
                Reset Pos
              </button>
              <button
                type="button"
                className="ch-mini-btn"
                onClick={handleResetSize}
                title={`Reset Copilot size to default minimum (${COPILOT_MIN_WIDTH}x${COPILOT_MIN_HEIGHT})`}
              >
                Reset Size
              </button>
              <button className="ch-mini-btn" onClick={runSelfTest} disabled={isSelfTesting} title="Run end-to-end database self-test">
                {isSelfTesting ? 'Testing…' : 'Self-test'}
              </button>
              <button className="ch-mini-btn" onClick={() => setShowHistory((v) => !v)} title="Every change the copilot made, with undo">
                {showHistory ? 'Chat' : 'History'}
              </button>
              <button className="ch-mini-btn" onClick={clearHistory} title="Clear Chat">
                Clear
              </button>
              <button className="ch-mini-btn" onClick={toggleChat} title="Close Chatbot">
                ✕
              </button>
            </div>
          </div>

          <div className="ch-quick-bar">
            {QUICK_COMMANDS.map((cmd) => (
              <button key={cmd} className="ch-chip" onClick={() => sendCommand(cmd)} disabled={isLoading}>
                {cmd}
              </button>
            ))}
          </div>

          <div className="ch-messages">
            {status && status !== 'offline' && status.sql_installed === false && (
              <div className="ch-msg-row ai">
                <div className="ch-bubble">
                  <p>⚠️ Editing is not set up yet. Run <strong>copilot_setup.sql</strong> in the Supabase SQL Editor, then reload.</p>
                </div>
              </div>
            )}

            {showHistory ? (
              <div className="ch-msg-row ai" style={{ display: 'block' }}>
                {history.length === 0 && <div className="ch-bubble"><p>No copilot changes yet.</p></div>}
                {history.map((p) => (
                  <div key={p.id} style={{ marginBottom: 8 }}>
                    {renderCard(p, true)}
                    <span className="ch-time">
                      {p.created_at ? new Date(p.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              messages.map((msg, index) => {
                const ids = msg.proposalIds || (msg.proposalId ? [msg.proposalId] : []);
                return (
                  <div key={index} className={`ch-msg-row ${msg.role === 'user' ? 'user' : 'ai'}`}>
                    {msg.role === 'user' && (
                      <button
                        type="button"
                        className="ch-btn-delete-prompt"
                        onClick={() => deleteMessageTurn(index)}
                        title="Remove prompt and reply"
                        aria-label="Remove prompt and reply"
                      >
                        ✕
                      </button>
                    )}
                    <div className="ch-bubble">
                      <p><Rich text={msg.content} /></p>

                      {msg.dbReport && (
                        <div className="ch-db-report-card">
                          <div style={{ color: '#2ed573', fontWeight: '700', marginBottom: '4px' }}>⚡ {msg.dbReport.title}</div>
                          <div className="ch-db-report-grid">
                            {msg.dbReport.stats.map((s, i) => (
                              <div key={i} className="ch-db-stat">
                                <div className="ch-db-stat-title">{s.label}</div>
                                <div className="ch-db-stat-val">{s.val}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.table && (
                        <div style={{ overflowX: 'auto', marginTop: 6 }}>
                          <table className="ch-diff-table" style={{ fontSize: 11 }}>
                            <thead>
                              <tr>
                                {msg.table.columns.map((c) => (
                                  <th key={c} className="ch-diff-label" style={{ textAlign: 'left' }}>{c.replace('.', ' · ')}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {msg.table.rows.map((r, i) => (
                                <tr key={i}>
                                  {msg.table.columns.map((c) => (
                                    <td key={c} style={{ padding: '2px 6px', whiteSpace: 'nowrap' }}>
                                      {r[c] === null || r[c] === undefined ? '—' : String(r[c]).slice(0, 28)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {ids.map((id) => (proposals[id] ? renderCard(proposals[id]) : null))}

                      {msg.triggers && msg.triggers.length > 0 && (
                        <div className="ch-badge-list">
                          {msg.triggers.map((trig, i) => (
                            <span key={i} className="ch-badge">⚡ {trig}</span>
                          ))}
                        </div>
                      )}

                      <span className="ch-time">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            {isLoading && (
              <div className="ch-msg-row ai">
                <div className="ch-bubble ch-typing-bubble" title="AI Copilot is thinking...">
                  <span className="ch-typing-dot"></span>
                  <span className="ch-typing-dot"></span>
                  <span className="ch-typing-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ch-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Copilot (e.g. Check DB, Update PRT-045 markup to 55%...)"
              disabled={isLoading}
            />
            <button className="ch-send-btn" onClick={() => sendCommand()} disabled={!input.trim() || isLoading}>
              Run
            </button>
          </div>

          {/* Corner Resize Handles */}
          <div
            className="ch-copilot-resize-handle se"
            onMouseDown={handleResizeMouseDown('se')}
            title="Drag to resize Copilot window"
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: '16px',
              height: '16px',
              cursor: 'nwse-resize',
              zIndex: 10,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              padding: '2px',
              userSelect: 'none',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#ff7300" strokeWidth="1.5" opacity="0.75">
              <line x1="8" y1="2" x2="2" y2="8" />
              <line x1="8" y1="5" x2="5" y2="8" />
              <line x1="8" y1="8" x2="8" y2="8" />
            </svg>
          </div>
          <div
            className="ch-copilot-resize-handle nw"
            onMouseDown={handleResizeMouseDown('nw')}
            title="Drag to resize Copilot window"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '16px',
              height: '16px',
              cursor: 'nwse-resize',
              zIndex: 10,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              padding: '2px',
              userSelect: 'none',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#ff7300" strokeWidth="1.5" opacity="0.75">
              <line x1="2" y1="8" x2="8" y2="2" />
              <line x1="2" y1="5" x2="5" y2="2" />
              <line x1="2" y1="2" x2="2" y2="2" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCopilot;

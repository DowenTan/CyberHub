import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatAttachmentMenu from './ChatAttachmentMenu.jsx';
import {
  useTechChatStore,
  FREQUENT_DISPATCH_TEXTS,
} from '../store/useTechChatStore.js';
import { useDashboardStore } from '../store/useDashboardStore.js';

const MIN_WIDTH = 460;
const MIN_HEIGHT = 620;

export default function TechnicianChatModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isOpen,
    activeTech,
    showCipherView,
    isTyping,
    threads,
    closeChat,
    toggleCipherView,
    sendMessage,
    openChatWithTech,
    startCall,
    clearThread,
  } = useTechChatStore();

  const allTechnicians = useDashboardStore((state) => state.technicians || []);
  const [inputText, setInputText] = useState('');
  const [showTechDropdown, setShowTechDropdown] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Position state (draggable)
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberhub_tech_chat_pos');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Size state (resizable with default being minimum size)
  const [size, setSize] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberhub_tech_chat_size');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          width: Math.max(MIN_WIDTH, parsed.width || MIN_WIDTH),
          height: Math.max(MIN_HEIGHT, parsed.height || MIN_HEIGHT),
        };
      }
    } catch {
      /* ignore */
    }
    return { width: MIN_WIDTH, height: MIN_HEIGHT };
  });

  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });

  const handleResetPosition = (e) => {
    e?.stopPropagation();
    setPosition(null);
    try {
      localStorage.removeItem('cyberhub_tech_chat_pos');
    } catch {
      /* ignore */
    }
  };

  const handleResetSize = (e) => {
    e?.stopPropagation();
    setSize({ width: MIN_WIDTH, height: MIN_HEIGHT });
    try {
      localStorage.removeItem('cyberhub_tech_chat_size');
    } catch {
      /* ignore */
    }
  };

  const handleHeaderMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.dropdown')) return;
    e.preventDefault();
    const rect = modalRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
    };

    const handleMouseMove = (moveEvent) => {
      if (!dragRef.current.isDragging) return;
      const dx = moveEvent.clientX - dragRef.current.startX;
      const dy = moveEvent.clientY - dragRef.current.startY;
      const curW = modalRef.current ? modalRef.current.offsetWidth : size.width;
      const curH = modalRef.current ? modalRef.current.offsetHeight : size.height;
      const maxX = Math.max(10, window.innerWidth - curW - 10);
      const maxY = Math.max(10, window.innerHeight - curH - 10);

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
            localStorage.setItem('cyberhub_tech_chat_pos', JSON.stringify(pos));
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

  const handleResizeMouseDown = (direction) => (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = modalRef.current?.offsetWidth || size.width;
    const startH = modalRef.current?.offsetHeight || size.height;
    const rect = modalRef.current?.getBoundingClientRect();

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

      const maxW = window.innerWidth - 32;
      const maxH = window.innerHeight - 32;
      const clampedW = Math.max(MIN_WIDTH, Math.min(maxW, Math.round(newW)));
      const clampedH = Math.max(MIN_HEIGHT, Math.min(maxH, Math.round(newH)));

      setSize({ width: clampedW, height: clampedH });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setSize((s) => {
        try {
          localStorage.setItem('cyberhub_tech_chat_size', JSON.stringify(s));
        } catch {
          /* ignore */
        }
        return s;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleOpenChatPage = () => {
    closeChat();
    navigate('/chats', { state: { selectedTechCode: activeCode } });
  };

  const activeCode = activeTech?.code || 'T-001';
  const currentMessages = useMemo(() => threads[activeCode] || [], [threads, activeCode]);

  // Scroll to bottom when messages or typing changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
    }
  }, [currentMessages, isTyping, isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeCode]);

  // Remove tech-chat-modal-wrapper on /chats page or when closed
  if (!isOpen || !activeTech || location.pathname.startsWith('/chats')) return null;

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(activeCode, inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUseQuickText = (text) => {
    setInputText(text);
    inputRef.current?.focus();
  };

  return (
    <div
      ref={modalRef}
      className="tech-chat-modal-wrapper"
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : undefined,
        top: position ? `${position.y}px` : undefined,
        bottom: position ? 'auto' : '24px',
        right: position ? 'auto' : '24px',
        width: `${size.width}px`,
        minWidth: `${MIN_WIDTH}px`,
        maxWidth: 'calc(100vw - 32px)',
        height: `${size.height}px`,
        minHeight: `${MIN_HEIGHT}px`,
        maxHeight: 'calc(100vh - 48px)',
        resize: 'both',
        background: '#020b27',
        border: '1.5px solid #ff7300',
        borderRadius: '14px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 25px rgba(255, 115, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 99999,
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* 1. CHAT HEADER */}
      <div
        onMouseDown={handleHeaderMouseDown}
        title="Drag header to move chat window"
        style={{
          background: 'linear-gradient(90deg, #051340, #040e33)',
          borderBottom: '1px solid rgba(255, 115, 0, 0.35)',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              cursor: 'grab',
              opacity: 0.5,
              display: 'inline-flex',
              alignItems: 'center',
              marginRight: '2px',
            }}
            title="Drag to reposition chat modal"
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
          <div style={{ position: 'relative' }}>
            <img
              src={activeTech.avatar || '/logo1.png'}
              alt={activeTech.name}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #ff7300',
              }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: (activeTech.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE' ? '#2ed573' : '#ffa502',
                border: '2px solid #020b27',
                boxShadow: '0 0 8px #2ed573',
              }}
              title="Online Status"
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                {activeTech.name}
              </span>
              <span
                style={{
                  background: 'rgba(255, 115, 0, 0.2)',
                  color: '#ff7300',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 115, 0, 0.4)',
                }}
              >
                {activeTech.code}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{activeTech.zone}</span>
              <span>•</span>
              <span style={{ color: (activeTech.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE' ? '#2ed573' : '#ffa502', fontWeight: 600 }}>
                {(activeTech.status || 'AVAILABLE').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Right header buttons (Call, Video, Switch Tech, Cipher, Close) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {/* Voice Call Button (SVG Icon) */}
          <button
            type="button"
            className="btn-small outline"
            onClick={() => startCall(activeTech, 'audio')}
            title="Start Encrypted Voice Call"
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              color: '#2ed573',
              borderColor: 'rgba(46, 213, 115, 0.45)',
              background: 'rgba(46, 213, 115, 0.1)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>Call</span>
          </button>

          {/* Video Call Button (SVG Icon) */}
          <button
            type="button"
            className="btn-small outline"
            onClick={() => startCall(activeTech, 'video')}
            title="Start Encrypted Video Call"
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              color: '#38bdf8',
              borderColor: 'rgba(56, 189, 248, 0.45)',
              background: 'rgba(56, 189, 248, 0.1)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span>Video</span>
          </button>

          {/* Switch technician dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-small outline"
              onClick={() => setShowTechDropdown((v) => !v)}
              title="Switch Technician"
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                color: '#38bdf8',
                borderColor: 'rgba(56, 189, 248, 0.4)',
                cursor: 'pointer',
              }}
            >
              Techs ▾
            </button>
            {showTechDropdown && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  width: '230px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  background: '#040d2d',
                  border: '1px solid #ff7300',
                  borderRadius: '8px',
                  zIndex: 1000,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                }}
              >
                {allTechnicians.slice(0, 30).map((t) => (
                  <div
                    key={t.code || t.id}
                    onClick={() => {
                      openChatWithTech(t);
                      setShowTechDropdown(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      background: (t.code === activeCode) ? 'rgba(255, 115, 0, 0.15)' : 'transparent',
                    }}
                  >
                    <img
                      src={t.avatar || '/logo1.png'}
                      alt=""
                      style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                    />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {t.code} • {t.zone?.split('(')[0] || 'Klang Valley'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open Dedicated Chat Page button */}
          <button
            type="button"
            className="btn-small outline"
            onClick={handleOpenChatPage}
            title="Open dedicated full Chats page"
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              color: '#ff7300',
              borderColor: 'rgba(255, 115, 0, 0.45)',
              background: 'rgba(255, 115, 0, 0.1)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span>Chats</span>
          </button>

          {/* Reset Position button */}
          <button
            type="button"
            className="btn-small outline"
            onClick={handleResetPosition}
            title="Reset position to default bottom-right"
            style={{
              padding: '4px 6px',
              fontSize: '10px',
              color: '#94a3b8',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              cursor: 'pointer',
            }}
          >
            Reset Pos
          </button>

          {/* Reset Size button */}
          <button
            type="button"
            className="btn-small outline"
            onClick={handleResetSize}
            title={`Reset size to default minimum (${MIN_WIDTH}x${MIN_HEIGHT})`}
            style={{
              padding: '4px 6px',
              fontSize: '10px',
              color: '#94a3b8',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              cursor: 'pointer',
            }}
          >
            Reset Size
          </button>

          {/* Close modal */}
          <button
            type="button"
            onClick={closeChat}
            title="Close Chat"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 6px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. E2EE ENCRYPTED SECURITY RIBBON */}
      <div
        style={{
          background: 'rgba(5, 19, 64, 0.85)',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '10.5px',
          color: '#cbd5e1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 600, color: '#2ed573' }}>[E2EE] AES-256-GCM Encrypted</span>
          <span style={{ color: '#64748b' }}>•</span>
          <span style={{ color: '#94a3b8' }}>ECDH-P384 Session</span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Clear chat history with ${activeTech.name}?`)) {
              clearThread(activeCode);
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            fontSize: '10px',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          Reset Session
        </button>
      </div>

      {/* 3. MESSAGES SCROLL AREA */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'radial-gradient(circle at center, #020b27 0%, #010617 100%)',
        }}
      >
        {currentMessages.length === 0 ? (
          // INITIAL MESSAGE WHEN NO CHAT HISTORY EXISTS
          <div
            style={{
              margin: 'auto',
              textAlign: 'center',
              padding: '24px 18px',
              color: '#cbd5e1',
              fontSize: '12.5px',
              lineHeight: 1.6,
              maxWidth: '380px',
              background: 'rgba(5, 19, 64, 0.65)',
              border: '1px dashed rgba(255, 115, 0, 0.4)',
              borderRadius: '12px',
            }}
          >
            <div style={{ color: '#ff7300', fontWeight: 700, marginBottom: '6px', fontSize: '13px' }}>
              New Dispatch Channel
            </div>
            this is your first conversation with technician {activeTech.name}({activeTech.code}), type something for dispatch
          </div>
        ) : (
          currentMessages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: 'center',
                    background: 'rgba(5, 19, 64, 0.65)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#93c5fd',
                    fontSize: '10.5px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    maxWidth: '85%',
                  }}
                >
                  {msg.text}
                </div>
              );
            }

            if (msg.type === 'call_event') {
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: 'center',
                    background: 'rgba(46, 213, 115, 0.12)',
                    border: '1px solid rgba(46, 213, 115, 0.35)',
                    color: '#2ed573',
                    fontSize: '11px',
                    padding: '5px 12px',
                    borderRadius: '12px',
                  }}
                >
                  {msg.text}
                </div>
              );
            }

            const isDispatcher = msg.sender === 'dispatcher';

            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isDispatcher ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isDispatcher ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Sender badge & timestamp */}
                <div
                  style={{
                    fontSize: '10px',
                    color: '#94a3b8',
                    marginBottom: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ fontWeight: 600, color: isDispatcher ? '#ff7300' : '#38bdf8' }}>
                    {isDispatcher ? 'Dispatcher (You)' : activeTech.name}
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Bubble */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: isDispatcher ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: isDispatcher
                      ? 'linear-gradient(135deg, rgba(255, 115, 0, 0.28), rgba(10, 29, 86, 0.95))'
                      : 'linear-gradient(135deg, rgba(14, 42, 117, 0.95), rgba(5, 19, 64, 0.95))',
                    border: isDispatcher ? '1px solid rgba(255, 115, 0, 0.5)' : '1px solid rgba(56, 189, 248, 0.45)',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                    color: '#f8fafc',
                    fontSize: '12.5px',
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.attachment && (
                    <div style={{ marginBottom: msg.text ? '8px' : 0 }}>
                      {(msg.attachment.type === 'image' || msg.attachment.type === 'gif') && (
                        <img
                          src={msg.attachment.url}
                          alt={msg.attachment.name || 'Attachment'}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            display: 'block',
                            objectFit: 'cover',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        />
                      )}
                      {msg.attachment.type === 'video' && (
                        <video
                          src={msg.attachment.url}
                          controls
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            display: 'block',
                            background: '#000',
                          }}
                        />
                      )}
                      {msg.attachment.type === 'document' && (
                        <a
                          href={msg.attachment.url}
                          download={msg.attachment.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            color: '#38bdf8',
                            textDecoration: 'none',
                            fontSize: '11.5px',
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{msg.attachment.name}</span>
                          {msg.attachment.size && <span style={{ fontSize: '10px', color: '#94a3b8' }}>({msg.attachment.size})</span>}
                        </a>
                      )}
                    </div>
                  )}

                  {showCipherView ? (
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#2ed573' }}>
                      <div style={{ color: '#94a3b8', fontSize: '9.5px', marginBottom: '2px' }}>
                        CIPHERTEXT [{msg.cipherSuite || 'AES-256-GCM'}]:
                      </div>
                      {msg.ciphertext || 'AES256GCM:ENCRYPTED_STREAM_PAYLOAD'}
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>

                {/* Delivery checkmarks */}
                {isDispatcher && (
                  <div style={{ fontSize: '9.5px', color: '#2ed573', marginTop: '2px' }}>
                    ✓✓ Delivered
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div
            style={{
              alignSelf: 'flex-start',
              background: 'rgba(14, 42, 117, 0.65)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '11px',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{activeTech.name} is typing response...</span>
            <span style={{ display: 'inline-flex', gap: '2px' }}>
              <span className="typing-dot" style={{ width: '4px', height: '4px', background: '#38bdf8', borderRadius: '50%' }} />
              <span className="typing-dot" style={{ width: '4px', height: '4px', background: '#38bdf8', borderRadius: '50%' }} />
              <span className="typing-dot" style={{ width: '4px', height: '4px', background: '#38bdf8', borderRadius: '50%' }} />
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. FREQUENTLY USED TEXTS (QUICK RESPONSE CHIPS) */}
      <div
        style={{
          background: '#040d2d',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '8px 10px',
        }}
      >
        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#ff7300', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.5px' }}>
          Frequently Used Dispatch Messages
        </div>
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
          }}
        >
          {FREQUENT_DISPATCH_TEXTS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleUseQuickText(item.text)}
              title={item.text}
              style={{
                background: 'rgba(5, 19, 64, 0.9)',
                border: '1px solid rgba(255, 115, 0, 0.35)',
                color: '#e2e8f0',
                padding: '4px 9px',
                borderRadius: '12px',
                fontSize: '11px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ff7300';
                e.currentTarget.style.background = 'rgba(255, 115, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 115, 0, 0.35)';
                e.currentTarget.style.background = 'rgba(5, 19, 64, 0.9)';
              }}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. INPUT AND ACTION FOOTER */}
      <div
        style={{
          background: '#020921',
          borderTop: '1px solid rgba(255, 115, 0, 0.3)',
          padding: '10px 12px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Attach Job Photo / Schematic Upward Dropdown */}
        <ChatAttachmentMenu
          onAttach={(att) => sendMessage(activeCode, '', 'text', att)}
        />

        <input
          ref={inputRef}
          type="text"
          className="ch-input"
          placeholder={`Type message to ${activeTech.name}...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: '#040d2d',
            border: '1px solid rgba(255, 115, 0, 0.45)',
            borderRadius: '8px',
            color: '#fff',
            padding: '9px 12px',
            fontSize: '12.5px',
          }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!inputText.trim()}
          style={{
            background: inputText.trim()
              ? 'linear-gradient(135deg, #ff7300, #e65c00)'
              : 'rgba(255, 115, 0, 0.25)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: 700,
            fontSize: '12.5px',
            padding: '9px 16px',
            cursor: inputText.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: inputText.trim() ? '0 0 15px rgba(255, 115, 0, 0.4)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          <span>Send</span>
        </button>
      </div>

      {/* Corner Resize Handles */}
      <div
        className="tech-chat-resize-handle se"
        onMouseDown={handleResizeMouseDown('se')}
        title="Drag to resize chat window"
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '16px',
          height: '16px',
          cursor: 'nwse-resize',
          zIndex: 99,
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
        className="tech-chat-resize-handle nw"
        onMouseDown={handleResizeMouseDown('nw')}
        title="Drag to resize chat window"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '16px',
          height: '16px',
          cursor: 'nwse-resize',
          zIndex: 99,
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
  );
}

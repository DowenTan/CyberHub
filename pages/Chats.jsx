import { useState, useMemo, useRef, useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import ChatAttachmentMenu from '../components/ChatAttachmentMenu.jsx';
import CustomerChatSubpage from '../components/CustomerChatSubpage.jsx';
import {
  useTechChatStore,
  FREQUENT_DISPATCH_TEXTS,
} from '../store/useTechChatStore.js';

export default function Chats({ defaultTab = 'technicians' }) {
  const [chatSubpage, setChatSubpage] = useState(defaultTab);
  const technicians = useDashboardStore((state) => state.technicians || []);
  const {
    threads,
    activeTech,
    showCipherView,
    isTyping,
    openChatWithTech,
    toggleCipherView,
    sendMessage,
    startCall,
    clearThread,
  } = useTechChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'chatted' | 'available' | 'busy'
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'name' | 'code' | 'rating'
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Default select first technician if none active
  useEffect(() => {
    if (!activeTech && technicians.length > 0) {
      openChatWithTech(technicians[0]);
    }
  }, [activeTech, technicians, openChatWithTech]);

  const activeCode = activeTech?.code || technicians[0]?.code || 'T-001';
  const currentMessages = useMemo(() => threads[activeCode] || [], [threads, activeCode]);

  // Scroll to bottom on message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isTyping]);

  // Filter and sort technicians
  const processedTechnicians = useMemo(() => {
    return technicians
      .map((t) => {
        const code = t.code || t.id || 'T-000';
        const threadList = threads[code] || [];
        const lastMsg = threadList[threadList.length - 1];
        return {
          ...t,
          threadList,
          hasHistory: threadList.length > 0,
          lastMessage: lastMsg?.text || (lastMsg?.type === 'call_event' ? lastMsg.text : 'No chat history'),
          lastMessageTime: lastMsg?.timestamp || '',
        };
      })
      .filter((t) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (t.name || '').toLowerCase().includes(q);
          const matchCode = (t.code || '').toLowerCase().includes(q);
          const matchZone = (t.zone || '').toLowerCase().includes(q);
          const matchPhone = (t.phoneNumber || t.phone || '').toLowerCase().includes(q);
          const matchSpecialty = (t.specialty || '').toLowerCase().includes(q);
          const matchMsg = (t.lastMessage || '').toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchZone && !matchPhone && !matchSpecialty && !matchMsg) {
            return false;
          }
        }

        // Pill filter
        if (activeFilter === 'chatted') return t.hasHistory;
        if (activeFilter === 'available') return (t.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE';
        if (activeFilter === 'busy') {
          const s = (t.status || '').toUpperCase();
          return s === 'ON_JOB' || s === 'BUSY';
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          if (a.hasHistory && !b.hasHistory) return -1;
          if (!a.hasHistory && b.hasHistory) return 1;
          return (b.threadList?.length || 0) - (a.threadList?.length || 0);
        }
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'code') return (a.code || '').localeCompare(b.code || '');
        if (sortBy === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        return 0;
      });
  }, [technicians, threads, searchQuery, activeFilter, sortBy]);

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

  const currentTechData = useMemo(() => {
    return technicians.find((t) => t.code === activeCode) || activeTech;
  }, [technicians, activeCode, activeTech]);

  return (
    <div
      className="page-wrapper ch-chats-page"
      style={{
        boxSizing: 'border-box',
        height: 'calc(100vh - 48px)',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        margin: 0,
        overflow: 'hidden',
      }}
    >
      {/* Page Title & Status */}
      <div
        className="page-header"
        style={{
          padding: '12px 20px',
          margin: 0,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(5, 19, 64, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1 style={{ fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff7300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Field Fleet Encrypted Radio & Chats</span>
            <span
              style={{
                fontSize: '11px',
                background: 'rgba(46, 213, 115, 0.15)',
                border: '1px solid #2ed573',
                color: '#2ed573',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 600,
              }}
            >
              [E2EE Active]
            </span>
          </h1>
          <p className="subtitle" style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#94a3b8' }}>
            Live secure coordination channel with field technicians.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Subpage Switcher Tabs */}
          <div
            style={{
              display: 'inline-flex',
              background: 'rgba(0, 0, 0, 0.45)',
              borderRadius: '6px',
              padding: '3px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button
              type="button"
              onClick={() => setChatSubpage('technicians')}
              style={{
                fontSize: '11.5px',
                padding: '5px 12px',
                borderRadius: '4px',
                border: 'none',
                background: chatSubpage === 'technicians' ? '#ff7300' : 'transparent',
                color: chatSubpage === 'technicians' ? '#fff' : '#9ca3af',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Technicians Radio
            </button>
            <button
              type="button"
              onClick={() => setChatSubpage('customers')}
              style={{
                fontSize: '11.5px',
                padding: '5px 12px',
                borderRadius: '4px',
                border: 'none',
                background: chatSubpage === 'customers' ? '#38bdf8' : 'transparent',
                color: chatSubpage === 'customers' ? '#000' : '#9ca3af',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Customer Support Chat
            </button>
          </div>

          <div
            style={{
              fontSize: '11px',
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              padding: '4px 10px',
              borderRadius: '6px',
            }}
          >
            Fleet Active: <strong>{technicians.filter((t) => (t.status || '').toUpperCase() !== 'OFFLINE').length}</strong> online
          </div>
        </div>
      </div>

      {chatSubpage === 'customers' ? (
        <div style={{ flex: 1, padding: '12px 20px', overflow: 'hidden' }}>
          <CustomerChatSubpage />
        </div>
      ) : (
      /* TWO-PANE WHATSAPP / OUTLOOK LAYOUT */
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          background: '#01081f',
        }}
      >
        {/* ================= LEFT PANE: CONTACTS / THREADS LIST ================= */}
        <div
          style={{
            width: '380px',
            minWidth: '320px',
            maxWidth: '420px',
            borderRight: '1px solid rgba(255, 115, 0, 0.25)',
            background: 'linear-gradient(180deg, #030d2e 0%, #010617 100%)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search bar & Sort Controls */}
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="ch-input"
                placeholder="Search technician, zone, phone, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  fontSize: '12px',
                  background: '#01081f',
                  border: '1px solid rgba(255, 115, 0, 0.4)',
                  borderRadius: '6px',
                  color: '#fff',
                }}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Filter pills & Sort by */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                }}
              >
                {[
                  { id: 'all', label: 'All' },
                  { id: 'chatted', label: 'Recent' },
                  { id: 'available', label: 'Available' },
                  { id: 'busy', label: 'On Job' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFilter(f.id)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      borderRadius: '12px',
                      border: activeFilter === f.id ? '1px solid #ff7300' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: activeFilter === f.id ? 'rgba(255, 115, 0, 0.25)' : 'rgba(5, 19, 64, 0.5)',
                      color: activeFilter === f.id ? '#ff7300' : '#cbd5e1',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontWeight: activeFilter === f.id ? 700 : 500,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '3px 6px',
                  fontSize: '11px',
                  background: '#051340',
                  color: '#cbd5e1',
                  
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                title="Sort technicians"
              >
                <option value="recent">Sort: Activity</option>
                <option value="name">Sort: Name</option>
                <option value="code">Sort: Code</option>
                <option value="rating">Sort: Rating</option>
              </select>
            </div>
          </div>

          {/* Technicians / Chat list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
            }}
          >
            {processedTechnicians.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                No technicians match the filter.
              </div>
            ) : (
              processedTechnicians.map((t) => {
                const isSelected = (t.code === activeCode);
                const status = (t.status || 'AVAILABLE').toUpperCase();

                const statusColor =
                  status === 'AVAILABLE' ? '#2ed573' :
                  status === 'ON_JOB' || status === 'BUSY' ? '#ffa502' : '#94a3b8';

                return (
                  <div
                    key={t.code || t.id}
                    onClick={() => openChatWithTech(t)}
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      background: isSelected
                        ? 'linear-gradient(90deg, rgba(255, 115, 0, 0.22), rgba(5, 19, 64, 0.85))'
                        : 'transparent',
                      borderLeft: isSelected ? '3px solid #ff7300' : '3px solid transparent',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* AVATAR WITH AVAILABILITY (NO EMOJI) */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={t.avatar || '/logo1.png'}
                        alt={t.name}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: isSelected ? '2px solid #ff7300' : '1.5px solid rgba(255, 255, 255, 0.2)',
                          display: 'block',
                        }}
                      />

                      {/* Online Availability Dot */}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: statusColor,
                          border: '2px solid #030d2e',
                          boxShadow: `0 0 8px ${statusColor}`,
                        }}
                        title={`Status: ${status}`}
                      />
                    </div>

                    {/* Tech details & last message snippet */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: isSelected ? 700 : 600,
                              color: '#fff',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                            }}
                          >
                            {t.name}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              color: '#ff7300',
                              fontWeight: 700,
                              background: 'rgba(255, 115, 0, 0.15)',
                              padding: '1px 4px',
                              borderRadius: '3px',
                            }}
                          >
                            {t.code}
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0 }}>
                          {t.lastMessageTime}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '11.5px',
                            color: isSelected ? '#cbd5e1' : '#94a3b8',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            fontStyle: t.hasHistory ? 'normal' : 'italic',
                          }}
                        >
                          {t.lastMessage}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT PANE: ACTIVE CHAT CONVERSATION ================= */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'radial-gradient(circle at center, #020b29 0%, #010617 100%)',
          }}
        >
          {activeTech ? (
            <>
              {/* 1. CHAT HEADER WITH CALL & VIDEO CALL BUTTONS (CLEAN SVG ICONS) */}
              <div
                style={{
                  padding: '12px 18px',
                  background: 'linear-gradient(90deg, #051340, #040e33)',
                  borderBottom: '1px solid rgba(255, 115, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={activeTech.avatar || '/logo1.png'}
                      alt={activeTech.name}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #ff7300',
                        display: 'block',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '11px',
                        height: '11px',
                        borderRadius: '50%',
                        background: (activeTech.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE' ? '#2ed573' : '#ffa502',
                        border: '2px solid #051340',
                        boxShadow: '0 0 6px #2ed573',
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                        {activeTech.name}
                      </span>
                      <span
                        style={{
                          background: 'rgba(255, 115, 0, 0.2)',
                          color: '#ff7300',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255, 115, 0, 0.4)',
                        }}
                      >
                        {activeTech.code}
                      </span>
                      <span style={{ fontSize: '11px', color: '#f1c40f', fontWeight: 700 }}>
                        Rating: {Number(activeTech.rating || 4.8).toFixed(1)}
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span>{activeTech.zone}</span>
                      <span>•</span>
                      <span style={{ color: (activeTech.status || 'AVAILABLE').toUpperCase() === 'AVAILABLE' ? '#2ed573' : '#ffa502', fontWeight: 600 }}>
                        {(activeTech.status || 'AVAILABLE').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CALL & VIDEO CALL ACTIONS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Voice Call Button (SVG) */}
                  <button
                    type="button"
                    onClick={() => startCall(currentTechData, 'audio')}
                    title={`Start Encrypted Voice Call with ${activeTech.name}`}
                    style={{
                      background: 'rgba(46, 213, 115, 0.15)',
                      border: '1px solid #2ed573',
                      color: '#2ed573',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(46, 213, 115, 0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(46, 213, 115, 0.15)'; }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>Voice Call</span>
                  </button>

                  {/* Video Call Button (SVG) */}
                  <button
                    type="button"
                    onClick={() => startCall(currentTechData, 'video')}
                    title={`Start Encrypted Video Call with ${activeTech.name}`}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'; }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    <span>Video Call</span>
                  </button>

                  {/* Cipher View Toggle */}
                  <button
                    type="button"
                    onClick={toggleCipherView}
                    title={showCipherView ? 'Switch to Decrypted View' : 'Inspect Encrypted Ciphertext'}
                    style={{
                      background: showCipherView ? 'rgba(46, 213, 115, 0.2)' : 'rgba(5, 19, 64, 0.8)',
                      border: showCipherView ? '1px solid #2ed573' : '1px solid rgba(255, 255, 255, 0.2)',
                      color: showCipherView ? '#2ed573' : '#cbd5e1',
                      borderRadius: '6px',
                      padding: '7px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {showCipherView ? 'Plain' : 'Cipher'}
                  </button>

                  {/* Clear history */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Clear chat history with ${activeTech.name}?`)) {
                        clearThread(activeCode);
                      }
                    }}
                    title="Reset Session Keys"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 2. E2EE SECURITY STATUS BAR */}
              <div
                style={{
                  background: 'rgba(5, 19, 64, 0.8)',
                  padding: '6px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: '11px',
                  color: '#94a3b8',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#2ed573', fontWeight: 600 }}>[E2EE] AES-256-GCM Encrypted Tunnel</span>
                  <span>•</span>
                  <span>ECDH-P384 Ephemeral Key</span>
                </div>
                <div>
                  <span style={{ color: '#ff7300', fontWeight: 600 }}>Dispatch Channel:</span>{' '}
                  <span style={{ color: '#38bdf8' }}>Active Telemetry Sync</span>
                </div>
              </div>

              {/* 3. CONVERSATION MESSAGES SCROLL AREA */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '18px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {currentMessages.length === 0 ? (
                  // INITIAL MESSAGE ONLY FOR CHATS WITH NO CHAT HISTORY
                  <div
                    style={{
                      margin: 'auto',
                      textAlign: 'center',
                      padding: '28px 22px',
                      color: '#cbd5e1',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      maxWidth: '440px',
                      background: 'rgba(5, 19, 64, 0.65)',
                      border: '1.5px dashed rgba(255, 115, 0, 0.4)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div style={{ color: '#ff7300', fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>
                      New Dispatch Conversation
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
                            background: 'rgba(5, 19, 64, 0.75)',
                            border: '1px solid rgba(56, 189, 248, 0.35)',
                            color: '#93c5fd',
                            fontSize: '11px',
                            padding: '5px 14px',
                            borderRadius: '14px',
                            textAlign: 'center',
                            maxWidth: '75%',
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
                            border: '1px solid rgba(46, 213, 115, 0.4)',
                            color: '#2ed573',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            padding: '6px 16px',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>{msg.text}</span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>• {msg.timestamp}</span>
                        </div>
                      );
                    }

                    const isDispatcher = msg.sender === 'dispatcher';

                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isDispatcher ? 'flex-end' : 'flex-start',
                          maxWidth: '70%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isDispatcher ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '10.5px',
                            color: '#94a3b8',
                            marginBottom: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: isDispatcher ? '#ff7300' : '#38bdf8' }}>
                            {isDispatcher ? 'Dispatcher (You)' : activeTech.name}
                          </span>
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </div>

                        <div
                          style={{
                            padding: '10px 16px',
                            borderRadius: isDispatcher ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                            background: isDispatcher
                              ? 'linear-gradient(135deg, rgba(255, 115, 0, 0.3), rgba(10, 29, 86, 0.95))'
                              : 'linear-gradient(135deg, rgba(14, 42, 117, 0.95), rgba(5, 19, 64, 0.95))',
                            border: isDispatcher ? '1px solid rgba(255, 115, 0, 0.5)' : '1px solid rgba(56, 189, 248, 0.45)',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                            color: '#f8fafc',
                            fontSize: '13px',
                            lineHeight: 1.5,
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
                                    maxHeight: '220px',
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
                                    maxHeight: '220px',
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
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    color: '#38bdf8',
                                    textDecoration: 'none',
                                    fontSize: '12px',
                                  }}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                  </svg>
                                  <span style={{ fontWeight: 600, color: '#fff' }}>{msg.attachment.name}</span>
                                  {msg.attachment.size && <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>({msg.attachment.size})</span>}
                                </a>
                              )}
                            </div>
                          )}

                          {showCipherView ? (
                            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#2ed573' }}>
                              <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '2px' }}>
                                CIPHERTEXT [{msg.cipherSuite || 'AES-256-GCM'}]:
                              </div>
                              {msg.ciphertext || 'AES256GCM:ENCRYPTED_STREAM_PAYLOAD'}
                            </div>
                          ) : (
                            msg.text
                          )}
                        </div>

                        {isDispatcher && (
                          <div style={{ fontSize: '10px', color: '#2ed573', marginTop: '2px' }}>
                            ✓✓ Delivered
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Technician typing indicator */}
                {isTyping && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      background: 'rgba(14, 42, 117, 0.65)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '14px',
                      padding: '7px 14px',
                      fontSize: '11.5px',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{activeTech.name} is typing response...</span>
                    <span style={{ display: 'inline-flex', gap: '3px' }}>
                      <span className="typing-dot" style={{ width: '4px', height: '4px', background: '#38bdf8', borderRadius: '50%' }} />
                      <span className="typing-dot" style={{ width: '4px', height: '4px', background: '#38bdf8', borderRadius: '50%' }} />
                      <span className="typing-dot" style={{ width: '4px', height: '4px', background: '#38bdf8', borderRadius: '50%' }} />
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* 4. FREQUENTLY USED TEXTS CHIPS (NO EMOJIS) */}
              <div
                style={{
                  background: '#040d2d',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '8px 18px',
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
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ff7300';
                        e.currentTarget.style.background = 'rgba(255, 115, 0, 0.18)';
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

              {/* 5. INPUT BAR (NO EMOJI BAR) */}
              <div
                style={{
                  background: '#020921',
                  borderTop: '1px solid rgba(255, 115, 0, 0.3)',
                  padding: '12px 18px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
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
                  placeholder={`Type message to ${activeTech.name}... (Press Enter to send)`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{
                    flex: 1,
                    background: '#040d2d',
                    border: '1px solid rgba(255, 115, 0, 0.45)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '10px 14px',
                    fontSize: '13px',
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
                    fontSize: '13px',
                    padding: '10px 18px',
                    cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: inputText.trim() ? '0 0 16px rgba(255, 115, 0, 0.45)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>Send</span>
                </button>
              </div>
            </>
          ) : (
            // EMPTY STATE WHEN NO TECH SELECTED
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                gap: '14px',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff7300" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                CyberHub Encrypted Radio Dispatch
              </div>
              <p style={{ maxWidth: '400px', textAlign: 'center', fontSize: '13px', lineHeight: 1.5 }}>
                Select a field technician from the left pane to open end-to-end encrypted messaging, voice radio calls, or video feeds for real-time field operations.
              </p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

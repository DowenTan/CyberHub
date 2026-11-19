import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore.js';

/**
 * Customer Chat Subpage Component.
 * Enables support agents and dispatchers to communicate directly with customers via live chat / WhatsApp Bridge.
 * Zero emojis - pure SVG icons only.
 */

const SEEDED_CUSTOMER_THREADS = {
  'ORD-501': [
    {
      id: 'm1',
      sender: 'customer',
      senderName: 'Tan Kia Yu',
      text: 'Hi CyberHub support, my Samsung fridge stopped cooling properly this morning. Food in the freezer is starting to defrost.',
      timestamp: '09:15 AM',
    },
    {
      id: 'm2',
      sender: 'agent',
      senderName: 'Support Desk (Afiq)',
      text: 'Good morning Tan Kia Yu! We have received your emergency booking #ORD-501. Lead technician Satou Kenji is assigned and scheduled for arrival at 11:30 AM.',
      timestamp: '09:18 AM',
    },
    {
      id: 'm3',
      sender: 'system',
      text: 'Order #ORD-501 matched with Satou Kenji (CIDB Level 3 Inverter Specialist). Van stocked with thermal fuse and defrost sensors.',
      timestamp: '09:20 AM',
    },
    {
      id: 'm4',
      sender: 'customer',
      senderName: 'Tan Kia Yu',
      text: 'Great, thank you! Could you remind him to bring the gate pass registration for Guardhouse A?',
      timestamp: '09:24 AM',
    },
    {
      id: 'm5',
      sender: 'agent',
      senderName: 'Support Desk (Afiq)',
      text: 'Noted! I have updated the technician route notes with Guardhouse A instructions. Satou will call when 10 minutes away.',
      timestamp: '09:26 AM',
    },
  ],
  'ORD-502': [
    {
      id: 'm1',
      sender: 'customer',
      senderName: 'Lee Wei Kang',
      text: 'Hello, water is leaking from my living room air conditioner indoor unit.',
      timestamp: '10:05 AM',
    },
    {
      id: 'm2',
      sender: 'agent',
      senderName: 'Support Desk (Afiq)',
      text: 'Hello Lee! Our AC specialist Ahmad Razif is currently completing a nearby job in Cheras and will proceed to your residence next.',
      timestamp: '10:08 AM',
    },
  ],
};

const QUICK_CUSTOMER_TEMPLATES = [
  'Technician is en route to your location (ETA ~15 mins).',
  'Your diagnostic inspection report and quotation are ready for review.',
  'Please confirm gate security pass registration for our service van.',
  'Service work has been completed. Please rate your technician.',
  'Your 90-day parts and labor warranty certificate has been generated.',
];

export default function CustomerChatSubpage({ onSelectOrder }) {
  const orders = useDashboardStore((state) => state.orders || []);
  const [customerThreads, setCustomerThreads] = useState(SEEDED_CUSTOMER_THREADS);
  const [selectedOrderId, setSelectedOrderId] = useState('ORD-501');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Derive unique customer conversation list from orders and seeded conversations
  const customerList = useMemo(() => {
    const list = [...orders];
    if (!list.some((o) => o.id === 'ORD-501')) {
      list.unshift({
        id: 'ORD-501',
        customer: 'Tan Kia Yu',
        phone: '+6012-3849102',
        location: 'Mont Kiara, KL',
        appliance: 'Samsung RT38K5562SL',
        status: 'ASSIGNED',
        matchedTech: 'Satou Kenji',
        assignedTech: 'Satou Kenji',
      });
    }

    return list
      .map((ord) => {
        const thread = customerThreads[ord.id] || [];
        const lastMsg = thread[thread.length - 1];
        return {
          orderId: ord.id,
          customerName: ord.customer || 'Customer',
          phone: ord.phone || '+6012-3456789',
          location: ord.location || 'Klang Valley',
          appliance: ord.appliance || 'Home Appliance',
          orderStatus: ord.status || 'PENDING',
          assignedTech: ord.matchedTech || ord.assignedTech || 'Satou Kenji',
          lastMessage: lastMsg?.text || 'Order placed. Awaiting initial chat.',
          lastTime: lastMsg?.timestamp || 'Today',
          unreadCount: thread.length > 0 && thread[thread.length - 1].sender === 'customer' ? 1 : 0,
        };
      })
      .filter((c) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = c.customerName.toLowerCase().includes(q);
          const matchId = c.orderId.toLowerCase().includes(q);
          const matchApp = c.appliance.toLowerCase().includes(q);
          const matchPhone = c.phone.toLowerCase().includes(q);
          if (!matchName && !matchId && !matchApp && !matchPhone) return false;
        }
        if (statusFilter === 'active') return c.orderStatus !== 'COMPLETED' && c.orderStatus !== 'CANCELLED';
        if (statusFilter === 'completed') return c.orderStatus === 'COMPLETED';
        return true;
      });
  }, [orders, customerThreads, searchQuery, statusFilter]);

  const activeCustomer = useMemo(() => {
    return customerList.find((c) => c.orderId === selectedOrderId) || customerList[0];
  }, [customerList, selectedOrderId]);

  const activeThread = useMemo(() => {
    return customerThreads[activeCustomer?.orderId] || [];
  }, [customerThreads, activeCustomer]);

  // Synchronize with backend live chat messages if available
  useEffect(() => {
    if (!activeCustomer?.orderId) return;
    const orderId = activeCustomer.orderId;
    let isCancelled = false;

    fetch(`/api/chat/messages?thread_id=order:${orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCancelled && data && Array.isArray(data.messages) && data.messages.length > 0) {
          const apiMessages = data.messages.map((m) => ({
            id: m.id || `m_${Math.random().toString(36).slice(2, 7)}`,
            sender: m.sender_role === 'customer' ? 'customer' : (m.sender_role === 'system' ? 'system' : 'agent'),
            senderName: m.sender_name || (m.sender_role === 'customer' ? 'Customer' : 'Support Desk'),
            text: m.text,
            timestamp: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
          }));

          setCustomerThreads((prev) => {
            const existing = prev[orderId] || [];
            // Merge deduplicating by text/id
            const existingIds = new Set(existing.map((e) => e.id));
            const newToAdd = apiMessages.filter((m) => !existingIds.has(m.id));
            if (newToAdd.length === 0) return prev;
            return {
              ...prev,
              [orderId]: [...existing, ...newToAdd],
            };
          });
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [activeCustomer?.orderId]);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread]);

  const handleSend = () => {
    if (!inputText.trim() || !activeCustomer) return;
    const trimmed = inputText.trim();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: `m_${Date.now()}`,
      sender: 'agent',
      senderName: 'Support Desk',
      text: trimmed,
      timestamp: timeStr,
    };

    setCustomerThreads((prev) => ({
      ...prev,
      [activeCustomer.orderId]: [...(prev[activeCustomer.orderId] || []), newMsg],
    }));

    // Post to backend live chat router
    try {
      fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: `order:${activeCustomer.orderId}`,
          repair_request_id: activeCustomer.orderId,
          sender_id: 'superadmin',
          sender_role: 'super_admin',
          sender_name: 'Support Desk (Superadmin)',
          text: trimmed,
          message_type: 'text',
        }),
      }).catch(() => {});
    } catch {
      // Safe fallback
    }

    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="customer-chat-subpage"
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        height: 'calc(100vh - 125px)',
        background: '#020718',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* Left Sidebar: Customer List */}
      <div
        style={{
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(5, 19, 64, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar Header & Search */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Customer Inquiries ({customerList.length})
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(46, 213, 115, 0.15)',
                color: '#2ed573',
                fontWeight: 600,
              }}
            >
              Bridge Online
            </span>
          </div>

          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <input
              type="text"
              className="ch-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, #ORD, phone..."
              style={{ fontSize: '11.5px', padding: '6px 10px 6px 28px', height: '32px', width: '100%' }}
            />
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              style={{ position: 'absolute', left: '9px', top: '9px' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['all', 'active', 'completed'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                style={{
                  flex: 1,
                  fontSize: '10.5px',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: statusFilter === f ? '#ff7300' : 'rgba(255, 255, 255, 0.08)',
                  background: statusFilter === f ? 'rgba(255, 115, 0, 0.15)' : 'transparent',
                  color: statusFilter === f ? '#ff7300' : '#9ca3af',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontWeight: 600,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Threads List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {customerList.map((c) => {
            const isSelected = c.orderId === activeCustomer?.orderId;
            return (
              <div
                key={c.orderId}
                onClick={() => setSelectedOrderId(c.orderId)}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(255, 115, 0, 0.1)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #ff7300' : '3px solid transparent',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <strong style={{ fontSize: '12.5px', color: isSelected ? '#ff7300' : '#fff' }}>
                    {c.customerName}
                  </strong>
                  <span style={{ fontSize: '10px', color: '#9ca3af' }}>{c.lastTime}</span>
                </div>

                <div style={{ fontSize: '11px', color: '#38bdf8', marginBottom: '2px' }}>
                  #{c.orderId} · {c.appliance}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {c.lastMessage}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Main Chat Window */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#030b21' }}>
        {activeCustomer ? (
          <>
            {/* Chat Header */}
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(5, 19, 64, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1.5px solid #38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8',
                    fontWeight: 700,
                    fontSize: '14px',
                  }}
                >
                  {activeCustomer.customerName.charAt(0)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>
                      {activeCustomer.customerName}
                    </h3>
                    <span
                      style={{
                        fontSize: '9.5px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(46, 213, 115, 0.15)',
                        border: '1px solid #2ed573',
                        color: '#2ed573',
                        fontWeight: 600,
                      }}
                    >
                      WhatsApp Active
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                    #{activeCustomer.orderId} · {activeCustomer.appliance} · Tech: <strong style={{ color: '#fff' }}>{activeCustomer.assignedTech}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#cbd5e1' }}>{activeCustomer.location}</span>
                <span className={`status-pill ${activeCustomer.orderStatus.toLowerCase()}`}>
                  {activeCustomer.orderStatus}
                </span>
              </div>
            </div>

            {/* Messages Scroll View */}
            <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeThread.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', margin: 'auto', fontSize: '12px' }}>
                  No messages yet for this customer order. Send a message below to start coordination.
                </div>
              ) : (
                activeThread.map((msg) => {
                  if (msg.sender === 'system') {
                    return (
                      <div key={msg.id} style={{ textAlign: 'center', margin: '6px 0' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            color: '#9ca3af',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '3px 10px',
                            borderRadius: '12px',
                          }}
                        >
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const isAgent = msg.sender === 'agent';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isAgent ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isAgent ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px', padding: '0 4px' }}>
                        {msg.senderName} · {msg.timestamp}
                      </div>
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: isAgent ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          background: isAgent ? '#ff7300' : 'rgba(255, 255, 255, 0.07)',
                          color: isAgent ? '#fff' : '#f1f5f9',
                          fontSize: '12.5px',
                          lineHeight: 1.45,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Template Chips */}
            <div
              style={{
                padding: '6px 16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'rgba(0, 0, 0, 0.2)',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
              }}
            >
              {QUICK_CUSTOMER_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInputText(tpl);
                    inputRef.current?.focus();
                  }}
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tpl}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(5, 19, 64, 0.5)',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                className="ch-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Reply to ${activeCustomer.customerName} via WhatsApp Bridge...`}
                style={{ flex: 1, fontSize: '12.5px', padding: '10px 14px', height: '42px' }}
              />

              <button
                type="button"
                className="ch-btn ch-btn-primary"
                onClick={handleSend}
                disabled={!inputText.trim()}
                style={{
                  height: '42px',
                  padding: '0 18px',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ff7300',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                <span>Send</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div style={{ margin: 'auto', textAlign: 'center', color: '#9ca3af' }}>
            Select a customer conversation from the left to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}

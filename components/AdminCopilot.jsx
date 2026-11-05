import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/useChatStore.js';
import { useDashboardStore } from '../store/useDashboardStore.js';
import './admin-copilot.css';

const QUICK_COMMANDS = [
  'Set diagnostic fee to RM 65',
  'Update PRT-045 markup to 60%',
  'Dispatch T-092 to ORD-882',
  'Zoom graph to May',
];

const AdminCopilot = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, toggleChat, messages, addMessage, clearHistory } = useChatStore();
  const {
    globalPricing,
    spareParts,
    updateGlobalPricing,
    updateSparePart,
    dispatchTechnician,
  } = useDashboardStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Local execution engine so commands work immediately in Vite even if FastAPI is offline
  const executeLocalAdminCommand = (promptText) => {
    const text = promptText.trim();
    const lower = text.toLowerCase();
    const triggers = [];

    // 1. Update Diagnostic Fee
    const diagMatch = lower.match(/diagnostic(?:\s+fee)?\s+(?:to\s+)?(?:rm\s*)?(\d+(?:\.\d+)?)/i);
    if (diagMatch) {
      const val = parseFloat(diagMatch[1]);
      updateGlobalPricing({ diagnosticFee: val });
      triggers.push(`Diagnostic Fee -> RM ${val.toFixed(2)}`);
      return {
        reply: `Updated Base Diagnostic Fee to RM ${val.toFixed(2)}.`,
        triggers,
      };
    }

    // 2. Update Labor Rate
    const laborMatch = lower.match(/labor(?:\s+rate)?\s+(?:to\s+)?(?:rm\s*)?(\d+(?:\.\d+)?)/i);
    if (laborMatch) {
      const val = parseFloat(laborMatch[1]);
      updateGlobalPricing({ laborRate: val });
      triggers.push(`Labor Rate -> RM ${val.toFixed(2)}/hr`);
      return {
        reply: `Updated Standard Labor Rate to RM ${val.toFixed(2)}/hr.`,
        triggers,
      };
    }

    // 3. Update Emergency Multiplier
    const multMatch = lower.match(/(?:emergency|multiplier|surge)\s+(?:to\s+)?(?:x\s*)?(\d+(?:\.\d+)?)/i);
    if (multMatch) {
      const val = parseFloat(multMatch[1]);
      updateGlobalPricing({ emergencyMultiplier: val });
      triggers.push(`Surge Multiplier -> x${val.toFixed(1)}`);
      return {
        reply: `Updated Emergency Surge Multiplier to x${val.toFixed(1)}.`,
        triggers,
      };
    }

    // 4. Update Spare Part Markup or Cost
    const skuMatch = text.match(/(PRT-\d{3})/i);
    if (skuMatch) {
      const sku = skuMatch[1].toUpperCase();
      const targetPart = spareParts.find((p) => p.sku === sku);
      if (!targetPart) {
        return { reply: `SKU ${sku} not found in catalog.`, triggers: [] };
      }
      const numMatch = lower.match(/(?:to|by)\s+(?:rm\s*)?(\d+(?:\.\d+)?)/i);
      if (lower.includes('markup') && numMatch) {
        const newMarkup = parseFloat(numMatch[1]);
        updateSparePart(sku, { markup: newMarkup });
        const finalPrice = targetPart.cost * (1 + newMarkup / 100);
        triggers.push(`${sku} Markup -> ${newMarkup}%`);
        return {
          reply: `Updated ${sku} (${targetPart.name}) markup to ${newMarkup}%. New retail price: RM ${finalPrice.toFixed(2)}.`,
          triggers,
        };
      }
      if (lower.includes('cost') && numMatch) {
        const newCost = parseFloat(numMatch[1]);
        updateSparePart(sku, { cost: newCost });
        const finalPrice = newCost * (1 + targetPart.markup / 100);
        triggers.push(`${sku} Cost -> RM ${newCost.toFixed(2)}`);
        return {
          reply: `Updated ${sku} supplier cost to RM ${newCost.toFixed(2)}. New retail price: RM ${finalPrice.toFixed(2)}.`,
          triggers,
        };
      }
    }

    // 5. Dispatch Technician to Order (e.g., "Dispatch T-092 to ORD-882")
    const ordMatch = text.match(/(ORD-\d{3})/i);
    const techMatch = text.match(/(T-\d{3})/i);
    if (ordMatch && techMatch) {
      const orderId = ordMatch[1].toUpperCase();
      const techCode = techMatch[1].toUpperCase();
      dispatchTechnician(orderId, techCode);
      triggers.push(`Dispatched ${techCode} -> ${orderId}`);
      return {
        reply: `Assigned technician ${techCode} to order ${orderId}. Order status is now DISPATCHED.`,
        triggers,
      };
    }

    // 6. Chart Zoom Commands
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const foundMonthIdx = months.findIndex((m) => lower.includes(m));
    if (lower.includes('zoom') || lower.includes('graph') || lower.includes('chart')) {
      if (location.pathname !== '/service-analytics') {
        navigate('/service-analytics');
      }
      const chartCommand = foundMonthIdx !== -1
        ? { monthIndex: foundMonthIdx }
        : lower.includes('reset')
          ? { mode: 'reset' }
          : { mode: 'daily' };
      window.sessionStorage.setItem('cyberhub-chart-command', JSON.stringify(chartCommand));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('cyberhub-chart-command', { detail: chartCommand }));
      }, 120);

      const label = foundMonthIdx !== -1 ? `${months[foundMonthIdx].toUpperCase()} 2026 (Daily Bars)` : lower.includes('reset') ? '1Y Monthly View' : 'Daily Resolution';
      triggers.push(`CHART_ZOOM: ${label}`);
      return {
        reply: `Adjusted Service Analytics ticker to ${label}.`,
        triggers,
      };
    }

    // 7. Query Rates
    if (lower.includes('rate') || lower.includes('price') || lower.includes('status')) {
      return {
        reply: `Active Global Rates:\n• Diagnostic Fee: RM ${globalPricing.diagnosticFee.toFixed(2)}\n• Standard Labor: RM ${globalPricing.laborRate.toFixed(2)}/hr\n• Emergency Multiplier: x${globalPricing.emergencyMultiplier.toFixed(1)}`,
        triggers: ['QUERY_PRICING'],
      };
    }

    return null;
  };

  const sendCommand = async (promptText) => {
    const textToSend = (promptText ?? input).trim();
    if (!textToSend || isLoading) return;

    const userMsg = { role: 'user', content: textToSend };
    addMessage(userMsg);
    setInput('');
    setIsLoading(true);

    // Execute local state mutations first for instant UI response
    const localResult = executeLocalAdminCommand(textToSend);

    try {
      const updatedHistory = [...messages, userMsg].map(({ role, content }) => ({ role, content }));
      const response = await fetch('http://localhost:8000/api/admin/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          current_page: location.pathname,
        }),
      });

      if (!response.ok) throw new Error('FastAPI unreachable');
      const data = await response.json();

      addMessage({
        role: 'assistant',
        content: data.reply,
        triggers: [...(localResult?.triggers || []), ...(data.ui_triggers || [])],
      });
    } catch {
      // Fallback to local execution if FastAPI server isn't running
      if (localResult) {
        addMessage({
          role: 'assistant',
          content: localResult.reply,
          triggers: localResult.triggers,
        });
      } else {
        addMessage({
          role: 'assistant',
          content:
            'Command noted (Offline Mode). Try:\n• "Set diagnostic fee to RM 65"\n• "Update PRT-045 markup to 60%"\n• "Dispatch T-092 to ORD-882"\n• "Zoom graph to May"',
          triggers: [],
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendCommand();
    }
  };

  return (
    <div className="ch-copilot-widget">
      {!isOpen ? (
        <button className="ch-copilot-fab" onClick={toggleChat} title="Open CyberHub AI Copilot">
          <span className="ch-pulse-dot"></span>
          <span>AI Admin Copilot</span>
        </button>
      ) : (
        <div className="ch-copilot-window">
          <div className="ch-copilot-header">
            <div className="ch-copilot-brand">
              <span className="ch-pulse-dot"></span>
              <div>
                <h4>CyberHub AI Copilot</h4>
                <span className="ch-context-route">Active: {location.pathname}</span>
              </div>
            </div>
            <div className="ch-header-btns">
              <button className="ch-mini-btn" onClick={clearHistory} title="Clear Chat">
                Clear
              </button>
              <button className="ch-mini-btn" onClick={toggleChat} title="Minimize">
                —
              </button>
            </div>
          </div>

          <div className="ch-quick-bar">
            {QUICK_COMMANDS.map((cmd, idx) => (
              <button key={idx} className="ch-chip" onClick={() => sendCommand(cmd)} disabled={isLoading}>
                {cmd}
              </button>
            ))}
          </div>

          <div className="ch-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`ch-msg-row ${msg.role === 'user' ? 'user' : 'ai'}`}>
                <div className="ch-bubble">
                  <p>{msg.content}</p>
                  {msg.triggers && msg.triggers.length > 0 && (
                    <div className="ch-badge-list">
                      {msg.triggers.map((trig, i) => (
                        <span key={i} className="ch-badge">
                          ⚡ {trig}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="ch-time">
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Now'}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="ch-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI to edit prices, dispatch techs..."
              disabled={isLoading}
            />
            <button className="ch-send-btn" onClick={() => sendCommand()} disabled={!input.trim() || isLoading}>
              Run
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCopilot;

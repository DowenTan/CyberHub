import { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore.js';

const SmartOrders = () => {
  const { orders, technicians, dispatchTechnician, updateOrderStatus } = useDashboardStore();
  const [filter, setFilter] = useState('ALL');
  const [selectedTechs, setSelectedTechs] = useState({});

  const filteredOrders = orders.filter((o) => (filter === 'ALL' ? true : o.status === filter));

  const handleDispatch = (orderId) => {
    const chosenTech = selectedTechs[orderId] || technicians[0]?.code;
    if (chosenTech) {
      dispatchTechnician(orderId, chosenTech);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Smart Orders & Dispatch</h1>
          <p className="subtitle">Assign field technicians or ask the AI Copilot to dispatch orders.</p>
        </div>
        <div className="pill-group">
          {['ALL', 'PENDING', 'DISPATCHED', 'COMPLETED'].map((st) => (
            <button
              key={st}
              className={`filter-pill ${filter === st ? 'active' : ''}`}
              onClick={() => setFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="ch-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="ch-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer & Zone</th>
              <th>Appliance & Reported Fault</th>
              <th>AI Estimate</th>
              <th>Status</th>
              <th>Assigned Tech</th>
              <th>Dispatch Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td className="accent-text">{order.id}</td>
                <td>
                  <strong>{order.customer}</strong>
                  <div className="sub-cell">{order.location}</div>
                </td>
                <td>
                  <strong>{order.appliance}</strong>
                  <div className="sub-cell">{order.issue}</div>
                </td>
                <td className="mono">RM {order.aiEstimate.toFixed(2)}</td>
                <td>
                  <span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span>
                </td>
                <td>{order.assignedTech}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <select
                      className="ch-select"
                      value={selectedTechs[order.id] || ''}
                      onChange={(e) => setSelectedTechs({ ...selectedTechs, [order.id]: e.target.value })}
                    >
                      {technicians.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.code} - {t.name.split(' ')[0]}
                        </option>
                      ))}
                    </select>
                    {order.status !== 'COMPLETED' ? (
                      <button className="btn-small" onClick={() => handleDispatch(order.id)}>
                        Dispatch
                      </button>
                    ) : (
                      <button
                        className="btn-small outline"
                        onClick={() => updateOrderStatus(order.id, 'PENDING')}
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SmartOrders;
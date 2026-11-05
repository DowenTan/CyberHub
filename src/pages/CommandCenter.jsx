import { Link } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore.js';

const CommandCenter = () => {
  const { orders, technicians, globalPricing, diagnosticsLogs } = useDashboardStore();

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const activeTechs = technicians.filter((t) => t.status !== 'OFFLINE').length;
  const totalRevenueEst = orders.reduce((sum, o) => sum + o.aiEstimate, 0);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Command Center</h1>
          <p className="subtitle">Live operational telemetry across Klang Valley repair zones.</p>
        </div>
        <Link to="/smart-orders" className="btn-primary" style={{ textDecoration: 'none' }}>
          Manage Dispatch Queue ({pendingCount})
        </Link>
      </div>

      <div className="kpi-grid">
        <div className="ch-card">
          <span className="kpi-label">Active Repair Requests</span>
          <h2 className="kpi-value">{orders.length} Orders</h2>
          <span className="kpi-sub orange">{pendingCount} awaiting technician dispatch</span>
        </div>
        <div className="ch-card">
          <span className="kpi-label">Field Technicians Online</span>
          <h2 className="kpi-value">
            {activeTechs} / {technicians.length}
          </h2>
          <span className="kpi-sub green">GPS telemetry active</span>
        </div>
        <div className="ch-card">
          <span className="kpi-label">Pipeline Estimated Value</span>
          <h2 className="kpi-value">RM {totalRevenueEst.toFixed(2)}</h2>
          <span className="kpi-sub">Base Diagnostic: RM {globalPricing.diagnosticFee.toFixed(2)}</span>
        </div>
      </div>

      <div className="two-col-grid">
        <div className="ch-card">
          <div className="section-title-row">
            <h3>Recent Smart Orders</h3>
            <Link to="/smart-orders" className="text-link">View All →</Link>
          </div>
          <table className="ch-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Appliance</th>
                <th>Zone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="accent-text">{o.id}</td>
                  <td>{o.appliance}</td>
                  <td>{o.location}</td>
                  <td>
                    <span className={`status-pill ${o.status.toLowerCase()}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ch-card">
          <div className="section-title-row">
            <h3>Latest AI Fault Assessments</h3>
            <Link to="/ai-diagnostics" className="text-link">Open Diagnostics →</Link>
          </div>
          <div className="stack-list">
            {diagnosticsLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="list-item-box">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{log.appliance}</strong>
                  <span className="green-text">{log.confidence}% Confidence</span>
                </div>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#9ca3af' }}>{log.predictedFault}</p>
                <span style={{ fontSize: '11px', color: '#ff7300' }}>Est: {log.estCost}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
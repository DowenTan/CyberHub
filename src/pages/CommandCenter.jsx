import { Link } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore.js';
import SmartTable from '../components/SmartTable.jsx';
import InteractiveGraph from '../components/InteractiveGraph.jsx';

const CommandCenter = () => {
  const { orders, technicians, globalPricing, addOrder } = useDashboardStore();

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const activeTechs = technicians.filter((t) => t.status !== 'OFFLINE').length;
  const totalRevenueEst = orders.reduce((sum, o) => sum + o.aiEstimate, 0);

  const handleQuickAddOrder = () => {
    const nextId = `ORD-${887 + orders.length}`;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    addOrder({
      id: nextId,
      time: nowStr,
      customer: 'Walk-In Customer',
      appliance: 'Midea 1.5HP Split AC',
      issue: 'Compressor fan not spinning',
      location: 'Ampang Jaya',
      aiEstimate: 165.0,
      status: 'PENDING',
      assignedTech: 'Unassigned',
    });
  };

  const columns = [
    { key: 'id', label: 'Order ID', className: 'accent-text mono' },
    { key: 'time', label: 'Time', className: 'mono' },
    { key: 'customer', label: 'Customer', sortType: 'alphabetical' },
    {
      key: 'applianceIssue',
      label: 'Appliance & Issue',
      sortType: 'alphabetical',
      getValue: (o) => `${o.appliance} ${o.issue}`,
      render: (o) => (
        <div>
          <strong>{o.appliance}</strong>
          <div className="sub-cell">{o.issue}</div>
        </div>
      ),
    },
    { key: 'location', label: 'Zone', sortType: 'alphabetical' },
    {
      key: 'aiEstimate',
      label: 'Estimate (RM)',
      render: (o) => <span className="mono">RM {o.aiEstimate.toFixed(2)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (o) => <span className={`status-pill ${o.status.toLowerCase()}`}>{o.status}</span>,
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Command Center</h1>
          <p className="subtitle">Live operational telemetry across Klang Valley repair zones.</p>
        </div>
        <Link to="/smart-orders" className="btn-primary" style={{ textDecoration: 'none' }}>
          Open Dispatch Queue ({pendingCount})
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

      <div style={{ marginBottom: '20px' }}>
        <InteractiveGraph title="Live Revenue & Order Ticker" compact />
      </div>

      <div className="ch-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SmartTable
          columns={columns}
          data={orders}
          rowKey="id"
          defaultSortKey="time"
          defaultSortOrder="desc"
          onAddNew={handleQuickAddOrder}
          addNewLabel="+ Add New Order"
          searchPlaceholder="Search orders, appliances, time, or zone..."
          maxHeight="380px"
        />
      </div>
    </div>
  );
};

export default CommandCenter;
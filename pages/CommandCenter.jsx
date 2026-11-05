import { Link } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore.js';
import SmartTable from '../components/SmartTable.jsx';

const CommandCenter = () => {
  const { orders, technicians, globalPricing, addOrder } = useDashboardStore();

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const activeTechs = technicians.filter((t) => t.status !== 'OFFLINE').length;
  const totalRevenueEst = orders.reduce((sum, o) => sum + o.aiEstimate, 0);

  const handleQuickAddOrder = () => {
    const nextNum = Math.floor(900 + Math.random() * 99);
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    addOrder({
      id: `ORD-${nextNum}`,
      customer: 'Aiman Hakim',
      appliance: 'Panasonic Inverter AC',
      issue: 'Blinking timer light & weak airflow',
      location: 'Cheras',
      aiEstimate: 165.0,
      status: 'PENDING',
      assignedTech: 'Unassigned',
      createdAt: nowStr,
      actionLabel: 'Awaiting Auto-Dispatch',
    });
  };

  const columns = [
    { key: 'id', label: 'Order ID', className: 'accent-text mono' },
    { key: 'createdAt', label: 'Time', className: 'mono' },
    { key: 'customer', label: 'Customer', alphabetical: true },
    {
      key: 'appliance',
      label: 'Appliance & Issue',
      alphabetical: true,
      getValue: (o) => `${o.appliance} ${o.issue}`,
      render: (o) => (
        <div>
          <strong>{o.appliance}</strong>
          <div className="sub-cell">{o.issue}</div>
        </div>
      ),
    },
    { key: 'location', label: 'Zone', alphabetical: true },
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
    {
      key: 'actionLabel',
      label: 'Action',
      sortable: false,
      isAction: true,
      render: (o) => <span className="ch-static-action-badge">{o.actionLabel || 'System Managed'}</span>,
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
          <h2 className="kpi-value">{activeTechs} / {technicians.length}</h2>
          <span className="kpi-sub green">GPS telemetry active</span>
        </div>
        <div className="ch-card">
          <span className="kpi-label">Pipeline Estimated Value</span>
          <h2 className="kpi-value">RM {totalRevenueEst.toFixed(2)}</h2>
          <span className="kpi-sub">Base Diagnostic: RM {globalPricing.diagnosticFee.toFixed(2)}</span>
        </div>
      </div>

      <div className="ch-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SmartTable
          columns={columns}
          data={orders}
          rowKey="id"
          defaultSortKey="createdAt"
          defaultSortOrder="desc"
          onAddNew={handleQuickAddOrder}
          addNewLabel="+ Add New Order"
          searchPlaceholder="Search order, customer, appliance, zone..."
          maxHeight="460px"
        />
      </div>
    </div>
  );
};

export default CommandCenter;
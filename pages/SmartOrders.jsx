import { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import SmartTable from '../components/SmartTable.jsx';

const SmartOrders = () => {
  const { orders, addOrder } = useDashboardStore();
  const [filter, setFilter] = useState('ALL');

  const filteredOrders = orders.filter((o) => (filter === 'ALL' ? true : o.status === filter));

  const handleAddNewOrder = () => {
    const nextNum = Math.floor(888 + Math.random() * 100);
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    addOrder({
      id: `ORD-${nextNum}`,
      customer: 'Daniel Hakim',
      appliance: 'Mitsubishi Heavy 2.0HP AC',
      issue: 'Outdoor compressor unit not starting',
      location: 'Ampang Jaya',
      aiEstimate: 195.0,
      status: 'PENDING',
      assignedTech: 'Unassigned',
      createdAt: nowStr,
      actionLabel: 'Awaiting Auto-Dispatch',
    });
  };

  const columns = [
    { key: 'id', label: 'Order ID', className: 'accent-text mono' },
    { key: 'createdAt', label: 'Time', className: 'mono' },
    {
      key: 'customer',
      label: 'Customer & Zone',
      alphabetical: true,
      getValue: (o) => `${o.customer} ${o.location}`,
      render: (o) => (
        <div>
          <strong>{o.customer}</strong>
          <div className="sub-cell">{o.location}</div>
        </div>
      ),
    },
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
    {
      key: 'aiEstimate',
      label: 'AI Estimate',
      render: (o) => <span className="mono">RM {o.aiEstimate.toFixed(2)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (o) => <span className={`status-pill ${o.status.toLowerCase()}`}>{o.status}</span>,
    },
    { key: 'assignedTech', label: 'Assigned Tech' },
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
          <h1>Smart Orders & Dispatch</h1>
          <p className="subtitle">Search, add new orders, or sort by Time and category headers.</p>
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
        <SmartTable
          columns={columns}
          data={filteredOrders}
          rowKey="id"
          defaultSortKey="createdAt"
          defaultSortOrder="desc"
          onAddNew={handleAddNewOrder}
          addNewLabel="+ Add New Order"
          searchPlaceholder="Search Order ID, customer, appliance, zone..."
          maxHeight="540px"
        />
      </div>
    </div>
  );
};

export default SmartOrders;
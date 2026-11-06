import { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import SmartTable from '../components/SmartTable.jsx';

const SmartOrders = () => {
  const { orders, addOrder } = useDashboardStore();
  const [filter, setFilter] = useState('ALL');

  const filteredOrders = orders.filter((o) => (filter === 'ALL' ? true : o.status === filter));

  const handleAddNewOrder = () => {
    const nextId = `ORD-${887 + orders.length}`;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    addOrder({
      id: nextId,
      time: nowStr,
      customer: 'New Booking Client',
      appliance: 'Sharp Inverter Refrigerator',
      issue: 'Temperature fluctuating in chiller',
      location: 'Kuala Lumpur',
      aiEstimate: 175.0,
      status: 'PENDING',
      assignedTech: 'Unassigned',
    });
  };

  const columns = [
    { key: 'id', label: 'Order ID', className: 'accent-text mono' },
    { key: 'time', label: 'Time', className: 'mono' },
    {
      key: 'customer',
      label: 'Customer & Zone',
      sortType: 'alphabetical',
      getValue: (o) => `${o.customer} ${o.location}`,
      render: (o) => (
        <div>
          <strong>{o.customer}</strong>
          <div className="sub-cell">{o.location}</div>
        </div>
      ),
    },
    {
      key: 'applianceIssue',
      label: 'Appliance & Issue',
      sortType: 'alphabetical',
      getValue: (o) => `${o.appliance} - ${o.issue}`,
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
      sortType: 'alphabetical',
      render: (o) => <span className={`status-pill ${o.status.toLowerCase()}`}>{o.status}</span>,
    },
    { key: 'assignedTech', label: 'Technician', sortType: 'alphabetical' },
    {
      key: 'action',
      label: 'Action',
      sortable: false,
      render: (order) => (
        <span className="ch-static-action-badge">
          {order.status === 'PENDING' ? 'Awaiting AI Dispatch' : 'Locked'}
        </span>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Smart Orders & Dispatch</h1>
          <p className="subtitle">Manage active repair requests and monitor AI-generated cost estimates.</p>
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
          defaultSortKey="time"
          defaultSortOrder="desc"
          onAddNew={handleAddNewOrder}
          addNewLabel="+ Add New Order"
          searchPlaceholder="Search Order ID, customer, appliance & issue, time..."
          maxHeight="520px"
        />
      </div>
    </div>
  );
};

export default SmartOrders;
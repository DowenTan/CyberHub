import { useDashboardStore } from '../store/useDashboardStore.js';
import SmartTable from '../components/SmartTable.jsx';

const Technicians = () => {
  const { technicians, addTechnician } = useDashboardStore();

  const handleAddNewTech = () => {
    const nextCode = `T-${Math.floor(132 + Math.random() * 60)}`;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    addTechnician({
      code: nextCode,
      name: 'Syafiq Zulkifli',
      specialty: 'HVAC & Smart Inverter Systems',
      zone: 'Ampang / KLCC',
      rating: 4.8,
      completedJobs: 64,
      status: 'AVAILABLE',
      createdAt: nowStr,
      actionLabel: 'Standby Ready',
    });
  };

  const columns = [
    { key: 'code', label: 'Tech ID', className: 'accent-text mono' },
    { key: 'createdAt', label: 'Time Joined', className: 'mono' },
    { key: 'name', label: 'Technician Name', alphabetical: true },
    { key: 'specialty', label: 'Specialty', alphabetical: true },
    { key: 'zone', label: 'Coverage Zone', alphabetical: true },
    {
      key: 'rating',
      label: 'Rating',
      render: (t) => <span style={{ color: '#f1c40f', fontWeight: 700 }}>★ {t.rating.toFixed(1)}</span>,
    },
    { key: 'completedJobs', label: 'Completed Jobs', className: 'mono' },
    {
      key: 'status',
      label: 'Status',
      render: (t) => <span className={`status-pill ${t.status.toLowerCase()}`}>{t.status}</span>,
    },
    {
      key: 'actionLabel',
      label: 'Action',
      sortable: false,
      isAction: true,
      render: (t) => <span className="ch-static-action-badge">{t.actionLabel || 'Verified Tech'}</span>,
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Field Technicians Roster</h1>
          <p className="subtitle">Search technicians, add new personnel, and sort by Time, Rating, or Name.</p>
        </div>
      </div>

      <div className="ch-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SmartTable
          columns={columns}
          data={technicians}
          rowKey="code"
          defaultSortKey="createdAt"
          defaultSortOrder="desc"
          onAddNew={handleAddNewTech}
          addNewLabel="+ Add New Technician"
          searchPlaceholder="Search technician name, code, specialty, zone..."
          maxHeight="540px"
        />
      </div>
    </div>
  );
};

export default Technicians;
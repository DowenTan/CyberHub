import { useDashboardStore } from '../store/useDashboardStore.js';
import SmartTable from '../components/SmartTable.jsx';

const Technicians = () => {
  const { technicians, addTechnician } = useDashboardStore();

  const handleAddTech = () => {
    const nextCode = `T-${132 + technicians.length}`;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    addTechnician({
      code: nextCode,
      time: nowStr,
      name: `Tech Specialist ${technicians.length + 1}`,
      specialty: 'Smart Appliances & HVAC',
      zone: 'Ampang / Cheras',
      rating: 4.8,
      completedJobs: 50,
      status: 'AVAILABLE',
    });
  };

  const columns = [
    { key: 'code', label: 'Tech ID', className: 'accent-text mono' },
    { key: 'time', label: 'Time', className: 'mono' },
    { key: 'name', label: 'Technician Name', sortType: 'alphabetical' },
    { key: 'specialty', label: 'Specialty', sortType: 'alphabetical' },
    { key: 'zone', label: 'Coverage Zone', sortType: 'alphabetical' },
    {
      key: 'rating',
      label: 'Rating',
      render: (t) => <span style={{ color: '#f1c40f', fontWeight: 700 }}>★ {t.rating.toFixed(1)}</span>,
    },
    { key: 'completedJobs', label: 'Completed Jobs', className: 'mono' },
    {
      key: 'status',
      label: 'Status',
      sortType: 'alphabetical',
      render: (t) => <span className={`status-pill ${t.status.toLowerCase()}`}>{t.status}</span>,
    },
    {
      key: 'action',
      label: 'Action',
      sortable: false,
      render: (t) => (
        <span className="ch-static-action-badge">
          {t.status === 'AVAILABLE' ? 'Auto-Queue Ready' : 'Standby'}
        </span>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Field Technicians Roster</h1>
          <p className="subtitle">Live technician availability, certifications, and aggregate customer ratings.</p>
        </div>
      </div>

      <div className="ch-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SmartTable
          columns={columns}
          data={technicians}
          rowKey="code"
          defaultSortKey="rating"
          defaultSortOrder="desc"
          onAddNew={handleAddTech}
          addNewLabel="+ Add New Tech"
          searchPlaceholder="Search technician name, ID, specialty, zone..."
          maxHeight="520px"
        />
      </div>
    </div>
  );
};

export default Technicians;
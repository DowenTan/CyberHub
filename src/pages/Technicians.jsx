import { useDashboardStore } from '../store/useDashboardStore.js';

const Technicians = () => {
  const { technicians, toggleTechnicianAvailability } = useDashboardStore();

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Field Technicians</h1>
          <p className="subtitle">Live technician availability, certifications, and aggregate customer ratings.</p>
        </div>
      </div>

      <div className="kpi-grid">
        {technicians.map((tech) => (
          <div key={tech.code} className="ch-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="accent-text mono">{tech.code}</span>
                <h3 style={{ margin: '4px 0' }}>{tech.name}</h3>
              </div>
              <span className={`status-pill ${tech.status.toLowerCase()}`}>{tech.status}</span>
            </div>

            <p style={{ fontSize: '12.5px', color: '#9ca3af', margin: '10px 0' }}>
              <strong>Specialty:</strong> {tech.specialty}
              <br />
              <strong>Coverage Zone:</strong> {tech.zone}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <span style={{ color: '#f1c40f', fontWeight: 700 }}>★ {tech.rating.toFixed(1)}</span>
                <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>
                  ({tech.completedJobs} jobs)
                </span>
              </div>
              <button
                className="btn-small outline"
                onClick={() => toggleTechnicianAvailability(tech.code)}
              >
                Toggle Status
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Technicians;
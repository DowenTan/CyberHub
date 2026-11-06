import { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore.js';
import SmartTable from '../components/SmartTable.jsx';

const AiDiagnostics = () => {
  const { diagnosticsLogs, addDiagnosticLog } = useDashboardStore();
  const [appliance, setAppliance] = useState('Panasonic 2.0HP Inverter AC');
  const [symptoms, setSymptoms] = useState('');

  const createAssessment = (appName, sympText) => {
    const isWasher = appName.toLowerCase().includes('wash');
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    addDiagnosticLog({
      id: `DIAG-${406 + diagnosticsLogs.length}`,
      time: nowStr,
      appliance: appName,
      symptoms: sympText,
      predictedFault: isWasher
        ? 'Drain Impeller Obstruction / Hall Sensor Fault'
        : 'Outdoor Condenser Relay / Refrigerant Low Pressure',
      confidence: Math.floor(88 + Math.random() * 11),
      recommendedPart: isWasher ? 'PRT-045' : 'PRT-001',
      estCost: isWasher ? 150 : 195,
    });
  };

  const handleSimulateAssessment = (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    createAssessment(appliance, symptoms);
    setSymptoms('');
  };

  const handleQuickAddDiag = () => {
    createAssessment('Electrolux 10kg Front Load Washer', 'Drum not spinning during rinse cycle');
  };

  const columns = [
    { key: 'id', label: 'Diag ID', className: 'accent-text mono' },
    { key: 'time', label: 'Time', className: 'mono' },
    {
      key: 'applianceIssue',
      label: 'Appliance & Issue',
      sortType: 'alphabetical', // Strict alphabetical sorting (A-Z / Z-A)
      getValue: (row) => `${row.appliance} - ${row.symptoms}`,
      render: (row) => (
        <div>
          <strong>{row.appliance}</strong>
          <div className="sub-cell">{row.symptoms}</div>
        </div>
      ),
    },
    { key: 'predictedFault', label: 'Predicted Fault', sortType: 'alphabetical' },
    { key: 'recommendedPart', label: 'Part SKU', className: 'mono', sortType: 'alphabetical' },
    {
      key: 'confidence',
      label: 'Confidence',
      render: (row) => <span className="green-text">{row.confidence}%</span>,
    },
    {
      key: 'estCost',
      label: 'Est. Cost (RM)',
      render: (row) => <span className="mono">RM {row.estCost}</span>,
    },
    {
      key: 'action',
      label: 'Action',
      sortable: false,
      render: () => <span className="ch-static-action-badge">Verified</span>,
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>AI Diagnostics Engine</h1>
          <p className="subtitle">Automated symptom-to-fault classification and spare part matching.</p>
        </div>
      </div>

      <div className="ch-card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Simulate AI Fault Assessment</h3>
        <form
          onSubmit={handleSimulateAssessment}
          style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}
        >
          <div style={{ flex: '1 1 240px' }}>
            <label className="kpi-label">Appliance Model</label>
            <input className="ch-input" value={appliance} onChange={(e) => setAppliance(e.target.value)} />
          </div>
          <div style={{ flex: '2 1 340px' }}>
            <label className="kpi-label">Reported Symptoms / Error Codes</label>
            <input
              className="ch-input"
              placeholder="e.g., Blinking H11 error code, indoor unit blowing warm air..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ height: '38px' }}>
            Run AI Assessment
          </button>
        </form>
      </div>

      <div className="ch-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SmartTable
          columns={columns}
          data={diagnosticsLogs}
          rowKey="id"
          defaultSortKey="applianceIssue"
          defaultSortOrder="asc"
          onAddNew={handleQuickAddDiag}
          addNewLabel="+ Add New Diagnostic"
          searchPlaceholder="Search Appliance & Issue, fault, SKU, or time..."
          maxHeight="460px"
        />
      </div>
    </div>
  );
};

export default AiDiagnostics;
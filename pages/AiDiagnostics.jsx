import { useDashboardStore } from '../store/useDashboardStore.js';
import SmartTable from '../components/SmartTable.jsx';

const AiDiagnostics = () => {
  const { diagnosticsLogs, addDiagnosticLog } = useDashboardStore();

  const handleAddNewDiagnostic = () => {
    const appliances = [
      'Acson 2.5HP Cassette AC',
      'Bosch Serie 8 Washer',
      'Electrolux Inverter Fridge',
      'Hitachi Air Purifier',
      'Midea Front Load Washer',
      'Sharp Dual-Cool Refrigerator',
    ];
    const picked = appliances[Math.floor(Math.random() * appliances.length)];
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    addDiagnosticLog({
      id: `DIAG-${Math.floor(406 + Math.random() * 90)}`,
      createdAt: nowStr,
      appliance: picked,
      symptoms: 'Unusual vibration and intermittent sensor fault code',
      predictedFault: 'Primary Drive Sensor / PCB Calibration Fault',
      confidence: Math.floor(87 + Math.random() * 12),
      recommendedPart: 'PRT-045',
      estCost: 165,
      actionLabel: 'Auto-Logged',
    });
  };

  const columns = [
    { key: 'id', label: 'Diag ID', className: 'accent-text mono' },
    { key: 'createdAt', label: 'Time', className: 'mono' },
    {
      key: 'applianceIssue',
      label: 'Appliance & Issue',
      alphabetical: true, // Strictly sorts A -> Z and Z -> A
      getValue: (row) => `${row.appliance} - ${row.symptoms}`,
      render: (row) => (
        <div>
          <strong>{row.appliance}</strong>
          <div className="sub-cell">{row.symptoms}</div>
        </div>
      ),
    },
    { key: 'predictedFault', label: 'Predicted Fault', alphabetical: true },
    { key: 'recommendedPart', label: 'Part SKU', className: 'mono' },
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
      key: 'actionLabel',
      label: 'Action',
      sortable: false,
      isAction: true,
      render: (row) => <span className="ch-static-action-badge">{row.actionLabel || 'Auto-Logged'}</span>,
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>AI Diagnostics Engine</h1>
          <p className="subtitle">
            Click &ldquo;Appliance & Issue&rdquo; to sort alphabetically (A–Z / Z–A), or sort by Time.
          </p>
        </div>
      </div>

      <div className="ch-card" style={{ padding: 0, overflow: 'hidden' }}>
        <SmartTable
          columns={columns}
          data={diagnosticsLogs}
          rowKey="id"
          defaultSortKey="applianceIssue"
          defaultSortOrder="asc"
          onAddNew={handleAddNewDiagnostic}
          addNewLabel="+ Add New Assessment"
          searchPlaceholder="Search appliance, symptoms, fault, or SKU..."
          maxHeight="540px"
        />
      </div>
    </div>
  );
};

export default AiDiagnostics;